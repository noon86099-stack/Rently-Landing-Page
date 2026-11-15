import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_TEST_URL?.trim();
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY?.trim();
const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
  console.error(
    "Set SUPABASE_TEST_URL, SUPABASE_TEST_PUBLISHABLE_KEY, and SUPABASE_TEST_SERVICE_ROLE_KEY for a dedicated test project.",
  );
  process.exit(1);
}

if (publishableKey === serviceRoleKey) {
  console.error("The publishable key and service role key must be different.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const createdOwners = [];
const createdRows = {
  lease_documents: [],
  rently_leases: [],
  rently_units: [],
  rently_properties: [],
  rently_tenants: [],
};
const createdStoragePaths = [];
const leaseDocumentBucket = "rently-lease-documents";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createOwner(label, suffix) {
  const email = `rently-isolation-${suffix}-${randomUUID()}@example.invalid`;
  const password = randomBytes(32).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error)
    throw new Error(`Could not create test owner ${label}: ${error.message}`);
  if (!data.user)
    throw new Error(`Supabase returned no user for test owner ${label}.`);

  const owner = { id: data.user.id, email, password, label };
  createdOwners.push(owner);

  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: sessionData, error: signInError } =
    await client.auth.signInWithPassword({ email, password });

  if (signInError) {
    throw new Error(
      `Could not sign in as test owner ${label}: ${signInError.message}`,
    );
  }
  assert(
    sessionData.user?.id === owner.id,
    `Supabase authenticated a different user for test owner ${label}.`,
  );

  owner.client = client;
  return owner;
}

async function insertFixture(table, values) {
  const { data, error } = await admin
    .from(table)
    .insert(values)
    .select("id")
    .single();
  if (error)
    throw new Error(`Could not create ${table} fixture: ${error.message}`);
  if (!data?.id)
    throw new Error(`Supabase returned no id for ${table} fixture.`);
  createdRows[table].push(data.id);
  return data.id;
}

async function createOwnerFixtures(owner, suffix) {
  const propertyId = await insertFixture("rently_properties", {
    owner_id: owner.id,
    name: `Isolation test ${suffix}`,
    property_type: "Residential",
  });
  const unitId = await insertFixture("rently_units", {
    owner_id: owner.id,
    property_id: propertyId,
    unit_label: `Unit ${suffix}`,
  });
  const tenantId = await insertFixture("rently_tenants", {
    owner_id: owner.id,
    full_name: `Isolation tenant ${suffix}`,
    email: owner.email,
  });
  const leaseId = await insertFixture("rently_leases", {
    owner_id: owner.id,
    unit_id: unitId,
    tenant_id: tenantId,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    status: "active",
  });

  return {
    rently_properties: propertyId,
    rently_units: unitId,
    rently_tenants: tenantId,
    rently_leases: leaseId,
  };
}

async function assertTableIsolation(owner, otherOwnerFixtures, ownFixtures) {
  for (const table of Object.keys(ownFixtures)) {
    const { data: ownRows, error: ownError } = await owner.client
      .from(table)
      .select("id")
      .eq("id", ownFixtures[table]);
    if (ownError)
      throw new Error(
        `${owner.label} could not read its ${table}: ${ownError.message}`,
      );
    assert(
      ownRows?.length === 1 && ownRows[0].id === ownFixtures[table],
      `${owner.label} could not read its own ${table} fixture.`,
    );

    const { data: otherRows, error: otherError } = await owner.client
      .from(table)
      .select("id")
      .eq("id", otherOwnerFixtures[table]);
    if (otherError)
      throw new Error(
        `${owner.label} could not check ${table} isolation: ${otherError.message}`,
      );
    assert(
      otherRows?.length === 0,
      `${owner.label} can read another owner's ${table} fixture.`,
    );
  }
}

async function readAdminRecord(table, id) {
  const { data, error } = await admin.from(table).select("*").eq("id", id);
  if (error)
    throw new Error(
      `Could not inspect ${table} fixture ${id}: ${error.message}`,
    );
  return data?.[0] ?? null;
}

function crossOwnerInsertPayload(table, victim, victimFixtures, id, suffix) {
  const base = { id, owner_id: victim.id };
  switch (table) {
    case "rently_properties":
      return { ...base, name: `Unauthorized property ${suffix}` };
    case "rently_units":
      return {
        ...base,
        property_id: victimFixtures.rently_properties,
        unit_label: `Unauthorized unit ${suffix}`,
      };
    case "rently_tenants":
      return {
        ...base,
        full_name: `Unauthorized tenant ${suffix}`,
        email: `unauthorized-${suffix}@example.invalid`,
      };
    case "rently_leases":
      return {
        ...base,
        unit_id: victimFixtures.rently_units,
        tenant_id: victimFixtures.rently_tenants,
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        status: "active",
      };
    default:
      throw new Error(`Unsupported owner-isolation table: ${table}`);
  }
}

function crossOwnerUpdatePayload(table) {
  switch (table) {
    case "rently_properties":
      return { name: `Changed by another owner ${randomUUID()}` };
    case "rently_units":
      return { unit_label: `Changed by another owner ${randomUUID()}` };
    case "rently_tenants":
      return { full_name: `Changed by another owner ${randomUUID()}` };
    case "rently_leases":
      return { status: "ended" };
    default:
      throw new Error(`Unsupported owner-isolation table: ${table}`);
  }
}

async function assertRecordUnchanged(table, id, originalRecord, operation) {
  const currentRecord = await readAdminRecord(table, id);
  assert(
    JSON.stringify(currentRecord) === JSON.stringify(originalRecord),
    `A cross-owner ${operation} changed or removed ${table} record ${id}.`,
  );
}

async function assertCrossOwnerWritesBlocked(attacker, victim, victimFixtures) {
  for (const table of Object.keys(victimFixtures)) {
    const victimRecordId = victimFixtures[table];
    const originalRecord = await readAdminRecord(table, victimRecordId);
    assert(originalRecord, `Missing ${victim.label}'s ${table} fixture.`);

    const insertedRecordId = randomUUID();
    // Track the intended id before the request so cleanup can remove it even
    // if the API commits the insert but its response is lost.
    createdRows[table].push(insertedRecordId);
    const { data: insertedRows, error: insertError } = await attacker.client
      .from(table)
      .insert(
        crossOwnerInsertPayload(
          table,
          victim,
          victimFixtures,
          insertedRecordId,
          randomUUID(),
        ),
      )
      .select("id");
    assert(
      Boolean(insertError) ||
        !insertedRows?.some((row) => row.id === insertedRecordId),
      `${attacker.label} inserted a ${table} record for ${victim.label}.`,
    );
    assert(
      (await readAdminRecord(table, insertedRecordId)) === null,
      `${attacker.label}'s cross-owner insert created a ${table} record.`,
    );

    const { data: updatedRows, error: updateError } = await attacker.client
      .from(table)
      .update(crossOwnerUpdatePayload(table))
      .eq("id", victimRecordId)
      .select("id");
    assert(
      Boolean(updateError) ||
        !updatedRows?.some((row) => row.id === victimRecordId),
      `${attacker.label} updated ${victim.label}'s ${table} record.`,
    );
    await assertRecordUnchanged(
      table,
      victimRecordId,
      originalRecord,
      "update",
    );

    const { data: deletedRows, error: deleteError } = await attacker.client
      .from(table)
      .delete()
      .eq("id", victimRecordId)
      .select("id");
    assert(
      Boolean(deleteError) ||
        !deletedRows?.some((row) => row.id === victimRecordId),
      `${attacker.label} deleted ${victim.label}'s ${table} record.`,
    );
    await assertRecordUnchanged(
      table,
      victimRecordId,
      originalRecord,
      "delete",
    );
  }
}

async function createLeaseDocumentFixture(owner, leaseId) {
  const storagePath = `${owner.id}/${leaseId}/${randomUUID()}.pdf`;
  const fileBytes = new TextEncoder().encode(
    "%PDF-1.4\nRently isolation fixture\n%%EOF\n",
  );
  const { error: uploadError } = await owner.client.storage
    .from(leaseDocumentBucket)
    .upload(storagePath, fileBytes, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (uploadError) {
    throw new Error(
      `${owner.label} could not upload its lease document: ${uploadError.message}`,
    );
  }
  createdStoragePaths.push(storagePath);

  const { data, error } = await owner.client
    .from("lease_documents")
    .insert({
      owner_id: owner.id,
      lease_id: leaseId,
      storage_path: storagePath,
      file_name: "isolation-fixture.pdf",
      content_type: "application/pdf",
      file_size: fileBytes.byteLength,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(
      `${owner.label} could not create its lease document metadata: ${error.message}`,
    );
  }
  if (!data?.id) {
    throw new Error(
      `Supabase returned no id for ${owner.label}'s lease document metadata.`,
    );
  }
  createdRows.lease_documents.push(data.id);

  return { id: data.id, storagePath, fileBytes };
}

async function assertLeaseDocumentIsolation(owner, otherDocument, ownDocument) {
  const { data: ownRows, error: ownMetadataError } = await owner.client
    .from("lease_documents")
    .select("id, owner_id, storage_path")
    .eq("id", ownDocument.id);
  if (ownMetadataError) {
    throw new Error(
      `${owner.label} could not read its lease document metadata: ${ownMetadataError.message}`,
    );
  }
  assert(
    ownRows?.length === 1 &&
      ownRows[0].owner_id === owner.id &&
      ownRows[0].storage_path === ownDocument.storagePath,
    `${owner.label} could not read its own lease document metadata.`,
  );

  const { data: otherRows, error: otherMetadataError } = await owner.client
    .from("lease_documents")
    .select("id")
    .eq("id", otherDocument.id);
  if (otherMetadataError) {
    throw new Error(
      `${owner.label} could not check lease document metadata isolation: ${otherMetadataError.message}`,
    );
  }
  assert(
    otherRows?.length === 0,
    `${owner.label} can read another owner's lease document metadata.`,
  );

  const { data: ownFile, error: ownFileError } = await owner.client.storage
    .from(leaseDocumentBucket)
    .download(ownDocument.storagePath);
  if (ownFileError || !ownFile) {
    throw new Error(
      `${owner.label} could not download its lease document: ${ownFileError?.message ?? "no file returned"}`,
    );
  }
  const downloadedBytes = new Uint8Array(await ownFile.arrayBuffer());
  assert(
    downloadedBytes.length === ownDocument.fileBytes.length &&
      downloadedBytes.every(
        (byte, index) => byte === ownDocument.fileBytes[index],
      ),
    `${owner.label} downloaded unexpected contents for its lease document.`,
  );

  const { data: otherFile, error: otherFileError } = await owner.client.storage
    .from(leaseDocumentBucket)
    .download(otherDocument.storagePath);
  assert(
    Boolean(otherFileError) && !otherFile,
    `${owner.label} can download another owner's lease document.`,
  );
}

async function cleanup() {
  const errors = [];

  if (createdStoragePaths.length > 0) {
    try {
      const { error } = await admin.storage
        .from(leaseDocumentBucket)
        .remove(createdStoragePaths);
      if (error)
        errors.push(`Could not remove lease document files: ${error.message}`);
    } catch (error) {
      errors.push(`Could not remove lease document files: ${error.message}`);
    }
  }

  for (const [table, ids] of Object.entries(createdRows)) {
    if (ids.length === 0) continue;
    try {
      const { error } = await admin.from(table).delete().in("id", ids);
      if (error)
        errors.push(`Could not remove ${table} fixtures: ${error.message}`);
    } catch (error) {
      errors.push(`Could not remove ${table} fixtures: ${error.message}`);
    }
  }

  for (const owner of [...createdOwners].reverse()) {
    try {
      const { error } = await admin.auth.admin.deleteUser(owner.id);
      if (error)
        errors.push(
          `Could not remove test owner ${owner.label}: ${error.message}`,
        );
    } catch (error) {
      errors.push(
        `Could not remove test owner ${owner.label}: ${error.message}`,
      );
    }
    try {
      await owner.client?.auth.signOut();
    } catch {
      // Signing out is best-effort; it must not prevent fixture cleanup.
    }
  }

  return errors;
}

let testFailure;
try {
  const ownerA = await createOwner("A", "a");
  const ownerB = await createOwner("B", "b");
  const fixturesA = await createOwnerFixtures(ownerA, "A");
  const fixturesB = await createOwnerFixtures(ownerB, "B");
  const leaseDocumentA = await createLeaseDocumentFixture(
    ownerA,
    fixturesA.rently_leases,
  );
  const leaseDocumentB = await createLeaseDocumentFixture(
    ownerB,
    fixturesB.rently_leases,
  );

  await assertTableIsolation(ownerA, fixturesB, fixturesA);
  await assertTableIsolation(ownerB, fixturesA, fixturesB);
  await assertCrossOwnerWritesBlocked(ownerA, ownerB, fixturesB);
  await assertCrossOwnerWritesBlocked(ownerB, ownerA, fixturesA);
  await assertLeaseDocumentIsolation(ownerA, leaseDocumentB, leaseDocumentA);
  await assertLeaseDocumentIsolation(ownerB, leaseDocumentA, leaseDocumentB);
} catch (error) {
  testFailure = error;
}

const cleanupErrors = await cleanup();

if (testFailure) {
  console.error(`Owner isolation test failed: ${testFailure.message}`);
}
if (cleanupErrors.length > 0) {
  console.error(`Cleanup failed: ${cleanupErrors.join("; ")}`);
}
if (!testFailure && cleanupErrors.length === 0) {
  console.log(
    "Owner isolation passed: both accounts read their own records only and could not insert, update, or delete another owner's properties, units, tenants, or leases. Lease documents remained isolated. Test data and accounts were removed.",
  );
}

if (testFailure || cleanupErrors.length > 0) process.exitCode = 1;

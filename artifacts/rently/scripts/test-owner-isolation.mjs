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
  rently_leases: [],
  rently_units: [],
  rently_properties: [],
  rently_tenants: [],
};

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

async function cleanup() {
  const errors = [];

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

  await assertTableIsolation(ownerA, fixturesB, fixturesA);
  await assertTableIsolation(ownerB, fixturesA, fixturesB);
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
    "Owner isolation passed: both accounts read their own properties, units, tenants, and leases only. Test data and accounts were removed.",
  );
}

if (testFailure || cleanupErrors.length > 0) process.exitCode = 1;

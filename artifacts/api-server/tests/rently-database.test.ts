import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const property = "33333333-3333-4333-8333-333333333333";
const unit = "44444444-4444-4444-8444-444444444444";
const root = new URL("../../../", import.meta.url);

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    grant usage on schema auth, public to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    insert into auth.users values ('${owner}'), ('${other}');
    create schema storage;
    create table storage.buckets (
      id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[]
      language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
    grant usage on schema storage to authenticated;
    grant all on storage.objects to authenticated;
  `);
  await db.exec(await readFile(new URL("supabase/migrations/20261115000100_rently_owner_portfolio.sql", root), "utf8"));
  await db.exec(await readFile(new URL("artifacts/rently/supabase/migrations/20261115190000_lease_documents_storage.sql", root), "utf8"));
  const migration = await readFile(new URL("supabase/migrations/20261116000100_rently_rent_management.sql", root), "utf8");
  await db.exec(migration);
  await db.exec(migration); // Safe to apply again after a rolled-back deployment.
  const corrections = await readFile(new URL("supabase/migrations/20261116000200_rently_payment_corrections.sql", root), "utf8");
  await db.exec(corrections);
  await db.exec(corrections);
  const setup = await readFile(new URL("supabase/migrations/20261116000300_rently_setup_retries.sql", root), "utf8");
  await db.exec(setup);
  await db.exec(setup);
  const tenantPortal = await readFile(new URL("supabase/migrations/20261116000400_rently_tenant_portal_lookup.sql", root), "utf8");
  await db.exec(tenantPortal);
  await db.exec(tenantPortal);
  const tenantPortalServerOnly = await readFile(new URL("supabase/migrations/20261116000500_rently_tenant_portal_server_only.sql", root), "utf8");
  await db.exec(tenantPortalServerOnly);
  await db.exec(tenantPortalServerOnly);
  const tenantPortalPhoneLength = await readFile(new URL("supabase/migrations/20261116000600_rently_tenant_portal_short_phone.sql", root), "utf8");
  await db.exec(tenantPortalPhoneLength);
  await db.exec(tenantPortalPhoneLength);
  const stripeCheckout = await readFile(new URL("supabase/migrations/20261116000700_rently_stripe_checkout.sql", root), "utf8");
  await db.exec(stripeCheckout);
  await db.exec(stripeCheckout);
  await db.exec(`
    insert into public.rently_properties (id,owner_id,name) values ('${property}','${owner}','Test property');
    insert into public.rently_units (id,owner_id,property_id,unit_label) values ('${unit}','${owner}','${property}','A');
  `);
  return db;
}

async function asOwner(db: PGlite, id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}

async function lease(db: PGlite, start = "2028-01-31", end = "2028-04-30", day = 31) {
  return db.query<{ id: string }>(
    `select public.create_rently_lease_with_schedule(
      $1::uuid,'Tenant',null,null,$2::date,$3::date,1500,$4::smallint
    ) as id`,
    [unit, start, end, day],
  );
}

test("guided setup retries return saved ids without duplicate properties, units, tenants or dues", async () => {
  const db = await database();
  try {
    await asOwner(db, owner);
    const create = async (request: string, kind: string, payload: object) =>
      (await db.query<{ id: string }>("select public.create_rently_setup_record($1,$2,$3::jsonb) as id", [request,kind,JSON.stringify(payload)])).rows[0].id;
    const propertyRequest = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const unitRequest = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const leaseRequest = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const p = { name: "عمارة", propertyType: "Apartment" };
    const pid = await create(propertyRequest, "property", p);
    assert.equal(await create(propertyRequest, "property", p), pid);
    await assert.rejects(create(propertyRequest, "property", { ...p,name:"Changed" }), /different data/);
    const u = { propertyId:pid,unitLabel:"شقة 1" };
    const uid = await create(unitRequest, "unit", u);
    assert.equal(await create(unitRequest, "unit", u), uid);
    const l = { unitId:uid,tenantFullName:"مستأجر تجريبي",tenantEmail:null,tenantPhone:null,
      startDate:"2028-01-31",endDate:"2028-04-30",monthlyRent:1500,dueDay:31 };
    const lid = await create(leaseRequest, "lease", l);
    // Simulates a committed request whose HTTP response was lost.
    assert.equal(await create(leaseRequest, "lease", l), lid);
    assert.equal((await db.query("select * from public.rently_properties")).rows.length, 2);
    assert.equal((await db.query("select * from public.rently_units")).rows.length, 2);
    assert.equal((await db.query("select * from public.rently_tenants")).rows.length, 1);
    assert.equal((await db.query("select * from public.rently_leases")).rows.length, 1);
    assert.equal((await db.query("select * from public.rently_payments")).rows.length, 4);
    await assert.rejects(db.query("select * from public.rently_creation_requests"), /permission/);
    await assert.rejects(db.query("delete from public.rently_creation_requests"), /permission/);

    await asOwner(db, other);
    await assert.rejects(create(unitRequest, "unit", u), /not found/);
    await assert.rejects(create(leaseRequest, "lease", l), /not found/);
    // Request keys are isolated by owner, never a way to retrieve another owner's id.
    const otherPid = await create(propertyRequest, "property", p);
    assert.notEqual(otherPid, pid);
    assert.equal((await db.query("select * from public.rently_properties")).rows.length, 1);
    await asOwner(db, "");
    await assert.rejects(create(propertyRequest, "property", p), /Authentication/);
    await db.exec("set role anon");
    await assert.rejects(create(propertyRequest, "property", p), /permission/);
  } finally { await db.close(); }
});

test("failed setup creates neither a receipt nor an orphan tenant and permits a corrected retry", async () => {
  const db = await database();
  try {
    await asOwner(db, owner);
    const request = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const input = { unitId:unit,tenantFullName:"Tenant",startDate:"2028-01-16",
      endDate:"2028-01-20",monthlyRent:1500,dueDay:1 };
    const create = (payload: object) => db.query(
      "select public.create_rently_setup_record($1,'lease',$2::jsonb) as id", [request,JSON.stringify(payload)]);
    await assert.rejects(create(input), /No due date/);
    assert.equal((await db.query("select * from public.rently_tenants")).rows.length, 0);
    assert.equal((await db.query("select * from public.rently_leases")).rows.length, 0);
    const saved = await create({ ...input,endDate:"2028-03-20" });
    assert.ok(saved.rows[0].id);
    await db.exec("reset role");
    assert.equal((await db.query("select * from public.rently_creation_requests")).rows.length, 1);
  } finally { await db.close(); }
});

test("contract schedule clamps short months and retains the original due day", async () => {
  const db = await database();
  try {
    await asOwner(db, owner);
    const created = await lease(db);
    const id = created.rows[0].id;
    const payments = await db.query<{ due: string; amount: string }>(
      "select due_date::text as due,amount::text as amount from public.rently_payments where lease_id=$1 order by due_date", [id],
    );
    assert.deepEqual(payments.rows.map((p) => p.due), ["2028-01-31", "2028-02-29", "2028-03-31", "2028-04-30"]);
    assert.ok(payments.rows.every((p) => p.amount === "1500.00"));
    await assert.rejects(lease(db, "2028-02-01", "2028-05-01"), /overlaps/);
    assert.equal((await db.query("select * from public.rently_tenants")).rows.length, 1);

    await asOwner(db, other);
    assert.equal((await db.query("select * from public.rently_payments")).rows.length, 0);
    await assert.rejects(lease(db, "2029-01-01", "2029-03-01"), /not found/);
    await assert.rejects(db.query("select public.record_rently_payment($1,current_date)", [(await (async () => {
      await asOwner(db, owner);
      const p = await db.query<{ id: string }>("select id from public.rently_payments limit 1");
      await asOwner(db, other);
      return p.rows[0].id;
    })())]), /not found/);
  } finally { await db.close(); }
});

test("payment recording persists once, blocks future dates and cross-owner file links", async () => {
  const db = await database();
  try {
    await asOwner(db, owner);
    const created = await lease(db, "2026-01-31", "2026-03-31");
    const id = created.rows[0].id;
    const dates = await db.query<{ due: string }>("select due_date::text as due from public.rently_payments order by due_date");
    assert.deepEqual(dates.rows.map((p) => p.due), ["2026-01-31", "2026-02-28", "2026-03-31"]);
    const first = await db.query<{ id: string }>("select id from public.rently_payments order by due_date limit 1");
    const paymentId = first.rows[0].id;
    await assert.rejects(db.query("select public.record_rently_payment($1,current_date+1)", [paymentId]), /future/);
    await db.query("select public.record_rently_payment($1,current_date)", [paymentId]);
    assert.notEqual((await db.query<{ paid_at: unknown }>("select paid_at from public.rently_payments where id=$1", [paymentId])).rows[0].paid_at, null);
    await assert.rejects(db.query("select public.record_rently_payment($1,current_date)", [paymentId]), /already/);

    await db.query(`insert into public.lease_documents(owner_id,lease_id,storage_path,file_name,content_type,file_size)
      values($1,$2,$3,'lease.pdf','application/pdf',123)`, [owner,id,`${owner}/${id}/sample.pdf`]);
    await db.query("insert into storage.objects(bucket_id,name) values('rently-lease-documents',$1)", [`${owner}/${id}/sample.pdf`]);

    await asOwner(db, other);
    assert.equal((await db.query("select * from public.lease_documents")).rows.length, 0);
    assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
    await assert.rejects(db.query(`insert into public.lease_documents(owner_id,lease_id,storage_path,file_name,content_type,file_size)
      values($1,$2,$3,'lease.pdf','application/pdf',123)`, [other,id,`${other}/${id}/sample.pdf`]));
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('rently-lease-documents',$1)", [`${other}/${id}/forged.pdf`]));
  } finally { await db.close(); }
});

test("owner writes work without granting access to someone else's records", async () => {
  const db = await database();
  try {
    await asOwner(db, owner);
    const added = await db.query<{ id: string }>("insert into public.rently_properties(owner_id,name) values($1,'Owner property') returning id", [owner]);
    await db.query("update public.rently_properties set name='Renamed' where id=$1", [added.rows[0].id]);
    assert.equal((await db.query<{ name: string }>("select name from public.rently_properties where id=$1", [added.rows[0].id])).rows[0].name, "Renamed");
    await asOwner(db, other);
    assert.equal((await db.query("update public.rently_properties set name='Hijacked' where id=$1 returning id", [added.rows[0].id])).rows.length, 0);
    await assert.rejects(db.query("insert into public.rently_properties(owner_id,name) values($1,'Hijacked')", [owner]));
    await assert.rejects(db.query("insert into public.rently_units(owner_id,property_id,unit_label) values($1,$2,'Hijacked')", [other,property]));
    await asOwner(db, owner);
    await assert.rejects(lease(db, "2027-01-16", "2027-01-20", 1), /No due date/);
    assert.equal((await db.query("select * from public.rently_tenants")).rows.length, 0);
    assert.equal((await db.query("select * from public.rently_leases")).rows.length, 0);
    await assert.rejects(lease(db, "2027-01-01", "2040-01-01"), /Invalid lease dates/);
  } finally { await db.close(); }
});

test("correction preserves the due and atomically appends immutable owner-only history", async () => {
  const db = await database();
  try {
    await asOwner(db, owner);
    await lease(db, "2026-01-31", "2026-03-31");
    const original = (await db.query<{ id: string; lease_id: string; amount: string; due: string }>(
      "select id,lease_id,amount::text,due_date::text as due from public.rently_payments order by due_date limit 1",
    )).rows[0];
    const correct = (next: string | null, expected: string | null, reason: string | null) =>
      db.query("select public.correct_rently_payment($1,$2::date,$3::date,$4)", [original.id, next, expected, reason]);
    await assert.rejects(correct("2026-02-02", "2026-02-01", "Fix"), /not recorded/);
    await db.query("select public.record_rently_payment($1,'2026-02-01')", [original.id]);
    await correct("2026-02-02", "2026-02-01", "  Receipt checked  ");
    await correct("2026-02-03", "2026-02-02", "Bank statement checked");
    const saved = (await db.query(
      "select id,lease_id,amount::text,due_date::text as due from public.rently_payments where id=$1", [original.id],
    )).rows[0];
    assert.deepEqual(saved, original);
    assert.equal((await db.query("select * from public.rently_payments")).rows.length, 3);
    const history = (await db.query<{
      actor_id: string; owner_id: string; previous: string; next: string; reason: string; corrected_at: unknown;
    }>(`select actor_id,owner_id,previous_paid_at::text as previous,new_paid_at::text as next,reason,corrected_at
        from public.rently_payment_corrections order by corrected_at`)).rows;
    assert.deepEqual(history.map((row) => [row.previous, row.next, row.reason]), [
      ["2026-02-01", "2026-02-02", "Receipt checked"],
      ["2026-02-02", "2026-02-03", "Bank statement checked"],
    ]);
    assert.ok(history.every((row) => row.actor_id === owner && row.owner_id === owner && row.corrected_at));

    await assert.rejects(correct("2026-02-04", "2026-02-01", "Stale session"), /reload/);
    await assert.rejects(correct("2026-02-03", "2026-02-03", "No change"), /must change/);
    for (const reason of ["", "   ", "x".repeat(1001), null]) {
      await assert.rejects(correct("2026-02-04", "2026-02-03", reason), /valid/);
    }
    await assert.rejects(correct(null, "2026-02-03", "Missing date"), /valid/);
    await assert.rejects(correct("2999-01-01", "2026-02-03", "Future"), /valid/);
    await assert.rejects(correct("2026-02-30", "2026-02-03", "Invalid date"));
    await assert.rejects(db.query("update public.rently_payments set paid_at='2026-02-04' where id=$1", [original.id]), /permission/);
    await assert.rejects(db.query("delete from public.rently_payments where id=$1", [original.id]), /permission/);
    await assert.rejects(db.query("select public.record_rently_payment($1,'2026-02-04')", [original.id]), /already/);
    await assert.rejects(db.query("update public.rently_payment_corrections set reason='Forged'"), /permission/);
    await assert.rejects(db.query("delete from public.rently_payment_corrections"), /permission/);
    await assert.rejects(db.query(`insert into public.rently_payment_corrections
      (payment_id,owner_id,actor_id,previous_paid_at,new_paid_at,reason)
      values($1,$2,$2,'2026-02-03','2026-02-04','Forged')`, [original.id, owner]), /permission/);

    await asOwner(db, other);
    assert.equal((await db.query("select * from public.rently_payment_corrections")).rows.length, 0);
    await assert.rejects(correct("2026-02-04", "2026-02-03", "Hijack"), /not found/);
    await asOwner(db, "");
    await assert.rejects(correct("2026-02-04", "2026-02-03", "Unauthenticated"), /Authentication/);
    await db.exec("set role anon");
    await assert.rejects(correct("2026-02-04", "2026-02-03", "Anonymous"), /permission/);

    await asOwner(db, owner);
    assert.equal((await db.query("select paid_at::text as date from public.rently_payments where id=$1", [original.id])).rows[0].date, "2026-02-03");
    assert.equal((await db.query("select * from public.rently_payment_corrections")).rows.length, 2);
    await db.exec("reset role");
    // Even privileged deletion cannot silently rewrite the audit.
    await assert.rejects(db.exec("delete from public.rently_payment_corrections"), /immutable/);
    await assert.rejects(db.exec("truncate public.rently_payment_corrections"), /immutable/);
    await db.query("delete from public.rently_leases where id=$1", [original.lease_id]);
    assert.equal((await db.query("select * from public.rently_payments")).rows.length, 0);
    assert.equal((await db.query("select * from public.rently_payment_corrections")).rows.length, 2);
  } finally { await db.close(); }
});

test("an audit failure rolls back the correction rather than losing evidence", async () => {
  const db = await database();
  try {
    await asOwner(db, owner);
    await lease(db, "2026-01-31", "2026-03-31");
    const id = (await db.query<{ id: string }>("select id from public.rently_payments limit 1")).rows[0].id;
    await db.query("select public.record_rently_payment($1,'2026-02-01')", [id]);
    await db.exec(`reset role;
      create function public.reject_test_audit() returns trigger language plpgsql as $$
      begin raise exception 'Simulated audit write failure'; end; $$;
      create trigger reject_test_audit before insert on public.rently_payment_corrections
      for each row execute function public.reject_test_audit();`);
    await asOwner(db, owner);
    await assert.rejects(db.query("select public.correct_rently_payment($1,'2026-02-02','2026-02-01','Receipt')", [id]), /audit write failure/);
    assert.equal((await db.query("select paid_at::text as date from public.rently_payments where id=$1", [id])).rows[0].date, "2026-02-01");
    assert.equal((await db.query("select * from public.rently_payment_corrections")).rows.length, 0);
  } finally { await db.close(); }
});

test("public tenant lookup matches both contacts and only exposes one owner's rent summary", async () => {
  const db = await database();
  try {
    const tenant = "77777777-7777-4777-8777-777777777777";
    const leaseId = "88888888-8888-4888-8888-888888888888";
    await db.query(
      `insert into public.rently_tenants(id,owner_id,full_name,email,phone)
      values($1,$2,'Portal Tenant','Tenant@Example.com','898989')`,
      [tenant, owner],
    );
    await db.query(
      `insert into public.rently_leases(id,owner_id,unit_id,tenant_id,start_date,end_date,status,monthly_rent,due_day)
       values($1,$2,$3,$4,current_date-30,current_date+90,'active',900,1)`,
      [leaseId, owner, unit, tenant],
    );
    await db.query(
      `insert into public.rently_payments(owner_id,lease_id,due_date,amount)
       values($1,$2,current_date-1,900)`,
      [owner, leaseId],
    );

    const lookup = () => db.query<{
      tenant_name: string; rent_amount: string; due_date: string; payment_status: string;
    }>(`select tenant_name,rent_amount::text,due_date::text,payment_status
        from public.lookup_rently_tenant_portal($1,$2)`, [" tenant@example.com ", "89-89-89"]);
    await db.exec("set role anon");
    await assert.rejects(lookup(), /permission/);
    await assert.rejects(db.query("select * from public.rently_tenants"), /permission/);
    await db.exec("reset role");
    const overdue = await lookup();
    assert.equal(overdue.rows.length, 1);
    assert.equal(overdue.rows[0].tenant_name, "Portal Tenant");
    assert.equal(overdue.rows[0].rent_amount, "900.00");
    assert.equal(overdue.rows[0].payment_status, "overdue");
    assert.equal((await db.query(
      "select * from public.lookup_rently_tenant_portal($1,$2)",
      ["tenant@example.com", "898980"],
    )).rows.length, 0);

    await db.exec("reset role");
    await db.query("update public.rently_payments set paid_at=current_date where lease_id=$1", [leaseId]);
    assert.equal((await lookup()).rows[0].payment_status, "paid");

    await db.exec("reset role");
    await db.query(
      "update public.rently_payments set paid_at=null,due_date=current_date+1 where lease_id=$1",
      [leaseId],
    );
    const property2 = "55555555-5555-4555-8555-555555555555";
    const unit2 = "66666666-6666-4666-8666-666666666666";
    const tenant2 = "99999999-9999-4999-8999-999999999999";
    const lease2 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    await db.query("insert into public.rently_properties(id,owner_id,name) values($1,$2,'Other')", [property2, other]);
    await db.query("insert into public.rently_units(id,owner_id,property_id,unit_label) values($1,$2,$3,'B')", [unit2, other, property2]);
    await db.query(
      `insert into public.rently_tenants(id,owner_id,full_name,email,phone)
       values($1,$2,'Other Tenant','tenant@example.com','89-89-89')`,
      [tenant2, other],
    );
    await db.query(
      `insert into public.rently_leases(id,owner_id,unit_id,tenant_id,start_date,end_date,status,monthly_rent,due_day)
       values($1,$2,$3,$4,current_date-30,current_date+90,'active',1200,1)`,
      [lease2, other, unit2, tenant2],
    );
    await db.query(
      `insert into public.rently_payments(owner_id,lease_id,due_date,amount)
       values($1,$2,current_date+1,1200)`,
      [other, lease2],
    );
    assert.equal((await lookup()).rows.length, 0, "ambiguous matches across owners return no private record");
  } finally { await db.close(); }
});

test("Stripe rent confirmations validate amount, keep payment references, and are idempotent", async () => {
  const db = await database();
  try {
    const tenantId = "77777777-7777-4777-8777-777777777777";
    const leaseId = "88888888-8888-4888-8888-888888888888";
    await db.query(
      `insert into public.rently_tenants(id,owner_id,full_name,email,phone)
       values($1,$2,'Stripe Tenant','stripe@example.com','898989')`,
      [tenantId, owner],
    );
    await db.query(
      `insert into public.rently_leases(id,owner_id,unit_id,tenant_id,start_date,end_date,status,monthly_rent,due_day)
       values($1,$2,$3,$4,current_date-30,current_date+90,'active',900,1)`,
      [leaseId, owner, unit, tenantId],
    );
    await db.query(
      `insert into public.rently_payments(owner_id,lease_id,due_date,amount)
       values($1,$2,current_date,900)`,
      [owner, leaseId],
    );
    const paymentId = (await db.query<{ id: string }>(
      "select id from public.rently_payments where lease_id=$1",
      [leaseId],
    )).rows[0].id;
    const args = [paymentId, "cs_test_rently_12345", "pi_test_rently_12345", 90000, "usd"];

    assert.equal((await db.query<{ recorded: boolean }>(
      "select public.record_rently_stripe_payment($1,$2,$3,$4,$5) as recorded",
      args,
    )).rows[0].recorded, true);
    assert.equal((await db.query<{ recorded: boolean }>(
      "select public.record_rently_stripe_payment($1,$2,$3,$4,$5) as recorded",
      args,
    )).rows[0].recorded, true);

    const payment = (await db.query<{
      paid_at: string | null;
      stripe_checkout_session_id: string | null;
      stripe_payment_intent_id: string | null;
    }>(
      `select paid_at::text, stripe_checkout_session_id, stripe_payment_intent_id
       from public.rently_payments where id=$1`,
      [paymentId],
    )).rows[0];
    assert.ok(payment.paid_at);
    assert.equal(payment.stripe_checkout_session_id, args[1]);
    assert.equal(payment.stripe_payment_intent_id, args[2]);

    await assert.rejects(
      db.query("select public.record_rently_stripe_payment($1,$2,$3,$4,$5)", [
        paymentId, args[1], args[2], 89999, "usd",
      ]),
      /amount does not match/,
    );
    await assert.rejects(
      db.query("select public.record_rently_stripe_payment($1,$2,$3,$4,$5)", [
        paymentId, args[1], args[2], args[3], "eur",
      ]),
      /Invalid Stripe payment confirmation/,
    );
    await db.exec("set role anon");
    await assert.rejects(
      db.query("select public.record_rently_stripe_payment($1,$2,$3,$4,$5)", args),
      /permission/,
    );
  } finally { await db.close(); }
});

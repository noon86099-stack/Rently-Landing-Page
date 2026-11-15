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

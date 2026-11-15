/**
 * Apply the additive Rently rent-management migration to the selected Supabase
 * project. Connection credentials stay in the environment, never in logs/files.
 */
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = new URL("../../", import.meta.url);
const migrationName = "20261116000100_rently_rent_management.sql";
const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error("Add SUPABASE_DB_URL through Replit Secrets before migrating.");
}
const url = new URL(connectionString);
if (!["postgres:", "postgresql:"].includes(url.protocol)) {
  throw new Error("SUPABASE_DB_URL must be a PostgreSQL connection URL.");
}
if (/YOUR[-_ ]?PASSWORD|\[.*PASSWORD.*\]|<.*PASSWORD.*>|CHANGE.?ME/i.test(decodeURIComponent(url.password))) {
  throw new Error("The database URL still contains a sample password. No changes were applied.");
}
for (const key of ["sslmode", "ssl", "sslrootcert", "sslcert", "sslkey"]) {
  url.searchParams.delete(key);
}

const ca = await fs.readFile(
  new URL("attached_assets/prod-ca-2021_1794772789110.crt", root),
  "utf8",
);
const sql = await fs.readFile(
  new URL(`supabase/migrations/${migrationName}`, root),
  "utf8",
);
const client = new pg.Client({
  connectionString: url.toString(),
  ssl: { ca, rejectUnauthorized: true },
  connectionTimeoutMillis: 12_000,
});

try {
  await client.connect();
  await client.query("begin");
  await client.query("set local lock_timeout = '5s'");
  await client.query("set local statement_timeout = '30s'");
  await client.query("select pg_advisory_xact_lock(1642829015)");
  // The base portfolio must already be installed; never create unrelated data.
  const base = await client.query(
    "select to_regclass('public.rently_properties') as properties, to_regclass('public.rently_leases') as leases",
  );
  if (!base.rows[0]?.properties || !base.rows[0]?.leases) {
    throw new Error("The base Rently owner-portfolio migration is required first.");
  }
  await client.query(sql);
  await client.query("notify pgrst, 'reload schema'");
  await client.query("commit");
  process.stdout.write("Rently rent-management migration applied with verified TLS.\n");
} catch (error: unknown) {
  await client.query("rollback").catch(() => {});
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "migration-error";
  process.stderr.write(`Rently migration failed (${code}). No migration changes were committed.\n`);
  process.exitCode = 1;
} finally {
  await client.end();
}

import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

export type TenantPortalRow = {
  tenant_name: unknown;
  rent_amount: unknown;
  due_date: unknown;
  payment_status: unknown;
};

export class TenantPortalDatabaseUnavailable extends Error {
  constructor() {
    super("Tenant portal database is unavailable");
    this.name = "TenantPortalDatabaseUnavailable";
  }
}

let pool: pg.Pool | null = null;

function getPool() {
  if (pool) return pool;
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) throw new TenantPortalDatabaseUnavailable();

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new TenantPortalDatabaseUnavailable();
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new TenantPortalDatabaseUnavailable();
  }
  for (const key of ["sslmode", "ssl", "sslrootcert", "sslcert", "sslkey"]) {
    url.searchParams.delete(key);
  }

  let ca: string;
  try {
    ca = readFileSync(new URL("./assets/prod-ca-2021_1794772789110.crt", import.meta.url), "utf8");
  } catch {
    try {
      ca = readFileSync(
        path.resolve(process.cwd(), "attached_assets/prod-ca-2021_1794772789110.crt"),
        "utf8",
      );
    } catch {
      throw new TenantPortalDatabaseUnavailable();
    }
  }

  pool = new pg.Pool({
    connectionString: url.toString(),
    ssl: { ca, rejectUnauthorized: true },
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: 30_000,
    max: 4,
  });
  return pool;
}

export async function lookupRentlyTenantPortal(email: string, phone: string) {
  const result = await getPool().query<TenantPortalRow>(
    `select tenant_name, rent_amount, due_date, payment_status
     from public.lookup_rently_tenant_portal($1, $2)
     limit 1`,
    [email, phone],
  );
  return result.rows[0] ?? null;
}

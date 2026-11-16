import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

export type TenantPortalRow = {
  tenant_name: unknown;
  rent_amount: unknown;
  due_date: unknown;
  payment_status: unknown;
};

export type TenantPortalCheckoutPayment = {
  id: string;
  ownerId: string;
  tenantName: string;
  tenantEmail: string | null;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  checkoutSessionId: string | null;
};

export type RentlyStripePaymentReference = {
  id: string;
  ownerId: string;
  amount: number;
  paidAt: string | null;
  checkoutSessionId: string | null;
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

export async function findRentlyTenantPortalCheckoutPayment(
  email: string,
  phone: string,
): Promise<TenantPortalCheckoutPayment | null> {
  const result = await getPool().query<{
    payment_id: string;
    owner_id: string;
    tenant_name: string;
    tenant_email: string | null;
    amount: string;
    due_date: string;
    paid_at: string | null;
    stripe_checkout_session_id: string | null;
  }>(
    `with matches as (
       select
         p.id::text as payment_id,
         p.owner_id::text as owner_id,
         t.full_name as tenant_name,
         t.email as tenant_email,
         p.amount::text as amount,
         p.due_date::text as due_date,
         p.paid_at::text as paid_at,
         p.stripe_checkout_session_id
       from public.rently_tenants t
       join public.rently_leases l
         on l.tenant_id = t.id and l.owner_id = t.owner_id
       join public.rently_payments p
         on p.lease_id = l.id and p.owner_id = l.owner_id
       where lower(btrim(coalesce(t.email, ''))) = lower(btrim($1))
         and regexp_replace(coalesce(t.phone, ''), '[^0-9]', '', 'g') =
             regexp_replace(coalesce($2, ''), '[^0-9]', '', 'g')
     ),
     matched_owners as (
       select count(distinct owner_id) as owner_count from matches
     ),
     selected_payment as (
       select *
       from matches
       order by
         case when paid_at is null then 0 else 1 end,
         case when paid_at is null then due_date end asc nulls last,
         case when paid_at is not null then due_date end desc nulls last
       limit 1
     )
     select s.*
     from selected_payment s
     cross join matched_owners o
     where o.owner_count = 1
     limit 1`,
    [email, phone],
  );
  const row = result.rows[0];
  if (!row) return null;
  const amount = Number(row.amount);
  if (!Number.isFinite(amount)) throw new Error("Invalid rent amount in database");
  return {
    id: row.payment_id,
    ownerId: row.owner_id,
    tenantName: row.tenant_name,
    tenantEmail: row.tenant_email,
    amount,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    checkoutSessionId: row.stripe_checkout_session_id,
  };
}

export async function getRentlyStripePaymentReference(
  paymentId: string,
): Promise<RentlyStripePaymentReference | null> {
  const result = await getPool().query<{
    id: string;
    owner_id: string;
    amount: string;
    paid_at: string | null;
    stripe_checkout_session_id: string | null;
  }>(
    `select id::text, owner_id::text, amount::text, paid_at::text,
            stripe_checkout_session_id
     from public.rently_payments
     where id = $1
     limit 1`,
    [paymentId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const amount = Number(row.amount);
  if (!Number.isFinite(amount)) throw new Error("Invalid rent amount in database");
  return {
    id: row.id,
    ownerId: row.owner_id,
    amount,
    paidAt: row.paid_at,
    checkoutSessionId: row.stripe_checkout_session_id,
  };
}

export async function saveRentlyStripeCheckoutSession(
  paymentId: string,
  sessionId: string,
): Promise<boolean> {
  const result = await getPool().query(
    `update public.rently_payments
     set stripe_checkout_session_id = $2
     where id = $1
       and paid_at is null
       and (stripe_checkout_session_id is null or stripe_checkout_session_id = $2)
     returning id`,
    [paymentId, sessionId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function clearExpiredRentlyStripeCheckoutSession(
  paymentId: string,
  sessionId: string,
): Promise<void> {
  await getPool().query(
    `update public.rently_payments
     set stripe_checkout_session_id = null
     where id = $1 and stripe_checkout_session_id = $2 and paid_at is null`,
    [paymentId, sessionId],
  );
}

export async function recordRentlyStripePayment(input: {
  paymentId: string;
  sessionId: string;
  paymentIntentId: string | null;
  amountCents: number;
  currency: string;
}): Promise<boolean> {
  const result = await getPool().query<{ recorded: boolean }>(
    `select public.record_rently_stripe_payment($1, $2, $3, $4, $5) as recorded`,
    [
      input.paymentId,
      input.sessionId,
      input.paymentIntentId,
      input.amountCents,
      input.currency,
    ],
  );
  return result.rows[0]?.recorded === true;
}

export async function listUnpaidRentlyStripeSessions(afterId: string | null) {
  const result = await getPool().query<{ id: string; session_id: string }>(
    `select id::text, stripe_checkout_session_id as session_id
     from public.rently_payments
     where paid_at is null and stripe_checkout_session_id is not null
       and ($1::uuid is null or id > $1::uuid)
     order by id
     limit 20`,
    [afterId],
  );
  return result.rows;
}

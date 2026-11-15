# Rently Supabase setup

Rently uses **the existing Supabase project**, not a replacement database.
Application records are stored in its PostgreSQL tables. Signed lease PDFs
are stored in its private `rently-lease-documents` bucket; generated draft PDFs
are derived on demand from the saved agreement.

## Environment

Store database credentials and API keys in Replit Secrets, never in source files.

- `VITE_SUPABASE_URL`: the public Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: project publishable key, used by the client
  and by Express when forwarding the authenticated user's bearer token.
- `SUPABASE_DB_URL`: only used by the migration command, never by browser code.
  Use the actual **Shared pooler / Session mode** URL on IPv4-only networks.
  Replace its password placeholder and URL-encode special password characters.

No service-role key is required by the application. Express verifies bearer
tokens with Supabase Auth and accesses tables using the same user's RLS context.

## Migration order

1. `supabase/migrations/20261115000100_rently_owner_portfolio.sql`
2. `artifacts/rently/supabase/migrations/20261115190000_lease_documents_storage.sql`
3. `supabase/migrations/20261116000100_rently_rent_management.sql`
4. `supabase/migrations/20261116000200_rently_payment_corrections.sql`

The existing project has the first two modules. The third migration is
additive: it preserves existing properties, tenants, and leases. Older leases
remain readable with missing rent terms rather than inventing amounts or dues.
For these leases the UI does not offer a generated PDF until terms are present.

Apply the additive rent-management and correction migrations from the workspace with:

```sh
pnpm --filter @workspace/scripts run rently:migrate
```

The command validates TLS against the uploaded Supabase root certificate, runs
within a transaction, sets lock/statement timeouts, and never logs credentials.
It refuses sample passwords. Alternatively, run the third SQL file in the
Supabase SQL Editor. Do not run destructive resets or replace the database.

## Relationships and write access

- Owners are Supabase `auth.users` identities.
- Properties belong to owners; units belong to properties.
- Leases link an owner's unit to that owner's tenant.
- Payment records link to a lease with a matching owner.
- Composite foreign keys prevent cross-owner links.
- Owners may insert/update their own properties, units, and tenants.
- Lease creation and payment recording use checked database functions.
- A unit row lock prevents two concurrent overlapping leases from being saved.
- Lease creation saves its new tenant, lease, and all dues atomically.
- Dues retain the original contractual day and clamp to each month's last day.
- A due is paid when `paid_at` is present; otherwise it is overdue after its due
  day. The UI derives this state, not a potentially stale stored status flag.
- Payment dates after the database's `current_date` are rejected.
- Direct lease/payment writes and direct record deletion are not granted.
- Paid dates can only be corrected by the payment owner, with a non-empty reason
  and the previously loaded date. Stale corrections are rejected rather than
  overwriting another session's change. Unpaid dues cannot be corrected.
- Corrections update only `paid_at`; due IDs, dates, amounts and lease links stay
  intact. Duplicate initial payment recording remains blocked.
- Correction history stores old/new dates, reason, authenticated actor and server
  time atomically. Owners can read only their history, never write or erase it.
  It has no cascading foreign keys, so account/lease deletion cannot erase history.

If the optional document module exists, the rent migration adds an
owner/lease foreign key and tightens metadata and storage policies. The new
foreign key is `NOT VALID` to avoid deleting/rejecting pre-existing inconsistent
metadata during rollout, but is enforced on future writes. Before separately
validating that constraint, review any old records. Do not delete them blindly.

## Verification

```sh
pnpm --filter @workspace/api-server run test:rently
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/rently run typecheck
```

The database regression tests use a separate, disposable in-process PostgreSQL
instance (PGlite), never application data. They verify migration reapplication,
normal/leap February schedules, owner writes, cross-owner denial, atomic
rollback, overlap rejection, payment validation, and document/file ownership.
The PDF test creates an actual PDF with Arabic names.

These local tests do **not** replace live Supabase verification. Until the
migration is successfully applied, rent management is not enabled in the real
project. Read-only portfolio data remains visible with an explicit setup notice.

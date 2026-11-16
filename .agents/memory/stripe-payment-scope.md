---
name: Stripe payment scope
description: User-approved Stripe account and test-payment constraints for Rently.
---

The user wants **Stripe Test Mode** for rent checkout on the published site: no real money or real cards. Published checkout should open Stripe Test Checkout, and successful test payments may update the linked Supabase rent record so the landlord sees it as paid. The user subsequently requested removal of the portal's test-payment notice, without changing test-only processing. Do not enable live charges or Stripe Connect payouts.

**Why:** The user explicitly enabled Stripe Test Mode on the published portal after learning that successful test checkouts change the rent status in Supabase.

**How to apply:** Bind development and production API runtimes to the confirmed Rently sandbox account, never the old LUNAPAWS or previous sandbox account. Accept only test-mode API keys and update rent status only after verifying a successful Stripe Checkout session.

Connector credential responses can use either `secret` or `secret_key`; support both without logging either value. Keep `stripe-replit-sync` external to server bundling.

**Why:** Different connector formats were encountered, and bundling the sync library prevents it from finding its packaged SQL migrations while reporting no migration error.

**How to apply:** Preserve both response formats and the build exclusion when updating Stripe dependencies or server builds.

Use an explicitly configured, verified public origin for Stripe success, cancellation, and final portal redirects, never the workspace's inferred domain. Revalidate return URLs before reusing saved Checkout sessions.

**Why:** A completed mobile checkout returned the tenant to Replit's private-preview login instead of the public portal; existing Stripe sessions retain the return URLs they were created with.

**How to apply:** Obtain the current published origin through deployment metadata before configuring it. Keep payment verification server-side, and replace only unpaid, open sessions with stale return URLs; never require tenants to sign into Replit.

Process Rently rent-payment confirmations through a dedicated signed `checkout.session.completed` webhook, separate from `stripe-replit-sync`. Reuse the existing server-side session and idempotent database validation; accept test mode only.

**Why:** The generic Stripe sync webhook does not update Rently's Supabase rent records, while a tenant's browser redirect is not a reliable payment signal.

**How to apply:** Verify the raw body using `STRIPE_WEBHOOK_SECRET`, acknowledge unrelated or non-paid events without changing rent, and let transient server failures return a retryable response.

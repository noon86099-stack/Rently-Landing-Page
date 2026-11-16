---
name: Stripe payment scope
description: User-approved Stripe account and test-payment constraints for Rently.
---

The user wants **Stripe Test Mode** for rent checkout on the published site: no real money or real cards. Published checkout should open Stripe Test Checkout, and successful test payments may update the linked Supabase rent record so the landlord sees it as paid. Show that this is a test payment. Do not enable live charges or Stripe Connect payouts.

**Why:** The user explicitly enabled Stripe Test Mode on the published portal after learning that successful test checkouts change the rent status in Supabase.

**How to apply:** Bind development and production API runtimes to the confirmed Rently sandbox account, never the old LUNAPAWS or previous sandbox account. Accept only test-mode API keys and update rent status only after verifying a successful Stripe Checkout session.

Connector credential responses can use either `secret` or `secret_key`; support both without logging either value. Keep `stripe-replit-sync` external to server bundling.

**Why:** Different connector formats were encountered, and bundling the sync library prevents it from finding its packaged SQL migrations while reporting no migration error.

**How to apply:** Preserve both response formats and the build exclusion when updating Stripe dependencies or server builds.

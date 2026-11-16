---
name: Stripe payment scope
description: User-approved Stripe account and test-payment constraints for Rently.
---

The user wants **test-only** rent checkout: no real money and no real cards. Keep landlord payment status visible in Rently after a successful test checkout. Do not enable live charges or Stripe Connect payouts.

**Why:** The user clarified that they do not want real money or real cards, overriding their earlier selection of live payments to each landlord.

**How to apply:** Use Stripe Test Mode and test card numbers only. Keep the test checkout in Preview unless the user explicitly approves a supported public test/demo approach.

Connector credential responses can use either `secret` or `secret_key`; support both without logging either value. Keep `stripe-replit-sync` external to server bundling.

**Why:** Different connector formats were encountered, and bundling the sync library prevents it from finding its packaged SQL migrations while reporting no migration error.

**How to apply:** Preserve both response formats and the build exclusion when updating Stripe dependencies or server builds.

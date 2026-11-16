---
name: Stripe payment scope
description: User-approved Stripe account and test-payment constraints for Rently.
---

The user wants **test-only** rent checkout: no real money and no real cards. Stripe Test Mode remains available in Preview; the published portal should use a clearly labeled simulation that never charges or changes actual rent records. Do not enable live charges or Stripe Connect payouts.

**Why:** The user clarified that they do not want real money or real cards, then approved publishing a no-charge simulation.

**How to apply:** Keep test Stripe credentials scoped to development. In published builds, keep payment actions local-only and explicitly state that the simulation does not change database payment status.

Connector credential responses can use either `secret` or `secret_key`; support both without logging either value. Keep `stripe-replit-sync` external to server bundling.

**Why:** Different connector formats were encountered, and bundling the sync library prevents it from finding its packaged SQL migrations while reporting no migration error.

**How to apply:** Preserve both response formats and the build exclusion when updating Stripe dependencies or server builds.

---
name: Stripe payment scope
description: User-approved Stripe account and test-payment constraints for Rently.
---

The user wants **test-only** rent checkout: no real money and no real cards. Use the Rently sandbox's server-side Stripe API key from Replit Secrets; reject non-test keys. Preview can use Stripe Test Mode, while the published portal remains a clearly labeled simulation that never charges or changes actual rent records. Do not enable live charges or Stripe Connect payouts.

**Why:** The user clarified that they do not want real money or real cards, then approved publishing a no-charge simulation.

**How to apply:** Bind the development API key to the Rently sandbox account, not the old LUNAPAWS or previous sandbox account. Keep the published payment action local-only and explicitly state that it does not change database payment status.

Connector credential responses can use either `secret` or `secret_key`; support both without logging either value. Keep `stripe-replit-sync` external to server bundling.

**Why:** Different connector formats were encountered, and bundling the sync library prevents it from finding its packaged SQL migrations while reporting no migration error.

**How to apply:** Preserve both response formats and the build exclusion when updating Stripe dependencies or server builds.

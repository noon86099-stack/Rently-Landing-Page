---
name: Stripe payment scope
description: User-approved Stripe account and test-payment constraints for Rently.
---

Use the currently connected **Rently Landing Page Sandbox** for test payments. The user initially selected a different Rently sandbox, then explicitly approved using the existing connection instead. Do not use the old LunaPaws account. Successful rent payments should appear to the landlord.

**Why:** After account-switching proved confusing, the user answered “نعم، استخدمه” to using the already connected account for test payments only.

**How to apply:** Verify the connected Stripe account before enabling Checkout. Do not assume that two Rently-branded sandboxes are the same account. Do not enable live payments or landlord payouts without a new request.

Connector credential responses can use either `secret` or `secret_key`; support both without logging either value. Keep `stripe-replit-sync` external to server bundling.

**Why:** Different connector formats were encountered, and bundling the sync library prevents it from finding its packaged SQL migrations while reporting no migration error.

**How to apply:** Preserve both response formats and the build exclusion when updating Stripe dependencies or server builds.

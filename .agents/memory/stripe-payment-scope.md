---
name: Stripe payment scope
description: User-approved Stripe account and test-payment constraints for Rently.
---

Use the user's **Rently sandbox** Stripe account, not the separately connected **Rently Landing Page Sandbox** or the old LunaPaws account. Payments are test-only; successful rent payments should appear to the landlord.

**Why:** The user explicitly selected the Rently sandbox shown in their Stripe dashboard and requested test payment data only.

**How to apply:** Verify the connected Stripe account before enabling Checkout. Do not assume that two Rently-branded sandboxes are the same account. Do not enable live payments or landlord payouts without a new request.

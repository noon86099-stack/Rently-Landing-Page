---
name: Stripe payment scope
description: User-approved Stripe account and test-payment constraints for Rently.
---

The user now wants real rent payments to go directly to each landlord's own Stripe account using Stripe Connect. The currently connected Rently Stripe account is only the platform account; no landlord payout onboarding has been implemented yet. Do not route landlord funds to Rently by default.

**Why:** The user explicitly chose real payments and selected each landlord as the recipient.

**How to apply:** Use Stripe Connect so each landlord links and verifies their own account. Confirm who bears Stripe's processing fees before choosing the charge type. Do not assume that Rently's connected account is the landlord's payout destination.

Connector credential responses can use either `secret` or `secret_key`; support both without logging either value. Keep `stripe-replit-sync` external to server bundling.

**Why:** Different connector formats were encountered, and bundling the sync library prevents it from finding its packaged SQL migrations while reporting no migration error.

**How to apply:** Preserve both response formats and the build exclusion when updating Stripe dependencies or server builds.

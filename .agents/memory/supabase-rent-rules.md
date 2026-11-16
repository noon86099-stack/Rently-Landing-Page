---
name: Rently Supabase and rent rules
description: Rently's selected Supabase project, owner authentication, and recurring rent due-date behavior.
---

Use the existing Supabase project named Rently with Supabase Auth email/password. Keep owner-owned records isolated with row-level security.

Supabase is the user's chosen replacement for MongoDB Atlas/Mongoose in the pasted technical requirements. Do not migrate to MongoDB based on that earlier checklist.

**Why:** the user repeatedly clarified "استخدم supabase" and "supabase هو البديل" after the MongoDB checklist, and selected this project and authentication method for the app.

**How to apply:** use the project publishable key only in browser code; never expose a service-role key. Scope every property, tenant, lease, payment, and file operation to the authenticated owner.

Keep Rently registration simple, without email messages or confirmation.

**Why:** the user requested "عملية تسجيل سهلة بدون رسائل ايميل او تاكيد".

**How to apply:** retain password-protected accounts and owner isolation, but do not require email verification to complete signup. Configure this in Supabase Auth rather than bypassing authentication or exposing administrator credentials.

Public tenant rent lookup must stay behind the API server's private database connection. Do not grant its lookup function to `public`, `anon`, or `authenticated`, and do not call it directly from browser code.

**Why:** a public RPC can be called directly with the publishable key and bypass API-level throttling while returning private rent information.

**How to apply:** keep the database function narrow, expose only the tenant rent summary through the API, and retain the server-side rate limit.

Tenant Portal phone validation must allow the six-digit values already accepted in landlord-entered records.

**Why:** a stricter minimum rejected a registered phone before the portal could attempt a match.

**How to apply:** keep OpenAPI, API, and database minimum lengths aligned with existing records; normalize punctuation instead of assuming every stored number has seven or more digits.

Monthly rent is due on the contractual day of the month. If that day does not exist in a month, use the month's final day. An unpaid installment becomes overdue the day after its due date, with no grace period.

**Why:** the user selected this recurring due-date rule.

**How to apply:** preserve the original contract due day when generating each month so a short-month adjustment does not shift future installments.

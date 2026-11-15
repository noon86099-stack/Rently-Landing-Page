---
name: Safe creation retries
description: Why setup retry identifiers survive successful responses and schema changes apply only on merge.
---

Keep a creation identifier stable for identical owner-scoped form submissions even after a successful response. Persist only an opaque digest and UUID in the browser, not tenant form contents.

**Why:** A lost response, a stale tab, or a reload must not create another property, unit, tenant, contract, or schedule. Releasing the identifier immediately on success reopens that risk.

**How to apply:** Treat the database receipt and creation as one transaction. Do not clear retry identifiers during ordinary form resets. Changed payloads use a different identifier; selecting existing records is how an owner resumes saved progress.

Do not apply new Supabase migrations directly to the shared project from a task fork.

**Why:** Supabase is external to the fork; changing it there would affect the main application's data before the task is merged.

**How to apply:** Verify migrations in an isolated database and include them in the existing post-merge migration runner.

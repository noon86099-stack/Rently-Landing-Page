# Rently owner isolation API test

`rently_owner_policies.sql` checks the database policy definitions. For a real
two-account read-isolation check, run the API test against a dedicated Supabase
test project:

```sh
SUPABASE_TEST_URL=... \
SUPABASE_TEST_PUBLISHABLE_KEY=... \
SUPABASE_TEST_SERVICE_ROLE_KEY=... \
pnpm --filter @workspace/rently test:owner-isolation
```

The API test creates two temporary confirmed users, adds one property, unit,
tenant, and lease for each, and reads the records using each user's own
authenticated Supabase client. It verifies each user can read their own rows
but not the other user's rows, then deletes the fixture rows and temporary
users, including when an assertion fails. The service-role key is only used by
the test process to create and clean up fixtures; never use a production
project or expose this key in browser code.

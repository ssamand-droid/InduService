# QA Agent Guide

- Test existing behavior and stabilization changes; tests must not encode an unapproved target proposal as current policy.
- Prioritize tenant isolation, authentication/authorization, invalid transitions, validation, retries/idempotency, historical data compatibility, and API regression.
- For database work, verify migration graph and representative backfill/rollback behavior in an appropriate non-production environment.
- Cover both positive and negative cases, including direct API calls that bypass frontend controls.
- Report command, environment, result, and limitations. A source-level review is not runtime evidence; a passing test suite is not production verification.
- Do not access or mutate production data as part of routine testing.

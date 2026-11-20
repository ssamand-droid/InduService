# Database Architecture

## Current persistence shape

The backend uses Django ORM models and app-owned migrations under `backend/apps/<app>/migrations/`. UUID/timestamp/soft-delete base concepts exist in `core`. The model inventory spans identity, organizations, services, assets, commerce, finance, contracts, reviews, support, and platform capabilities. App-by-app details are in the domain pages.

## Database engine and migration status

The Phase 0 source audit reports a critical discrepancy: production settings configure SQLite at `/var/www/induservice/backend/db.sqlite3`, while PostgreSQL driver/configuration is also present and PostgreSQL is the intended architecture. Resolve the authoritative production engine/configuration before further schema work. Migration files are committed, but parity against a live production database is **UNVERIFIED**; no live DB inspection was part of this baseline.

## Data-boundary concerns

- `users.Profile` mixes personal identity with provider/company and financial profile concerns.
- Service request, quote, order, and execution semantics are not yet cleanly separated.
- Payment contains financial calculations and cross-domain coupling; financial objects/statuses need explicit lifecycle boundaries.
- Organization membership exists, but tenant ownership and isolation across every model/query/file/export need an authorization/data audit.
- Asset hierarchy, product seller offers, and procurement records are incomplete or unverified as first-class data concepts.

## Migration controls

1. Do not run production migrations as part of Phase 0 documentation.
2. Before a migration, identify dependent models, serializers, APIs, signals, imports, and UI callers.
3. Prefer additive/backward-compatible migrations; preserve API behavior and historical financial/work records.
4. Define data backfill, null/duplicate handling, rollback, and verification queries before destructive changes.
5. Coordinate shared foundation changes so only one migration stream owns them at a time.
6. Verify migration graph and live schema separately; committed migration files alone do not prove parity.

## Not verified by repository inspection

Production DB engine/state, migration parity, row counts/data quality, backup/restore, indexing under real workload, transaction isolation behavior, and operational retention policy. Resolve these with authorized environment evidence before claiming production readiness.

## References

- [Phase 0 baseline](../../ARCHITECTURE_BASELINE_V1.md)
- [Users domain](../domains/users.md), [organizations](../domains/organizations.md), [payment](../domains/payment.md)

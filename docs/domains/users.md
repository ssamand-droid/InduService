# Users & Identity Domain

**Current app:** `backend/apps/users` · **Observed models:** `User`, `Profile`, `PortfolioItem`, `Certification`.

## Responsibility

Authentication identity, person-level profile data, and professional portfolio/certifications. Business tenancy is represented separately by the `organizations` app; membership connects a user to an organization.

## Current-state findings

`Profile` has been identified by the Phase 0 audit as overloaded with personal, provider/company, operational, and financial concerns. Role representation and permission boundaries need review. The auth frontend persists access/refresh tokens in browser `localStorage` via Zustand persistence, a high-priority security issue.

## Boundary and constraints

Keep `User` as a person/account. Store business ownership and tenant-scoped roles on organization/membership concepts. Do not infer authorization from frontend roles alone. Profile decomposition requires data mapping, API compatibility, migration/backfill, and an ADR where cross-domain contracts change.

## Evidence to maintain

Model/serializer/API inventory, role-to-permission matrix, token/session design, profile field ownership, and migration evidence. See [ADR-001](../decisions/ADR-001.md) and [database architecture](../architecture/database-architecture.md).

# Organizations Domain

**Current app:** `backend/apps/organizations` · **Observed models:** `Organization`, `OrganizationMembership`.

## Responsibility

Represent business tenants and the association of people with those businesses. The app exists in this checkout; this is current implementation evidence, not proof that all records are tenant-scoped correctly.

## Current-state questions

Verify organization ownership on each business object, membership lifecycle and role semantics, invitation/verification behavior, cross-tenant list/detail/search/export/file access, and how legacy organization-like fields in `users.Profile` are reconciled.

## Target boundary

Business-specific data belongs to an organization. User accounts can participate in multiple organizations through membership if supported by approved policy. Site/area/production-line hierarchy is not established by the two observed models and remains a design decision.

## Safety rules

Resolve tenant access on the server for every query and mutation. Do not rely on client-supplied organization IDs. Changes to tenant keys require a backfill plan and cross-tenant regression evidence. See [ADR-001](../decisions/ADR-001.md).

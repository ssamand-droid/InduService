# Backend Agent Guide

- Read the relevant domain, workflow, API contract, and ADR before editing backend behavior.
- During Phase 0, do not add business features, speculative models, or new endpoints.
- Keep domain rules with their owning app; avoid expanding `core` into a business-rule dumping ground.
- Enforce authentication, actor/tenant scope, validation, and allowed state transitions server-side.
- Preserve public API behavior unless the change includes a reviewed compatibility/deprecation plan.
- Before schema edits, map dependent models, migrations, serializers, signals, imports, API clients, existing data, and rollback/backfill strategy.
- Keep financial and operational statuses separate; make consequential writes safe against duplicate requests.
- Record exact evidence and distinguish source-level findings from runtime verification.

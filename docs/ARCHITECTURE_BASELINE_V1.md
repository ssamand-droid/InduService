# InduService — Architecture Baseline v1

**Phase 0 — Freeze & Audit | 2026-10-08**

## Verdict
**AUDIT COMPLETE / IMPLEMENTATION FROZEN**

Nine source-level audits completed:
1. Repository Audit
2. Domain Map
3. Dependency Map
4. API Inventory
5. Model Inventory
6. Frontend Inventory
7. State Inventory
8. Migration Audit
9. Security Audit

Runtime-only items remain explicitly unverified: production DB engine/state, migration parity against live DB, live OpenAPI schema, full endpoint authorization matrix, deployed security headers, dependency vulnerability scan, production secrets, Redis/Celery runtime, backup/restore.

## Current domains

| Domain | App | Decision |
|---|---|---|
| Identity/Access | users | KEEP / REFACTOR |
| Industrial Services | services | KEEP / REFACTOR |
| Assets | assets | KEEP / REFACTOR |
| Products | products | KEEP |
| Orders | orders | KEEP / REFACTOR |
| Payment/Finance | payment | KEEP / REFACTOR |
| Contracts | contracts | KEEP |
| Reviews | reviews | KEEP |
| Support/Disputes | support | KEEP / REFACTOR |
| Notifications | notification | KEEP |
| Subscription | subscription | KEEP |
| Blog | blog | KEEP |
| System Configuration | system_setting | KEEP / REVIEW |
| Shared Core | core | KEEP / STRICT BOUNDARY |

## Dependency findings

- `users` is a broad dependency for business domains.
- `payment` directly depends on `orders` and `services`.
- `services` is the primary business hotspot.
- `assets` is already a substantial domain, not simple CRUD.
- Future work must avoid uncontrolled cross-domain imports.

## API inventory

Root groups confirmed:
`/api/`, `/api/products/`, `/api/services/`, `/api/orders/`, `/api/payment/`, `/api/reviews/`, `/api/notifications/`, `/api/contracts/`, `/api/blog/`, `/api/assets/`, `/api/subscription/`, `/api/settings/`, `/api/support/`.

Auth:
`/api/token/`, `/api/token/refresh/`, `/api/token/verify/`.

Docs:
`/api/schema/`, `/api/docs/`, `/api/redoc/`.

## Model findings

Major model areas confirmed:
- users: User, Profile, PortfolioItem, Certification
- services: ServiceCategory, Service, ServiceRequest, ServiceRequestQuote
- assets: assets, parts, maintenance, health, alerts, imports, sensors, digital-twin concepts
- payment: CommissionRule, Wallet, WalletTransaction, Invoice, Transaction, Settlement
- plus orders, products, contracts, reviews, support, subscription, blog, settings

High-risk model areas:
- `users.Profile` mixes identity, provider/company and financial profile concerns.
- payment models contain financial calculations and cross-domain coupling.

## Frontend inventory

Architecture:
`features/`, `pages/`, `components/`, `hooks/`, `services/`, `stores/`, `lib/`, `routes/`.

Routes cover public marketplace, authentication, buyer, provider, assets, finance, subscriptions, support and admin.

Global Zustand stores:
- authStore
- themeStore
- uiStore

React Query is installed and should own server state; Zustand should remain client/global state.

## Migration audit

Migration files are committed across Django apps. Services, support and system settings have multiple migrations.

Confirmed repository-level issue:
- production settings currently configure SQLite at `/var/www/induservice/backend/db.sqlite3`
- PostgreSQL driver/configuration also exists.

**CRITICAL:** reconcile actual production DB configuration before further architectural changes.

Live migration parity is **UNVERIFIED** without production DB access.

## Security audit

Positive controls:
- Django security middleware
- CSRF middleware
- XFrameOptions
- JWT authentication
- password validators
- production DEBUG=False
- secure session/CSRF cookies
- HSTS
- restricted CORS
- custom permissions

Critical/high findings:
1. **CRITICAL:** production.py configures SQLite despite PostgreSQL architecture/dependency.
2. **HIGH:** access and refresh JWTs are persisted in browser localStorage through Zustand persistence.
3. **HIGH:** base settings contain a development SECRET_KEY fallback; production should fail closed.
4. **HIGH:** duplicate `IsSeller` definition exists in `core/permissions.py`; the later definition overwrites the first.
5. **HIGH:** `services/views.py` is approximately 49 KB and is a major service-layer hotspot.
6. **HIGH:** `users.Profile` is overloaded.
7. **HIGH:** payment has sensitive cross-domain financial coupling.
8. **MEDIUM:** HTTP origins remain in CORS/CSRF configuration.
9. **MEDIUM:** Swagger/Redoc production exposure should be deliberate.
10. **MEDIUM:** frontend authentication logging should be minimized.

## Keep / Refactor / Delete / New

### KEEP
Django/DRF, React/Vite, PostgreSQL intended architecture, existing business domains, OpenAPI, React Query, Zustand, tests.

### REFACTOR
services views, users/Profile, payment workflows, permissions, authentication token storage, API contracts, domain boundaries, production DB configuration, frontend router ownership.

### DELETE
No domain deletion is justified by this audit alone.

### NEW
No new business feature/domain/model/API is approved during the freeze.

## Freeze rules

Allowed: audit, documentation, security fixes, migration verification, tests required for existing behavior, minimal configuration corrections, approved architectural refactoring.

Not allowed: new business features, new business domains, speculative models, future APIs, UI feature expansion or unrelated redesign.

## Stabilization sequence

Phase 0 Freeze & Audit
→ Phase 1 Production/DB/Security Stabilization
→ Phase 2 Domain/Service-Layer Refactor
→ Phase 3 API Contract Stabilization
→ Phase 4 Frontend State/Feature Boundary Cleanup
→ Phase 5 Feature Development

## Baseline conclusion

InduService is an existing, substantial production-oriented marketplace/MRO system. It should **not** be rebuilt from scratch.

The immediate priorities are:
1. production DB configuration
2. authentication/token storage
3. authorization consistency
4. services service-layer decomposition
5. users/Profile boundary
6. payment/domain boundaries
7. live migration parity

**No feature development until these stabilization findings are addressed or explicitly waived.**

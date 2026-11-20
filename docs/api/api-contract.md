# API Contract Inventory

**Status:** Phase 0 inventory, not a complete OpenAPI contract. Backend source is authoritative. Do not infer a route's permissions or transition semantics from its URL alone; inspect viewsets, serializers, permissions, and tests.

## API infrastructure

The baseline identifies schema/documentation routes at `/api/schema/`, `/api/docs/`, and `/api/redoc/`, plus JWT routes `/api/token/`, `/api/token/refresh/`, and `/api/token/verify/`. Production exposure of interactive API docs should be deliberate.

## Observed root groups

The Phase 0 baseline records `/api/`, `/api/products/`, `/api/services/`, `/api/orders/`, `/api/payment/`, `/api/reviews/`, `/api/notifications/`, `/api/contracts/`, `/api/blog/`, `/api/assets/`, `/api/subscription/`, `/api/settings/`, and `/api/support/`. This checkout confirms `users.urls`, `organizations.urls`, and `core.urls` are included at `/api/`; organization and membership routes therefore share that root prefix. New roots: `/api/work-orders/` for accepted service execution and `/api/procurement/` for RFQ through settlement.

## New lifecycle APIs (source-reviewed)

- Work orders: read list/detail; create idempotently from an accepted service request; add tasks; transition through provider/customer guarded state changes. Tenant access currently follows linked user identity, not organization membership.
- Procurement: RFQs, quotes, purchase orders, goods receipts, shipments, supplier invoices, and payment records. List/detail scope uses active organization memberships; RFQ open/award, PO acknowledgement, invoice matching, receipt quantity bounds, and payment amount bounds are enforced in viewsets. Organization role granularity and file evidence are not yet enforced.

## Contract rules for changes

- Preserve existing method, path, serializer shape, status/error behavior, and authorization unless a version/deprecation plan is approved.
- Record tenant and actor authorization at list, detail, mutation, search, export, and file endpoints.
- Validate state transitions and business invariants server-side.
- Document stable identifiers, pagination/filtering, validation failures, conflict/version behavior, and idempotency for consequential writes.
- Frontend work consumes this inventory and must not invent endpoints.
- Add endpoint-level evidence to the inventory before marking an operation verified.

## Phase 0 inventory tasks

For every URL include and router, record method/path, view/action, serializer/input/output, authentication, permission, tenant scope, state side effect, and frontend callers. Compare source schema with generated live schema when runtime access is authorized. Repository presence does not verify production deployment.

See [baseline](../../ARCHITECTURE_BASELINE_V1.md) and [frontend architecture](../architecture/frontend-architecture.md).

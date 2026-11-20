# Services Domain

**Current app:** `backend/apps/services` · **Observed models:** `ServiceScenario`, `ServiceCategory`, `Service`, `ServiceRequest`, `ServiceRequestQuote`, service images and attachments.

## Responsibility

Service catalog and customer demand capture, provider matching, and quote-related behavior. `services` is the primary backend hotspot; its view module is large and business logic should be mapped before refactoring.

## Current-state boundary

Current quote model is `ServiceRequestQuote`; the audit plan identifies tight coupling between request, quote, completion, and payment semantics. There is no canonical `WorkOrder` model in the inspected inventory. Do not describe the proposed full request-to-acceptance flow as implemented.

## Target invariants

Keep request, versioned commercial quote, approved scope, execution, acceptance, and finance as distinct concepts. Approval should reference an exact quote version. Technical acceptance must not imply payment. See [service lifecycle](../workflows/service-lifecycle.md), [ADR-002](../decisions/ADR-002.md), and the product workflow specification.

## Stabilization evidence

Map existing statuses, transitions, permissions, serializers/endpoints, frontend callers, and tests before changing behavior. Preserve public API compatibility unless an explicit migration/deprecation plan is approved.

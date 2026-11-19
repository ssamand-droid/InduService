# Service Lifecycle

**Status:** Desired workflow specification; not verified as fully implemented. See `docs/product/service-workflow-specification-v0.1.md` and the source audit. Phase 0 freeze prohibits adding missing features until stabilization decisions are approved.

## Conceptual stages

```text
Request intake → triage/clarification → provider sourcing → quote revision/review
→ exact quote approval → authorized execution → report/evidence → customer acceptance
```

Quote approval may create/activate an execution record in the target design. A canonical WorkOrder is not present in the inspected model inventory, and the current request/quote/completion behavior must be mapped before implementation claims are made.

## Target state separation

- Request state: intake, assessment, sourcing readiness, and closure.
- Quote state/version: draft, submitted, revision, approval/rejection/withdrawal/expiry.
- Execution state: scheduling, progress/blocker, review, rework, accepted/cancelled.
- Finance state: invoice/payment/settlement, independently owned.

Exact state values and transitions are proposed in the workflow specification and remain subject to policy approval. Avoid using one status to mean intake and execution simultaneously.

## Required controls

Every transition checks actor and organization authorization server-side, records actor/time/reason, and preserves prior versions/evidence. Approval references an exact quote scope, price, currency, schedule, and terms. Completion submission is not customer acceptance; acceptance is not payment. Retries must not create duplicate approvals/execution records.

## Open policies

Provider invitation authority, quote validity, approver roles, execution assignment acceptance, category-specific evidence, rework versus rejection, cancellation consequences, warranty/reopen behavior, and any emergency exception remain decisions. See [ADR-002](../decisions/ADR-002.md).

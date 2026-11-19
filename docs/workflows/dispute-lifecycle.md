# Dispute Lifecycle

**Status:** Outline for audit and policy discussion. `Dispute` and `DisputeResolution` models exist, but the complete state machine, permissions, and linkage are not verified here.

## Conceptual handling

```text
Issue raised → parties/context/evidence recorded → triage and response
→ resolution proposal/decision → accepted or escalated → closed with history
```

The outline intentionally does not prescribe business outcomes. A dispute may relate to service quality, scope, delivery, invoice, or payment; its resolution must not silently rewrite the original quote, accepted work, invoice, payment, or settlement.

## Controls to verify

Who may open/respond/resolve; response deadlines; evidence retention and privacy; conflict-of-interest handling; escalation/appeal; effect on new work or settlement; and whether closure can be reopened. Preserve actor, timestamp, rationale, and prior evidence at each transition.

See [support domain](../domains/support.md), [payment](../domains/payment.md), and [ADR-004](../decisions/ADR-004.md).

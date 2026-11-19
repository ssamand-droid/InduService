# Architecture Decision Register

This register tracks decisions and open directions extracted from the architecture plan and Phase 0 baseline. A recorded direction is not automatically approved or implemented. Unless a decision record says **ACCEPTED** with an owner and date, treat it as **PROPOSED**.

## Domain decisions

| ID | Topic | Current direction | Status |
|---|---|---|---|
| [ADR-001](ADR-001.md) | User and organization | User is a person/account; Organization is a business tenant; membership links them. | PROPOSED; Organization models now exist; authorization coverage needs verification. |
| [ADR-002](ADR-002.md) | Service request, quote, and work | Keep customer request, versioned commercial quote, and authorized execution distinct. | PROPOSED; lifecycle rules and current behavior require reconciliation. |
| [ADR-003](ADR-003.md) | Product and seller offer | Keep canonical product identity distinct from seller-specific terms. | PROPOSED; field ownership/migration undecided. |
| [ADR-004](ADR-004.md) | Business and financial states | Keep work/order progress independent from invoice/payment/settlement progress. | PROPOSED; financial invariants require approval. |
| [ADR-005](ADR-005.md) | Workflow infrastructure | Add reusable workflow machinery only when stable repeated patterns justify it. | PROPOSED; scope and requirements open. |
| [ADR-006](ADR-006.md) | Asset operational root | Connect maintenance history, work, parts, documents, failure, and cost with a deliberate hierarchy. | PROPOSED; hierarchy and duplicate hotspot concepts need design. |

## Record and status rules

Each ADR should state context, problem, options, decision, consequences, migration/API impact, owner, date, and implementation evidence. Valid statuses: **PROPOSED**, **ACCEPTED**, **REJECTED**, **SUPERSEDED**. Record implementation and migration verification separately; code presence alone is not acceptance.

For a superseded decision, retain the old record and link its successor. Cross-domain model/API changes require impact analysis and an ADR. Product decisions PM-001 through PM-005 remain in the source execution plan until a product decision register is created; they are not architecture ADRs.

## Related baseline docs

- [System overview](../architecture/system-overview.md)
- [Domain map](../architecture/domain-map.md)
- [Phase 0 baseline](../../ARCHITECTURE_BASELINE_V1.md)

# Contracts Domain

**Current app:** `backend/apps/contracts` · **Observed models:** `ServiceContract`, `EquipmentTransfer`, `ContractMilestone`.

## Responsibility

Persist service contract records, equipment transfers, and contract milestones.

## Current-state questions

Verify contract parties and tenant ownership, covered assets/services, SLA terms, pricing, renewal, warranty, work-order linkage, and financial references. Their presence in the target plan is not evidence of current implementation.

## Lifecycle boundary

Contract lifecycle and service request/work execution lifecycle are related but separate. A contract may constrain eligibility or scope; it should not silently replace quote approval, execution, acceptance, invoice, or payment state. See [contract lifecycle](../workflows/contract-lifecycle.md).

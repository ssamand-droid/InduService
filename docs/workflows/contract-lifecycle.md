# Contract Lifecycle

**Status:** Current model inventory confirms contract, equipment transfer, and milestone concepts; the end-to-end lifecycle and policy have not been runtime-verified.

## Conceptual lifecycle

```text
Draft/negotiation → authorized approval/signing → active obligations and milestones
→ amendment/transfer or renewal → expiry/termination → retained history
```

These labels are explanatory stages only, not asserted enum values in the current model. Contract state must remain distinct from service request, work execution, invoice, and payment states.

## Evidence and controls to verify

Parties and signing authority; tenant access; versioned terms; effective/expiry dates; covered assets/services; milestone completion evidence; amendments; transfer approvals; renewal/termination; and immutable history. Financial or scope changes should reference an explicit approved amendment rather than silently rewriting prior obligations.

See [contracts domain](../domains/contracts.md).

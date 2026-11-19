# Procurement Lifecycle

**Status:** Implemented baseline in the dedicated `procurement` app. See [domain reference](../domains/procurement.md) for API details and policy limits.

```text
RFQ draft → open → supplier quotes → award → purchase order
→ supplier acknowledgement → shipment → partial/full goods receipts
→ invoice submission → buyer matching → payment records → settled
```

RFQ, quote, purchase order, shipment, goods receipt, invoice, and payment are separate records, allowing supplier responses, partial fulfillment, rejection details, and settlement history to be retained. Awarding is the only operation that creates a PO, so client-submitted POs cannot bypass quote selection.

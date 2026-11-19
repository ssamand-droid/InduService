# Procurement Domain

**Implementation:** `backend/apps/procurement` owns sourcing and supplier-side procurement records. It is separate from customer commerce `Order` and accounting `payment` records.

## Lifecycle and API

1. A buyer organization creates an RFQ with one or more quantity/specification lines at `POST /api/procurement/rfqs/`.
2. The buyer publishes a draft with `POST /api/procurement/rfqs/{id}/open/`.
3. A supplier organization submits a quote with priced RFQ lines at `POST /api/procurement/quotes/`.
4. The buyer selects a submitted response via `POST /api/procurement/rfqs/{id}/award/` and `{ "quote": "<quote UUID>" }`. This transaction rejects competing quotes and creates a purchase order and line snapshots.
5. The supplier acknowledges the PO with `POST /api/procurement/purchase-orders/{id}/acknowledge/`.
6. The supplier records shipments and submits invoices through `/api/procurement/shipments/` and `/api/procurement/invoices/`.
7. The buyer records receipts through `/api/procurement/goods-receipts/`. Accepted quantities may arrive in multiple receipts; rejected quantities and reasons are retained. The PO moves to partial or full receipt.
8. The buyer matches an invoice at `POST /api/procurement/invoices/{id}/match/`, then records one or more payment claims at `/api/procurement/payments/`. A staff administrator verifies each recorded payment at `POST /api/procurement/payments/{id}/verify/`. Verification posts balanced double-entry journals for both buyer and supplier and only verified payment totals settle the invoice.

The organization ledger is readable at `/api/procurement/ledger/accounts/` and `/api/procurement/ledger/journals/`. Journals are idempotent per organization and source payment, and the read API is scoped to active organization memberships. The UI is available at `/dashboard/procurement`.

Every organization-scoped API filters records by active organization membership. Supplier quotes, shipments, invoices, and payments carry their actor. RFQ and quote currency are explicit; no implicit exchange-rate conversion occurs.

## Limits to resolve

Supplier invoice amount is not yet three-way matched against PO and accepted receipt totals. Shipment quantities, invoice tax/withholding, administrator verification evidence, reversals after posting, exchange rates, quote revisions, substitutions, returns, and cancellation policy need further rules. Payments are entered as externally paid claims; the current integration posts the financial ledger after staff verification and does not initiate a live bank gateway charge.

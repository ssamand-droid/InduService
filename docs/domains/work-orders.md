# Work Orders Domain

**Implementation:** `backend/apps/work_orders` owns execution of an accepted `ServiceRequest`. It does not replace commerce `orders.Order`.

## Records

- `WorkOrder` has a one-to-one service request link, optional commercial order link, customer/provider, a JSON scope snapshot, schedule, blockers, completion report, and acceptance notes/timestamps.
- `WorkTask` represents assignable execution tasks.
- `WorkLog` records actor and event history for API transition/task actions.

Creation is available at `POST /api/work-orders/from-request/{request_id}/` and only succeeds for an accepted request with a service provider. Transitions use `POST /api/work-orders/{id}/transition/` with `status` and optional status fields. Provider actions cover scheduling, execution, blocking, submission, and cancellation; only the customer can accept. The allowed flow is ready → scheduled/in progress → blocked/in progress → submitted → accepted or rework → in progress. Customer acceptance and financial settlement remain separate.

Tasks are listed in detail, added with `POST /api/work-orders/{id}/tasks/`, and updated with `PATCH /api/work-orders/{id}/tasks/{task_id}/`. File evidence can be uploaded at `POST /api/work-orders/{id}/evidence/`. Access is limited to the linked customer, provider, or staff. Transition, task, and evidence actions append a `WorkLog` record. The dashboard UI is available at `/dashboard/work-orders`.

## Current limits

Scope snapshot captures request title, description, accepted price, selected quote identity/notes, and acceptance timestamp at creation. It is not a signed immutable quote snapshot yet. Rework reasons, time/material consumption, warranty, cancellation rules after start, and organization-level membership authorization need follow-up policy work. Direct admin edits are available through Django admin.

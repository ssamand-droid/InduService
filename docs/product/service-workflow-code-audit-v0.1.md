# InduService — Service Workflow Requirement-to-Code Audit v0.1

**Status:** LOCAL BASELINE EXECUTED (20 PASSED, 1 FAILED); QUOTE-STATUS FIX AND REGRESSION TEST ADDED ON `fix/quote-status-workflow`; RERUN PENDING  
**Review ref:** `fix/quote-status-workflow` (implementation change isolated on a dedicated branch)  
**Review date:** 2026-10-28  
**Scope:** Factory request → assessment → service quote → factory approval → execution/evidence → factory acceptance  
**Change policy:** Initial audit was read-only. A minimal quote-status implementation change and a regression test were subsequently committed to a dedicated branch. No schema, migration, production setting or database was changed; the changed code has not yet been executed.

> Statuses in this document describe evidence found in the source files only. `IMPLEMENTED — NOT VERIFIED` means code exists but has not been exercised. `PARTIAL` means some of the required behavior exists but important requirements are absent or inconsistent. A source review is not proof of runtime behavior.

## 1. Executive conclusion

The repository contains a substantial first version of the service request journey in `backend/apps/services/` and corresponding React UI in `frontend/src/features/services/` and `frontend/src/pages/ServiceRequestDetailPage.jsx`. It is not yet a reliable end-to-end workflow as specified in `service-workflow-specification-v0.1.md`.

The most important gap is the final acceptance boundary: the provider completion actions set the request directly to `completed`, and the buyer's `submit_review` endpoint is a rating/review action, not a distinct acceptance/rework decision. Quote approval also immediately sets the request to `accepted` and is coupled to invoice creation, while the target specification requires explicit approval of an immutable quote version and a work-order snapshot. The current implementation has no clear separate work-order lifecycle for this journey.

**No application code was changed during this audit.** The next safe action is to add focused tests around existing behavior and confirm which findings reproduce in a local test environment before implementing the smallest corrective changes.

## 2. Requirement-to-code matrix

| ID | Requirement | Evidence inspected | Status | Finding / next check |
|---|---|---|---|---|
| RQ-01 | Factory user can create and track a service request | `backend/apps/services/models.py`, `serializers.py`, `views.py`; `ServiceRequestForm.jsx`; `serviceApi.js` | PARTIAL | Request model, create endpoint and UI exist. Current role model is user-role based (`buyer`), not factory-organization/site based. Frontend form requires a service selection although the model allows `service=null`. |
| RQ-02 | Required request fields are validated | `ServiceRequestSerializer`; `ServiceRequestForm.jsx`; `tests.py` | PARTIAL | Frontend asks for title/description, but backend validation and request completeness policy are not equivalent to the specification. Equipment/site/access/contact and conditional evidence are not consistently required. |
| RQ-03 | Attachments are submitted with the request and retained | `ServiceRequestForm.jsx`; `ServiceRequestViewSet.upload_attachment`; attachment serializers/models | PARTIAL | The form tracks selected files and displays them, but its `onSubmit` payload contains request fields and `extra_data`, not the selected `files`; upload is a separate API call. End-to-end submission of selected files is therefore not wired in this form. File access/privacy also needs runtime/storage verification. |
| RQ-04 | Evaluator assesses request and records a reason/history | `ServiceRequest.Status`; `admin_update_status`; `AdminServiceRequestDetailPage.jsx` | PARTIAL | Statuses include `pending` and `reviewed`, but no dedicated assessment record, structured outcome, clarification thread, assessor/rationale history or request-information loop was found in the inspected service workflow. Admin UI changes status directly. |
| RQ-05 | Incomplete requests can be returned for clarification | `ServiceRequest.Status`; `ServiceRequestViewSet`; service UI | MISSING / NOT EVIDENCED | No explicit `needs_information` state or question/answer action was found in inspected files. Confirm against full route and frontend inventory before implementation. |
| RQ-06 | Provider invitation is explicit and restricted | `ServiceRequestViewSet.get_queryset/get_object`; `perform_create`; notification service usage | PARTIAL — SECURITY REVIEW REQUIRED | Provider discovery includes scenario-matched requests and requests with `service=null`; for `service=null`, the queryset can expose all open requests to provider-role users, rather than only invited providers. Object access similarly permits open unassigned requests. Notifications are used as one quote authorization path but do not constitute a complete invitation/assignment model. |
| RQ-07 | Provider quote includes scope, exclusions, price/currency, validity and terms | `ServiceRequestQuote`; `ProviderQuoteSerializer`; `ProviderQuoteForm.jsx` | PARTIAL | Quote currently stores price, notes, estimated completion date and advance-payment fields. No explicit currency, validity deadline, structured scope, exclusions, assumptions or immutable version history were found. |
| RQ-08 | Quote versions are immutable and revisions preserve history | `ServiceRequestQuote.Meta.unique_together`; `provider_quote` | MISSING | Unique pair `(service_request, provider)` plus `update_or_create` overwrites that provider's existing quote instead of preserving revisions. |
| RQ-09 | Factory approves one exact quote version | `accept_quote`; `ServiceRequestQuote.is_selected` | PARTIAL | Buyer can select a quote and code blocks a second selection in the ordinary path. There is no version-bound approval record, validity check, transaction/locking around selection, or stale-version conflict protection. Concurrency and retry behavior need tests. |
| RQ-10 | Approval creates a work-order snapshot of approved terms | `ServiceRequest.order`; `orders.Order`; `accept_quote` | PARTIAL / CONFLICTING | ServiceRequest can link to an Order, and Order has product-order/MRO-step concepts, but the inspected `accept_quote` path does not create/link a WorkOrder or Order. It creates an invoice and sets request status to `accepted`. The invoice seller is set from `service_request.service.provider`, not the selected `quote.provider`; when service is null this path may fail. Confirm with a focused test. |
| RQ-11 | Only assigned provider can start work after approval | `start_work`; `ServiceRequestViewSet.get_object` | PARTIAL | Status check requires `accepted`, but authorization references `service_request.service.provider` instead of a selected/assigned quote provider. A request without a service may cause an attribute error. Admin bypass exists. |
| RQ-12 | Provider records progress, blockers and change requests | `ServiceRequest`; `Order.MROWorkflowStep`; frontend detail page | PARTIAL | Order has generic MRO steps, but inspected service request lifecycle has no explicit blocked state, responsible party, scope-change proposal or approval path. Relationship from accepted service quote to order/work steps is not established in `accept_quote`. |
| RQ-13 | Provider submits completion report and evidence | `complete`, `complete_with_images`; `ServiceCompletionImage`; `ServiceCompletionForm.jsx` | PARTIAL | Completion notes/images exist. Both completion paths set request status to `completed` before any distinct factory acceptance. Evidence is not a complete structured report (tests/results, parts used, deviations) and no required-evidence rules were found. |
| RQ-14 | Factory explicitly accepts, requests rework or rejects completion | `submit_review`; `ServiceRequest.Status`; `ServiceRequestDetailPage.jsx` | MISSING / CRITICAL | `submit_review` is for a rating/review and requires status `completed`; it is not an acceptance decision. No separate accept-work, request-rework or reject-completion endpoint/state was found in inspected files. |
| RQ-15 | Valid and invalid state transitions enforced centrally | `ServiceRequest.Status`; service actions; `admin_update_status` | PARTIAL / CRITICAL | Transition checks are distributed across action methods. Admin can set any valid choice directly through `admin_update_status`, and AdminServiceRequestDetailPage attempts a generic PATCH of `status`. No central transition service or transition history was found in inspected files. |
| RQ-16 | Status history records actor, time, old/new state and reason | `TimeStampedModel`; service request model/views | MISSING / NOT EVIDENCED | Created/updated timestamps exist, but a dedicated transition/audit event model was not found in inspected service files. Generic updated_at cannot reconstruct prior transitions. |
| RQ-17 | Factory-to-factory and provider-to-provider isolation | `get_queryset`, `get_object`, `ServiceRequestSerializer`, user-role model | PARTIAL — HIGH PRIORITY | Buyer object access is filtered to own requests. Provider visibility is broader than explicit invitation in some paths. No organization/site tenant boundary is represented on ServiceRequest; phone/name/quote fields and attachment URLs need role-specific serialization and storage/access tests. |
| RQ-18 | Rejection/cancellation/no-quote/expiry/dispute/rework paths | `ServiceRequest.Status`; action methods | PARTIAL | `rejected` and `cancelled` status values exist, but reason capture, quote expiry/withdrawal, no-quote outcome, rework and dispute handling were not found as complete workflows. |
| RQ-19 | Notifications cover each material transition | `notification.services` calls in `services/views.py` | PARTIAL | Notifications exist for request creation, quote selection, completion and some payment events; coverage is action-specific and is not driven from a complete transition/event map. |
| RQ-20 | Tests cover full journey and negative permission cases | `backend/apps/services/tests.py`; `backend/apps/orders/tests.py`; local output supplied 2026-10-28 | PARTIAL — BASELINE RUN; 1 FAILURE | Command `python manage.py test apps.services apps.orders --verbosity 2` ran 21 tests: 20 passed, 1 failed. `test_provider_quote` fails at `apps/services/tests.py:217`: expected `quoted`, actual `reviewed`. The test database was created as an in-memory SQLite database and destroyed after the run. The full request→assessment→quote→approval→execution→factory acceptance journey is still not covered by this run. |
| RQ-21 | Frontend presents stage-appropriate actions | `ServiceRequestDetailPage.jsx`; `AdminServiceRequestDetailPage.jsx`; service API/hooks/components | PARTIAL | Request detail has quote selection, start and completion UI. Admin detail permits direct status selection/deletion. Distinct factory acceptance/rework controls were not evidenced. The frontend request form displays selected files but does not include them in its submit payload. |
| RQ-22 | Runtime and production behavior verified | No local test run, staging run or production shell evidence in this pass | BLOCKED / PENDING | GitHub source inspection only. No claims about runtime, deployed revision, live database or production authorization behavior are made. |

## 3. High-priority concrete findings

### F-01 — Provider completion is conflated with factory acceptance
Evidence: `backend/apps/services/views.py`, actions `complete` and `complete_with_images`; `submit_review`.

Both completion actions move the request from `in_progress` directly to `completed`. The later buyer action stores a rating and review; it does not accept/reject the technical work or request rework. This conflicts with the target workflow and is the most important product-state gap.

### F-02 — Quote revision overwrites rather than versions
Evidence: `ServiceRequestQuote` in `backend/apps/services/models.py`; `provider_quote` in `backend/apps/services/views.py`.

The database enforces one quote row per request/provider and the endpoint uses `update_or_create`. A resubmitted quote overwrites prior terms. This cannot reliably support an approval tied to a particular quote version.

### F-03 — Quote approval is not atomic and does not establish an execution record
Evidence: `accept_quote` in `backend/apps/services/views.py`.

The selected flag is checked and set without a transaction/row lock. A simultaneous request could pass the initial check. The path sets the request to `accepted` and creates an invoice, but the inspected code does not create a WorkOrder or link an Order. Invoice seller is taken from `service_request.service.provider`, rather than the selected quote's provider. A targeted test is needed before changing this path.

### F-04 — Provider visibility is not invitation-only
Evidence: `ServiceRequestViewSet.get_queryset/get_object` in `backend/apps/services/views.py`.

The provider queryset includes open requests with no linked service, and object-level access allows providers to view those requests. This is broader than the specification's explicit-sharing rule and requires a permission test and a deliberate decision about provider discovery versus invitation.

### F-05 — Service-less requests are accepted by the data model but not safely supported by every action
Evidence: nullable `ServiceRequest.service` in `backend/apps/services/models.py`; references to `service_request.service.provider` in `start_work`, `complete`, `complete_with_images`, `force_majeure` and quote approval/invoice code.

The request-creation path intentionally supports unmatched requests, but several downstream actions dereference `service` directly. Test the service-null journey before any fix; the selected quote's provider should be authoritative after quote selection.

### F-06 — Request attachment UI does not submit selected files
Evidence: `frontend/src/features/services/components/ServiceRequestForm.jsx`; `serviceApi.js`.

The form maintains a `files` state and renders file names, but the submit payload is constructed from form data and does not append/upload `files`. The separate `upload_attachment` API exists, but this form does not call it in the inspected submit path.

### F-07 — Confirmed test/code mismatch on quote status
Evidence: `backend/apps/services/tests.py`, `test_provider_quote` (assertion at line 217 in the reported local copy); `backend/apps/services/views.py`, action `provider_quote`; local test output supplied 2026-10-28.

**Runtime-confirmed in the supplied baseline run:** `python manage.py test apps.services apps.orders --verbosity 2` reported `AssertionError: 'reviewed' != 'quoted'`. The test expects `req.status == 'quoted'`, while the prior implementation set `reviewed`. The chosen minimal fix is on branch `fix/quote-status-workflow`: provider quote submission now changes `pending`/`reviewed` to `quoted`, and subsequent providers may still quote while the request remains `quoted` (until a quote is selected). A regression test, `test_second_provider_can_quote_after_first_quote`, covers two providers submitting offers. The existing test also asserted `ServiceRequest.quoted_price`, although the implementation stores provider-specific prices in `ServiceRequestQuote`; that assertion now checks the quote belonging to the provider, avoiding an ambiguous single price on a multi-quote request. **These changes are not yet runtime-tested.** This status choice treats `reviewed` as assessment and `quoted` as at least one offer received; confirm against product semantics before merging.

### F-08 — Generic admin status updates bypass transition semantics
Evidence: `admin_update_status` and `AdminServiceRequestDetailPage.jsx`.

The backend action accepts any valid status choice without transition validation or a reason, while the admin page uses generic PATCH `status`. Even if operationally useful, exception overrides should be explicit, reasoned and audited rather than silently bypassing lifecycle rules.

## 4. What exists and should be evaluated for reuse

- `ServiceRequest` with title, description, equipment details, urgency, desired start, linked asset, attachments and timestamps.
- `ServiceRequestQuote` with provider, quoted price, notes, estimated completion and advance-payment fields.
- `ServiceCompletionImage` and `completion_notes`.
- Request list/detail/create UI and provider quote UI.
- Service request notifications and provider matching.
- `Order` and `MROWorkflowStep` as potential reusable concepts, subject to deciding whether an industrial service work order can safely be represented by the existing product-order model. Do not automatically equate a product purchase Order with a service WorkOrder.

No duplicate domain models should be added until these current concepts and migration/data compatibility are reviewed.

## 5. Recommended remediation order (not yet implemented)

### Gate 1 — Reproduce and baseline
1. **Baseline completed for the supplied local copy:** `python manage.py test apps.services apps.orders --verbosity 2` — 21 tests discovered, 20 passed, 1 failed (`test_provider_quote`). Django system check reported no issues. The runner created and destroyed an in-memory SQLite test database; no production DB is evidenced.
2. **Quote-status patch tested by the user on the local checkout:** `python manage.py check` passed and `python manage.py test apps.services apps.orders --verbosity 2` discovered 22 tests and passed all 22. The test runner used an in-memory SQLite test database. The warning `No directory at ...\\staticfiles\\` did not fail the tests.
3. **Follow-up patch prepared but not yet tested** on `fix/quote-acceptance-workflow`: quote selection now uses a transaction and request row lock, invoice seller is taken from the selected quote provider, requests without an initial service are supported in selection/start/complete paths, and selected-provider access is allowed during execution. Added regression tests for null-service acceptance/invoice ownership, single quote selection, and selected-provider start/completion.
4. Next: check out `fix/quote-acceptance-workflow`, run `python manage.py check` and `python manage.py test apps.services apps.orders --verbosity 2`, then review any failures before merging. Do not run migrations or alter production data during this gate.

### Gate 2 — Approve lifecycle semantics
1. Decide whether request triage status and execution status should be separate linked state machines.
2. Define the one authoritative provider after a quote is selected.
3. Define quote revision/version semantics and what fields freeze at submission/approval.
4. Decide how to reuse or separate `Order` and service `WorkOrder`.
5. Define the factory acceptance/rework/rejection rules and required evidence by service type.
6. Define explicit provider invitation/discovery policy and server-side access tests.

### Gate 3 — Implement the smallest vertical slice
Implement only the approved missing behavior for the core workflow. Suggested order:
1. Request completeness/assessment/clarification.
2. Quote immutability/version and approval safety.
3. Approved quote → execution record and assigned provider.
4. Execution report/evidence → explicit factory acceptance/rework.
5. Permission isolation, audit events and notifications.
6. Frontend status/actions and attachment submission.
7. End-to-end tests and staging verification.

The exact model/migration plan must follow Gate 1 and Gate 2; this document does not prescribe adding specific models before that analysis.

## 6. Definition of verification status

- **VERIFIED:** evidence from a passing relevant test or directly observed environment behavior.
- **IMPLEMENTED — NOT VERIFIED:** code path exists, but behavior has not been tested.
- **PARTIAL:** some requirements exist but critical parts are missing or inconsistent.
- **MISSING:** no implementation found in inspected scope.
- **CONFLICTING:** code, UI, tests or specification disagree.
- **BLOCKED:** cannot verify without a missing prerequisite/environment.

For this audit, all findings are based on source inspection. No row is marked runtime-VERIFIED.

## 7. Next action and continuation record

**Current next action:** check out `fix/quote-acceptance-workflow` in the local development checkout and run the documented Django checks/tests. The quote-status branch passed the user's 22-test run, but the new acceptance/execution changes have not yet been runtime-verified. Review the diff and failures before merging; do not deploy directly to production.

**Not done:** the modified application code has not been run in this session; no migrations generated or applied; no production settings/database touched; no deployment or production smoke test performed.


### Local test execution instructions (PowerShell)

The GitHub repository had no checked-in `.github/workflows/` test workflow in the inspected tree. The user supplied a local test run on 2026-10-28; results are recorded above. This session did not independently execute the user's local Python environment.

Run these commands on the local development copy, using its existing project virtual environment and local test database (not production). Switch to `fix/quote-acceptance-workflow` first:

```powershell
Set-Location "D:\Projects\InduService\backend"
python manage.py check
python manage.py test apps.services apps.orders --verbosity 2
```

If the project virtual environment is not already active, activate the existing environment first. Do not create/apply migrations or point these commands at production. After resolving the quote-status contract, rerun the command and record the full terminal summary. If test settings require an environment variable, share the variable name and error message but do not paste secrets or database passwords.

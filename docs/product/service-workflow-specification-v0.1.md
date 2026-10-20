# InduService — End-to-End Industrial Service Workflow Specification v0.1

**Status:** PROPOSED SPECIFICATION — NOT YET IMPLEMENTATION-VERIFIED  
**Date:** 2026-10-20  
**Scope:** Factory service request → assessment → service quote → factory approval → work execution and evidence → factory acceptance  
**Out of scope:** Full CMMS, preventive-maintenance scheduler, predictive AI, standalone parts marketplace, subscription billing, complex financial settlement and broad ERP integrations. Parts may be recorded as part of a service job where required.

> This document defines intended behavior. It does not claim that existing code, APIs, pages, permissions, migrations or production behavior already implement it. First map the specification to the repository; then decide what to reuse, repair or build.

---

## 1. Objective and completion definition

Deliver one reliable, traceable service journey for a factory and a service provider. A request must never silently become an approved job; a provider quote must never be treated as factory approval; provider-reported completion must never automatically mean customer acceptance.

The workflow is complete only when:
1. A permitted factory user can submit a sufficiently detailed request and track it.
2. An authorized evaluator can assess completeness, urgency and feasibility, then request clarification, reject with a reason or invite providers.
3. A provider can submit a versioned quote with scope, exclusions, price, currency and timing.
4. An authorized factory approver can approve one exact quote version, reject it or request revision.
5. The assigned provider can execute the approved scope and record report/evidence; out-of-scope work requires an explicit change approval.
6. The factory can accept, reject with reasons or request rework.
7. Actors, timestamps, decisions, quote versions, changes and evidence remain traceable.
8. Factory/provider permissions are enforced server-side, including files and list/search APIs.
9. Exception paths such as no quote, expiry, cancellation, blocked work and rework are defined.
10. Automated tests and an end-to-end test demonstrate the workflow in the target environment.

## 2. Roles and authority

| Role | Responsibilities | Limits |
|---|---|---|
| Factory requester | Create request, add evidence, answer clarification, track status | Cannot approve unless separately authorized |
| Factory approver | Approve/reject/request quote revision; accept/reject completed work | Must have permission for the organization/site and applicable spending authority |
| Factory maintenance owner | Review technical context, coordinate access and inspect evidence | Assessment alone does not authorize spending |
| InduService operations/evaluator | Triage, request missing information, invite providers and monitor exceptions | Cannot impersonate factory approval or silently alter a provider quote |
| Service provider user | Clarify, quote, confirm assigned work, record progress and submit report | Sees only requests explicitly shared or work orders assigned to its provider organization |
| Platform administrator | Manage platform configuration and operational exceptions | Administrative access and exceptional actions must be auditable |
| Observer/auditor (optional) | Read authorized history | Read-only and scope-limited |

A person may hold multiple roles, but permissions must be explicit. Being logged in is not sufficient authorization. Quote approval and final work acceptance may be separate permissions.

## 3. Logical entities and required information

These are logical concepts, not a claim that matching database models already exist. Map them to existing models before adding anything.

### 3.1 Service request
- Unique ID and human-readable request number
- Factory organization and optional site/plant
- Requester, creation/update timestamps
- Title, problem description/category, machine or equipment details
- Operational impact, urgency, current operating condition and safe access window
- Location/contact and desired visit/response window
- Photos/files and structured evidence
- Status, assigned evaluator/owner and status timestamps
- Clarification questions/answers
- Cancellation/rejection reason and audit history

An asset registry ID may be optional if the factory has not registered the asset; a usable equipment description must be available before quoting or dispatch.

### 3.2 Assessment
- Completeness: complete / clarification needed
- Priority and rationale
- Required skills/equipment and site/safety constraints
- Missing information and clarification questions
- Provider invitation list and eligibility rationale
- Assessor and timestamp

Assessment must not overwrite the original request or erase prior assessments.

### 3.3 Service quote
- Request, provider organization, quote ID and version
- Status and validity deadline
- Scope, deliverables, exclusions and assumptions
- Labor, travel, parts/consumables and other costs where applicable
- Total price and explicit currency
- Estimated arrival/start and duration; distinguish estimate from commitment
- Payment terms if supported; warranty/rework terms where agreed
- Factory prerequisites, access/shutdown requirements and attachments
- Submitted by/time and revision summary

A submitted quote version is immutable. Revision creates a new version or linked revision; it must not silently mutate an approved or previously submitted version.

### 3.4 Work order
Created/activated only after explicit approval of a specific quote version:
- Factory, provider, request and approved quote version
- Snapshot of approved scope, price/currency and conditions
- Schedule, responsible contacts and actual timestamps
- Work status, progress notes and blockers
- Change requests
- Work report: diagnosis, work performed, tests/results, parts used, findings and recommendations
- Evidence attachments and submitter/time
- Customer review, acceptance, rework and cancellation records

### 3.5 Evidence and acceptance record
Evidence may include before/after photos, service report, tests, measurements, replaced parts and customer-visible notes. Each file needs uploader, timestamp, parent record, visibility and access control.

Acceptance record includes decision, authorized reviewer, timestamp, reason/comments and any rework conditions/deadline. Preserve all prior reports and decisions.

## 4. State machines

### 4.1 Request lifecycle
Recommended states:
- DRAFT — being prepared; not available for provider quoting.
- SUBMITTED — sent by factory, awaiting triage.
- UNDER_REVIEW — evaluator assessing.
- NEEDS_INFORMATION — waiting for factory clarification.
- READY_FOR_QUOTE — complete enough for provider invitation.
- QUOTING — one or more providers are preparing/submitting quotes.
- QUOTE_SELECTED — one exact quote is approved and the work order is created/activated.
- IN_PROGRESS — work has begun under approved scope.
- AWAITING_CUSTOMER_ACCEPTANCE — provider submitted report/evidence.
- REWORK_REQUIRED — factory requested corrective work or rejected completion.
- ACCEPTED — authorized factory representative accepted the work.
- CANCELLED — cancelled with reason and actor.
- REJECTED — rejected with reason; terminal unless explicit reopen behavior is designed.
- CLOSED — optional administrative close-out after acceptance if it adds value.

Do not let one status field ambiguously represent both request triage and work execution. Linked state machines are acceptable; one constrained state machine is also possible if stage meanings remain unambiguous.

### 4.2 Quote lifecycle
DRAFT → SUBMITTED → APPROVED / REJECTED / WITHDRAWN / EXPIRED / SUPERSEDED, with revision requested leading to a new immutable version. Only one quote version may be approved for a single request/work order in the first release. Approval points to the exact version, scope, price, currency, schedule and terms. Post-approval changes require an explicit change request.

### 4.3 Work execution lifecycle
NOT_STARTED → SCHEDULED → IN_PROGRESS ↔ BLOCKED → READY_FOR_REVIEW → COMPLETED_ACCEPTED. A factory request for corrective work leads to REWORK_REQUIRED, after which the provider records corrective work and resubmits. Cancellation is a separately recorded terminal outcome.

### 4.4 Three distinct meanings
1. Provider says the work is complete → READY_FOR_REVIEW / AWAITING_CUSTOMER_ACCEPTANCE.
2. Factory accepts the work → COMPLETED_ACCEPTED / ACCEPTED.
3. Payment or settlement → outside this workflow's completion definition unless finance scope is explicitly approved later.

Acceptance does not imply payment, and payment does not prove technical acceptance.

## 5. End-to-end steps and acceptance criteria

### Step 1 — Factory creates and submits request
**Actor:** factory requester.  
**Inputs:** problem, equipment details, site/location, impact/urgency, access/contact window, desired response window, optional photos/reports.

**System behavior**
- Validate required fields and attachment type/size.
- Save draft or submit; create a unique request number.
- Record actor and timestamp, show confirmation and next status.
- Notify authorized factory maintenance owner and operations queue.
- Keep request private from providers until it is explicitly ready/shared.

**Acceptance criteria**
- Incomplete submissions show field-specific errors and do not falsely become submitted.
- Retries/double-clicks do not create duplicate requests.
- Users can view only records their organization is authorized to access.
- Attachments are private by default.

### Step 2 — Operations assesses request
**Actor:** authorized evaluator / factory maintenance owner, according to agreed permission policy.

Actions: check completeness, impact, urgency, technical fit, access and safety; request clarification, reject with reason, or mark ready for quote.

**System behavior**
- Record assessment rationale, actor and time.
- Clarification changes status to NEEDS_INFORMATION and sends exact questions.
- Answers are retained in history and return the request to review.
- Rejection requires a reason and notifies requester.
- READY_FOR_QUOTE enables provider invitation.

**Acceptance criteria**
- Only authorized roles can make assessment transitions.
- Clarification waiting cannot be mistaken for readiness to quote.
- Reassessment does not erase earlier assessments, answers or priority changes.

### Step 3 — Invite providers and receive quotes
**Actor:** operations invites; eligible provider submits.

**System behavior**
- Share only necessary request information with invited providers.
- Record invitation, deadline and response.
- Allow clarification questions and answers visible to authorized participants.
- Require scope, exclusions, assumptions, price/currency, validity, timing and relevant attachments for quote submission.
- Freeze submitted version and notify authorized factory reviewers.
- If no one quotes, record no-quote outcome; operations may invite more providers or return to factory with a clear explanation.

**Acceptance criteria**
- A provider cannot quote a request not shared with its organization.
- Quote belongs to the correct request/provider.
- Submitted quote is not silently editable.
- Quotes in different currencies are not compared as if directly equivalent.
- Expired, withdrawn, rejected or superseded quote cannot be approved.
- No-quote outcome is visible and auditable.

**First-release simplification:** manual provider invitations are acceptable; automated matching/ranking is deferred.

### Step 4 — Factory reviews and approves quote
**Actor:** authorized factory approver.

The factory can compare quotes, request revision, reject an offer or approve one exact version.

**System behavior**
- Display scope, exclusions, price/currency, validity, timing, assumptions and warranty terms.
- Require explicit confirmation of the quote version being approved.
- Record approver, timestamp and quote-version reference.
- Create/activate work order from an approved snapshot.
- Notify selected provider and factory contacts.
- Record unselected/rejected offers according to policy.

**Acceptance criteria**
- Unauthorized requester cannot approve.
- Expired/withdrawn quote cannot be approved.
- Stale review screen cannot approve a version that has changed.
- Retries do not create duplicate work orders.
- Approved scope and price remain immutable in the approval snapshot.
- Work cannot start merely because a quote was submitted.

**Post-approval change:** any material scope, price, currency or schedule change requires a change request and factory approval. Never overwrite the original approved terms.

### Step 5 — Provider executes and records evidence
**Actor:** assigned provider.

**Preconditions:** approved quote/work order exists; provider has confirmed/accepted the assignment if that policy is adopted; site access and safety prerequisites are met.

**Provider records**
- Start/completion timestamps where applicable
- Diagnosis, work performed, tests/measurements and results
- Parts/materials used where relevant
- Before/after evidence and service report
- Findings, recommendations, blockers and deviations

**System behavior**
- Provider can update only assigned work.
- BLOCKED requires a reason and identifies the next responsible party.
- Extra chargeable work requires a change request before execution, except for a separately approved emergency policy.
- Provider submits report/evidence and moves work to READY_FOR_REVIEW.
- Factory receives notification and an evidence checklist.

**Acceptance criteria**
- Unapproved work cannot be started.
- Required report/evidence fields are enforced by job type.
- Files retain uploader/time and authorization controls.
- Provider cannot alter the approved quote snapshot.
- Completion submission does not automatically accept the work.

### Step 6 — Factory reviews and accepts/reworks/rejects
**Actor:** authorized factory reviewer.

- ACCEPT: agreed scope and acceptance criteria are met.
- REQUEST_REWORK: specifies deficiency, evidence and expected correction.
- REJECT: completion is materially unacceptable or agreement cannot be fulfilled; requires reason and should not be a vague synonym for rework.

**System behavior**
- Record decision, reviewer, time and reason.
- Rework moves work to REWORK_REQUIRED; provider corrects and resubmits.
- Prior reports, evidence and decisions remain available.
- Acceptance sets work to COMPLETED_ACCEPTED and request to ACCEPTED.
- Notify factory, provider and authorized operations staff.

**Acceptance criteria**
- Only permitted factory user can accept.
- Acceptance is based on submitted report/evidence.
- Rework/rejection requires a meaningful reason.
- Provider cannot accept its own work on behalf of the factory without a separately approved and audited exception.
- Final acceptance is timestamped and auditable.

## 6. Exception paths required in the first operational release

| Scenario | Required behavior |
|---|---|
| Request incomplete | Draft or clarification; do not invite providers prematurely |
| Factory does not answer | Remain waiting, show age/reminder; no silent closure |
| No provider responds | Record no-quote; invite others or close with reason |
| All quotes unacceptable | Reject all and return to sourcing or close with reason |
| Quote expires | Block approval; request renewal/revision |
| Provider withdraws before approval | Mark withdrawn and prevent approval |
| Provider withdraws after approval | Escalate to operations; record blocked/cancellation decision; do not silently reassign |
| Factory cancels before approval | Record reason, preserve history and notify invited providers |
| Factory cancels after approval/during work | Record performed work and evidence; commercial consequences follow agreed terms, not an invented automatic fee |
| Part unavailable/site inaccessible | Mark blocked with responsible party and next action; approve material date/scope changes |
| Extra work discovered | Change request with scope/price/schedule delta; approval before chargeable work |
| Work fails review | Request rework or reject with evidence and reason |
| Scope/quality dispute | Escalate and preserve evidence; do not force acceptance |
| Duplicate request | Warn/link possible duplicate; never auto-delete or merge without audit |
| Attachment upload fails | Show failure and allow retry; do not report successful submission without stored file |
| Membership/permission revoked | Recheck access server-side; keep audit history |
| Network retry/double submit | Idempotency or duplicate protection for submit, approve, create work order and accept |

Cancellation/dispute can initially be handled manually by operations, but the system must record state, reason, actor and history.

## 7. Notifications and timestamps

Notifications are aids, not the source of truth; the persisted state and audit history are authoritative.

Minimum events: request submitted; clarification requested/answered; assessment completed/rejected; provider invited; provider question/answer; quote submitted/revised/withdrawn/expired; revision requested; quote approved/rejected; work scheduled/started/blocked; change request submitted/decided; completion report submitted; rework requested; work accepted; dispute escalated; cancellation requested/confirmed.

Each notification should include reference, required action, due date when applicable and secure in-app link. Avoid exposing sensitive factory details in email/push previews.

Do not invent response-time SLAs before discovery and pilot. Capture timestamps now so later response and fulfilment metrics can be calculated.

## 8. Security, permissions and audit

- Every transition records actor, organization, previous state, new state, timestamp and reason/context.
- Quote, scope, price, currency, schedule and approval have durable version history.
- Factory tenant isolation applies to lists, detail pages, search, exports, APIs, files and notifications.
- Providers see only explicitly shared requests and assigned work, with minimum necessary information.
- Files cannot be publicly guessed or served without authorization.
- Server-side authorization is mandatory; hiding React buttons is not authorization.
- Invalid transitions are rejected by the server even when called directly through an API.
- Exceptional administrator actions and any impersonation feature must be audited.
- Do not put secrets in workflow records or logs.
- Retention/deletion rules for service evidence and contact data must be decided before production release.

## 9. Minimal API capability map

These are logical capabilities to map to existing endpoints. Do not create duplicate APIs until current API inventory is reviewed.

| Capability | Required operations |
|---|---|
| Requests | Draft/create, submit, authorized list/detail, update permitted fields, cancel, answer clarification |
| Assessment | Review, request information, answer, ready-for-quote, reject |
| Provider participation | Invite, provider view of shared request, ask/answer, decline |
| Quotes | Draft, submit immutable version, revise, withdraw, request revision, approve, reject, compare |
| Work orders | Create/activate from approved quote, confirm, schedule, start, block, record progress |
| Change requests | Propose scope/price/schedule delta, approve/reject, retain prior scope |
| Completion | Submit report/evidence, request rework, resubmit, accept, reject, escalate |
| Audit/history | Read authorized timeline and decisions |
| Notifications | Retrieve in-app events/unread state; external delivery integration may be deferred |

Responses should provide stable IDs, current status, validation errors and conflict/version information. Returning allowed next actions can improve UI clarity, but server-side validation remains mandatory.

## 10. Minimal page map

This is a functional target, not a claim that these pages already exist.

**Factory**
1. New request form with draft/submit.
2. Organization request list and status filters.
3. Request detail/timeline, clarification, quote comparison and approval.
4. Work detail, schedule, progress, evidence and review.
5. Acceptance/rework decision form.

**Operations**
1. Triage queue with age, urgency, missing information and owner.
2. Assessment detail.
3. Provider invitation and response tracking.
4. Quote/no-quote monitoring.
5. Exception queue for blocked, cancelled and disputed work.

**Provider**
1. Invited request queue.
2. Shared request detail and clarification.
3. Quote builder and quote history.
4. Assigned jobs/schedule.
5. Work report and evidence submission.
6. Rework response/resubmission.

Existing pages can consolidate these capabilities if every role can perform its authorized tasks and see the correct state.

## 11. Policy decisions that must be resolved

- Who can invite providers: operations only, factory, or both?
- Can factories see provider identity before quote submission?
- Can one request have multiple approved quotes? Recommendation for v1: one approved quote/work order per request.
- Must provider accept the work order before scheduling?
- What constitutes acceptance for each job category?
- Can a factory reopen accepted work during a defined period, or must it create a separate warranty/rework case?
- Quote validity defaults and expiry rules.
- Cancellation policy before/after approval and during execution.
- Which job types require mandatory photos, tests, safety documents or customer signature?
- Are taxes, invoices, payments, deposits, currency conversion and settlement included? Recommendation: keep them out unless already essential to the current workflow.
- Who bears technical, safety and warranty responsibility; what certifications are required?
- What retention policy applies to reports, photos and contact details?

Record each decision with owner/date in the decision register. Until decided, mark affected behavior pending instead of silently assuming a policy.

## 12. Definition of Done

### Design-complete
- [ ] Roles and permission matrix approved.
- [ ] Request, quote and work state transitions approved.
- [ ] Required fields and conditional validation approved.
- [ ] Exception, cancellation and rework paths approved.
- [ ] Quote versioning and approval snapshot defined.
- [ ] Acceptance criteria approved.
- [ ] UI/API capabilities reconciled with existing architecture.
- [ ] Open policy decisions resolved or explicitly deferred.

### Implementation-complete
- [ ] Existing models, APIs, permissions, pages, hooks and tests mapped to requirements.
- [ ] Missing work split into repository issues with acceptance criteria.
- [ ] Unit/API tests cover valid and invalid transitions.
- [ ] Cross-factory and cross-provider access tests pass.
- [ ] Attachment access and upload failure paths tested.
- [ ] End-to-end request-to-acceptance test passes.
- [ ] Quote revision, no-quote, expiry, rework, cancellation, blocked and change-request paths tested.
- [ ] Migration/backward compatibility reviewed if schema changes are needed.
- [ ] Staging validation, release/rollback plan and monitoring approved.
- [ ] Deployment and production smoke-test evidence recorded.

Design-complete does not imply implementation-complete.

## 13. Required test scenarios

1. Happy path: submit → assess → quote → approve → execute → submit evidence → accept.
2. Missing information → clarification → answer → reassessment.
3. Two providers quote; factory selects one.
4. Revision requested; new version submitted; old version cannot be approved accidentally.
5. Quote expires before approval; approval is blocked.
6. Unauthorized requester attempts approval; server denies.
7. Provider attempts access to another provider's invitation/work order; server denies.
8. Factory B attempts to access factory A's record/file; server denies.
9. Completion submitted without required evidence; validation fails.
10. Factory requests rework; provider resubmits; factory accepts.
11. Scope change proposed; extra chargeable work cannot proceed before approval.
12. Cancellation before approval preserves reason/history.
13. Job blocked by part/access issue; blocker and next responsible party are visible.
14. Retry/double submit does not create duplicate records or contradictory transitions.
15. Dispute escalation preserves all prior evidence and decisions.

## 14. Implementation sequence after design review

**Gate A — Existing-state mapping, no feature changes**
- Inspect current models, serializers, APIs, permissions, React pages/hooks/state and tests relevant to services, orders, users, notifications, products and reviews.
- Map each requirement to existing-and-verified, implemented-but-unverified, partial, missing, conflicting or blocked.
- Review migrations/state fields; do not run production migrations or destructive changes during the audit.
- Identify duplicate concepts and reusable existing components.

**Gate B — Resolve decisions**
Approve the state machine, role matrix, quote versioning, acceptance rules and exception policies. Reuse sound existing models; do not add speculative duplicates.

**Gate C — Issue-level backlog**
Split missing behavior into small changes with acceptance criteria. Prioritize security/data integrity and state transitions before UI polish. Review migration compatibility, release plan and rollback.

**Gate D — Implement and verify**
Implement in small steps with tests; validate staging end-to-end and tenant isolation; deploy only after explicit approval.

## 15. Current status and immediate next action

**Status:** PROPOSED SPECIFICATION; existing implementation is not yet verified against this full workflow.

**Immediate next action:** perform code mapping for this workflow only: service/order models, APIs/serializers, permissions, frontend pages/hooks, state management and tests. Produce a requirement-to-code matrix with evidence for every status. Do not begin broad feature implementation before the mapping is complete.

**Confidence:** High that the specification separates the important business states and decisions; not established that the current code supports them or that every proposed policy fits the first customer segment.

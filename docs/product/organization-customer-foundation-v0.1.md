# Organization and Customer Foundation v0.1

**Status:** IMPLEMENTATION IN PROGRESS — first vertical slice only  
**Date:** 2026-11-12  
**Architecture authority:** InduService Architecture & Execution Master Plan v1.0, ADR-001 (`User ≠ Organization`)  
**Scope:** Individual and legal-entity customer identity, organization membership, and organization-owned service requests.

## 1. Domain rules

- A `User` is a person with login credentials and personal contact information.
- An `Organization` is a legal business tenant, such as a factory or service company.
- A person acts for an organization only through an active `OrganizationMembership`.
- A legal customer's registration creates an organization record and an `owner` membership for the registering person. An individual customer remains a personal account and does not get a synthetic organization.
- The account's marketplace role and its organization authority are separate. Membership roles are `owner`, `admin`, `requester`, `approver`, `member`, and `viewer`.
- Request creation/editing requires an active request-capable membership. Quote approval, completion acceptance, and customer payment require an active approval-capable membership (`owner`, `admin`, or `approver`).
- A service request retains its human requester (`buyer`) and can additionally reference its legal customer (`organization`). The organization association is immutable after creation.
- Organization verification is a separate status; entering a company name does not imply legal verification.

## 2. First release API contract

- `POST /api/users/register_step1/` returns the existing `user_id` and a signed registration token.
- `POST /api/users/register_step2/` requires that time-limited token, personal name and person type. For a legal entity it also requires the registered organization name and accepts registration/tax identifiers and address fields. Completion creates the organization and owner membership atomically.
- `GET /api/organizations/` lists only organizations for which the caller has active membership.
- `POST /api/organizations/` creates an organization and owner membership for the caller.
- `GET/PATCH /api/organizations/{uuid}/` reads/updates a member organization; updates require owner/admin.
- `GET /api/organization-memberships/` exposes only the caller's active memberships.
- Service request creation accepts an organization UUID only when the caller can request for it. If exactly one factory membership is eligible, the API can infer it; multiple eligible factories require an explicit selection.

The registration token expires after 30 minutes and can complete an account only once. The legacy public `user_id`-only step-two payload is intentionally rejected because IDs are enumerable and do not prove control of the registration flow.

## 3. Data and rollout policy

- Preserve `Profile` company fields while the existing provider and profile consumers are migrated.
- New legal registrations write normalized organization details to `Organization`; no uniqueness or merge rule is inferred from organization names.
- Do not automatically merge existing profiles with matching company names. A future backfill must use verified registration identifiers or an operator-reviewed mapping, be idempotent, and include a rollback plan.
- Existing requests remain personal (`organization = NULL`) unless their ownership is explicitly verified. New requests store both requester and organization.
- Legacy legal profiles without an organization retain the old personal-request path until a verified organization membership is established; a new legal registration cannot silently fall back to a personal request if its organization membership is missing or inactive.
- Membership invitations and employee onboarding are not part of this first slice. Membership creation remains an administrative/bootstrap action until an invitation-and-acceptance flow is specified.

## 4. Explicit remaining tenant work

This implementation does not yet move asset ownership, orders, invoices, contracts, subscriptions, documents, support, exports, or all notifications from user IDs to organizations. Asset visibility by equal `Profile.company_name` must be replaced with organization IDs before this foundation can be considered a complete tenant boundary. Provider invitation and company-level provider quoting also remain a separate service-domain task.

The service workflow still lacks several items documented in `service-workflow-code-audit-v0.1.md`, including immutable quote versions, dedicated work orders, private file delivery, full transition audit, and complete acceptance/rework history. This customer foundation does not claim those requirements complete.

## 5. Acceptance gates

- Individual registration creates a personal account without an organization.
- Legal factory registration atomically creates exactly one factory organization and an owner membership.
- The registration step-two endpoint rejects missing, invalid, expired, or already-used registration tokens.
- An unrelated user cannot list, retrieve, update, create requests for, or approve requests belonging to another organization.
- Requesters may create and edit requests but cannot approve quotes or accept work; approvers can perform approval actions.
- Existing personal-customer request behavior remains available.
- Migration/backfill does not merge organizations by name or rewrite existing ownership without review.

Runtime tests and migration verification remain required before release.

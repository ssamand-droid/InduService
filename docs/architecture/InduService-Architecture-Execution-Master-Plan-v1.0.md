# InduService — Architecture & Execution Master Plan v1.0

> **Repository:** `ssamand-droid/InduService`  
> **Baseline branch:** `main`  
> **Plan branch:** `docs/architecture-master-plan-v1`  
> **Purpose:** Single source of truth for architecture, refactoring, new domains, execution order, and AI-agent ownership.

## 1. Scope and governance

This document separates **Current State** from **Target State**. Existing apps are not assumed to be the final domain boundaries. New domains are introduced only where the current model cannot safely represent the business lifecycle.

### Mandatory rules

1. No new business feature is implemented without updating the relevant domain specification.
2. `ServiceRequest`, `Quote`, `WorkOrder`, `Payment`, `Invoice`, `Settlement`, and `Review` remain separate business objects.
3. Business status and financial status are independent state machines.
4. `User` represents a person/account; an `Organization` represents a business tenant.
5. A product catalog item is not the same thing as a seller's commercial offer.
6. Frontend agents consume documented API contracts and must not invent endpoints.
7. Only one migration stream may modify shared database foundations at a time.
8. Cross-domain model changes require impact analysis and an ADR.
9. Existing public API behavior is preserved during migration unless a migration/deprecation plan explicitly changes it.
10. Every domain change requires tests for permissions, state transitions, validation and regression.

---

## 2. Current application inventory

The repository currently contains these **14 Django apps**:

1. assets
2. blog
3. contracts
4. core
5. notification
6. orders
7. payment
8. products
9. reviews
10. services
11. subscription
12. support
13. system_setting
14. users

The frontend currently uses both `src/features/*` and a large `src/pages/*` layer. The target architecture will progressively make domain features the primary ownership boundary while retaining pages as route-level composition.

---

## 3. Master Domain Matrix

| Domain | Current App | Current Models | Current APIs | Current Pages | Current Workflow | Problems | Keep | Refactor | Delete | New Models | Dependencies | Agent |
| ------ | ----------- | -------------- | ------------ | ------------- | ---------------- | -------- | ---- | -------- | ------ | ---------- | ------------ | ----- |
| **Users & Identity** | `users` | `User`, `Profile`, `PortfolioItem`, `Certification` | `/users/`, `/profiles/`, `/portfolio/`, `/certifications/` | `AdminUsersPage`, user/profile features, auth/register/login flows | Register → profile → role/provider onboarding | Person, company, business and operational data are mixed in `Profile`; role model is overloaded; weak tenant boundary | User authentication/account, portfolio, certification concepts | Move organization/business data out of Profile; normalize roles and permissions; connect business actors to Organization | Duplicate company/provider concepts inside Profile; obsolete role-specific fields after migration | `Organization`, `OrganizationMembership`, `OrganizationRole`, `Department`, `Location`, `Contact`, `Verification`, `BusinessDocument`, `BankAccount` | Core, Organizations, Audit, Permissions | **Identity Agent** |
| **Organizations & Multi-tenancy** | **NEW** | — | — | — | — | No first-class tenant/business entity exists; current Profile carries organization data | — | New foundation domain; all business ownership moves to organizations | Organization-like fields in Profile after migration | `Organization`, `OrganizationMembership`, `OrganizationRole`, `Department`, `Site`, `Area`, `Location`, `Contact` | Users, Core, Audit, Permissions | **Foundation Agent** |
| **Core / Platform** | `core` | `TimeStampedModel`, `UUIDModel`, `SoftDeleteModel`, `PlatformSetting` | `/settings/`, `/admin-dashboard/`, `/admin-users/` | `AdminDashboardPage` plus shared layout/admin surfaces | Platform settings/admin overview | Infrastructure and business settings are mixed; core risks becoming a dumping ground | Base models, UUID/timestamps, soft-delete infrastructure | Keep infrastructure-only responsibilities; move business rules elsewhere | Business-specific settings/models placed in core | Optional `AuditMixin`, shared domain primitives | All domains | **Architecture Agent** |
| **Services Catalog & Requests** | `services` | `ServiceScenario`, `ServiceCategory`, `Service`, `ServiceRequest`, `ServiceImage`, `ServiceRequestAttachment`, `ServiceCompletionImage`, `ServiceRequestQuote` | `/categories/`, `/services/`, `/requests/`, `/match/` | `ServicesPage`, `ServiceDetailPage`, `RequestServicePage`, `ServiceRequestDetailPage`, request/update/quote/completion forms, admin service/request pages | Service → request → provider matching → quote → completion | Request is at risk of becoming quote + execution + completion + payment; quote is embedded too tightly; no real WorkOrder | Service catalog, ServiceRequest, categories/scenarios, attachments | Split Request, Quote, Scope and Execution; introduce canonical state machine | `ServiceRequestQuote` after data migration to `ServiceQuote`; duplicated completion fields | `ServiceOffering`, `ServiceQuote`, `ServiceQuoteLine`, `ServiceScope`, `WorkOrder`, `ServiceReport`, `CustomerAcceptance`, `WarrantyClaim` | Organizations, Assets, Work Orders, Contracts, Payment, Reviews | **Service Domain Agent** |
| **Work Orders / Execution** | **NEW** | — | — | — | — | No canonical execution object between accepted commercial scope and field work | — | New P0 domain; becomes execution source of truth | Any execution state currently hidden in ServiceRequest/Order | `WorkOrder`, `WorkOrderTask`, `WorkOrderAssignment`, `WorkOrderPart`, `WorkOrderTimeEntry`, `WorkOrderExpense`, `WorkOrderEvidence`, `WorkOrderStatusHistory` | Services, Assets, Contracts, Dispatch, Checklist, Products, Payment | **Work Order Agent** |
| **Dispatch & Scheduling** | **NEW** | — | — | — | — | No dedicated scheduling/assignment model; technician availability is not a first-class domain | — | New domain for matching technicians to executable work | Hard-coded/manual assignment logic | `TechnicianAvailability`, `TechnicianSchedule`, `Assignment`, `Visit`, `Travel` | Organizations, Users, Work Orders, Services, Assets | **Dispatch Agent** |
| **Workflow Engine** | **NEW** | — | — | — | — | Current workflow logic is tied to individual apps and scenarios; difficult to version and extend | Existing workflow concepts as business references | Introduce reusable template/transition engine | Hard-coded scenario-specific workflow branching | `WorkflowTemplate`, `WorkflowStep`, `WorkflowTransition`, `WorkflowCondition`, `WorkflowInstance`, `WorkflowStepInstance` | Core, Work Orders, Services, Contracts, Procurement | **Workflow Agent** |
| **Checklist / Inspection** | **NEW** | — | — | — | — | No generic reusable checklist engine for industrial inspections and execution | Existing asset/maintenance inspection concepts where present | Normalize into reusable templates and instances | Duplicated checklist fields/forms created inside individual domains | `ChecklistTemplate`, `ChecklistSection`, `ChecklistItem`, `ChecklistInstance`, `ChecklistResponse` | Work Orders, Assets, Services, Workflow | **Execution Agent** |
| **Orders / Commerce** | `orders` | `Order`, `OrderItem`, `MROWorkflowStep` | `/orders/` | `MyOrders`, `ManageOrders`, `OrderDetailPage`, `AdminOrdersPage`, order timeline/workflow components | Order creation → items → MRO workflow | Product commerce and service execution are conflated; `MROWorkflowStep` duplicates future workflow engine | Existing Order/OrderItem only where true commerce semantics exist | Split product purchase from service execution; migrate MRO workflow to WorkOrder/Workflow | `MROWorkflowStep` after migration | `PurchaseOrder`, `PurchaseOrderLine`, `Shipment`, `GoodsReceipt` | Products, Procurement, Payment, Work Orders | **Commerce Agent** |
| **Products / Catalog** | `products` | `Category`, `Brand`, `TechnicalSpecification`, `Product`, `ProductSpecificationValue`, `ProductImage`, `ProductDocument` | `/categories/`, `/brands/`, `/specifications/`, `/products/` | `ProductsPage`, `ProductDetailPage`, product list/card/filter, `MyProducts`, `ProductForm`, `AdminProductsPage`, cart/checkout surfaces | Browse → product detail → cart → checkout | Canonical product and seller offer are mixed conceptually; weak B2B procurement data | Catalog/category/brand/specification/document concepts | Normalize canonical product vs commercial offer; add OEM/MPN/compatibility/lead-time data | Seller-specific price/availability fields if currently embedded in Product | `ProductOffer`, `ProductCompatibility`, `ProductEquivalent`, `ProductCertification`, `ProductAvailability` | Organizations, Procurement, Orders, Payment | **Catalog Agent** |
| **Product Offers** | **NEW** | — | — | — | — | No first-class seller-specific offer object | — | Introduce seller/price/MOQ/lead-time/warranty/origin/condition layer | Product fields that represent seller-specific commercial state | `ProductOffer`, `OfferPrice`, `OfferDocument`, `OfferAvailability` | Products, Organizations, Procurement, Payment | **Commerce Agent** |
| **Assets / CMMS / Digital Twin** | `assets` | `Asset`, `AssetCategory`, `AssetPart`, `AssetDocument`, `AssetMaintenanceLog`, `Sensor`, `SensorReading`, `AssetAlert`, `DigitalTwinHotspot`, `Hotspot`, `MaintenanceSchedule`, `FailurePrediction` | Asset/category/alert routers; nested parts/documents/maintenance/hotspots/sensors/schedules/predictions; health, emergency stop, dashboards, bulk import/template, record readings, run/resolve prediction | `AssetsPage`, `AssetDashboardPage`, `AssetDetailPage`, `EditAssetPage`, `AddAssetPage`, `ImportAssetsPage`, `AssetSensorsPage`, global/asset dashboards | Asset → parts/docs/maintenance/sensors → schedules/alerts/predictions | Asset hierarchy is incomplete; execution history not unified with WorkOrder; duplicate hotspot concepts exist; predictive engine should not be presented as proven AI without evidence | Asset, parts, docs, maintenance logs, sensors, readings, alerts, schedules | Add Organization/Site/Area/Line hierarchy; connect WorkOrder and failure history; rationalize Hotspot/DigitalTwinHotspot; formalize prediction provenance | Duplicate hotspot representation; any prediction claims unsupported by actual model evidence | `Site`, `Area`, `ProductionLine`, `AssetComponent`, `AssetFailure`, `AssetCost`, `AssetMeter` | Organizations, Work Orders, Parts/Products, Sensors, Checklists | **Asset/CMMS Agent** |
| **Contracts / SLA / AMC** | `contracts` | `ServiceContract`, `EquipmentTransfer`, `ContractMilestone` | `/contracts/`, `/transfers/` | `ContractDetailPage`, contract feature components | Contract → milestones/transfers | Missing explicit organization parties, assets, SLA, pricing, work-order linkage, renewal/warranty semantics | Contract, milestone, equipment transfer | Connect contract to organizations, assets, service scope, WorkOrders and finance; add SLA/renewal | Redundant transfer logic after normalization | `ContractParty`, `ContractAsset`, `ContractServiceScope`, `SLA`, `SLATarget`, `ContractPrice`, `Renewal`, `Warranty` | Organizations, Assets, Services, Work Orders, Payment | **Contracts Agent** |
| **Payment & Finance** | `payment` | `CommissionRule`, `Wallet`, `WalletTransaction`, `Invoice`, `Transaction`, `Settlement` | `/invoices/`, `/commission-rules/`, `/wallets/`, `/settlements/` | `AdminFinancePage`, `AdminCommissionPage`, `SettlementPage`, `WalletPage`, `InvoicesPage` | Invoice/transaction/wallet/commission/settlement | Financial objects are under-normalized; transaction/payment terminology overlaps; no explicit refund/payment lifecycle; status coupling risk | Invoice, commission, wallet, settlement concepts | Separate Payment, FinancialTransaction, Fee/Commission, Settlement and Refund; keep financial states independent from business states | Generic/ambiguous transaction records after migration | `Payment`, `FinancialTransaction`, `PlatformFee`, `Commission`, `Refund`, `Credit`, `Settlement` | Orders, Work Orders, Contracts, Organizations | **Finance Agent** |
| **Reviews & Reputation** | `reviews` | `Review`, `ReviewImage` | `/reviews/` | Review components/pages integrated into service/order flows | Completed transaction → review | Review target is too generic; weak linkage to completed work and provider/technician reputation | Review and image concepts | Add explicit target type and source transaction; separate provider/service/technician/product reputation | Anonymous/unscoped review records after migration | `ReviewTarget`, `ReviewCriterion`, `ProviderReputation`, `TechnicianReputation` | Work Orders, Orders, Products, Services, Users, Organizations | **Reputation Agent** |
| **Support & Disputes** | `support` | `TicketStatus`, `TicketPriority`, `TicketCategory`, `Ticket`, `TicketMessage`, `DisputeResolution`, `Dispute` | `tickets/`, ticket detail/close/messages, admin tickets, `disputes/` create/detail | `SupportPage`, `SupportTicketDetailPage`, ticket/dispute forms and admin support page | Ticket → messages → close; dispute → resolution | Dispute does not have a strong polymorphic business-object reference; evidence/SLA/escalation need normalization | Ticket, TicketMessage, Dispute | Link disputes to Request/Quote/WorkOrder/Order/Payment; add evidence and resolution lifecycle | Generic dispute links without business context | `DisputeSubject`, `DisputeEvidence`, `DisputeAction`, `Escalation` | Services, Work Orders, Orders, Payment, Reviews | **Support Agent** |
| **Notifications** | `notification` | `Notification`, `NotificationTemplate` | `/notifications/` | `NotificationBell`, `NotificationsPage` | Event → notification → read/unread | No canonical event taxonomy or reliable domain-event source; templates can become business logic | Notification and template infrastructure | Introduce event-driven notification contracts and channels | Hard-coded notification creation inside unrelated views | `DomainEvent`, `NotificationDelivery`, `NotificationPreference`, `NotificationChannel` | All transactional domains | **Integration Agent** |
| **Subscriptions / SaaS** | `subscription` | `Plan`, `Subscription` | `/plans/`, `/subscriptions/`, `/active/`, `/my-subscription/`, `/usage-stats/`, `/upgrade/`, `/cancel/` | `PricingPage`, `SubscriptionPage` | Plan → subscribe → usage → upgrade/cancel | Monetization scope is unclear; provider, seller and factory SaaS semantics are mixed | Plan and Subscription infrastructure | Define productized SaaS entitlements and organization ownership | Role-specific subscription assumptions not backed by business decision | `Entitlement`, `UsageRecord`, `SubscriptionInvoice` | Organizations, Payment | **SaaS Agent** |
| **System Settings** | `system_setting` | `SettingType`, `SystemSetting` | list/create, `public/`, `bulk/`, detail | `AdminSettingsPage`, setting list/form/bulk editor | Admin changes setting → platform consumes setting | Generic settings can become a hidden database for business rules and state | Genuine platform configuration | Keep technical/configuration settings; move commission/SLA/workflow/pricing rules into typed domain models | Business rules stored as arbitrary settings | Typed policy/config models only where justified | Core, all domains | **Platform Agent** |
| **Blog / Knowledge** | `blog` | `BlogCategory`, `BlogTag`, `BlogPost` | `/posts/`, `/categories/` | `BlogPage`, `BlogDetailPage`, `AdminBlogPage` | Draft/publish/read | Content is not yet deeply connected to products/services/assets for industrial SEO | Blog CMS | Add structured content relationships, SEO metadata and entity references | — | Optional `ContentRelation`, `SEOProfile` | Products, Services, Assets | **Content/SEO Agent** |
| **Procurement / RFQ** | **NEW** | — | — | — | — | No factory procurement workflow from RFQ through supplier quote and PO | — | New major commercial domain | Manual procurement logic hidden in orders/products | `RFQ`, `RFQLine`, `RFQSupplier`, `SupplierQuote`, `SupplierQuoteLine`, `PurchaseOrder`, `PurchaseOrderLine`, `GoodsReceipt`, `GoodsReceiptLine` | Organizations, Products/ProductOffers, Orders, Payment, Documents | **Procurement Agent** |
| **Documents** | **NEW** | — | — | — | — | Documents are duplicated as model-specific attachments; no version/access/audit layer | Existing Asset/Product/Service attachments as source data | Centralize document metadata, versioning, access and links while preserving domain ownership | Ad-hoc attachment metadata after migration | `Document`, `DocumentVersion`, `DocumentCategory`, `DocumentAccess`, `DocumentLink` | Organizations, Assets, Products, Services, Contracts, Work Orders | **Document Agent** |
| **Audit & Compliance** | **NEW** | — | — | — | — | No canonical immutable audit trail across business and financial actions | — | New cross-cutting domain | Ad-hoc logs used as audit substitutes | `AuditLog`, `AuditEventType`, `SecurityEvent` | Core, Organizations, all transactional domains | **Security Agent** |
| **Customer Acceptance & Warranty** | **NEW** | — | — | — | — | Completion/acceptance/warranty are not independent first-class lifecycle stages | Existing completion evidence where present | Separate technical completion, customer acceptance and warranty | Completion flags embedded in ServiceRequest | `CustomerAcceptance`, `AcceptanceEvidence`, `Warranty`, `WarrantyClaim` | Work Orders, Services, Contracts, Payment, Reviews, Documents | **Service Lifecycle Agent** |

---

## 4. Canonical cross-domain architecture

The target business backbone is:

`User → OrganizationMembership → Organization`

`Organization → Site → Area → ProductionLine → Asset → AssetComponent`

`ServiceOffering → ServiceRequest → ServiceQuote → WorkOrder`

`WorkOrder → Assignment → Visit → Tasks/Checklist → Evidence → ServiceReport → CustomerAcceptance`

`Product → ProductOffer → RFQ → SupplierQuote → PurchaseOrder → GoodsReceipt`

`WorkOrder/PurchaseOrder → Invoice → Payment → Commission/Fee → Settlement`

`Completed WorkOrder/Order → Review → Reputation`

This sequence is the principal reference for API, database, frontend and agent work.

---

## 5. Canonical Service Lifecycle

**Factory Request**  
→ Service Request  
→ Matching  
→ Provider shortlist  
→ Quotes  
→ Quote comparison  
→ Buyer approval  
→ Contract / Service Order where required  
→ Authorization / payment terms  
→ Work Order  
→ Scheduling  
→ Technician Assignment  
→ Dispatch  
→ Arrival / check-in  
→ Diagnosis  
→ Parts / additional scope  
→ Revised quote / approval if required  
→ Execution  
→ Tasks / Checklist / Evidence  
→ Testing  
→ Service Report  
→ Customer Acceptance  
→ Final Invoice  
→ Final Payment  
→ Settlement  
→ Warranty  
→ Review  
→ Closed

### State separation

A WorkOrder may be `COMPLETED` while its Payment is `PENDING`.  
An Invoice may be `ISSUED` while the WorkOrder is `IN_PROGRESS`.  
A Review may only become eligible after the relevant business transaction reaches its accepted/completed state.

No domain may collapse these states into one status field.

---

## 6. Agent ownership model

### Orchestrator / Architecture Agent
Owns:
- domain boundaries
- ADRs
- dependency graph
- API contract governance
- cross-domain impact analysis
- execution sequencing

### Foundation Agent
Owns:
- Users/Organizations
- RBAC
- tenancy
- shared infrastructure
- audit foundation

### Service Domain Agent
Owns:
- Services
- ServiceRequest
- ServiceQuote
- ServiceScope

### Work Order Agent
Owns:
- WorkOrder
- Tasks
- Assignments
- Time/expense/parts/evidence

### Asset/CMMS Agent
Owns:
- Asset hierarchy
- maintenance
- sensors
- alerts
- failure history
- prediction infrastructure

### Commerce / Catalog Agent
Owns:
- Products
- ProductOffer
- Orders
- procurement-facing commerce contracts

### Procurement Agent
Owns:
- RFQ
- SupplierQuote
- PurchaseOrder
- GoodsReceipt

### Finance Agent
Owns:
- Invoice
- Payment
- FinancialTransaction
- Commission/Fee
- Settlement
- Refund

### Frontend Agent
Owns only UI implementation against approved API contracts. It may not invent backend models/endpoints.

### QA / Security / Review Agent
Owns:
- business invariants
- state transition tests
- authorization
- object-level permissions
- migration safety
- regression review
- performance/security checks

---

## 7. Refactoring priority

### P0 — Architecture blockers

1. Organizations / multi-tenancy
2. ServiceRequest → ServiceQuote separation
3. WorkOrder domain
4. canonical state machines
5. permission/object ownership model
6. audit foundation
7. API contract baseline

### P1 — Operational completion

8. Dispatch & scheduling
9. Checklist engine
10. Customer acceptance
11. Service report/evidence
12. ProductOffer
13. Procurement/RFQ
14. financial lifecycle normalization

### P2 — Enterprise maturity

15. SLA/AMC
16. warranty claims
17. document management
18. reputation normalization
19. notification/event architecture
20. subscription/entitlement architecture

### P3 — Intelligence

21. sensor analytics
22. anomaly detection
23. failure prediction
24. provider matching
25. cost/time prediction
26. recommendation engine

---

## 8. Migration rules

### Never do

- Create a second model with the same business meaning.
- Put WorkOrder logic into ServiceRequest.
- Put payment state into Order/WorkOrder.
- Put company ownership directly on arbitrary user/profile fields after Organizations exists.
- Store workflow definitions as arbitrary JSON settings when a typed workflow domain is required.
- Let frontend code define an API contract independently.
- Run multiple conflicting Django migration streams in parallel.

### Always do

- Add new model first.
- Backfill existing data.
- Dual-read only when necessary.
- Verify counts and foreign-key integrity.
- Migrate API consumers.
- Deprecate old API/model.
- Remove old model only after verification.
- Add regression tests before deletion.

---

## 9. Definition of Done for every domain

A domain is not complete because its models or pages exist.

It is complete only when:

- business rules are documented;
- domain model is approved;
- state machine is defined;
- API contract is defined;
- permissions are implemented;
- database migration is tested;
- backend behavior is implemented;
- frontend consumes the approved API;
- loading/empty/error/permission states exist;
- invalid transitions are rejected;
- tests cover happy and failure paths;
- audit/security requirements are addressed;
- API documentation is updated;
- no unrelated files were changed;
- Git diff has been reviewed.

---

## 10. Recommended repository documentation structure

```text
docs/
├── architecture/
│   ├── system-overview.md
│   ├── domain-map.md
│   ├── dependency-map.md
│   ├── database-architecture.md
│   ├── frontend-architecture.md
│   └── InduService-Architecture-Execution-Master-Plan-v1.0.md
├── domains/
│   ├── users.md
│   ├── organizations.md
│   ├── services.md
│   ├── work-orders.md
│   ├── assets.md
│   ├── products.md
│   ├── procurement.md
│   ├── contracts.md
│   ├── payment.md
│   ├── reviews.md
│   └── support.md
├── workflows/
│   ├── service-lifecycle.md
│   ├── procurement-lifecycle.md
│   ├── pm-lifecycle.md
│   ├── contract-lifecycle.md
│   └── dispute-lifecycle.md
├── api/
│   └── api-contract.md
├── agents/
│   ├── master.md
│   ├── backend.md
│   ├── frontend.md
│   ├── qa.md
│   └── reviewer.md
└── decisions/
    ├── ADR-001-organization-tenancy.md
    ├── ADR-002-service-request-vs-work-order.md
    ├── ADR-003-product-vs-product-offer.md
    ├── ADR-004-financial-state-separation.md
    └── ADR-005-workflow-engine.md
```

---

## 11. Immediate execution sequence

### Phase 0 — Freeze & Baseline
- Freeze feature additions.
- Inventory models/APIs/pages/workflows.
- Record current migrations.
- Record current API consumers.
- Establish architecture baseline.

### Phase 1 — Foundation
- Organization and Membership.
- Tenant-aware permissions.
- Audit.
- Document foundation.
- User/Profile migration.

### Phase 2 — Service Core
- ServiceOffering.
- ServiceRequest.
- ServiceQuote.
- ServiceScope.
- State machine.
- API contract.

### Phase 3 — Work Execution
- WorkOrder.
- Task.
- Assignment.
- Parts.
- Time.
- Expense.
- Evidence.
- Checklist.

### Phase 4 — Field Operations
- Dispatch.
- Schedule.
- Visit.
- Service report.
- Customer acceptance.
- Warranty.

### Phase 5 — Commercial & Finance
- ProductOffer.
- RFQ.
- SupplierQuote.
- PurchaseOrder.
- Invoice.
- Payment.
- Commission.
- Settlement.

### Phase 6 — Enterprise CMMS
- Site/Area/Line.
- PM.
- Asset cost/history.
- SLA/AMC.
- Contract renewal.

### Phase 7 — Intelligence
- Sensors.
- Alerts.
- anomaly detection.
- failure prediction.
- matching/recommendations.

---

## 12. Architectural decisions that are now binding

### ADR-001 — User ≠ Organization
A person/account is not a company/tenant. Membership connects them.

### ADR-002 — ServiceRequest ≠ WorkOrder
A request expresses need. A WorkOrder expresses executable authorized work.

### ADR-003 — Product ≠ ProductOffer
Product is the canonical catalog entity. Offer is seller-specific commercial availability.

### ADR-004 — Business State ≠ Financial State
Order/WorkOrder/Contract states never replace Invoice/Payment/Settlement states.

### ADR-005 — Workflow is reusable infrastructure
Scenario-specific workflow steps must not become duplicated hard-coded state logic across apps.

### ADR-006 — Asset is an operational root, not merely a catalog record
Asset history must connect maintenance, work orders, parts, documents, failures and costs.

---

## 13. Repository execution policy for AI agents

Every agent task must include:

- Domain owner
- Allowed files/directories
- Forbidden files/directories
- Current model/API dependencies
- Required API contract
- State transitions affected
- Migration impact
- Required tests
- Acceptance criteria
- Rollback/migration notes

Agents must work in isolated branches and submit changes for review. `main` is never a scratch workspace.

If an agent discovers that completing its task requires changing another domain's model or public API, it must stop and report the dependency rather than silently redesigning that domain.

---

## 14. Baseline verification note

The **14 current Django apps** and their current API route structures were inspected from the repository. Current model/page inventories are based on repository source and the existing frontend structure. Where the target domain is new, Current fields are intentionally marked as `—` rather than invented.

This document is an **architecture and execution baseline**, not a claim that every existing endpoint has been runtime-tested in production. Runtime API behavior, database migration state and deployment configuration remain separate verification tasks.

**Confidence:** High for repository/app structure and architectural mapping; medium-high for current frontend-to-domain mapping where route composition spans shared page files.  
**Verification status:** Repository source inspected; runtime/production behavior not asserted without separate execution tests.


---

## 15. Product management layer

> **Status: PARTIALLY DEFINED — product decisions below are proposals until validated with target customers.**
>
> This section extends the architecture baseline into a product execution plan. It does not claim that proposed features are implemented or that production behavior has been verified.

### 15.1 Product vision (proposed)

InduService aims to help industrial organizations discover qualified service providers and spare parts, authorize work, coordinate execution, and retain a traceable history of assets, service outcomes, and commercial transactions.

The product should connect four related capabilities over time:

1. Industrial service marketplace.
2. B2B spare-parts and procurement marketplace.
3. Asset maintenance / CMMS.
4. Field-service execution and coordination.

**Product principle:** deliver one reliable end-to-end industrial service journey before expanding horizontally into every domain.

### 15.2 Target customer hypothesis

**Initial segment hypothesis — VALIDATION REQUIRED:** factories with recurring maintenance needs and identifiable production assets, initially focusing on one selected industrial segment (candidate segments include packaging, beverage/food production, and industrial machinery).

Primary buyer/user hypotheses:
- Factory maintenance or engineering manager.
- Procurement manager / buyer.
- Operations manager.
- Service provider owner / service coordinator.
- Field technician.

These are hypotheses, not validated personas. Customer interviews and evidence of willingness to pay are **PENDING**.

### 15.3 Core problem hypothesis

A factory has difficulty turning a maintenance need into a timely, trusted, traceable completed job because provider discovery, diagnosis, quotation, approval, execution evidence, acceptance, and payment are fragmented.

Proposed value:
- Traceable requests and quotations.
- Explicit customer approval before authorized work.
- Clear assignment, execution evidence, and service report.
- Separate technical completion, customer acceptance, and financial settlement.
- A reusable asset/service history.

The magnitude of this problem and the relative importance of each pain point are **PENDING customer validation**.

### 15.4 Product positioning boundaries

Initial product should not promise:
- Guaranteed provider availability or a specific repair time without operational evidence.
- Predictive maintenance accuracy without a validated model and dataset.
- Verified supplier stock or pricing unless the data is refreshed and its source is visible.
- Escrow, payment processing, tax, or regulatory capabilities before the operating market and legal/payment constraints are confirmed.

### 15.5 Business model hypotheses

Potential revenue streams for validation:
- Commission or transaction fee on completed service jobs.
- Commercial fee on successful spare-parts transactions.
- Organization subscription for advanced workflow / CMMS capabilities.
- Paid SLA/AMC administration and reporting.

**PENDING:** initial revenue stream, fee basis, who pays, refund/chargeback rules, tax treatment, settlement timing, market-specific payment feasibility, and provider commercial terms. Do not implement pricing or commission assumptions as hard-coded rules before approval.

---

## 16. First operational release — PRD draft v0.1

> **Status: DRAFT / NOT APPROVED.** This is a scope proposal to guide validation and backlog creation, not an approved commitment to release.

### 16.1 Proposed release goal

Allow one factory organization to submit a service request for one of its assets, receive and compare provider quotations, approve a quote, track an authorized work order, review the service report, accept or reject the work with a recorded reason, and view the related invoice/payment state.

The first release should prove one complete service journey. It should not attempt to deliver every domain in the master matrix.

### 16.2 Proposed primary persona

A factory maintenance manager who is authorized to request and approve maintenance work for a specific organization.

**PENDING:** confirm the first customer segment, authority levels, user research, language, geography, and expected service categories.

### 16.3 In-scope capabilities (proposed)

1. Organization membership and tenant-aware access for factory and service-provider organizations.
2. Asset reference sufficient to identify the affected equipment; full enterprise asset hierarchy can follow.
3. Service request creation, attachments, priority, status history, and request ownership.
4. Provider response and versioned service quotation with scope, price, validity, estimated schedule, exclusions, and terms.
5. Explicit quote acceptance/rejection and an auditable approval record.
6. Work order creation only from an approved/authorized scope, with assignment and controlled state transitions.
7. Execution notes, checklist/evidence attachments, parts/time records where needed, and a service report.
8. Customer acceptance or rejection with evidence/reason and a defined rework path.
9. Invoice and payment state visibility, without assuming a payment gateway or escrow exists.
10. Notifications for important state changes.
11. Admin/support handling for blocked requests and disputes.
12. Audit events and automated tests for authorization, invalid transitions, and tenant isolation.

### 16.4 Explicitly out of scope for this first release (proposed)

- Predictive maintenance / AI recommendations.
- IoT streaming and advanced sensor analytics.
- A fully configurable general-purpose workflow engine.
- Full procurement lifecycle (RFQ → supplier quote → PO → goods receipt).
- Advanced warehouse/inventory management.
- Full accounting/ERP.
- Complex subscription entitlements.
- Multi-country tax and payment integrations.
- Native mobile apps, unless customer validation makes them a release blocker.

### 16.5 User stories and acceptance criteria (draft)

**US-01 — Create a service request**
- Given an authenticated, authorized organization member, when they submit a valid request, then it is associated with the correct organization and asset (if selected), receives a valid initial state, and is visible only to authorized parties.
- Invalid or incomplete required data is rejected with field-level feedback.
- Attachments are validated and access-controlled.

**US-02 — Provider responds with a quotation**
- Only an authorized provider member can quote a request routed/invited to that provider.
- The quote stores scope, price/currency, validity, exclusions, and estimated schedule as structured data.
- Quote revisions preserve prior versions or an equivalent auditable revision history.

**US-03 — Factory approves a quote**
- Only an authorized buyer can approve or reject a quote.
- Approval records actor, time, selected quote version, and terms.
- Rejected, expired, or superseded quotes cannot silently create an executable work order.

**US-04 — Create and execute a work order**
- A work order references the accepted commercial scope and source request/quote.
- Invalid state transitions are rejected by the backend.
- Assignment, task/evidence updates, and state changes are authorized and audited.

**US-05 — Submit service report and request acceptance**
- The provider submits a report and required evidence before marking the work ready for acceptance.
- The customer can accept or reject with a reason.
- Rejection creates a traceable rework/dispute path; it does not erase the original report.

**US-06 — View financial lifecycle**
- Work order state and invoice/payment/settlement state are independently represented.
- A completed work order does not automatically imply that payment is complete.
- Financial state changes are permission-checked and auditable.

**US-07 — Tenant isolation**
- Users from Organization A cannot read or modify Organization B's private requests, quotes, work orders, assets, documents, invoices, or provider-only data unless an explicitly authorized cross-organization relationship grants access.
- Tests cover list endpoints, detail endpoints, nested resources, file access, and mutation endpoints.

**US-08 — Operational support**
- Authorized support/admin users can inspect a case and record actions without bypassing audit requirements.
- Disputes reference the underlying business object and retain evidence and resolution history.

### 16.6 Release gates

Release must not be approved until:
- The agreed end-to-end journey passes in a staging-like environment.
- Tenant-isolation and object-level permission tests pass.
- State-transition and regression tests pass.
- Migrations are tested against a representative copy/fixture of existing data and have documented rollback/recovery steps.
- API schema and frontend consumers agree.
- Error, empty, loading, and unauthorized UI states exist.
- Logs, monitoring, backups, and operational ownership are defined.
- A pilot customer/provider has completed UAT and unresolved critical issues are closed.

**PENDING:** approved persona, exact initial service category, commercial terms, acceptance policy, payment operating model, pilot participants, and measurable release targets.

---

## 17. Product backlog and execution gates

> **Status: PRIORITIZED BACKLOG SKELETON.** Items below require issue-level decomposition, owner assignment, estimates, and dependency review before implementation.

| ID | Workstream | Priority | Deliverable / exit gate | Status |
| --- | --- | --- | --- | --- |
| VAL-01 | Customer discovery | P0 | Interview target factories/providers; document pain points and willingness-to-pay evidence | **PENDING** |
| BASE-01 | Repository baseline | P0 | Re-run source inventory against the target branch; reconcile this document with current code | **PENDING verification** |
| RUN-01 | Runtime gate | P0 | Verify environment settings, database engine, migrations, service processes, and staging behavior safely | **PENDING** |
| SEC-01 | Security gate | P0 | Review secrets/configuration, auth, object permissions, file access, and tenant boundaries | **PENDING** |
| API-01 | API contract baseline | P0 | Export current OpenAPI schema; map each endpoint to consumer, permission, and state effects | **PENDING** |
| DATA-01 | Data/migration plan | P0 | Map current Profile/roles/provider data to Organization/Membership; define backfill and rollback | **PENDING** |
| ORG-01 | Organization foundation | P0 | Organization and membership model/API/tests, introduced with backward-compatible migration | **NOT STARTED / VERIFY** |
| TEN-01 | Tenant authorization | P0 | Centralized queryset/object permission strategy plus negative tests for cross-tenant access | **NOT STARTED / VERIFY** |
| AUD-01 | Audit foundation | P0 | Structured audit for sensitive actions, with actor, timestamp, object, action, and outcome | **NOT STARTED / VERIFY** |
| SRV-01 | Service lifecycle specification | P0 | Approved state machine, quote rules, approval rules, cancellation and rework paths | **PENDING approval** |
| SRV-02 | Service quote separation | P0 | Versioned ServiceQuote contract and migration away from embedded request-quote semantics | **NOT STARTED / VERIFY** |
| WO-01 | Work order core | P0 | WorkOrder model/API/state machine linked to authorized scope and source request/quote | **NOT STARTED / VERIFY** |
| UX-01 | Primary user journey | P0 | Factory and provider UI support the approved end-to-end journey and all UI states | **NOT STARTED / VERIFY** |
| QA-01 | End-to-end acceptance | P0 | Automated happy-path, failure-path, permission, migration, and regression suite | **PENDING** |
| OPS-01 | Release operations | P0 | Staging, backup/restore evidence, monitoring, deployment and rollback runbook | **PENDING** |
| DIS-01 | Dispatch and scheduling | P1 | Assignment, availability, visit scheduling, and rescheduling rules | **NOT STARTED / VERIFY** |
| CHK-01 | Checklist and evidence | P1 | Reusable checklist templates/instances and execution evidence | **NOT STARTED / VERIFY** |
| ACC-01 | Customer acceptance/warranty | P1 | Acceptance/rejection, rework, warranty terms and claims lifecycle | **NOT STARTED / VERIFY** |
| OFFER-01 | Product offers | P1 | Product/offer separation and seller-specific price/availability/lead-time | **NOT STARTED / VERIFY** |
| RFQ-01 | Procurement | P1 | RFQ, supplier quote, purchase order and goods receipt workflow | **NOT STARTED / VERIFY** |
| FIN-01 | Financial lifecycle | P1 | Separate invoice/payment/refund/commission/settlement states and reconciliation rules | **NOT STARTED / VERIFY** |
| CMMS-01 | Core maintenance | P1/P2 | Asset hierarchy, maintenance schedule, work-order history, and maintenance KPIs | **NOT STARTED / VERIFY** |
| DOC-01 | Document management | P2 | Access-controlled document metadata, versioning, and domain links | **NOT STARTED / VERIFY** |
| SLA-01 | SLA/AMC | P2 | Contract service scope, response/restore targets, renewal, and breach handling | **NOT STARTED / VERIFY** |
| SUB-01 | SaaS entitlements | P2 | Approved plans, organization ownership, entitlements, usage, and subscription billing | **PENDING business decision** |
| INT-01 | Domain events/notifications | P2 | Versioned event contracts, delivery records, retries, and preferences | **NOT STARTED / VERIFY** |
| AI-01 | Predictive capabilities | P3 | Data quality gate, offline evaluation, measurable performance, and human-safe fallback | **BLOCKED on evidence/data** |

### Backlog rules

- Convert each row into an issue only after the scope and acceptance criteria are clear.
- Every issue must state allowed paths, forbidden paths, dependencies, migration impact, tests, owner, and rollback considerations.
- One shared database-foundation migration stream at a time.
- Do not assign independent agents concurrent changes to shared models/migrations.
- No issue is done merely because code compiles; apply the domain Definition of Done in Section 9.
- Preserve the existing public API or document a deprecation/migration plan before breaking it.

---

## 18. Product metrics and instrumentation plan

> **Status: METRIC DEFINITIONS PROPOSED; event instrumentation and baselines are PENDING.**

Initial metrics to instrument:
- Request completion rate: eligible requests reaching customer-accepted completion / eligible requests created in the cohort.
- Time to first qualified provider response.
- Quote coverage: eligible requests receiving at least one valid quote.
- Quote acceptance rate.
- Time from quote approval to work start.
- First-pass acceptance rate.
- Cancellation and dispute rates.
- Invoice aging and time from invoice issue to payment.
- Provider response/fulfilment reliability.
- Factory repeat usage and cohort retention.
- PM on-time completion rate, once maintenance scheduling is operational.

For each metric, define event names, event properties, numerator, denominator, exclusions, cohort window, owner, and dashboard. Do not set numeric targets until a baseline is collected or a target is explicitly approved.

---

## 19. Non-functional product requirements

> **Status: REQUIREMENTS TO VALIDATE AGAINST DEPLOYMENT AND CUSTOMER NEEDS.**

### Security and privacy
- Enforce organization-aware authorization on every API and file/document access path.
- Never trust tenant identifiers supplied by the client without authorization checks.
- Keep secrets out of source control; use environment-specific secret management.
- Record sensitive administrative and financial actions.
- Define retention, export, deletion, and access rules for personal and commercial data.

### Reliability and recovery
- Define backup frequency, retention, restore testing, and recovery objectives.
- Make state-changing operations safe against accidental duplicate submissions where relevant.
- Use transaction boundaries and idempotency controls for payment/settlement integrations where applicable.
- Monitor errors, failed jobs, email/notification delivery, and database health.

### Performance and scale
- Establish baseline API latency and database-query behavior before setting targets.
- Paginate large collections and test list/filter/search endpoints.
- Index verified query patterns rather than adding speculative indexes.
- Define file size/type limits and secure storage/access behavior.

### Accessibility and usability
- Consistent loading, empty, error, permission-denied, and success states.
- Responsive mobile experience for field execution.
- Localization, date/time, currency, and RTL behavior according to approved markets.
- Clear status names and actionable validation messages.

### Compliance and market constraints
- **PENDING:** operating countries, applicable privacy/tax/contract rules, payment-provider availability, and data-residency requirements.
- Do not represent a payment, escrow, electronic signature, or compliance capability as available until its provider, legal basis, and production operation are verified.

---

## 20. Product and architecture decision register

| Decision ID | Topic | Current direction | Status |
| --- | --- | --- | --- |
| ADR-001 | User vs Organization | Separate person/account from business tenant; connect via membership | Direction recorded; implementation/approval verification **PENDING** |
| ADR-002 | Request vs WorkOrder | Request expresses need; WorkOrder is authorized executable work | Direction recorded; state rules **PENDING approval** |
| ADR-003 | Product vs ProductOffer | Canonical catalog product separate from seller's commercial offer | Direction recorded; field migration **PENDING** |
| ADR-004 | Business vs financial states | Independent state machines | Direction recorded; finance invariants **PENDING** |
| ADR-005 | Workflow engine | Build reusable workflow infrastructure only when justified by validated repeated patterns | Needs detailed ADR and scope **PENDING** |
| ADR-006 | Asset as operational root | Asset history links maintenance, work, parts, documents, failures, and costs | Direction recorded; hierarchy design **PENDING** |
| PM-001 | Initial target segment | Select one segment for the first operational release | **PENDING customer validation** |
| PM-002 | First release revenue model | Decide payer, fee basis, and settlement assumptions | **PENDING business decision** |
| PM-003 | First release payment model | Decide manual tracking vs payment integration and supported markets | **PENDING feasibility/legal review** |
| PM-004 | Acceptance and warranty policy | Define evidence, rejection, rework, warranty, and dispute rules | **PENDING business decision** |
| PM-005 | Localization | Confirm initial language, currency, timezone, and market | **PENDING** |

A recorded direction is not proof of an implemented or formally approved ADR. Detailed ADRs should include context, alternatives, consequences, migration implications, and status (proposed/accepted/superseded).

---

## 21. Open items and continuation register

> **This register is intentionally persistent. Items marked PENDING must not be silently treated as complete. Resume work from this list in later sessions.**

### A. Required before product scope is finalized
- [ ] **PENDING — Customer discovery:** identify interviewees and validate the first customer segment and highest-value problem.
- [ ] **PENDING — PRD approval:** approve or revise the draft scope in Section 16.
- [ ] **PENDING — Commercial model:** decide initial payer, commission/fee model, refund rules, and provider terms.
- [ ] **PENDING — Operating market:** confirm country/countries, language, currency, timezone, legal constraints, and payment feasibility.
- [ ] **PENDING — Release targets:** define baseline and target values for primary KPIs.

### B. Required technical verification
- [ ] **PENDING — Runtime verification:** run backend/frontend checks in a safe environment and document observed results.
- [ ] **PENDING — Production configuration review:** verify effective settings, database connection, deployment configuration, secrets handling, and migrations without making unapproved production changes.
- [ ] **PENDING — Database/migration audit:** record applied migrations, data counts, integrity constraints, and a tested recovery plan.
- [ ] **PENDING — API contract inventory:** export the current schema and map endpoints to frontend consumers, permissions, and state changes.
- [ ] **PENDING — Frontend/runtime inventory:** verify real route behavior, API integration, loading/error states, and primary user flows.
- [ ] **PENDING — Security audit:** verify tenant isolation, object-level authorization, upload/download access, admin privileges, and secret/configuration handling.
- [ ] **PENDING — Test baseline:** record current unit, integration, end-to-end, and regression test coverage/results.

### C. Required before implementation of shared foundations
- [ ] **PENDING — Data migration design:** map legacy Profile/provider/company fields into Organization and Membership without losing ownership or permissions.
- [ ] **PENDING — Canonical state machines:** approve ServiceRequest, ServiceQuote, WorkOrder, acceptance, invoice, payment, refund, and settlement transitions.
- [ ] **PENDING — API compatibility plan:** document versioning/deprecation and frontend rollout order.
- [ ] **PENDING — Audit and document policy:** define immutability expectations, access policy, retention, and evidence requirements.
- [ ] **PENDING — Agent boundaries:** assign issue owners and allowed file paths; serialize shared migration work.
- [ ] **PENDING — Release operations:** staging gate, backup/restore proof, monitoring, deployment checklist, rollback runbook, and pilot UAT.

### D. Later capabilities, explicitly not complete
- [ ] **PENDING — Dispatch/scheduling design**
- [ ] **PENDING — Checklist template/instance design**
- [ ] **PENDING — Customer acceptance, rework, and warranty rules**
- [ ] **PENDING — ProductOffer and compatibility model**
- [ ] **PENDING — RFQ → SupplierQuote → PurchaseOrder → GoodsReceipt lifecycle**
- [ ] **PENDING — Invoice/payment/refund/commission/settlement invariants**
- [ ] **PENDING — CMMS hierarchy and preventive-maintenance policy**
- [ ] **PENDING — Document versioning and access model**
- [ ] **PENDING — SLA/AMC and renewal model**
- [ ] **PENDING — Subscription/entitlement business decision**
- [ ] **PENDING — Domain event and notification delivery contracts**
- [ ] **PENDING — Predictive analytics data-quality and evaluation gate**

### Resume protocol

When continuing this project:
1. Read this document from the current target branch.
2. Read the latest baseline/audit artifacts and open issues; do not assume historical status remains current.
3. Select the earliest unresolved prerequisite from Sections 17 and 21.
4. Verify actual repository/runtime evidence before changing any status from PENDING.
5. Update this register and the relevant domain/ADR/PRD document in the same work item.
6. Keep production changes, destructive migrations, restarts, and secret changes behind explicit verification and approval.

---

## 22. Status semantics and evidence policy

Use these status labels consistently:
- **VERIFIED:** evidence was observed for the stated scope in the stated environment; include date, command/test, and result.
- **IMPLEMENTED — NOT VERIFIED:** code exists but required behavior has not been demonstrated.
- **PARTIAL:** some acceptance criteria pass and others remain open; enumerate them.
- **PROPOSED:** design recommendation awaiting product/architecture approval.
- **PENDING:** work or decision has not been completed.
- **BLOCKED:** cannot proceed until a named dependency is resolved.
- **NOT APPLICABLE:** explicitly justified for this release; do not use as a substitute for investigation.

Evidence rules:
- Source inspection does not prove runtime behavior.
- A passing local test does not prove production configuration or data correctness.
- An existing model/API/page does not prove end-to-end product completion.
- A commit does not prove release, deployment, or customer acceptance.
- Never mark a checklist item verified without recording the evidence and scope.

## 23. Current document status

**Document status:** Architecture baseline plus proposed product-management extension.

**Verified from the supplied repository review:** the master-plan document describes 14 current Django apps, current/target separation, target domains, migration rules, agent governance, and architecture priorities.

**Not independently verified in this update:** live production behavior, effective production configuration, database contents/applied migrations, endpoint authorization, complete user journeys, customer demand, willingness to pay, and any claim that proposed new domains are implemented.

**Immediate next action:** complete the technical/runtime verification and customer discovery gates; then approve PRD v1.0 and create issue-level backlog items. Do not start broad feature implementation before these gates are resolved.

**Confidence:** high for the document structure and proposed product/architecture distinctions; not established for runtime behavior, market validation, or implementation status until the listed evidence is collected.


---

## 24. Target customer and core problem validation

**Detailed working document:** [`docs/product/customer-problem-validation-v0.1.md`](../product/customer-problem-validation-v0.1.md)

**Status: PROPOSED / PENDING CUSTOMER EVIDENCE.** This is a research protocol and testable hypothesis, not a claim of validated demand.

### Current beachhead hypothesis
Test reachable small-to-mid-sized manufacturing plants with production-critical machinery and recurring service needs. Food/beverage/packaging and plastics processing are the first discovery cohorts to compare, not an approved exclusive target market.

### Core problem hypothesis
A factory may struggle to coordinate a production-critical maintenance incident across diagnosis, qualified service-provider sourcing, compatible spare parts, quote/scope approval, execution evidence and completion acceptance. The first-release wedge to test is a traceable factory-to-provider request/quote/fulfilment workflow. CMMS, predictive maintenance and broader procurement must not be assumed to be the first priority.

### Evidence distinction
Desk research supports the plausibility of maintenance/downtime as a problem category and confirms that commercial alternatives exist. It does **not** validate the local target segment, launch geography, local incident costs, market size, willingness to pay or product-market fit. Vendor surveys and pricing pages must not be treated as independent proof of local demand.

### Required validation gates
1. Conduct 20–30 discovery interviews as a starting target (factory-side, service-provider and parts-supplier roles); record real recent incidents, current alternatives, consequences, budget owners and disconfirming evidence.
2. Review at least five anonymized workflow artifacts where customers permit.
3. Compare the first industry cohorts using evidence-backed criteria rather than intuition.
4. Run 3–5 real concierge pilot jobs before broad automation; record baseline timestamps, quote response, job completion, acceptance and repeat-use signals.
5. Test willingness to pay through a concrete paid pilot or purchasing step, not only stated interest.
6. Update and obtain approval for the first-release PRD and selected beachhead based on the findings.

### Open decisions
- Launch geography / city / industrial cluster.
- Industry and company-size beachhead.
- Whether the primary wedge is provider sourcing, parts sourcing, job accountability or preventive maintenance.
- Buyer, budget owner, pricing/payer, provider economics and contractual allocation of technical/warranty liability.
- Whether CMMS is in the first release or deferred.

**Resume rule:** Until the required primary evidence exists, retain these items as PENDING. Do not label the market or customer problem “validated” and do not broaden implementation based only on this desk-research document.


---

## 25. End-to-end industrial service workflow specification

**Detailed specification:** [`docs/product/service-workflow-specification-v0.1.md`](../product/service-workflow-specification-v0.1.md)

**Status: PROPOSED SPECIFICATION — NOT IMPLEMENTATION-VERIFIED.**

### Workflow boundary
Factory request → assessment/clarification → provider invitation and quote → factory approval of an exact quote version → work order and execution/evidence → factory acceptance/rework.

### Non-negotiable business distinctions
- A submitted request is not a quote-ready request.
- A submitted quote is not factory approval.
- A provider's completion report is not customer acceptance.
- Technical acceptance is not payment/settlement.
- Any material post-approval change to scope/price/schedule requires explicit approval and a preserved version history.
- Factory and provider tenant boundaries must be enforced server-side, including attachments and list/search endpoints.

### Current specification decisions
The workflow document defines logical entities, roles, request/quote/work-order states, six main steps, exception paths, notifications, security/audit requirements, API capability map, page map, definition of done and end-to-end test scenarios. These are target requirements, not claims about existing code.

### Required next gate
Map every requirement against the current repository implementation before making feature changes. Inspect models, serializers, APIs, permissions, migrations, frontend pages/hooks/state and tests. Classify each requirement as VERIFIED, IMPLEMENTED — NOT VERIFIED, PARTIAL, MISSING, CONFLICTING or BLOCKED, and cite concrete code/test evidence.

### Deferred scope
Full CMMS, preventive maintenance, predictive AI, standalone spare-parts marketplace, subscriptions, broad finance/settlement and ERP integration remain outside this workflow unless the repository audit demonstrates that a limited capability is already essential to complete the current service journey.

**Resume rule:** The next work item is the requirement-to-code matrix for this workflow, not implementation of new broad features.

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

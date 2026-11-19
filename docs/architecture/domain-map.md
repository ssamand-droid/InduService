# Domain Map

This map separates observed repository domains from proposed boundaries. **Current** means a matching app/model exists in this checkout; it does not certify complete behavior. **Target** means a direction in the master plan that still requires design/ADR and implementation evidence.

| Domain | Current implementation | Main concepts observed | Boundary note |
|---|---|---|---|
| Users & identity | `backend/apps/users` | User, Profile, PortfolioItem, Certification | Profile carries several concerns; see [users](../domains/users.md). |
| Organizations | `backend/apps/organizations` | Organization, OrganizationMembership | Exists in code; organization hierarchy and tenant coverage need audit. |
| Services | `backend/apps/services` | ServiceScenario, ServiceCategory, Service, ServiceRequest, ServiceRequestQuote, attachments/images | Primary coupling hotspot; quote and execution separation is incomplete. |
| Work orders | No dedicated app/model found | Some execution/workflow semantics occur in requests/orders | Target boundary only; do not add during freeze. |
| Assets / CMMS | `backend/apps/assets` | Asset, parts, maintenance, sensors, alerts, schedules, hotspots, predictions | Substantial domain; no complete organizational site/area/line hierarchy established. |
| Products | `backend/apps/products` | Product, category, brand, specification, images/documents | Seller-specific commercial offer is not a separate model in inspected inventory. |
| Procurement | No dedicated app found | Product ordering concepts may exist in `orders` | RFQ, supplier quote, purchase order, and receipt are target concepts. |
| Orders | `backend/apps/orders` | Order, OrderItem, MROWorkflowStep | Commerce and service execution semantics need boundary review. |
| Contracts | `backend/apps/contracts` | ServiceContract, EquipmentTransfer, ContractMilestone | Organization/asset/SLA linkage requires verification. |
| Payment & finance | `backend/apps/payment` | Invoice, Payment, Transaction, Wallet, Settlement, CommissionRule | Sensitive financial logic and cross-domain relationships. |
| Reviews | `backend/apps/reviews` | Review, ReviewImage | Target/source linkage to completed work needs verification. |
| Support & disputes | `backend/apps/support` | Ticket, TicketMessage, Dispute, DisputeResolution | Dispute lifecycle and its relationship to order/service/payment require review. |
| Platform/core | `core`, `system_setting`, `notification`, `subscription`, `blog` | Shared primitives, settings, notifications, plans, content | Keep shared core infrastructure-only; supporting domains remain distinct. |

## Cross-domain invariants

- A person/account (`User`) is distinct from a business tenant (`Organization`); membership links them.
- A service request, quote, execution record, invoice, payment, settlement, and review are distinct concepts even where the current implementation is coupled.
- Business progress and financial progress must not be represented by one overloaded status.
- Product catalog identity is distinct from seller-specific commercial terms.
- No domain deletion or new business model is justified by this baseline alone.

See each page in [`docs/domains/`](../domains/users.md) and the decision register in [`docs/decisions/`](../decisions/README.md).

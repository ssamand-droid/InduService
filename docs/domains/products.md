# Products Domain

**Current app:** `backend/apps/products` · **Observed models:** Category, Brand, TechnicalSpecification, Product, ProductSpecificationValue, ProductImage, ProductDocument.

## Responsibility

Canonical industrial product catalog, specifications, and supporting media/documents.

## Boundary question

Catalog identity is distinct from seller-specific price, MOQ, availability, lead time, warranty, origin, and condition. A first-class `ProductOffer` does not appear in the inspected model list; the master plan proposes it as a future separation. Do not add it during Phase 0 freeze.

## Compatibility

Before moving commercial fields, inventory product serializers, filters/search, seller pages, cart/checkout, order snapshots, and historical records. Preserve product identifiers and existing API behavior through any approved migration. See [procurement lifecycle](../workflows/procurement-lifecycle.md) and [ADR-003](../decisions/ADR-003.md).

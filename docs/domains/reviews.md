# Reviews & Reputation Domain

**Current app:** `backend/apps/reviews` · **Observed models:** Review, ReviewImage.

## Responsibility

Store customer feedback and related image evidence.

## Current-state questions

Verify who may review, eligibility trigger, tenant scoping, moderation, edit/delete rules, and whether a review targets a service, provider, technician, product, order, or accepted execution. The target plan notes weak linkage to a completed transaction; richer reputation aggregates are proposals, not current capability.

## Boundary

Review publication and moderation do not change order, work, acceptance, or payment state. See [domain map](../architecture/domain-map.md).

# Assets / CMMS Domain

**Current app:** `backend/apps/assets` · **Observed areas:** Asset/category, parts, documents, health and maintenance logs, alerts, sensors/readings, schedules, imports, hotspots, and failure predictions.

## Responsibility

Maintain industrial equipment identity and operational history. This is already a substantial domain, not simple CRUD. Asset maintenance and failure context can inform service demand, but asset history and service execution remain separately owned.

## Current-state concerns

The audit calls out missing/unverified organization/site/area/line hierarchy, lack of a unified WorkOrder link, and duplicate `Hotspot`/`DigitalTwinHotspot` concepts. Prediction provenance and claims must be evidence-based; model presence does not establish validated predictive capability.

## Constraints

Preserve maintenance history and document access controls. Resolve hierarchy and duplicate-model decisions before schema changes. Tie operational work to an authorized execution reference only after the WorkOrder boundary is decided. See [ADR-006](../decisions/ADR-006.md).

# Preventive Maintenance Lifecycle

**Meaning of PM here:** preventive maintenance. **Status:** High-level outline based on asset maintenance concepts; verify current model/API states before treating it as an implemented lifecycle.

## Conceptual cycle

```text
Asset and meter/context → maintenance plan/schedule → due work identified
→ authorized maintenance performed → findings/parts/evidence recorded
→ schedule/history updated → next interval determined
```

The `assets` app contains `MaintenanceSchedule`, `AssetMaintenanceLog`, sensors/readings, alerts, and prediction concepts. This inventory does not prove a complete scheduled job dispatch, work-order, checklist, approval, or notification workflow.

## Data and safety concerns

Keep planned maintenance schedule separate from performed maintenance history. Record source, actor, timestamp, meter/interval basis, findings, parts, and evidence where supported. Do not represent a prediction as a confirmed failure. Safety-critical changes require operational owner review.

## Open design

Calendar- versus meter-based recurrence, missed/overdue behavior, schedule versioning, shutdown/safety prerequisites, execution linkage, and responsibility for next interval remain to be verified or decided. See [assets](../domains/assets.md) and [ADR-006](../decisions/ADR-006.md).

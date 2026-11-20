# Master Agent Guide — InduService

## Mission

Coordinate stabilization and implementation against the approved architecture while preserving repository behavior. Phase 0 is **Freeze & Audit**: no new business features.

## Before changing code

1. Read [Architecture Baseline v1](../../ARCHITECTURE_BASELINE_V1.md), relevant architecture/domain/workflow/API pages, and related ADRs.
2. Establish the current source evidence and working-tree state; do not overwrite unrelated user changes.
3. Separate facts, target proposals, and unverified runtime assumptions.
4. For cross-domain/schema/API work, document dependency and migration impact and update the relevant ADR/spec first.

## Freeze policy

During Phase 0, allow audit, documentation, security fixes, migration verification, tests for existing behavior, minimal configuration correction, and approved refactoring. Do not add business features, domains, speculative models/APIs, UI expansion, or unrelated redesign.

## Coordination

Assign a single owner to shared database foundation/migration streams. Backend and frontend agents must use the API contract. Require reviewer evidence for authorization, state transitions, data compatibility, and regression. Mark anything not proven **UNVERIFIED**, not complete.

# Frontend Agent Guide

- Read [frontend architecture](../architecture/frontend-architecture.md), the owning domain/workflow page, and [API contract](../api/api-contract.md) first.
- Consume documented backend endpoints; never invent paths, payloads, state transitions, or permissions.
- During Phase 0, do not expand product flows or introduce unrelated redesign.
- Keep remote state in React Query and client/global presentation state in Zustand unless an explicit design says otherwise.
- Treat backend authorization as authoritative. Hide unavailable actions for clarity, but do not rely on UI checks for security.
- Preserve established RTL/localization behavior and implement loading, error, empty, denied, and conflict states.
- Avoid duplicating shared API/data logic across `features/`, root `services/`, and `pages/` without first mapping existing callers.

# Frontend Architecture

## Observed structure

The frontend is a React/Vite application in `frontend/src` with:

- `routes/` and `App.jsx` for route composition and access wrappers.
- `pages/` for a large route-level page collection.
- `features/<domain>/` for API clients, hooks, components, and some feature state.
- `components/` for shared UI, layout, forms, and domain components.
- `lib/`, `services/`, and `hooks/` for shared client utilities and legacy/shared API access.
- `stores/` for Zustand global state.

There is meaningful overlap between `features/*`, `pages/*`, `components/*`, and root `services/*`; domain ownership is not yet exclusive.

## State ownership

- React Query is installed and should own remote/server state, cache, and invalidation.
- Zustand should remain for client/global state such as auth/session presentation, theme, and UI controls.
- Avoid copying server responses into global stores without a specific consistency requirement.
- Authentication token persistence currently uses browser `localStorage` through persisted Zustand state; the baseline marks this HIGH risk and calls for a deliberate secure-storage/session design.

## API access and routing

Feature API modules call the shared Axios client (`src/lib/axios.js`). Several older service modules coexist at `src/services/`. Routes are composed centrally in `src/routes/router.jsx`, with lazy page loading and protected route handling. The backend API contract is the authority; frontend agents must not invent endpoints.

## Refactoring guidance during stabilization

1. Keep pages focused on route composition; move domain behavior into its owning feature incrementally.
2. Do not redesign or expand user-facing flows during the freeze.
3. Consolidate duplicate API clients only after caller inventory and behavior checks.
4. Make loading, error, empty, permission-denied, and conflict states explicit.
5. Treat server authorization as authoritative; UI visibility is not access control.
6. Keep RTL/localization behavior consistent with existing product conventions.

## Verification gaps

The inventory documents structure, not bundle/runtime behavior, complete route permission coverage, API parity, or accessibility status. See [API contract](../api/api-contract.md) and the [baseline](../../ARCHITECTURE_BASELINE_V1.md).

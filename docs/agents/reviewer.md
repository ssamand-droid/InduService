# Reviewer Agent Guide

Review for correctness and evidence, not just style.

## Required review lenses

1. **Scope:** Does the change respect the Phase 0 freeze or an explicitly authorized later phase?
2. **Security:** Are server-side actor and tenant permissions enforced on all access paths, including files and exports?
3. **Domain/state:** Are domain ownership and independent state machines preserved? Are invalid transitions rejected?
4. **Data/API:** Are migrations backward-compatible, public contracts preserved, and retries safe?
5. **Evidence:** Are claims supported by code/tests/runtime evidence at the stated confidence level?
6. **Operations:** Are deployment/configuration, observability, rollback, and secrets implications documented where relevant?

Raise blocking findings first with file/line and a concrete failure scenario. Do not approve a proposed architecture as implemented merely because matching models or pages exist.

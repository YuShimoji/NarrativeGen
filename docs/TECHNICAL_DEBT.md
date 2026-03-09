# Technical Debt and Improvement Tasks

Last updated: 2026-03-10

## Overview
This document tracks technical debt and improvement work items.

---

## High Priority

### 1. Stabilize Spec SoT operation
Status: in progress

- Added syntax and reference validation for `docs/spec-index.json`.
- Script: `scripts/spec-index-check.mjs`
- Command: `npm run check:spec-index`
- Workflow note added to `docs/plans/DEVELOPMENT_PLAN.md`.

Remaining tasks:
- [ ] Require `npm run check:spec-index` in PR/CI.
- [ ] Add change-review examples for spec maintenance.

### 2. Dependency health recheck
Status: in progress

- Workspace build is restored.
- Build scripts in `packages/engine-ts` and `packages/backend` now use hoisted TypeScript.

Remaining tasks:
- [ ] Monitor `npm ls --depth=0` for `extraneous/invalid` recurrence.
- [ ] Add environment troubleshooting notes for permission/sandbox differences.

### 3. Encoding safety operation
Status: in progress

- Added `npm run check:encoding-safety` and `npm run check:safety`.
- Added `npm run check:safety:changed` for changed-file-oriented validation.
- Added incident record: `docs/governance/encoding-safety-incident-2026-03-10.md`.

Remaining tasks:
- [ ] Make changed-file mode use Git diff directly in restricted/sandboxed environments.
- [ ] Add CI/pre-commit guidance for encoding safety checks.

---

## Medium Priority

### 4. Chunk optimization
Status: in progress

- Dynamic import added for Graph editor and Mermaid preview managers.
- Mermaid import now targets `mermaid/dist/mermaid.core.mjs`.
- Manual chunking now separates `vendor-mermaid-core`, `vendor-mermaid-deps`, `vendor-diagram-layout`, and `vendor-cytoscape`.

Remaining tasks:
- [ ] Decide whether to accept or further reduce `vendor-mermaid-core` (~1.27 MB).
- [ ] Add chunk budget enforcement for regression detection.
- [ ] Measure first screen load performance.

### 5. Responsive and accessibility improvements
Status: not started

Remaining tasks:
- [ ] Mobile/tablet layout definitions.
- [ ] ARIA labels and keyboard navigation.
- [ ] Manual usability checks on key screens.

### 6. Manual test expansion
Status: partially done

Remaining tasks:
- [ ] Re-verify core graph editor scenarios.
- [ ] Regression checks for variable system and Yarn export.
- [ ] Negative-path checks for model import/export.

---

## Low Priority

### 7. Documentation cleanup
Status: ongoing

Remaining tasks:
- [ ] Simplify workflow to prevent doc/spec update leaks.
- [ ] Periodic legacy document review.
- [ ] Normalize mojibake-affected legacy planning documents.

---

## Completed

| Task | Date | Note |
|------|------|------|
| main.js split refactor | 2026-03-08 | `apps/web-tester/main.js` is now a thin entry |
| Yarn Spinner export | 2026-03-09 | Formatter added |
| Variable system extension | 2026-03-09 | Numeric compare/ops/UI integrated |
| Condition/effect dedup | 2026-03-09 | Shared module introduced |
| spec-index JSON recovery | 2026-03-09 | Valid JSON + file references checked |
| spec-index checker | 2026-03-09 | `npm run check:spec-index` |
| encoding safety checker | 2026-03-09 | `npm run check:encoding-safety` |
| encoding safety workflow + incident record | 2026-03-10 | workflow doc and incident record added |
| Mermaid chunk split v2 | 2026-03-10 | `vendor-mermaid-core/deps` and `vendor-diagram-layout` introduced |

---

## History
- 2026-03-09: rewritten to current state
- 2026-03-10: updated for encoding safety workflow and Mermaid chunk split
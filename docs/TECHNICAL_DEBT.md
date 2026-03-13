# Technical Debt and Improvement Tasks

Last updated: 2026-03-12

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

### 6. Node graph visual issues
Status: mostly done (2026-03-14)

Two display problems observed on ノードグラフ tab:
- ~~Minimap (bottom-right) renders with white background on dark theme~~ → Fixed: replaced hardcoded rgba with CSS variables (`--color-surface`, `--color-border`).
- ~~Node text labels overlap outside node boundaries~~ → Fixed: added `#nodeTextClip` clipPath (112x52) in `_setupDefs()`, applied to node text elements.

Remaining tasks:
- [ ] Investigate foreignObject SVG clone rendering reliability (minimap content).
- [x] Replace minimap background with CSS variable for theme-awareness.
- [x] Add clip-path or text-overflow handling to graph node labels.

### 7. Manual test expansion
Status: partially done

Remaining tasks:
- [ ] Re-verify core graph editor scenarios.
- [ ] Regression checks for variable system and Yarn export.
- [ ] Negative-path checks for model import/export.

---

## Low Priority

### 8. Documentation cleanup
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
| validate-models cache pollution fix | 2026-03-12 | `clearSessionCaches()` added to session-ops.ts |
| E2E skip triage (36→5) | 2026-03-12 | theme-toggle deleted (UI未実装), 5 defensive skips retained |
| Export all-model smoke test | 2026-03-12 | 6 models x 4 formatters = 24 structural checks |
| Inference UI Phase 2 (UC-3/UC-4) | 2026-03-12 | Impact analysis + state key usage in InferencePanel |

---

## History
- 2026-03-09: rewritten to current state
- 2026-03-10: updated for encoding safety workflow and Mermaid chunk split
- 2026-03-12: added graph visual issues, completed Phase 2 items
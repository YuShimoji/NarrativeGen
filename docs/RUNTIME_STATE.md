# Runtime State

## Workflow stamp

```text
CODEX_REKICKSTART_KIT=2026-07-09.v1
GLOBAL_CODEX_WORKING_CONTRACT=v1
BUILD_EVIDENCE_LOOP=v1
PROJECT_CAPSULE=v1
```

## Current branch

`main`, tracking `origin/main`. `git rev-list --left-right --count "HEAD...@{u}"` returned `0 0` during re-kickstart on 2026-07-10.

## Last commit

`49b1250 docs: refresh probe recovery handoff`

## Last known good state

Tracked repo is in remote parity after `git fetch --prune origin`. The shipped state remains Probe Reviewability Recovery v0: Web Tester resets cross-sample play state and `originality-spine-probe.json` uses Japanese-first player copy while retaining diagnostics in dashboard/readback surfaces.

## Last validation

| Check | Command | Result | Date |
|---|---|---|---|
| install | `npm ci` | not run this turn; existing `node_modules/` present | 2026-07-10 |
| build | `npm run build:engine` | pass; evidence: `artifacts/review/re-kickstart-build-engine-2026-07-10.md` | 2026-07-10 |
| test | `npm run test` or focused `npm run test -w @narrativegen/engine-ts -- test/originality-spine-probe.spec.ts` | command confirmed, not run this turn | 2026-07-10 |
| lint | `npm run lint` | command confirmed, not run this turn | 2026-07-10 |
| preview | `npm run preview` | command confirmed, not run this turn | 2026-07-10 |
| screenshot | `NOT_AVAILABLE_IN_THIS_REPO` dedicated screenshot command absent; use Web Tester dev server plus Playwright/manual capture | not run this turn | 2026-07-10 |
| artifact generation | `npm run build:generated-specimen -w @narrativegen/web-tester` | command confirmed, not run this turn | 2026-07-10 |
| governance safety | `npm run check:safety` | pass; spec-index 36 entries, encoding scan 327 text files, 18 model files in sync | 2026-07-10 |

## Current active slice

Re-kickstart BUILD: Project Capsule initialized, real validation commands recorded, engine build evidence produced, and next BUILD candidates selected without changing product behavior.

## Known open items

- Root Unity-style residue is still untracked. Purpose: preserve local Unity/package-manager output without silently promoting it. Effect: `git status` is noisy but tracked repo parity is clean. Requirement: decide whether NarrativeGen should track a root Unity project before adding or deleting it. State: uncommitted local residue. Owner: human or future Unity-scoped slice. Next move: classify/promote or explicitly discard in a separate slice.
- No UI screenshot was captured in this turn. Purpose: keep the first re-kickstart action small and evidence-backed. Effect: UI state is not visually refreshed. Requirement: run Web Tester and capture a review surface if the next BUILD slice is UI-facing. State: open. Owner: assistant can do this in the next UI slice. Next move: capture `originality-spine-probe.json` or `vertical-slice.json` desktop/mobile evidence.
- The kit AGENTS template was not applied over repo AGENTS. Purpose: avoid overwriting stronger repo-local read order and Anti-Growth constraints. Effect: Project Capsule docs exist, but `AGENTS.md` remains the NarrativeGen entry pointer. Requirement: only adjust AGENTS if the user explicitly wants to change the repo-local authority chain. State: intentionally unchanged. Owner: user decision. Next move: continue using `AGENTS.md -> docs/REPO_LOCAL_RULES.md -> HANDOVER.md`.

## Next BUILD candidates

| Candidate | Impact | Effort | Risk | Evidence target |
|---|---:|---:|---:|---|
| Capture current Web Tester review evidence | high | low | low | screenshot or Playwright trace for `originality-spine-probe.json` and/or `vertical-slice.json` |
| SP-DTYARN-001 continuation spec-to-test slice | high | medium | medium | updated formatter contract plus focused formatter test output |
| SP-009 UI quality expansion on one surface | medium | medium | medium | before/after screenshots and focused Playwright/manual checklist evidence |

## Last material evidence

`artifacts/review/re-kickstart-build-engine-2026-07-10.md`

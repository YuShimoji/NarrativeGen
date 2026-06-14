# Development Plan

Status: roadmap source of truth
Last updated: 2026-06-15

This file is the single roadmap document. Agent operating rules live in `docs/REPO_LOCAL_RULES.md`; current state and next resume steps live in the root `HANDOVER.md`; feature/spec status lives in `docs/spec-index.json`; durable decisions live in `docs/governance/decision-log.md`.

## Current Priorities

1. **Playable vertical slice canonicalization**
   - Treat `models/examples/vertical-slice.json` as the current survival check: a writer can open it in Web Tester, play a short story to an ending, save, and reload without losing the route.
   - Keep test, lint, schema, CI, doctor, and refactor work subordinate to preserving this playable authoring/playback path.

2. **AI mock adoption path**
   - Move the existing AI generation UI from display-only/inert paths toward mock-provider adoption: generate, adopt into the model, add a node, connect a choice, save, and reload.
   - Do this as a narrow follow-up to the vertical slice, not as a broad AI feature expansion.

3. **CSV import/export semantics for the slice**
   - Align the active CSV path with schema-valid JSON enough for `vertical-slice.csv` to be a meaningful writer-facing companion, not a separate semantic ledger.

4. **SP-DTYARN-001 continuation**
   - Extend Dynamic Text to Yarn conversion beyond the implemented `[entity]`, `[entity.prop]`, and numeric comparison support.
   - Fix the intended Yarn representation in `docs/specs/dynamic-text-yarn-export.md` before code changes.

5. **SP-009 UI quality expansion**
   - Continue a11y/responsive work from the completed baseline into graph, debug, and remaining modal surfaces.
   - Track screen-level checks in `docs/checklists/A11Y_RESPONSIVE_CHECKLIST.md`.

6. **E2E and regression stability**
   - Continue issue-backed flaky follow-up for GitHub #81-#83 and `docs/tasks/FLAKY_ISSUES_TRACKER.md`.
   - Add or formalize negative-path import/export checks where they remove manual uncertainty.

## Medium-Term Tracks

- Keep automated/manual regression ownership clear via `docs/operations/E2E_FLAKE_RUNBOOK.md`.
- Promote governance checks (`check:spec-index`, `check:models-sync`, `check:encoding-safety`) from maintenance habit to release-readiness criteria.
- Keep roadmap entries tied to spec IDs, GitHub issues, or concrete operator workflow gaps. Do not add speculative feature batches without a value path.

## Long-Term Tracks

- **WritingPage integration** remains blocked until `docs/specs/writingpage-io-contract.md` gates pass.
- **Unity distribution** remains UPM-first. Local NuGet pack readiness is complete; public publishing remains outside assistant-owned implementation.
- **Quality gates** should stay centered on spec integrity, model sync, compatibility, and regression evidence.

## Completed Foundations

- CI governance checks are in place for spec index, model sync, and encoding safety.
- SP-PLAY-001 is done; AC-9 to AC-12 are covered by `play-media-bgm-ac.spec.js` plus the spec verification table.
- SP-UNITY-001 is done; `createEvent` applies through the C# runtime, `expandTemplate` major parity edges are covered, and local NuGet pack metadata is present.
- Vite 8 is merged to `main` with the Rollup wasm override maintained.
- Web Tester has baseline a11y/responsive improvements and runbook-backed E2E flaky handling.
- WritingPage has a preparation contract and a recorded No-Go gate.

## Operating Rules

- AI agents restart through `AGENTS.md` -> `docs/REPO_LOCAL_RULES.md` -> `HANDOVER.md`; `HANDOVER.md` remains the current-state entrypoint.
- This file should not duplicate current test counts, branch state, or session handoff details.
- When a roadmap item becomes an implementation slice, link it to a spec, issue, or checklist and keep `docs/spec-index.json` synchronized if spec status changes.
- Historical plans are not archived as files; use Git history for removed planning documents.

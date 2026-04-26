# Development Plan

Status: roadmap source of truth
Last updated: 2026-04-27

This file is the single roadmap document. Current state and next resume steps live in the root `HANDOVER.md`; feature/spec status lives in `docs/spec-index.json`; durable decisions live in `docs/governance/decision-log.md`.

## Current Priorities

1. **SP-UNITY-001 residual parity**
   - Finish Unity SDK parity work that remains after `hasEvent`, `createEvent`, `TemplateUsageState`, and `maxUses`.
   - Focus areas: NuGet/distribution notes, `expandTemplate` edge cases, and quarterly TS/C# parity audit.

2. **SP-DTYARN-001 continuation**
   - Extend Dynamic Text to Yarn conversion beyond the implemented `[entity]`, `[entity.prop]`, and numeric comparison support.
   - Fix the intended Yarn representation in `docs/specs/dynamic-text-yarn-export.md` before code changes.

3. **SP-009 UI quality expansion**
   - Continue a11y/responsive work from the completed baseline into graph, debug, and remaining modal surfaces.
   - Track screen-level checks in `docs/checklists/A11Y_RESPONSIVE_CHECKLIST.md`.

4. **E2E and regression stability**
   - Continue issue-backed flaky follow-up for GitHub #81-#83 and `docs/tasks/FLAKY_ISSUES_TRACKER.md`.
   - Add or formalize negative-path import/export checks where they remove manual uncertainty.

## Medium-Term Tracks

- Keep automated/manual regression ownership clear via `docs/operations/E2E_FLAKE_RUNBOOK.md`.
- Promote governance checks (`check:spec-index`, `check:models-sync`, `check:encoding-safety`) from maintenance habit to release-readiness criteria.
- Keep roadmap entries tied to spec IDs, GitHub issues, or concrete operator workflow gaps. Do not add speculative feature batches without a value path.

## Long-Term Tracks

- **WritingPage integration** remains blocked until `docs/specs/writingpage-io-contract.md` gates pass.
- **Unity distribution** remains UPM-first, with NuGet or additional channel work handled as a distribution improvement rather than runtime divergence.
- **Quality gates** should stay centered on spec integrity, model sync, compatibility, and regression evidence.

## Completed Foundations

- CI governance checks are in place for spec index, model sync, and encoding safety.
- SP-PLAY-001 is done; AC-9 to AC-12 are covered by `play-media-bgm-ac.spec.js` plus the spec verification table.
- Vite 8 is merged to `main` with the Rollup wasm override maintained.
- Web Tester has baseline a11y/responsive improvements and runbook-backed E2E flaky handling.
- WritingPage has a preparation contract and a recorded No-Go gate.

## Operating Rules

- `HANDOVER.md` is the only normal restart entrypoint.
- This file should not duplicate current test counts, branch state, or session handoff details.
- When a roadmap item becomes an implementation slice, link it to a spec, issue, or checklist and keep `docs/spec-index.json` synchronized if spec status changes.
- Historical plans are not archived as files; use Git history for removed planning documents.

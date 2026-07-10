# Development Plan

Status: roadmap source of truth
Last updated: 2026-07-10

This file is the single roadmap document. Agent operating rules live in `docs/REPO_LOCAL_RULES.md`; current state and next resume steps live in the root `HANDOVER.md`; feature/spec status lives in `docs/spec-index.json`; durable decisions live in `docs/governance/decision-log.md`.

## Current Priorities

1. **Playable baseline and originality-probe review**
   - Keep `models/examples/vertical-slice.json` as the survival check for authoring, play, save, and reload.
   - Use `models/examples/originality-spine-probe.json` as the current review artifact for whether Character Knowledge and Perception Policy produce a player-visible route difference without old-ADV-style manual wiring.
   - The cross-sample state leak and Japanese-first probe presentation are repaired. Do not reopen them without a reproduced defect or review finding.

2. **Procedural-narrative policy frontier**
   - Decide whether the next approved slice should move Character Knowledge into choice availability or into a broader event-generation pass.
   - Selection means specification/evaluation first; implementation is not approved until the value path, player-visible signal, and authoring-cost reduction are explicit.

3. **SP-DTYARN-001 continuation**
   - Extend Dynamic Text to Yarn conversion beyond the implemented `[entity]`, `[entity.prop]`, and numeric comparison support.
   - Fix the intended Yarn representation in `docs/specs/dynamic-text-yarn-export.md` before code changes.

4. **Experience-direction exploration before broad UI work**
   - Compare materially different directions for layout/information hierarchy, Japanese/English behavior, visual system, and motion before a broad modernization slice.
   - Produce low-cost review evidence first. Human direction selection advances the spec/prototype; implementation still requires an explicit `IMPLEMENT` packet unless that packet already names the choice as its final gate. Do not enter a micro-polish loop without a chosen direction and fixed acceptance axes.

5. **SP-009 UI quality expansion**
   - Continue a11y/responsive work from the completed baseline into graph, debug, and remaining modal surfaces.
   - Track screen-level checks in `docs/checklists/A11Y_RESPONSIVE_CHECKLIST.md`.

6. **E2E and regression stability**
   - Continue issue-backed flaky follow-up for GitHub #81-#83 and `docs/tasks/FLAKY_ISSUES_TRACKER.md`.
   - Add or formalize negative-path import/export checks where they remove manual uncertainty.

## Proposed Experience Routes

These candidates preserve the creative exploration from the 2026-07-10 workflow reset. All remain `proposed`; choosing one normally advances specification/prototyping and does not authorize implementation.

| Candidate | Workflow or product value | Smallest proof | Main decision / risk |
|---|---|---|---|
| **Choice Consequence Lens** (recommended first) | Translate inference, What-if, and Character Knowledge into “why available,” “what changes,” and “what opens” for the selected choice | Read-only right pane for `originality-spine-probe.json` with every statement traceable to engine facts | Authoring-only vs player-visible; narrative vocabulary vs technical vocabulary; avoid inferred claims |
| **Stage-based Authoring Cockpit** | Reframe flat tabs around the single operator's Writer / TechDesigner / Integrator modes: create, play, diagnose, export | Reuse existing DOM/events for one `vertical-slice.json` path with a mode rail, work surface, and context pane | Pipeline-centered vs object-centered IA; high responsive/event-wiring blast radius |
| **Two-layer localization** | Let UI language change without mutating story prose, node IDs, or schema | Extract about 30 Story/tab/Dashboard strings to `ja/en` dictionaries with explicit fallback | Initial languages, glossary, locale formatting, and missing-key behavior |
| **Narrative Visual Grammar** | Distinguish authoring, story, and diagnostics through semantic color, typography, and restrained motion | Existing palette as base; system sans for UI, optional Japanese serif for prose, mono for state/code, reduced-motion support | Visual temperature, serif use, motion intensity; do after layout direction to avoid rework |
| **Mechanics Starter Packs** | Extend current primitives into human-authored genre structures without letting AI write the story | One eight-node “evidence mystery” skeleton using Entity-Property, Perception Policy, Event, ConversationTemplate, and Dynamic Text | First genre and how much structure the template fixes; prove one workflow before multiplying packs |

Review sequence: three same-content direction mocks -> one-screen macro contract -> fixed-scenario vertical slice -> 1440px / 768px integrated review. If the macro direction fails, return to direction selection rather than attempting to rescue it with repeated CSS polish.

## Medium-Term Tracks

- Keep automated/manual regression ownership clear via `docs/operations/E2E_FLAKE_RUNBOOK.md`.
- Promote governance checks (`check:spec-index`, `check:models-sync`, `check:encoding-safety`) from maintenance habit to release-readiness criteria.
- Keep roadmap entries tied to spec IDs, GitHub issues, or concrete operator workflow gaps. Do not add speculative feature batches without a value path.
- Keep the supervising-AI to development-AI handoff at one outcome per mission packet. Do not split related implementation, verification, current-state synchronization, and git follow-through into separate prompts.
- If an external Project Cockpit is approved, generate it from `HANDOVER.md`, this roadmap, and `docs/spec-index.json`; do not maintain a manual Wiki status copy.

## Long-Term Tracks

- **WritingPage integration** remains blocked until `docs/specs/writingpage-io-contract.md` gates pass.
- **Unity distribution** remains UPM-first. Local NuGet pack readiness is complete; public publishing remains outside assistant-owned implementation.
- **Quality gates** should stay centered on spec integrity, model sync, compatibility, and regression evidence.

## Completed Foundations

- The playable vertical slice, mock-provider proposal adoption, save-slot persistence, and schema-valid CSV import/export roundtrip are implemented.
- The originality spine probe now exercises Character Knowledge through a node-triggered Perception Policy, and the recovered Web Tester review flow prevents state leakage between samples.
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

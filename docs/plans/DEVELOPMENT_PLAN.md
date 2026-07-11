# Development Plan

Status: roadmap source of truth
Last updated: 2026-07-11

This file is the single roadmap document. Agent operating rules live in `docs/REPO_LOCAL_RULES.md`; current state and next resume steps live in the root `HANDOVER.md`; feature/spec status lives in `docs/spec-index.json`; durable decisions live in `docs/governance/decision-log.md`.

## Current Priorities

1. **Playable baseline and originality-probe review**
   - Keep `models/examples/vertical-slice.json` as the survival check for authoring, play, save, and reload.
   - Use `models/examples/originality-spine-probe.json` as the current review artifact for whether Character Knowledge and Perception Policy produce a player-visible route difference without old-ADV-style manual wiring.
   - The cross-sample state leak and Japanese-first probe presentation are repaired. Do not reopen them without a reproduced defect or review finding.

2. **Procedural-narrative policy frontier**
   - Decide whether the next approved slice should move Character Knowledge into choice availability or into a broader event-generation pass.
   - Evaluate choice availability first: it has the smaller state/authoring surface and the clearest player-visible signal. Keep broader event generation as the comparison route, not as an implied implementation target.
   - Selection means specification/evaluation first; implementation is not approved until the value path, player-visible signal, and authoring-cost reduction are explicit.

3. **SP-DTYARN-001 continuation**
   - Extend Dynamic Text to Yarn conversion beyond the implemented `[entity]`, `[entity.prop]`, and numeric comparison support.
   - Fix the intended Yarn representation in `docs/specs/dynamic-text-yarn-export.md` before code changes.

4. **Experience-direction exploration before broad UI work**
   - Compare materially different directions for layout/information hierarchy, Japanese/English behavior, visual system, and motion before a broad modernization slice.
   - Produce low-cost review evidence first. Human direction selection advances the spec/prototype; implementation still requires an explicit `IMPLEMENT` packet unless that packet already names the choice as its final gate. Do not enter a micro-polish loop without a chosen direction and fixed acceptance axes.

5. **SP-009 UI quality expansion**
   - The primary Story / Graph / Play / Modal checklist is marked complete, while technical debt still names debug and secondary modal surfaces. Reconcile that coverage and name the exact remaining screens before another implementation slice.
   - Track any newly confirmed screen-level gaps in `docs/checklists/A11Y_RESPONSIVE_CHECKLIST.md`; do not use a generic Phase 8 label as proof of unfinished behavior.

6. **E2E and regression stability**
   - GitHub #81-#83 are closed in `docs/tasks/FLAKY_ISSUES_TRACKER.md`. Do not treat them as active work unless the runbook threshold is met by a reproduced recurrence.
   - Add or formalize negative-path import/export checks where they remove manual uncertainty.

## Proposed North Star And Forward Target Ladder

The proposed long-range product image is: a single author defines world objects, character knowledge, and narrative intent once; the deterministic runtime derives meaningful choice availability, events, and text without duplicating route wiring; the author can inspect why a route changed; the same full-fidelity JSON behaves consistently in Web Tester and Unity; and the author can complete author -> validate -> play -> export -> integrate without an improvised transfer step.

This is a dependency-ordered proposal, not an approved implementation queue. A later goal becomes implementation-ready only after its stated gate passes and an `IMPLEMENT` packet approves that slice.

| Gate / target | Purpose and what becomes possible | Completion signal | Requirements / main risk | State, owner, next move |
|---|---|---|---|---|
| **G0 — Lock the current originality baseline** | Separate machine correctness from whether the probe actually communicates a meaningful story difference | Human reviews both probe branches and Designer Dashboard together; findings are recorded as pass or concrete defects | Requires subjective GUI/story judgment; automation cannot approve it | `pending verification`; user owns judgment; this may run in parallel if G1 exploration is selected |
| **G1 — Choose the policy contract** | Decide how Character Knowledge acts before node arrival and prevent the engine from growing two competing policy models | Choice-availability and broader event-generation designs are compared on model shape, deterministic timing, idempotency, player signal, and authoring-wiring reduction; one recommendation is frozen in a spec/probe | Must preserve JSON-first, TS-as-source, deterministic/offline behavior; avoid invisible background complexity | `proposed`; assistant prepares an `EXPLORE` packet, user approves only the product direction |
| **G2 — Ship one procedural-choice vertical slice** | Make knowledge-derived state change a choice before the author manually wires an equivalent event/flag chain | One fixed scenario shows a choice becoming available or unavailable from Character Knowledge, with engine tests, schema validation, dashboard evidence, and no raw diagnostics in player copy | Requires G1 contract and explicit `IMPLEMENT`; schema/API changes reopen the gate | `proposed`; assistant-owned implementation after approval; start with choice availability unless G1 evidence rejects it |
| **G3 — Explain consequences from engine facts** | Turn inference and policy power into an author-usable reason surface instead of hidden diagnostics | A read-only Choice Consequence Lens explains why a choice is available, what state changes, and what opens, with every statement traceable to deterministic facts | Policy semantics must be stable; inferred or speculative prose is prohibited | `proposed`; assistant prototypes three same-content directions, user selects the macro direction |
| **G4 — Prove the one-person authoring workflow** | Demonstrate that the primitives reduce work in a real story shape rather than only in a technical probe | One eight-node evidence-mystery starter pack completes author -> validate -> play -> save/reload -> export, with wiring count and manual exceptions recorded | Human owns creative acceptance; do not mass-produce templates before one workflow proof | `proposed`; shared ownership; assistant scaffolds and measures, user judges story usefulness |
| **G5 — Restore cross-runtime semantic parity** | Let the approved policy behavior survive Unity integration instead of becoming Web-only originality | C# model shape, event derivation, TS/C# fixtures, serialization, and one Unity integration sample agree on the G2 contract | Requires stable TS semantics; Unity must not independently evolve; Editor visual acceptance is separate | `hold pending G2`; assistant owns parity implementation, user owns any public distribution decision |
| **G6 — Mature the authoring experience around proven work** | Reorganize the tool around the real Writer / TechDesigner / Integrator loop and reduce language/visual friction | Stage-based cockpit direction, two-layer UI localization, and narrative visual grammar are each selected through low-cost evidence and delivered as bounded slices | Do not redesign around an unproven workflow; high-subjectivity direction needs human selection | `proposed`; shared direction, assistant implementation after explicit packets; start only after G4 reveals the actual friction |
| **G7 — Establish release readiness** | Make a reproducible build trustworthy enough for versioned consumption | Supported toolchains are pinned; production audit findings have an approved resolution/baseline; backend build and real Web Tester lint are in the standard gate; negative import/export and recurring parity checks are enforced | Dependency upgrades require approval and may change behavior; quality work must protect the playable path | `proposed support track`; shared approval/assistant execution; schedule as a dedicated security/toolchain slice before release claims |
| **G8 — Open conditional ecosystem paths** | Connect external writing, distribution, and status surfaces without creating a second source of truth | WritingPage gates pass before integration; public Unity/package publication is explicitly human-approved; any Project Cockpit is generated from canonical docs | External format stability, publication scope, credentials, and maintenance ownership are outside current authority | `hold (conditional)`; user unlocks each path; assistant implements only the approved bounded adapter or generated projection |

Parallel compatibility work remains available but is not the core originality sequence: SP-DTYARN-001 should proceed spec-first, and regression/a11y work should begin from a reproduced or precisely named gap rather than a generic maintenance label.

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

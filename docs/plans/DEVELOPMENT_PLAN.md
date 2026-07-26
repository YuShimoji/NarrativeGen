# Development Plan

Status: roadmap source of truth
Last updated: 2026-07-27

This file is the single roadmap document. Agent operating rules live in `docs/REPO_LOCAL_RULES.md`; current state and next resume steps live in the root `HANDOVER.md`; feature/spec status lives in `docs/spec-index.json`; durable decisions live in `docs/governance/decision-log.md`.

## Current Priorities

1. **SR0 closed; S1 source/save accepted**
   - SR0 is accepted. Runtime revision `44656de` contains the exact adapter
     repair, all seven LF normalizations, the index-blob regression guard, and a
     self-contained full adapter test. It was fast-forwarded to `origin/main`
     and passed ordinary remote-clone acceptance before this docs-only status
     follow-up.
   - The supervising report owns the exact final docs SHA and its repeated
     clone evidence. The repository roadmap no longer treats repair integration
     as an active implementation lane.
   - Human-observed Sites evidence now records a successful adapter source
     import, build, and Version 1 save with owner-only custom access. No
     Preview URL or Live URL exists, and deployment was neither required nor
     performed.
   - The repository records the provisioned non-secret project binding.
     Hosted runtime behavior remains unknown, so the only unlocked successor
     is an explicit owner-only deployment-or-hold decision.

2. **Public Studio private-compatibility gate**
   - Keep `apps/public-studio/` as a separate Japanese-first, browser-local demonstration and editing lane. It reuses the shared browser engine and canonical procedural-choice sample; it must not become a second runtime or model authority.
   - Source intake and Version 1 save are accepted; private hosted-runtime compatibility remains partial because root/assets/story/edit/reload/export were not observed on Sites.
   - The next human gate is whether to deploy Version 1 with owner-only access for runtime review or hold. Publication, analytics, auth, personal data, AI configuration, transactions, and public visibility remain disabled.
   - Choose S2 only after one concrete local or hosted-runtime editing friction is observed. Do not broaden the editor from hypothetical demand or from the current evidence gap.

3. **Playable baseline and originality-probe review**
   - Keep `models/examples/vertical-slice.json` as the survival check for authoring, play, save, and reload.
   - Use `models/examples/originality-spine-probe.json` as the current review artifact for whether Character Knowledge and Perception Policy produce a player-visible route difference without old-ADV-style manual wiring.
   - The cross-sample state leak and Japanese-first probe presentation are repaired. Do not reopen them without a reproduced defect or review finding.

4. **Procedural-narrative policy frontier**
   - The user accepted Contract A on 2026-07-12. [SP-KNOW-002](../specs/knowledge-derived-choice-availability.md) owns the reusable pure choice-availability contract; the [comparison](../samples/originality-spine-policy-contract-comparison.md) remains non-normative evidence.
   - The G2 TS/Web slice is `done`: schema, engine, inference, cache, probe, Dashboard, Story-boundary, three-browser, build, safety, push, parity, and commit-associated CI agree.
   - Contract B event materialization, Unity parity, and G3 Choice Consequence Lens remain separate lanes. Do not fold them into G2 closeout.

5. **SP-DTYARN-001 continuation**
   - Extend Dynamic Text to Yarn conversion beyond the implemented `[entity]`, `[entity.prop]`, and numeric comparison support.
   - Fix the intended Yarn representation in `docs/specs/dynamic-text-yarn-export.md` before code changes.

6. **Experience-direction exploration before broad UI work**
   - Compare materially different directions for layout/information hierarchy, Japanese/English behavior, visual system, and motion before a broad modernization slice.
   - Produce low-cost review evidence first. Human direction selection advances the spec/prototype; implementation still requires an explicit `IMPLEMENT` packet unless that packet already names the choice as its final gate. Do not enter a micro-polish loop without a chosen direction and fixed acceptance axes.

7. **SP-009 UI quality expansion**
   - The primary Story / Graph / Play / Modal checklist is marked complete, while technical debt still names debug and secondary modal surfaces. Reconcile that coverage and name the exact remaining screens before another implementation slice.
   - Track any newly confirmed screen-level gaps in `docs/checklists/A11Y_RESPONSIVE_CHECKLIST.md`; do not use a generic Phase 8 label as proof of unfinished behavior.

8. **E2E and regression stability**
   - GitHub #81-#83 are closed in `docs/tasks/FLAKY_ISSUES_TRACKER.md`. Do not treat them as active work unless the runbook threshold is met by a reproduced recurrence.
   - Add or formalize negative-path import/export checks where they remove manual uncertainty.

## Proposed North Star And Forward Target Ladder

The proposed long-range product image is: a single author defines world objects, character knowledge, and narrative intent once; the deterministic runtime derives meaningful choice availability, events, and text without duplicating route wiring; the author can inspect why a route changed; the same full-fidelity JSON behaves consistently in Web Tester and Unity; and the author can complete author -> validate -> play -> export -> integrate without an improvised transfer step.

This is a dependency-ordered proposal, not an approved implementation queue. A later goal becomes implementation-ready only after its stated gate passes and an `IMPLEMENT` packet approves that slice.

| Gate / target | Purpose and what becomes possible | Completion signal | Requirements / main risk | State, owner, next move |
|---|---|---|---|---|
| **G0 — Lock the current originality baseline** | Separate machine correctness from whether the probe actually communicates a meaningful story difference | Human reviews both probe branches and Designer Dashboard together; findings are recorded as pass or concrete defects | Requires subjective GUI/story judgment; automation cannot approve it | `pending verification`; user owns judgment; remains separate from completed technical direction selection and G2 validation |
| **G1 — Choose the policy contract** | Decide how Character Knowledge acts at choice evaluation and prevent the engine from growing two competing policy models | [Comparison evidence](../samples/originality-spine-policy-contract-comparison.md) records exactly two contracts; one direction and its public/fixture defaults are accepted | Must preserve JSON-first, TS-as-source, deterministic/offline behavior; avoid invisible background complexity | `done`; user accepted Contract A and SP-KNOW-002 defaults on 2026-07-12 |
| **G2 — Ship one procedural-choice vertical slice** | Make knowledge-derived state change a choice before the author manually wires an equivalent event/flag chain | One fixed scenario shows a choice becoming available or unavailable from Character Knowledge, with engine tests, schema validation, dashboard evidence, and no raw diagnostics in player copy | Contract A only; zero perception-event mutation; commit-associated CI must close before lifecycle `done` | `done`; AS-1 through AS-12 pass, implementation is pushed, and its commit-associated CI is green |
| **G3 — Explain consequences from engine facts** | Turn inference and policy power into an author-usable reason surface instead of hidden diagnostics; the selected explanation pattern may later supply a bounded public-facing “why this opened” surface | A read-only Choice Consequence Lens explains why a choice is available, what state changes, and what opens, with every statement traceable to deterministic facts | Policy semantics must be stable; inferred or speculative prose is prohibited; public projection must not expose internal diagnostics | `proposed / unlocked`; not started; assistant prototypes three same-content directions only after a separate EXPLORE packet, user selects the macro direction |
| **G4 — Prove the one-person authoring workflow** | Demonstrate that the primitives reduce work in a real story shape rather than only in a technical probe | One eight-node evidence-mystery starter pack completes author -> validate -> play -> save/reload -> export, with wiring count and manual exceptions recorded | Human owns creative acceptance; do not mass-produce templates before one workflow proof | `proposed`; shared ownership; assistant scaffolds and measures, user judges story usefulness |
| **G5 — Restore cross-runtime semantic parity** | Let the approved policy behavior survive Unity integration instead of becoming Web-only originality | C# model shape, rule evaluation, TS/C# fixtures, and one Unity integration sample agree on the SP-KNOW-002 semantics | Requires stable TS semantics; Unity must not independently evolve; Editor visual acceptance is separate | `hold`; separate Unity `IMPLEMENT` authority is not granted; user owns visual/public distribution decisions |
| **G6 — Mature the authoring experience around proven work** | Reorganize the tool around the real Writer / TechDesigner / Integrator loop and reduce language/visual friction | Stage-based cockpit direction, two-layer UI localization, and narrative visual grammar are each selected through low-cost evidence and delivered as bounded slices | Do not redesign around an unproven workflow; high-subjectivity direction needs human selection | `proposed`; shared direction, assistant implementation after explicit packets; start only after G4 reveals the actual friction |
| **G7 — Establish release readiness** | Make a reproducible build trustworthy enough for versioned consumption | Supported toolchains are pinned; production audit findings have an approved resolution/baseline; backend build and real Web Tester lint are in the standard gate; negative import/export and recurring parity checks are enforced | Dependency upgrades require approval and may change behavior; quality work must protect the playable path | `proposed support track`; shared approval/assistant execution; schedule as a dedicated security/toolchain slice before release claims |
| **G8 — Open conditional ecosystem paths** | Connect external writing, distribution, and status surfaces without creating a second source of truth | WritingPage gates pass before integration; public Unity/package publication is explicitly human-approved; any Project Cockpit is generated from canonical docs; Public Studio stays private until its own release gate | External format stability, publication scope, credentials, analytics, and maintenance ownership are outside current authority | `hold (conditional)`; the local Public Studio candidate does not unlock publication; user unlocks each path and the assistant implements only the approved bounded adapter or generated projection |

## Parallel Public Studio Target Ladder

This lane can gather public-demo and lightweight-editing evidence without changing the G3-G8 dependency ladder. It remains a projection of canonical JSON and shared engine behavior.

| Gate / target | Purpose and what becomes possible | Completion signal | Requirements / main risk | State, owner, next move |
|---|---|---|---|---|
| **SR0 — Restore adapter reproducibility** | Remove the clean-clone-only missing-plugin failure and checkout encoding noise before Sites receives the source | The repair ancestry and all seven LF normalizations are in `origin/main`; a fresh clone is clean before/after one isolated install and passes safety plus the full adapter test | Do not treat an ignored local file, cached clean status, or branch-only CI as main evidence; exact push/clone evidence belongs in the supervising report | `done`; runtime acceptance passed at `44656de`; the final docs-only follow-up carries no runtime or dependency change, and S1 is handed to the user |
| **S0 — Local public-studio candidate** | Put one deterministic story experience, small editor, and transfer loop into a static Japanese-first surface | Auto-start, edit/live preview, local restore, engine-valid export/import, responsive smoke, build scan, and local artifact inspection pass | Must reuse canonical sample/engine; no private data, AI configuration, transactions, analytics, or network runtime | `done locally`; assistant-owned implementation is validated; artifact is not published |
| **S1 — Private Sites compatibility** | Learn whether the adapter can be saved privately and whether the hosted runtime preserves behavior | Source import/build/Version 1 save pass is distinct from root/assets/runtime/edit/reload/export evidence | Source/save accepted with owner-only custom access; no Preview/Live URL and no deployment. Runtime behavior remains unknown until a separately authorized owner-only deployment | `adapter_partial`; source/save is done, user owns the Version 1 deploy-or-hold decision, and no external Sites action is authorized by this roadmap update |
| **S2 — Evidence-led editing improvement** | Reduce the largest observed author friction while keeping the public surface small | One local or hosted-runtime friction is named, measured, fixed, and regression-tested | Do not infer demand for node creation, graph editing, collaboration, or accounts; unknown runtime behavior is not a friction finding | `proposed`; assistant may implement only after one concrete friction is selected from review evidence |
| **S3 — Explicit public-demo decision** | Decide whether and how a reviewed candidate becomes publicly reachable and observable | Scope, owner, privacy/analytics policy, approved URL, rollback, and acceptance checks are explicitly approved before any publication | Publication, Sites-managed analytics, legal copy, brand/domain, and commercial contact are human gates; commerce remains a separate system | `hold`; user-owned release decision; no deployment or analytics work begins from S0/S1 alone |

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

# Authoring Sample Logic Audit

Scope: internal agent audit of `models/spreadsheets/authoring-sample.csv` as a compact writer-facing fixture, using the generated readback and route trace. This does not accept prose quality for production use and does not request user narrative review.

## Inputs Inspected

- `models/spreadsheets/authoring-sample.csv`
- `docs/samples/authoring-sample-readback.md`
- `docs/samples/authoring-sample-route-trace.json`
- `apps/web-tester/scripts/build-authoring-sample-readback.mjs`
- `apps/web-tester/tests/e2e/authoring-sample-csv-roundtrip.spec.js`
- `README.md`
- `HANDOVER.md`

## Route Summary

| Route | Node sequence | Ending | Audit note |
|---|---|---|---|
| `launch-proof-route` | `front_desk -> mailbox -> poster -> stage -> launch -> launch_end` | `launch_end` | Primary proof route demonstrates flags, resources, variables, gated publishing, and final proof gain. |
| `quiet-circle-route` | `front_desk -> stage -> quiet_end` | `quiet_end` | Low-proof branch keeps the publish choice hidden and reaches a soft failure ending without reading like a test shortcut. |
| `draft-anyway-route` | `front_desk -> stage -> draft_end` | `draft_end` | Low-proof branch reaches a distinct under-evidenced ending from the same stage state. |
| `partial-proof-return-route` | `front_desk -> mailbox -> stage -> quiet_end` | `quiet_end` | Traverses the reachable partial-proof return path and shows why publishing stays gated when the poster is not ready. |

## Findings

| Class | Area | Finding | Next move |
|---|---|---|---|
| pass | Route coverage | The sample has one proof-building success route, two low-proof endings, and one partial-proof return route, so the fixture demonstrates success, failure, and an optional return branch without becoming a large scenario. | Keep as the default authoring specimen. |
| pass | Condition gating | `publish_manifesto` is hidden when `poster_ready=false`, `proof<2`, or `energy<1`, then visible only after `pin_poster` and `invite_mara` establish enough state. The route trace makes the hidden choice explainable. | Preserve this as the main logic example. |
| pass | Resource causality | `energy` is consumed by `invite_mara` and now remains consequential because `publish_manifesto` also requires `energy >= 1`. | Keep the energy condition paired with the invite cost. |
| pass | State changes | `has_invite`, `poster_ready`, `proof`, `energy`, and `draft_status` all change through ordinary choices, and the readback records before/after state for each selected route step. | Keep using readback drift checks before future edits. |
| pass | Authoring clarity | Speaker fields, multiline prose, and first-row `settings.presentation` survive CSV export/re-import. The fixture demonstrates authoring-format preservation as well as playability. | Keep the sample small and inspectable. |
| pass | Shortcut feel | The low-proof stage entry is now `start_without_proof`, with player-facing text "Start the meeting without proof"; this keeps the mechanics while making the route read as story causality. | Preserve the wording unless a bounded human review requests a sharper story label. |
| pass | Partial return trace | `return_to_stage` is now covered by `partial-proof-return-route`, proving the reachable partial-proof state and hidden publish gate are represented in readback. | Keep this route in generated readback while the choice remains in the fixture. |
| defer | Presentation settings | `settings.presentation` is relevant to CSV preservation, but incidental to story logic. | Treat presentation changes as CSV/UI parity work, not story logic work. |
| defer | Prose quality | The prose is good enough to carry logic review, but this audit does not judge final narrative tone or style. | Human review can now be useful if bounded to fixture suitability, route clarity, and wording polish. |

## Fixture Adequacy Verdict

Adequate as a compact authoring fixture after the bounded fixture fix. It demonstrates a writer-readable CSV shape, a clear success path, gated publishing with flag/resource requirements, stateful effects, distinct failure endings, a traced partial-return branch, speaker and multiline preservation, and deterministic readback.

No concrete contradiction, shortcut-only route, non-consequential resource claim, or untraced reachable branch remains in the automated logic audit. This is still not a production prose acceptance; it is readiness for bounded human review of fixture suitability and route clarity.

The sample is not a stress test. It intentionally avoids broad schema coverage, AI, SaveManager, graph UI, Unity, and engine semantics. That restraint is appropriate for the current story-production-first lane.

## Recommended Next Actions

1. If the goal is human review, ask for a bounded review of fixture suitability, route clarity, and wording polish using `docs/samples/authoring-sample-readback.md` plus this audit.
2. If the goal is implementation progress, continue SP-DTYARN or broader CSV/JSON parity as separate slices.
3. If future fixture polish is requested, keep it bounded to the authoring sample fixture and regenerate the readback artifacts before review.

## Non-Goals

- No Web Tester UI redesign.
- No CSV schema change.
- No engine semantics change.
- No AI provider, SaveManager, Unity, graph UI, local LLM, or sample-browser work.
- No broad prose rewrite.

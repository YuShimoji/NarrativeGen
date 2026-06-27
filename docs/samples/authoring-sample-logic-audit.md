# Authoring Sample Logic Audit

Scope: internal agent audit of `models/spreadsheets/authoring-sample.csv` as a compact writer-facing fixture, using the generated readback and route trace. This does not accept prose quality for production use and does not request user narrative review.

## Inputs Inspected

- `models/spreadsheets/authoring-sample.csv`
- `docs/samples/authoring-sample-readback.md`
- `docs/samples/authoring-sample-route-trace.json`
- `apps/web-tester/scripts/build-authoring-sample-readback.mjs`
- `README.md`
- `HANDOVER.md`

## Route Summary

| Route | Node sequence | Ending | Audit note |
|---|---|---|---|
| `launch-proof-route` | `front_desk -> mailbox -> poster -> stage -> launch -> launch_end` | `launch_end` | Primary proof route demonstrates flags, resources, variables, gated publishing, and final proof gain. |
| `quiet-circle-route` | `front_desk -> stage -> quiet_end` | `quiet_end` | Low-proof branch keeps the publish choice hidden and reaches a soft failure ending. |
| `draft-anyway-route` | `front_desk -> stage -> draft_end` | `draft_end` | Low-proof branch reaches a distinct under-evidenced ending from the same stage state. |

## Findings

| Class | Area | Finding | Next move |
|---|---|---|---|
| pass | Route coverage | The sample has one proof-building route and two low-proof endings, so the fixture demonstrates success and failure outcomes without becoming a large scenario. | Keep as the default authoring specimen. |
| pass | Condition gating | `publish_manifesto` is hidden when `poster_ready=false` and `proof<2`, then visible after `pin_poster` supplies both prerequisites. The route trace makes the hidden choice explainable. | Preserve this as the main logic example. |
| pass | State changes | `has_invite`, `poster_ready`, `proof`, `energy`, and `draft_status` all change through ordinary choices, and the readback records before/after state for each selected route step. | Keep using readback drift checks before future edits. |
| pass | Authoring clarity | Speaker fields, multiline prose, and first-row `settings.presentation` survive CSV export/re-import. The fixture demonstrates authoring-format preservation as well as playability. | Keep the sample small and inspectable. |
| warn | Resource causality | `energy` is consumed by `invite_mara` but no later choice depends on it. This is acceptable as a resource-delta example, but it does not demonstrate resource pressure. | In a future bounded fixture slice, either make energy consequential or remove it from the sample's logic claims. |
| warn | Shortcut feel | `skip_to_stage` is useful for exposing low-proof endings, but its label can read like a test shortcut rather than story causality. | If narrative review promotes this fixture, consider a tiny wording/route fix that keeps the same mechanics. |
| warn | Untraced partial route | `return_to_stage` is reachable after `mailbox` and creates a partial-proof stage state, but the readback's selected routes do not traverse it. | Leave as acceptable optional coverage unless future audits require every choice to appear in a selected route. |
| defer | Presentation settings | `settings.presentation` is relevant to CSV preservation, but incidental to story logic. | Treat presentation changes as CSV/UI parity work, not story logic work. |
| defer | Prose quality | The prose is good enough to carry logic review, but this audit does not judge final narrative tone or style. | Human review can now be useful if bounded to fixture suitability, not broad product prose polish. |

## Fixture Adequacy Verdict

Adequate as a compact authoring fixture. It demonstrates a writer-readable CSV shape, a clear success path, gated publishing, stateful effects, distinct failure endings, speaker and multiline preservation, and deterministic readback. No concrete contradiction or unreachable required route was found, so no fixture fix is needed in this slice.

The sample is not a stress test. It intentionally avoids broad schema coverage, AI, SaveManager, graph UI, Unity, and engine semantics. That restraint is appropriate for the current story-production-first lane.

## Recommended Next Actions

1. If the goal is fixture polish, run a bounded fixture-fix slice that only addresses `energy` causality and the `skip_to_stage` wording/causality.
2. If the goal is human review, ask for a bounded review of fixture suitability and route clarity using `docs/samples/authoring-sample-readback.md` plus this audit.
3. If the goal is implementation progress, continue SP-DTYARN or broader CSV/JSON parity as separate slices.

## Non-Goals

- No Web Tester UI redesign.
- No CSV schema change.
- No engine semantics change.
- No AI provider, SaveManager, Unity, graph UI, local LLM, or sample-browser work.
- No broad prose rewrite.

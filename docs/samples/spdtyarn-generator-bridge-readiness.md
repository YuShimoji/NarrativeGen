# SP-DTYARN Generator Bridge Readiness

> Role: readiness and seam-state artifact for `NG-spdtyarn-deterministic-bridge-adapter-001`. This is not a human narrative review card and does not claim real AI/generator quality.

## Classification

- classification: `deterministic_bridge_adapter_implemented_with_multi_packet_probe`
- reason: SP-DTYARN still has a runnable `YarnFormatter` export path, and the repo now also has a separate deterministic bridge adapter that consumes `StoryContextPacket` and returns a packet-sensitive `StructuredContinuationProposal`.
- deterministic bridge specimen produced: yes, through the existing generated specimen adoption path.
- multi-packet generalization evidence produced: yes, in `docs/samples/spdtyarn-bridge-generalization-probe.md`.
- real AI/provider specimen produced: no.
- readiness artifact updated: yes.

## Path Inventory

| path | role | runnable_status | bridge relevance |
| --- | --- | --- | --- |
| `packages/engine-ts/src/spdtyarn-bridge-adapter.ts` | Deterministic packet-to-proposal adapter | runnable through engine build/tests | Consumes `StoryContextPacket` facts and emits `StructuredContinuationProposal` fields. |
| `packages/engine-ts/test/spdtyarn-bridge-adapter.spec.ts` | Focused adapter test | runnable through `npm run test -w @narrativegen/engine-ts` | Proves the adapter reads current node text/id, route, resources, variables, story pressure, and emits distinct proposals for distinct packets. |
| `docs/samples/spdtyarn-bridge-generalization-probe.md` | Multi-packet probe artifact | docs/evidence artifact | Summarizes Packet A/B, proposal A/B, differences, and remaining deterministic limits. |
| `apps/web-tester/scripts/build-generated-specimen.mjs` | Generated specimen builder | runnable through generated specimen build/check | Builds the story packet, calls the deterministic adapter, adopts the proposal, and writes review/readback artifacts. |
| `docs/samples/generated-specimen-model.json` | Adopted specimen model | generated artifact | Contains the adapter-produced node connected into the existing playable route. |
| `docs/samples/generated-specimen-route-trace.json` | Machine readback | generated artifact | Records `story_packet`, `adapter_generated`, `builder_added`, `validation_adjusted`, and `still_not_real_AI`. |
| `docs/samples/generated-specimen-readback.md` | Technical readback | generated artifact | Documents adapter path, proposal shape, ownership boundary, and route to `truth_end`. |
| `docs/samples/generated-specimen-review-ja.md` | Human review surface | generated artifact | Shows the generated specimen while keeping deterministic adapter limitations explicit. |
| `apps/web-tester/src/features/export/formatters/YarnFormatter.js` | NarrativeGen model to Yarn Spinner exporter | runnable through `npm run test -w @narrativegen/web-tester` | Can serialize the completed model after generation, but remains an exporter, not a packet-to-proposal generator. |
| `packages/engine-ts/src/ai-provider.ts` | AI/mock continuation proposal interface | runnable through engine tests | Defines `StoryContextPacket` and `StructuredContinuationProposal`; `MockAIProvider` remains separate. |

## Runnable Status

- `DeterministicSpdtyarnBridgeAdapter.generateContinuationProposal(packet)` is implemented.
- The adapter reads packet facts directly: current node id/text, route, visible/gated choices, resources, variables, story pressure, and constraints.
- The adapter returns a `StructuredContinuationProposal` with node id hint, node text, follow-up choice id/text, target id, and one `addResource evidence` effect.
- The focused adapter test now covers two packets and verifies different source node, route phrase, lead wording, target, and effect delta.
- The generated specimen builder now uses the adapter instead of `MockAIProvider` for this specimen path.
- `YarnFormatter` remains a model-to-Yarn export path only.

## Bridge Seam State

| seam | current state | effect | remaining move |
| --- | --- | --- | --- |
| input contract | `StoryContextPacket` is consumed by the deterministic adapter | Packet fields now drive proposal text and choice/effect shape | Enrich only when a future generator needs more evidence. |
| output proposal shape | Adapter emits `StructuredContinuationProposal` | Existing adoption path can serialize the proposal into a model node | Preserve this contract for real provider work. |
| runner/script | generated specimen builder calls the adapter | Build/check regenerates a playable specimen from adapter output | Add a separate bridge command only if future SP-DTYARN work needs it. |
| engine adoption | existing builder adoption remains in place | Adapter proposal reaches `truth_end` through existing route | Keep builder-added adoption choice explicit. |
| tests | focused adapter test exists | Packet -> proposal behavior is covered before real provider work | Add provider-level tests only when a real provider exists. |
| generalization probe | two distinct packets produce distinct proposals | The seam is not only a one-sample `drafting -> archive` fixture | Add more packet families only when a future provider needs comparison baselines. |

## Multi-Packet Generalization Evidence

| dimension | Packet A | Packet B |
| --- | --- | --- |
| current node | `drafting` | `balcony` |
| route | `open_notebook -> draft_scene` | `enter_tower -> question_witness -> inspect_storm_glass` |
| lead | `the clocktower bell` | `the storm glass fracture` |
| target source | explicit `preferredReturnTargetId=archive` | visible choice target fallback `observatory` |
| effect | `addResource evidence +2` because `focus > 0` | `addResource evidence +1` because `focus=0` |

## Story Packet Mapping Used By The Adapter

| story packet field | adapter use |
| --- | --- |
| `currentNode.id` / `currentNode.text` | names and grounds the generated continuation source. |
| `route.selectedChoiceIds` / `route.nodeIds` | explains how the player reached the pressure point. |
| `visibleChoices` / `gatedChoices` | records local choice context and fallback target inference. |
| `state.resources.evidence` / `state.resources.focus` | drives evidence wording and effect strength. |
| `state.variables.lead_name` | names the generated clue in text and follow-up choice. |
| `storyPressure` | explains why the continuation exists. |
| `constraints.preferredReturnTargetId` / `nonGoals` | chooses the return target and keeps limitations explicit. |

## Evidence Boundary

- `adapter_generated`: node id hint, node text, follow-up choice id hint, choice text, target id, effect, and the packet fields read to produce them.
- `builder_added`: source adoption choice from `drafting` and artifact/readback scaffolding.
- `validation_adjusted`: empty when the adapter returns the expected specimen ids and schema-valid effect.
- `still_not_real_AI`: true. This is deterministic rule-based adapter evidence, not OpenAI, local LLM, or final narrative quality evidence.

## What Not To Fake

- Do not label `YarnFormatter.format(model)` as story generation. It is model export.
- Do not claim real AI/generator quality from deterministic adapter output.
- Do not collapse `adapter_generated` and `builder_added` into one ownership bucket.
- Do not broaden into OpenAI, local LLM, CSV schema, Web Tester UI redesign, or core engine transition changes.

## Minimal Next Action

The missing packet-to-proposal seam is now closed at deterministic adapter level. The next meaningful move is not more readiness work; it is either:

1. replace or extend the deterministic adapter with a real generator provider while preserving the same packet/proposal contract, or
2. keep the adapter as a stable seam and return to narrower SP-DTYARN export gaps such as nested conditions or `[entity~]`.

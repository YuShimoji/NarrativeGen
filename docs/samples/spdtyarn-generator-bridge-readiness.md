# SP-DTYARN Generator Bridge Readiness

> Role: readiness artifact for `NG-spdtyarn-generator-bridge-001`. This is not a generated story specimen and not a human narrative review card.

## Classification

- classification: `partial_generator_path`
- reason: SP-DTYARN has a runnable `YarnFormatter` export path, but that path converts an existing model to Yarn Spinner text. It does not consume `StoryContextPacket`, does not generate a continuation proposal, and does not adopt a new node into a playable model.
- nonmock specimen produced: no
- readiness artifact produced: yes

## Path Inventory

| path | role | runnable_status | bridge relevance |
| --- | --- | --- | --- |
| `apps/web-tester/src/features/export/formatters/YarnFormatter.js` | NarrativeGen model to Yarn Spinner exporter | runnable through `npm run test -w @narrativegen/web-tester` | Can serialize a completed model after generation, but is not a generator. |
| `apps/web-tester/scripts/verify-export-formatters.mjs` | Formatter regression script | runnable; covers Yarn dynamic text cases and all-model formatter smoke | Confirms SP-DTYARN export behavior, not story-packet generation. |
| `docs/specs/dynamic-text-yarn-export.md` | SP-DTYARN scope and implementation note | docs/spec; points at `YarnFormatter` and formatter tests | Defines export conversion scope and remaining gaps. |
| `docs/specs/yarn-spinner-export.md` | Yarn Spinner export specification | docs/spec | Defines model-to-Yarn mapping and information loss. |
| `docs/specs/narrative-text-generation-pipeline.md` | Text generation SSoT | docs/spec | Explicitly treats `AIProvider.generateNextNode` as graph editing support outside runtime display synthesis. |
| `apps/web-tester/scripts/build-generated-specimen.mjs` | Current generated specimen builder | runnable through generated specimen build/check | Builds `StoryContextPacket`, but currently feeds only the mock provider. |
| `packages/engine-ts/src/ai-provider.ts` | AI/mock continuation proposal interface | runnable through engine tests | Defines `StoryContextPacket` and mock structured proposal path. |

## Runnable Status

- `YarnFormatter` is runnable and covered by `verify-export-formatters`.
- Current generated specimen path is runnable and covered by `build:generated-specimen` / `check:generated-specimen`.
- No existing nonmock or SP-DTYARN generator accepts `StoryContextPacket` and returns a `StructuredContinuationProposal`.
- No existing SP-DTYARN script generates a new node, choice, target, or effect from story packet fields.

## Missing Seam

| seam | current state | effect | minimal next move |
| --- | --- | --- | --- |
| input contract | `StoryContextPacket` exists on the mock provider path only | SP-DTYARN cannot consume story packet fields directly | Add a small adapter input type for a deterministic generator bridge, reusing packet fields instead of inventing new schema. |
| output proposal shape | `StructuredContinuationProposal` exists in `ai-provider.ts` | Yarn export does not return proposal fields | Define a nonmock deterministic proposal builder that returns node id hint, text, follow-up choice, target, and effects. |
| runner/script | generated specimen builder calls mock provider only | No separate bridge command/check exists | Add a focused bridge script only after the adapter has a real implementation. |
| engine adoption | generated specimen builder can adopt a proposal | SP-DTYARN path has no generated proposal to adopt | Reuse existing adoption only after the adapter returns a valid proposal. |
| tests | formatter and mock provider tests exist | No test proves story packet -> nonmock proposal | Add a focused unit/script check for the adapter before producing a specimen. |

## Story Packet Mapping For Future Bridge

| story packet field | future generator use | current runnable owner |
| --- | --- | --- |
| `currentNode.id` / `currentNode.text` | seed node text and generated node identity hints | generated specimen builder |
| `route.selectedChoiceIds` / `route.nodeIds` | summarize how the player reached the pressure point | generated specimen builder |
| `visibleChoices` | avoid duplicating existing local choices | generated specimen builder |
| `gatedChoices` | identify proof or requirement gaps | generated specimen builder |
| `state.flags/resources/variables` | choose state-aware effect and wording | engine session state |
| `storyPressure` | explain why the continuation exists | generated specimen builder |
| `constraints.nonGoals` / `validationRequirements` | prevent false claims and preserve playability | generated specimen builder |

## What Not To Fake

- Do not label `YarnFormatter.format(model)` as story generation. It is model export.
- Do not claim SP-DTYARN generated a node unless a runnable adapter produced a proposal from packet fields.
- Do not use mock output as nonmock generator evidence.
- Do not broaden into OpenAI, local LLM, CSV schema, Web Tester UI redesign, or core engine transition changes.

## Minimal Next Action

Implement a small deterministic bridge adapter, separate from `YarnFormatter`, that consumes `StoryContextPacket` and returns `StructuredContinuationProposal`. The first useful acceptance check should prove:

1. packet facts are read directly,
2. the proposal shape matches the existing generated specimen adoption path,
3. the adopted model remains playable to `truth_end`,
4. the review/readback surfaces identify adapter-generated versus builder-added fields.

Only after that adapter exists should the repo produce `docs/samples/spdtyarn-generated-specimen-*` artifacts.

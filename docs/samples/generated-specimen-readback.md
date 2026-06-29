# Generated Specimen Readback

> Role: detailed technical trace for the generated specimen. For human narrative review, start with `docs/samples/generated-specimen-review-ja.md`.

## Generator Path

- Source model: `models/examples/vertical-slice.json`
- Generator: `createAIProvider({ provider: "mock" }).generateContinuationProposal(...)`
- Compatibility path: `generateNextNode(...)` still returns the proposal text only.
- Source node: `drafting` after `open_notebook -> draft_scene`
- Generated node: `generated_specimen_continuation`
- Active artifact: `docs/samples/generated-specimen-model.json`

## Story Packet Summary

- Current node: `drafting`
- Route so far: `open_notebook` -> `draft_scene`
- Visible choices: `use_mock_ai`, `cut_short`
- Gated choices: none
- Resources: {   "evidence": 1,   "focus": 1 }
- Story pressure: Turn the drafted scene into a proof-bearing clue that can reconnect to the archive route.
- Non-goals: Do not claim real AI quality from mock output. / Do not redesign schema, CSV, Web Tester UI, or engine transition semantics.

## Generated Text

> Mock continuation: after open_notebook -> draft_scene, the clocktower bell stops being a loose note in drafting and becomes a reachable clue. The packet shows evidence=1 and gated choices none, so a lantern under the archive stairs turns the pressure "Turn the drafted scene into a proof-bearing clue that can reconnect to the archive route." into a ledger test. It is still marked as mock prose so the generated node can be reviewed before a writer polishes it.

## Structured Proposal

- Node id hint: `generated_specimen_continuation`
- Follow-up choice id hint: `connect_generated_specimen_archive`
- Follow-up target: `archive`
- Follow-up effects: add resource evidence +2

Ownership boundary:

```json
{
  "builder_added": [
    {
      "field": "source_adoption_choice",
      "value": {
        "effects": [
          {
            "key": "ai_draft_adopted",
            "type": "setFlag",
            "value": true
          },
          {
            "key": "draft_status",
            "type": "setVariable",
            "value": "generated specimen adopted"
          }
        ],
        "id": "adopt_generated_specimen",
        "target": "generated_specimen_continuation",
        "text": "Adopt the generated specimen"
      }
    },
    {
      "field": "artifact_serialization_and_readback",
      "value": [
        "docs/samples/generated-specimen-model.json",
        "docs/samples/generated-specimen-route-trace.json",
        "docs/samples/generated-specimen-readback.md",
        "docs/samples/generated-specimen-review-ja.md"
      ]
    }
  ],
  "generator_provided": {
    "fields": [
      "storyPacket.currentNode",
      "storyPacket.route",
      "storyPacket.state.resources.evidence",
      "storyPacket.gatedChoices",
      "storyPacket.storyPressure",
      "storyPacket.constraints",
      "nodeIdHint",
      "text",
      "followUpChoice.idHint",
      "followUpChoice.text",
      "followUpChoice.targetId",
      "followUpChoice.effects"
    ],
    "follow_up_choice": {
      "effects": [
        {
          "delta": 2,
          "key": "evidence",
          "type": "addResource"
        }
      ],
      "idHint": "connect_generated_specimen_archive",
      "targetId": "archive",
      "text": "Test the clocktower bell against the archive ledger"
    },
    "node_id_hint": "generated_specimen_continuation",
    "text": "Mock continuation: after open_notebook -> draft_scene, the clocktower bell stops being a loose note in drafting and becomes a reachable clue. The packet shows evidence=1 and gated choices none, so a lantern under the archive stairs turns the pressure \"Turn the drafted scene into a proof-bearing clue that can reconnect to the archive route.\" into a ledger test. It is still marked as mock prose so the generated node can be reviewed before a writer polishes it."
  },
  "validation_adjusted": []
}
```

## Structure Summary

- The generated node is adopted from `drafting` through `adopt_generated_specimen`.
- The generated node connects back to the existing `archive` route through the provider-proposed `connect_generated_specimen_archive` follow-up choice.
- The provider-proposed follow-up effect adds evidence so the existing proof gate can be tested.
- The route then reuses existing proof logic: archive decode, reveal, and proof ending.

## Detailed Route Trace

- Choice IDs: `open_notebook` -> `draft_scene` -> `adopt_generated_specimen` -> `connect_generated_specimen_archive` -> `decode_ledger` -> `publish_with_proof`
- Node sequence: `desk` -> `notebook` -> `drafting` -> `generated_specimen_continuation` -> `archive` -> `reveal` -> `truth_end`
- Ending: `truth_end`

Ending text:

> Ending: the story runs with receipts. By dawn, readers can play the path from hook to proof and reload the save without losing the thread.

1. `desk` (no speaker)

> Midnight is close. Your editor needs a playable short story, not another planning board.
>
> Focus: 2 | Evidence: 0
> Lead: the missing bell

   - Visible choices: `open_notebook` "Open the old notebook" -> `notebook` [effects: set flag found_hook=true; add resource evidence +1; set variable lead_name=the clocktower bell]; `listen_alley` "Listen to the alley outside" -> `alley` [effects: add resource focus -1; set variable lead_name=the rain signal]
   - Gated choices: none
   - Selected: `open_notebook` "Open the old notebook" -> `notebook` [effects: set flag found_hook=true; add resource evidence +1; set variable lead_name=the clocktower bell]
   - State changes: flags.found_hook: false -> true; resources.evidence: 0 -> 1; variables.lead_name: "the missing bell" -> "the clocktower bell"; time: 0 -> 1

2. `notebook` (no speaker)

> The notebook has one usable hook: the clocktower bell. A margin note says Mira heard it first.
>
> The story finally has a spine.

   - Visible choices: `interview_mira` "Interview Mira" -> `mira` [effects: set flag trusted_mira=true; add resource evidence +1]; `draft_scene` "Draft a brave scene" -> `drafting` [effects: add resource focus -1]
   - Gated choices: none
   - Selected: `draft_scene` "Draft a brave scene" -> `drafting` [effects: add resource focus -1]
   - State changes: resources.focus: 2 -> 1; time: 1 -> 2

3. `drafting` (no speaker)

> The scene is still thin. You can either accept a mock AI continuation into the graph or publish a fragment.
>
> Draft: unwritten
>

   - Visible choices: `use_mock_ai` "Use the mock AI continuation" -> `ai_mock_scene` [effects: set flag ai_draft_adopted=true; set variable draft_status=mock scene adopted]; `cut_short` "Cut the scene short" -> `rushed_end`; `adopt_generated_specimen` "Adopt the generated specimen" -> `generated_specimen_continuation` [effects: set flag ai_draft_adopted=true; set variable draft_status=generated specimen adopted]
   - Gated choices: none
   - Selected: `adopt_generated_specimen` "Adopt the generated specimen" -> `generated_specimen_continuation` [effects: set flag ai_draft_adopted=true; set variable draft_status=generated specimen adopted]
   - State changes: flags.ai_draft_adopted: false -> true; variables.draft_status: "unwritten" -> "generated specimen adopted"; time: 2 -> 3

4. `generated_specimen_continuation` (no speaker)

> Mock continuation: after open_notebook -> draft_scene, the clocktower bell stops being a loose note in drafting and becomes a reachable clue. The packet shows evidence=1 and gated choices none, so a lantern under the archive stairs turns the pressure "Turn the drafted scene into a proof-bearing clue that can reconnect to the archive route." into a ledger test. It is still marked as mock prose so the generated node can be reviewed before a writer polishes it.

   - Visible choices: `connect_generated_specimen_archive` "Test the clocktower bell against the archive ledger" -> `archive` [effects: add resource evidence +2]
   - Gated choices: none
   - Selected: `connect_generated_specimen_archive` "Test the clocktower bell against the archive ledger" -> `archive` [effects: add resource evidence +2]
   - State changes: resources.evidence: 1 -> 3; time: 3 -> 4

5. `archive` (no speaker)

> The archive shelves are locked by habit more than steel. Evidence: 3 | Focus: 1

   - Visible choices: `decode_ledger` "Spend focus to decode the ledger" -> `reveal` [conditions: resource evidence >= 2; resource focus >= 1] [effects: add resource focus -1]; `take_obvious_answer` "Take the obvious answer" -> `false_end`
   - Gated choices: none
   - Selected: `decode_ledger` "Spend focus to decode the ledger" -> `reveal` [conditions: resource evidence >= 2; resource focus >= 1] [effects: add resource focus -1]
   - State changes: resources.focus: 1 -> 0; time: 4 -> 5

6. `reveal` (no speaker)

> The ledger proves the clocktower bell marked the night the mayor erased the flood records.
>
> Evidence: 3
> You have enough proof to publish.

   - Visible choices: `publish_with_proof` "Publish with proof" -> `truth_end` [conditions: resource evidence >= 3]; `publish_as_rumor` "Publish as rumor" -> `false_end`
   - Gated choices: none
   - Selected: `publish_with_proof` "Publish with proof" -> `truth_end` [conditions: resource evidence >= 3]
   - State changes: time: 5 -> 6

## Assessment Snapshot

- pass: the builder passes a bounded story packet with current node, route, choices, state, pressure, and constraints.
- pass: the generator produces a structured continuation packet that reflects packet facts in text and choice wording.
- pass: the structured packet is serialized as a concrete reachable story node, not only a test assertion.
- warn: the mock remains deterministic and the source adoption choice is still builder scaffolding.
- fix: next bounded slice can add a non-mock provider adapter, enrich the packet, or integrate this path with SP-DTYARN.
- defer: OpenAI provider, local LLM, Web Tester redesign, and schema expansion are outside this specimen slice.

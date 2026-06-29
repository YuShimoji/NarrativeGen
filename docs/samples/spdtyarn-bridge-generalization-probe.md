# SP-DTYARN Bridge Generalization Probe

> Role: engineering evidence for `NG-spdtyarn-bridge-generalization-probe-001`. This is not a human story review surface and does not claim real AI/generator quality.

## Purpose

Check whether `DeterministicSpdtyarnBridgeAdapter` is only tuned to the generated specimen's `drafting -> archive -> truth_end` shape, or whether it can produce packet-sensitive deterministic proposals for distinct story packets.

## Packet A Summary

- current node: `drafting`
- route: `open_notebook -> draft_scene`
- lead: `the clocktower bell`
- resources: `evidence=0`, `focus=1`
- pressure: `make the draft produce proof before publication`
- preferred target: `archive`

## Proposal A Summary

- text names `the clocktower bell`, `drafting`, route `open_notebook -> draft_scene`, `evidence=0`, `focus=1`, and the story pressure.
- follow-up choice: `Route the clocktower bell through the archive proof check`
- target: `archive`
- effect: `addResource evidence +2`

## Packet B Summary

- current node: `balcony`
- route: `enter_tower -> question_witness -> inspect_storm_glass`
- lead: `the storm glass fracture`
- resources: `evidence=4`, `focus=0`
- pressure: `turn the alibi contradiction into a location test`
- preferred target: none
- visible target fallback: `observatory`

## Proposal B Summary

- text names `the storm glass fracture`, `balcony`, route `enter_tower -> question_witness -> inspect_storm_glass`, `evidence=4`, `focus=0`, and the story pressure.
- follow-up choice: `Route the storm glass fracture through the observatory proof check`
- target: `observatory`
- effect: `addResource evidence +1`

## Differences Proved

| dimension | Packet A proposal | Packet B proposal |
| --- | --- | --- |
| source node | `drafting` | `balcony` |
| route phrase | `open_notebook -> draft_scene` | `enter_tower -> question_witness -> inspect_storm_glass` |
| lead wording | `the clocktower bell` | `the storm glass fracture` |
| target selection | explicit `preferredReturnTargetId=archive` | inferred from visible choice target `observatory` |
| effect delta | `evidence +2` because `focus > 0` | `evidence +1` because `focus=0` |

## Traceable Packet Facts

The focused test asserts that proposal output reflects:

- `storyPacket.currentNode.id`
- `storyPacket.currentNode.text`
- `storyPacket.route.selectedChoiceIds`
- `storyPacket.visibleChoices`
- `storyPacket.state.resources.evidence`
- `storyPacket.state.resources.focus`
- `storyPacket.state.variables.lead_name`
- `storyPacket.storyPressure`

## Remaining Determinism And Limits

- The adapter still uses fixed specimen ids when the builder asks for them: `generated_specimen_continuation` and `connect_generated_specimen_archive`.
- The effect type and key remain deterministic: `addResource evidence`.
- This does not prove real AI quality, natural prose quality, or complete SP-DTYARN generation.
- It only proves the packet-to-proposal seam is not limited to one route/target/pressure sample.

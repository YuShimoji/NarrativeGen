# Authoring Sample Story Readback

## Story Brief

This fixture is a small Mara-centered community-room story about trying to make a neighborhood repair plan credible before a meeting begins. The player can gather an invite note, pin a poster, bring Mara to the stage, or begin without enough proof. The main pressure is whether the plan has enough visible evidence, remaining energy, and public readiness to justify publishing it. Player choices change the invite flag, poster readiness, proof count, energy count, and draft status before the final branch. The endings distinguish a witnessed launch, a kind but under-supported quiet circle, and a draft that still reads like an outline.

Reader note: this artifact is a story/readback bridge for understanding the CSV fixture. It is not final prose acceptance, and the detailed trace exists to make the fixture inspectable after the story meaning is clear.

## What Appears / What Changes

- Main actor: Mara, framed by a narrator in a community room just before a neighborhood repair meeting.
- Important objects and concepts: the mailbox note, the invite, the handmade poster, the stage, the launch plan, and public proof that the plan is ready.
- `has_invite`: whether the player found Mara's note and has a reason to bring the meeting forward.
- `poster_ready`: whether the visible poster has been pinned, making the plan concrete for the room.
- `proof`: how much evidence or public support the player has gathered. Publishing requires at least 2 proof before the final launch step adds one more.
- `energy`: the remaining effort available to bring Mara on stage. Publishing also requires at least 1 energy, so the resource is consequential rather than decorative.
- `draft_status`: the plan's authoring state, moving from `outline` to `poster pinned` to `ready` on the full proof route.

## Route Overview

- Launch proof route: The player gathers the invite note, pins the poster, spends energy to bring Mara on stage, and can publish because proof, poster readiness, and energy all satisfy the gate. This route demonstrates the intended success path.
- Quiet circle route: The player starts the meeting without proof and chooses a quiet circle. This route demonstrates that the story can continue warmly while the publish choice remains hidden.
- Draft anyway route: The player starts without proof and creates an under-evidenced draft. This route demonstrates a distinct low-proof ending from the same stage pressure.
- Partial proof return route: The player checks the mailbox, returns before pinning the poster, and still cannot publish. This route demonstrates that partial proof is not enough when poster readiness is missing.

## Authoring Semantics Shown By This CSV

- Speaker fields show who is speaking (`Narrator` and `Mara`) and survive export/re-import.
- Multiline prose appears in the opening node, so paragraph breaks are part of the fixture rather than a separate prose-only case.
- Initial values establish the story state before any choice: no invite, no poster, zero proof, two energy, and an outline draft.
- Effects show how choices change flags, resources, and variables: checking the mailbox sets `has_invite`, pinning the poster sets `poster_ready`, and later choices update proof, energy, and `draft_status`.
- Condition-gated choices show why publishing is not always available: `publish_manifesto` needs `poster_ready=true`, `proof >= 2`, and `energy >= 1`.
- Multiple endings show that the same compact CSV can express success, soft failure, and under-evidenced draft outcomes.
- Export/re-import preservation proves the spreadsheet form keeps the same speakers, multiline text, settings, conditions, and effects.

## Detailed Route Trace

This section renders the deterministic route trace. Use it after the brief and overview when you need exact choices, visible/gated options, effects, and state changes.

### Launch proof route (`launch-proof-route`)

Collects invite and poster proof before publishing the launch plan.

- Choice IDs: `check_mailbox` -> `pin_poster` -> `invite_mara` -> `publish_manifesto` -> `open_doors`
- Node sequence: `front_desk` -> `mailbox` -> `poster` -> `stage` -> `launch` -> `launch_end`
- Ending: `launch_end` (Mara)

Ending text:

> Ending: the launch has witnesses. The proof route shows the room why neighborhood repair can begin tonight.

1. `front_desk` (Narrator)

> The community room opens in twenty minutes.
>
> Goal: neighborhood repair
> Proof: 0

   - Visible choices: `check_mailbox` "Check the mailbox" -> `mailbox`; `start_without_proof` "Start the meeting without proof" -> `stage`
   - Gated choices: none
   - Selected: `check_mailbox` "Check the mailbox" -> `mailbox`
   - Effects applied: set flag has_invite=true; add resource proof +1
   - State changes: flags.has_invite: false -> true; resources.proof: 0 -> 1; time: 0 -> 1

2. `mailbox` (Mara)

> Mara has left a folded note: "Bring one proof, then make the room believe the rest." Invite ready: true

   - Visible choices: `pin_poster` "Pin the poster" -> `poster`; `return_to_stage` "Return to the stage" -> `stage`
   - Gated choices: none
   - Selected: `pin_poster` "Pin the poster" -> `poster`
   - Effects applied: set flag poster_ready=true; add resource proof +1; set variable draft_status=poster pinned
   - State changes: flags.poster_ready: false -> true; resources.proof: 1 -> 2; variables.draft_status: "outline" -> "poster pinned"; time: 1 -> 2

3. `poster` (Narrator)

> The poster looks handmade, but it names the exact promise: neighborhood repair. The wall now has a first witness.

   - Visible choices: `invite_mara` "Invite Mara to the stage" -> `stage`
   - Gated choices: none
   - Selected: `invite_mara` "Invite Mara to the stage" -> `stage`
   - Effects applied: add resource energy -1
   - State changes: resources.energy: 2 -> 1; time: 2 -> 3

4. `stage` (Mara)

> Mara checks the chairs, then the door. Proof: 2 | Energy: 1 The poster gives the room a first promise.

   - Visible choices: `publish_manifesto` "Publish the launch plan" -> `launch` [conditions: flag poster_ready=true; resource proof >= 2; resource energy >= 1]; `host_quiet_circle` "Host a quiet circle" -> `quiet_end`; `draft_anyway` "Draft anyway" -> `draft_end`
   - Gated choices: none
   - Selected: `publish_manifesto` "Publish the launch plan" -> `launch` [conditions: flag poster_ready=true; resource proof >= 2; resource energy >= 1]
   - Effects applied: set variable draft_status=ready
   - State changes: variables.draft_status: "poster pinned" -> "ready"; time: 3 -> 4

5. `launch` (Narrator)

> The room can feel the plan becoming public. Draft: ready

   - Visible choices: `open_doors` "Open the doors" -> `launch_end`
   - Gated choices: none
   - Selected: `open_doors` "Open the doors" -> `launch_end`
   - Effects applied: add resource proof +1
   - State changes: resources.proof: 2 -> 3; time: 4 -> 5

### Quiet circle route (`quiet-circle-route`)

Starts the meeting without proof and reaches the quiet ending.

- Choice IDs: `start_without_proof` -> `host_quiet_circle`
- Node sequence: `front_desk` -> `stage` -> `quiet_end`
- Ending: `quiet_end` (Mara)

Ending text:

> Ending: the circle is kind but quiet. People stay, yet the plan has less proof than it needs.

1. `front_desk` (Narrator)

> The community room opens in twenty minutes.
>
> Goal: neighborhood repair
> Proof: 0

   - Visible choices: `check_mailbox` "Check the mailbox" -> `mailbox`; `start_without_proof` "Start the meeting without proof" -> `stage`
   - Gated choices: none
   - Selected: `start_without_proof` "Start the meeting without proof" -> `stage`
   - Effects applied: none
   - State changes: time: 0 -> 1

2. `stage` (Mara)

> Mara checks the chairs, then the door. Proof: 0 | Energy: 2

   - Visible choices: `host_quiet_circle` "Host a quiet circle" -> `quiet_end`; `draft_anyway` "Draft anyway" -> `draft_end`
   - Gated choices: `publish_manifesto` "Publish the launch plan" -> `launch` [conditions: flag poster_ready=true; resource proof >= 2; resource energy >= 1]
   - Selected: `host_quiet_circle` "Host a quiet circle" -> `quiet_end`
   - Effects applied: none
   - State changes: time: 1 -> 2

### Draft anyway route (`draft-anyway-route`)

Starts the meeting without proof and reaches the under-evidenced draft ending.

- Choice IDs: `start_without_proof` -> `draft_anyway`
- Node sequence: `front_desk` -> `stage` -> `draft_end`
- Ending: `draft_end` (Narrator)

Ending text:

> Ending: the draft exists, but it still reads like an outline. The missing poster and proof are visible in the route.

1. `front_desk` (Narrator)

> The community room opens in twenty minutes.
>
> Goal: neighborhood repair
> Proof: 0

   - Visible choices: `check_mailbox` "Check the mailbox" -> `mailbox`; `start_without_proof` "Start the meeting without proof" -> `stage`
   - Gated choices: none
   - Selected: `start_without_proof` "Start the meeting without proof" -> `stage`
   - Effects applied: none
   - State changes: time: 0 -> 1

2. `stage` (Mara)

> Mara checks the chairs, then the door. Proof: 0 | Energy: 2

   - Visible choices: `host_quiet_circle` "Host a quiet circle" -> `quiet_end`; `draft_anyway` "Draft anyway" -> `draft_end`
   - Gated choices: `publish_manifesto` "Publish the launch plan" -> `launch` [conditions: flag poster_ready=true; resource proof >= 2; resource energy >= 1]
   - Selected: `draft_anyway` "Draft anyway" -> `draft_end`
   - Effects applied: none
   - State changes: time: 1 -> 2

### Partial proof return route (`partial-proof-return-route`)

Collects the invite proof, returns before the poster is ready, and shows why publishing stays gated.

- Choice IDs: `check_mailbox` -> `return_to_stage` -> `host_quiet_circle`
- Node sequence: `front_desk` -> `mailbox` -> `stage` -> `quiet_end`
- Ending: `quiet_end` (Mara)

Ending text:

> Ending: the circle is kind but quiet. People stay, yet the plan has less proof than it needs.

1. `front_desk` (Narrator)

> The community room opens in twenty minutes.
>
> Goal: neighborhood repair
> Proof: 0

   - Visible choices: `check_mailbox` "Check the mailbox" -> `mailbox`; `start_without_proof` "Start the meeting without proof" -> `stage`
   - Gated choices: none
   - Selected: `check_mailbox` "Check the mailbox" -> `mailbox`
   - Effects applied: set flag has_invite=true; add resource proof +1
   - State changes: flags.has_invite: false -> true; resources.proof: 0 -> 1; time: 0 -> 1

2. `mailbox` (Mara)

> Mara has left a folded note: "Bring one proof, then make the room believe the rest." Invite ready: true

   - Visible choices: `pin_poster` "Pin the poster" -> `poster`; `return_to_stage` "Return to the stage" -> `stage`
   - Gated choices: none
   - Selected: `return_to_stage` "Return to the stage" -> `stage`
   - Effects applied: none
   - State changes: time: 1 -> 2

3. `stage` (Mara)

> Mara checks the chairs, then the door. Proof: 1 | Energy: 2

   - Visible choices: `host_quiet_circle` "Host a quiet circle" -> `quiet_end`; `draft_anyway` "Draft anyway" -> `draft_end`
   - Gated choices: `publish_manifesto` "Publish the launch plan" -> `launch` [conditions: flag poster_ready=true; resource proof >= 2; resource energy >= 1]
   - Selected: `host_quiet_circle` "Host a quiet circle" -> `quiet_end`
   - Effects applied: none
   - State changes: time: 2 -> 3

## Preservation / Roundtrip Notes

- speaker fields survive export/re-import: pass
- multiline front_desk prose survives export/re-import: pass
- settings.presentation survives export/re-import: pass
- publish_manifesto conditions survive export/re-import: pass
- publish_manifesto effects survive export/re-import: pass
- pin_poster effects survive export/re-import: pass

## Model Capsule / Technical Appendix

- Fixture: `models/spreadsheets/authoring-sample.csv`
- Route trace JSON: `docs/samples/authoring-sample-route-trace.json`
- Generator: `npm run build:authoring-readback -w @narrativegen/web-tester`
- Check: `npm run check:authoring-readback -w @narrativegen/web-tester`
- Model type: `adventure-playthrough`
- Start node: `front_desk`
- Node count: 8
- Initial flags: `{"has_invite":false,"poster_ready":false}`
- Initial resources: `{"proof":0,"energy":2}`
- Initial variables: `{"theme":"neighborhood repair","draft_status":"outline"}`
- Presentation settings: `{"defaultTransition":"append-scroll","paragraphDelay":45,"transitionDuration":140}`

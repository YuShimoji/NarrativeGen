# Authoring Sample Story Readback

Fixture: `models/spreadsheets/authoring-sample.csv`
Route trace JSON: `docs/samples/authoring-sample-route-trace.json`
Generator: `npm run build:authoring-readback -w @narrativegen/web-tester`
Check: `npm run check:authoring-readback -w @narrativegen/web-tester`

## Model Capsule

- Model type: `adventure-playthrough`
- Start node: `front_desk`
- Node count: 8
- Initial flags: `{"has_invite":false,"poster_ready":false}`
- Initial resources: `{"proof":0,"energy":2}`
- Initial variables: `{"theme":"neighborhood repair","draft_status":"outline"}`
- Presentation settings: `{"defaultTransition":"append-scroll","paragraphDelay":45,"transitionDuration":140}`

## CSV Roundtrip Preservation

- speaker fields survive export/re-import: pass
- multiline front_desk prose survives export/re-import: pass
- settings.presentation survives export/re-import: pass
- publish_manifesto conditions survive export/re-import: pass
- publish_manifesto effects survive export/re-import: pass
- pin_poster effects survive export/re-import: pass

## Routes

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

   - Visible choices: `check_mailbox` "Check the mailbox" -> `mailbox`; `skip_to_stage` "Skip to the stage" -> `stage`
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

   - Visible choices: `publish_manifesto` "Publish the launch plan" -> `launch` [conditions: flag poster_ready=true; resource proof >= 2]; `host_quiet_circle` "Host a quiet circle" -> `quiet_end`; `draft_anyway` "Draft anyway" -> `draft_end`
   - Gated choices: none
   - Selected: `publish_manifesto` "Publish the launch plan" -> `launch` [conditions: flag poster_ready=true; resource proof >= 2]
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

Skips proof collection and reaches the quiet ending.

- Choice IDs: `skip_to_stage` -> `host_quiet_circle`
- Node sequence: `front_desk` -> `stage` -> `quiet_end`
- Ending: `quiet_end` (Mara)

Ending text:

> Ending: the circle is kind but quiet. People stay, yet the plan has less proof than it needs.

1. `front_desk` (Narrator)

> The community room opens in twenty minutes.
>
> Goal: neighborhood repair
> Proof: 0

   - Visible choices: `check_mailbox` "Check the mailbox" -> `mailbox`; `skip_to_stage` "Skip to the stage" -> `stage`
   - Gated choices: none
   - Selected: `skip_to_stage` "Skip to the stage" -> `stage`
   - Effects applied: none
   - State changes: time: 0 -> 1

2. `stage` (Mara)

> Mara checks the chairs, then the door. Proof: 0 | Energy: 2

   - Visible choices: `host_quiet_circle` "Host a quiet circle" -> `quiet_end`; `draft_anyway` "Draft anyway" -> `draft_end`
   - Gated choices: `publish_manifesto` "Publish the launch plan" -> `launch` [conditions: flag poster_ready=true; resource proof >= 2]
   - Selected: `host_quiet_circle` "Host a quiet circle" -> `quiet_end`
   - Effects applied: none
   - State changes: time: 1 -> 2

### Draft anyway route (`draft-anyway-route`)

Skips proof collection and reaches the under-evidenced draft ending.

- Choice IDs: `skip_to_stage` -> `draft_anyway`
- Node sequence: `front_desk` -> `stage` -> `draft_end`
- Ending: `draft_end` (Narrator)

Ending text:

> Ending: the draft exists, but it still reads like an outline. The missing poster and proof are visible in the route.

1. `front_desk` (Narrator)

> The community room opens in twenty minutes.
>
> Goal: neighborhood repair
> Proof: 0

   - Visible choices: `check_mailbox` "Check the mailbox" -> `mailbox`; `skip_to_stage` "Skip to the stage" -> `stage`
   - Gated choices: none
   - Selected: `skip_to_stage` "Skip to the stage" -> `stage`
   - Effects applied: none
   - State changes: time: 0 -> 1

2. `stage` (Mara)

> Mara checks the chairs, then the door. Proof: 0 | Energy: 2

   - Visible choices: `host_quiet_circle` "Host a quiet circle" -> `quiet_end`; `draft_anyway` "Draft anyway" -> `draft_end`
   - Gated choices: `publish_manifesto` "Publish the launch plan" -> `launch` [conditions: flag poster_ready=true; resource proof >= 2]
   - Selected: `draft_anyway` "Draft anyway" -> `draft_end`
   - Effects applied: none
   - State changes: time: 1 -> 2

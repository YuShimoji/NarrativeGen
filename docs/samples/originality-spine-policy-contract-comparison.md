# Originality Spine Policy Contract Comparison

Status: `proposed`

Normative: `no` — non-normative comparison evidence

Implementation authority: `none`

Horizon: G1 / H0 decision evidence only
Updated: 2026-07-12

## 結論

同じ Mira / `receipt_fragment` / `archive_records` シナリオで exactly two contracts を比較した結果、**Contract A — reusable pure knowledge rule による choice availability** を、未承認の `proposed` recommendation とする。

A は `getAvailableChoices()` の列挙中に `SessionState` を変更せず、知識由来の player-visible route 差を即時に作る。現行 baseline から authored wiring を 8 から 5 単位へ減らし、G2 の TypeScript / Web / schema / inference / Unity parity surface も B より小さい。

今回 G2 に推奨しない Contract B の最も強い利点は、知覚を「その checkpoint で起きた」永続・直列化可能な event として一度確定し、choice、template、text、Dashboard、readback、将来の別 consumer から共有できることにある。A の transient fact は現在の availability を説明できるが、明示的な後段 materialization なしには知覚履歴を表せない。この利点は将来要件として保持するが、現在の G2 は route availability が bottleneck であり、B の hidden mutation、lifecycle、cascade、duplicate、undo/save、cross-runtime 契約を先に導入する根拠にはしない。

この recommendation は G1 の比較証拠であり、採用決定でも実装承認でもない。H1 で user が方向を判断し、別の明示的 `IMPLEMENT` packet が出るまで G2 は開始しない。

## Evidence standard

- **verified**: repository source、model、または Git state を直接確認した事実。
- **observed**: canonical doc / readback に記録されている状態。
- **inferred**: verified な実装境界から導いた設計上の含意。本文で明示する。
- **proposed**: H0 が定義する将来 contract。現行 schema / API で動作するとは扱わない。

## 固定シナリオ

A と B は次の入力と player-visible result を変えない。

| 項目 | 固定値 |
|---|---|
| character | `mira` |
| entity | `receipt_fragment` |
| domain | `archive_records` |
| expectation | `credibility = 50` |
| actual property | `receipt_fragment.credibility = 72` |
| route meaning | Mira の書庫知識が、レシートを汎用手掛かりではなく記録上の矛盾として読ませる |
| player-visible result | `follow_semantic_change` が利用可能になり、`semantic_end` へ到達できる |
| constant authored event | `event_mira_reframes_receipt` と、その ConversationTemplate / Dynamic Text の役割を維持 |

固定値は [originality-spine-probe.json](../../models/examples/originality-spine-probe.json) の entity / character / policy (`lines 29-98`) と route (`lines 130-213`) で verified。現在の route 説明は [originality-spine-probe-readback.json](originality-spine-probe-readback.json) (`lines 5-47`) でも observed である。

## 現行 baseline

```text
desk
  -> ask_mira_reframe
     -> authored event_mira_reframes_receipt
     -> meaning_locked=false / receipt_reading update
memory_reframed
  -> node-triggered mira_receipt_contradiction_policy
     -> persistent event_mira_perceives_receipt_contradiction
  -> follow_semantic_change checks hasEvent(perception event)
semantic_end
```

区別する事実:

- `event_mira_reframes_receipt` は author が choice effect として作る narrative event。A/B の両方で不変。
- `event_mira_perceives_receipt_contradiction` は現行 v0 policy が作る persistent perception event。
- Contract A の `KnowledgeEvaluationFact` は transient read-only fact であり、Session event ではない。
- Contract B の perception event は deterministic lifecycle pass が commit する persistent fact。

## Inspected runtime facts

| Fact | Grade | Evidence / implication |
|---|---|---|
| `getAvailableChoices(session, model)` は `Choice[]` を返し、既存 conditions で filter する | verified | [session-ops.ts](../../packages/engine-ts/src/session-ops.ts) `lines 65-90`; Choice に explanation field はない ([types.ts](../../packages/engine-ts/src/types.ts) `lines 78-85`) |
| availability 列挙は SessionState を代入変更しない | verified | `session-ops.ts:76-89`; condition evaluation は read-only (`condition-effect-ops.ts:34-97`) |
| availability は global memoization cache を温める | verified | `session-ops.ts:8-16, 36-49, 65-89`; したがって A は **SessionState-pure** だが「全 global state に対して副作用ゼロ」とは呼ばない |
| current policy pass は session start と choice transition 後に動く | verified | `session-ops.ts:52-63, 121-142`; transition では effects / target 後、time increment 前 |
| current trigger は `policy.trigger.node === session.nodeId` のみ | verified | [perception-policy.ts](../../packages/engine-ts/src/perception-policy.ts) `lines 96-98`; schema も node-only (`playthrough.schema.json:367-395`) |
| current policy duplicate は existing event ID を skip する | verified | `perception-policy.ts:27-38`; 一方、一般の `createEventEntity()` は同 ID を overwrite する (`event-entity.ts:34-56`) |
| profile は exact domain、次に `general` fallback | verified | [character-knowledge.ts](../../packages/engine-ts/src/character-knowledge.ts) `lines 27-38` |
| missing profile は anomalies 空 / `noticed=false`; missing property は anomaly から除外される | verified | `character-knowledge.ts:51-78`; [anomaly-detector.ts](../../packages/engine-ts/src/anomaly-detector.ts) `lines 31-85` |
| current event diagnostics は requested domain を持つが exact/general の採用結果を持たない | verified | `perception-policy.ts:66-86` |
| Session events は engine JSON serialize と whole-session storage / history snapshot に入る | verified | `session-ops.ts:145-155`; [core/session.js](../../apps/web-tester/src/core/session.js) `lines 66-104`; [session-history.ts](../../packages/engine-ts/src/session-history.ts) `lines 7-49` |
| Web SaveManager slot は現在 events / inventory を保存しない | verified | [save-manager.js](../../apps/web-tester/src/features/save-manager.js) `lines 120-161`; B の full save/load claim は G2 でこの gap を閉じない限り成立しない |
| current choice / condition cache key は SessionState を含むが model identity / knowledge rule は含まない | verified | `session-ops.ts:12-25, 65-89`; A は model/rule-aware invalidation が必要 |
| current availability path は inference registry を使わない | verified | `session-ops.ts:1-6, 77-80`; registry builtins に knowledge condition はない ([inference/registry.ts](../../packages/engine-ts/src/inference/registry.ts) `lines 72-103`) |

## Contract A — Choice Availability First

Status: `proposed`

Mutation class: read-only / SessionState-pure
Recommended as proposed evidence: yes, pending H1 user direction

### Representative model shape

以下は contract を比較するための illustrative shape であり、現行 schema では無効。public JSON / API 名は G2 前の unresolved decision とする。

```json
{
  "knowledgeRules": {
    "mira_receipt_contradiction": {
      "character": "mira",
      "entity": "receipt_fragment",
      "domain": "archive_records",
      "expectations": { "credibility": 50 }
    }
  },
  "nodes": {
    "memory_reframed": {
      "choices": [
        {
          "id": "follow_semantic_change",
          "conditions": [
            {
              "type": "knowledgeRule",
              "rule": "mira_receipt_contradiction",
              "result": "noticed"
            }
          ]
        }
      ]
    }
  }
}
```

Direct inline knowledge condition は採用しない。selector tuple (`character` / `entity` / `domain` / `expectations`) は reusable rule に一度だけ authoring し、各 consuming choice は rule ID と期待 result だけを参照する。これにより choice が増えても selector 4項目を複写しない。

### Timing and inputs

1. `getAvailableChoices()` が current node の choices を読む。
2. `knowledgeRule` condition に達した時点で、immutable な `model` と `session` を入力として shared pure evaluator を呼ぶ。
3. evaluator は `model.characters`、`model.entities`、rule definition を読み、同じ anomaly semantics から `KnowledgeEvaluationFact` を返す。
4. condition は fact の `noticed` を判定し、choice filter が ordered `Choice[]` を返す。
5. player UI は choice text だけを受け取る。diagnostic consumer は同じ evaluator の fact を sibling explanation API または deterministic recomputation から読む。

同じ model / session / rule では同じ choice order と同じ fact が返らなければならない。

固定 scenario の knowledge fact は `model.characters.mira`、`model.entities.receipt_fragment`、rule の domain / expectations を読む。surrounding availability lookup は `session.nodeId` と既存 condition inputs を読むが、knowledge evaluator 自体は flags、resources、variables、inventory、time、eventsを書き換えず、この scenario ではそれらを知識判定入力にも使わない。

Illustrative transient fact:

```json
{
  "rule_id": "mira_receipt_contradiction",
  "result": "noticed",
  "requested_domain": "archive_records",
  "matched_domain": "archive_records",
  "profile_match": "exact",
  "character": "mira",
  "entity": "receipt_fragment",
  "anomalies": [{ "property": "credibility", "expected": 50, "actual": 72 }],
  "missing_reason": null,
  "model_revision": "<fingerprint>",
  "cache": "hit|miss|bypass"
}
```

この fact は return/readback data であり、SessionState や player copy に格納しない。

### Missing data and fallback

Runtime は fail-closed とし、choice を unavailable にして次の diagnostic reason を返す。

| Missing / invalid input | Availability | Diagnostic |
|---|---|---|
| rule | false | `rule_missing` |
| character | false | `character_missing` |
| entity | false | `entity_missing` |
| exact profile なし、general あり | evaluated | `profile_match=general`, requested / matched domain を両方保持 |
| exact / general profile ともになし | false | `profile_missing` |
| expectation key なし / 空 | false | `expectation_missing` |
| property なし / non-numeric | false | `property_missing_or_non_numeric` |

現行 `perceiveEntity()` は missing profile / property を `noticed=false` に畳むため、A の explanation contract は unavailable の理由を追加で保持する。

### Required invariant

同一 model / session に対して availability を繰り返し評価したとき:

- ordered choices と diagnostic facts は同一。
- `serialize(session)` の before / after は byte-for-byte identical。
- event create / overwrite / delete は 0。
- `time`、`nodeId`、flags、resources、variables、inventory、events は不変。
- future event materialization は choice enumeration では行わず、明示的な後段 state-changing boundary の別 contract とする。

### Cache and model-switch contract

- knowledge evaluation は現行 `conditionCache` をそのまま使わない。
- outer availability cache を使う場合、key は SessionState に加えて model identity/revision と knowledge rule fingerprint を含める。
- model switch、draft edit、rule edit は cache clear または revision change を必須とする。
- diagnostic は `model_revision` / `rule_id` / `cache=hit|miss|bypass` を readback に出せる。

### Inference / diagnostics / Unity impact

- `getAvailableChoices()` は current inference registry を通らないため、G2 は `Condition` / schema / direct evaluator を追加するだけでなく、What-if / impact analysis 用 registry evaluator も同じ pure helper に接続する。
- registry `EvaluationContext` には現在 model/entities/characters がないため、read-only knowledge context を型付きで拡張する必要がある。
- Dashboard/readback fact は `rule_id`、requested / matched domain、exact/general/none、noticed、anomaly/property facts、missing reason、model/rule cache factsを持つ。
- C# は同じ reusable rule、fail-closed semantics、fallback diagnostic、choice condition を実装する。persistent event lifecycle の移植は G2 A には不要。

## Contract B — Broader Deterministic Event Generation

Status: `proposed`

Mutation class: explicit lifecycle commit
Recommended: no for G2; strongest benefit retained

### Representative model shape

以下も illustrative で現行 schema では無効。engine-owned checkpoints を全 policy へ重複記述せず、`trigger.when` だけを authoring する。

```json
{
  "perceptionPolicies": [
    {
      "id": "mira_receipt_contradiction_policy",
      "trigger": {
        "when": {
          "type": "hasEvent",
          "key": "event_mira_reframes_receipt",
          "value": true
        }
      },
      "character": "mira",
      "entity": "receipt_fragment",
      "domain": "archive_records",
      "expectations": { "credibility": 50 },
      "eventId": "event_mira_perceives_receipt_contradiction",
      "eventName": "ミラはレシートの矛盾に気づいた",
      "onlyIfNoticed": true
    }
  ]
}
```

`event_mira_reframes_receipt` による causal gate は必須。無条件 lifecycle pass では `treat_as_old_clue` route にも perception event が入り、固定 scenario を破る。

Knowledge evaluation は A と同じ fail-closed / exact-then-general semantics を使う。missing rule/character/entity/profile/property/expectation は candidate event を作らず、pass diagnostics に reason code を残す。

### Exact lifecycle checkpoints

1. **session initialization**: flags / resources / variables / inventory / time / initial events を正規化した後、SessionState を caller へ返す前。
2. **post-choice committed transition**: availability check、choice effects、target/goto validation、`time + 1` が完了した後、history/autosave/UI へ新 state を公開する前。

各 checkpoint で一度だけ次を行う。

1. candidate SessionState の immutable snapshot `S` を固定。
2. 全 policies を `S` に対して評価。same-pass candidate events は別 policy の入力にしない。
3. candidates を `(policy.id, eventId)` で stable sort。
4. existing event IDs と candidate duplicates を判定。
5. accepted events を一度に clone-and-commit し `S'` を返す。

fixpoint は行わず、same-pass cascade は禁止。1 checkpoint = 1 bounded pass で終了する。新 event は次の checkpoint または commit 後の `getAvailableChoices()` からのみ観測できる。

### Stable ID, duplicate, lifetime

- stable ID は explicit `eventId`、省略時は `event_perception_${policy.id}`。character/entity だけの current default は policy collision を避けられないため採用しない。
- snapshot に ID が既にあれば `skip_existing`。overwrite / merge / refresh はしない。
- same-pass collision は stable order の最初だけを採用し、後続を `skip_same_pass_duplicate` として診断する。model integrity check は duplicate explicit IDs を error にする。
- event lifetime は current SessionState lifetime。session reset / model switch で破棄し、自動 expiry / delete は行わない。
- event metadata は `policy_source`、checkpoint、`derived_at_time`、trigger fact、requested/matched domain、duplicate disposition を diagnostic surface に保持する。

### Serialization, history, UI ordering

- committed event は SessionState の一部なので engine `serialize/deserialize` と whole-session storage に残る。
- caller は transition 前 state を history に push する。undo は event commit 前へ戻り、同じ choice replay で event を再導出する。
- Web SaveManager slot は current schema で events/inventory を落とすため、B を実装する場合は slot save/load contract も同じ G2 slice で修正しなければ「save/reload で残る」と主張できない。
- lifecycle pass は state を UI へ返す前に完了するため、`getAvailableChoices()` は committed event を `hasEvent` で読み、UI call order に依存しない。

### Cache / inference / Unity impact

- committed event は current SessionState cache key に含まれるため availability cache を自然に分離する。
- model/policy edit 後も同 ID event は refresh されない。model switch は new session + cache clear、in-place policy edit は session restart または explicit migration を必要とする。
- choice は既存 `hasEvent` semantics を維持できるが、lifecycle policy evaluator / snapshot commit / diagnostics は inference registry とは別の runtime service になる。
- schema migration は `trigger` を backward-compatible tagged union (`{ node }` または `{ when }`) として追加し、既存 node-triggered v0 を再解釈しない。現行 model は自動 migration なしで同じ挙動を保つ。
- C# は checkpoint order、snapshot semantics、stable ID、duplicate skip、event metadata、serialization/historyをすべて parity 実装する必要があり、A より広い。

## Player copy and diagnostic separation

| Surface | Allowed | Prohibited |
|---|---|---|
| Player story / choice | 自然な Story text と choice text、物語上必要な結果 | rule/policy ID、cache hit、fallback enum、trigger/checkpoint token、raw anomaly score |
| Dashboard / readback | rule/policy ID、requested/matched domain、exact/general/none、noticed/anomaly facts、missing reason、trigger/checkpoint、duplicate disposition、model/rule cache fact | player-facing proseであるという扱い |

現行 review も raw `perceptionPolicy` / trigger / noticed tokens を player copy から分離している ([originality-spine-probe-review-ja.md](originality-spine-probe-review-ja.md) `lines 3-13, 42-48`)。A/B ともこの境界を維持する。

## Authoring wiring count

### Counting method

JSON line 数ではなく、author が model に置く distinct occurrences を数える。固定 target node refs、prose/readback 内 ID は除外する。

1. distinct knowledge rule / policy objects
2. authored node / lifecycle trigger references
3. event ID declarations (`createEvent.id` または policy `eventId`)
4. event ID cross-references（choice/template `hasEvent`、Dynamic Text `[event.property]`、B trigger predicate）
5. `nodes.*.choices[].conditions` objects
6. selector tuple (`character` / `entity` / `domain` / `expectations`) の二つ目以降への duplicated field declarations

ConversationTemplate の session condition は event cross-reference として数え、choice condition へ二重計上しない。selector tuple の最初の authoring は rule/policy object に含め、canonical character/entity definitionsの重複とは数えない。

### Results

| Shape | knowledge objects | node/lifecycle refs | event declarations | event cross-refs | choice conditions | duplicated selector fields | Total | Delta vs current |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Current implemented v0 | 1 | 1 | 2 | 3 | 1 | 0 | **8** | — |
| Contract A reusable rule | 1 | 0 | 1 | 2 | 1 | 0 | **5** | **-3 / -37.5%** |
| Contract B engine-owned checkpoints | 1 | 0 | 2 | 4 | 1 | 0 | **8** | **0** |

Current event occurrences:

- `event_mira_reframes_receipt`: declaration 1、cross-reference 2（ConversationTemplate / Dynamic Text）。
- `event_mira_perceives_receipt_contradiction`: declaration 1、cross-reference 1（choice `hasEvent`）。

A の condition 内 rule-ID reference は prompt-required units に含まれない。補助単位として +1 しても A=6、current/B より -2。B の lifecycle が model-authored selector なら B=9、二 checkpoints を各 policy に記述するなら B=10。したがって A recommendation は counting sensitivity に対して変わらない。

Inline A は単一 choice なら一見さらに少ないが、consumer choice ごとに selector 4 fields を複写するため、define-once North Star と将来の配線量に反する。

## Comparison matrix

| Axis | Contract A | Contract B |
|---|---|---|
| player-visible signal | choice enumeration で即時 | committed event を choice が読む |
| Session mutation | none | checkpoint で event commit |
| timing surface | `getAvailableChoices` condition evaluation | start + post-choice committed transition |
| idempotency | same inputs -> same choices/facts; SessionState identical | stable ID + snapshot pass + skip existing |
| duplicate complexity | reusable rule ref; no knowledge event | existing / same-pass collision rulesが必要 |
| event lifetime | N/A; transient fact | SessionState lifetime |
| save/undo impact | none beyond current choice state | event serialization/history/SaveManager contractが必要 |
| cache impact | model/rule-aware cache keyが必要 | committed event changes Session key; policy edit migrationが必要 |
| diagnostics | sibling/recomputed read-only fact | committed metadata + pass trace |
| schema/API impact | new reusable rule + condition + explanation path | generalized trigger + lifecycle service + event metadata |
| inference impact | direct evaluator と registry を shared helper へ接続 | choice remains `hasEvent`; policy pass is separate service |
| Unity parity | pure rule + choice condition | checkpoint order + event lifecycle + serialization/history |
| authored wiring | 5 primary units | 8 primary units |
| strongest fit | current route availability bottleneck | durable historical perception shared by many consumers |

## Testable contract invariants

### A

- same model/session/rule を N 回評価して ordered choices / facts が同一。
- serialized SessionState before/after が byte-for-byte identical。
- missing inputs は fail-closed で reason code が安定。
- exact / general fallback が同じ fact schema で識別可能。
- model/rule revision change 後に stale availability cache を返さない。
- Dashboard/readback fact と choice decision が同じ pure helper から導出される。

### B

- each checkpoint は immutable snapshot に対する一回の bounded pass。
- same-pass cascade は 0、処理回数は policy count で上限が決まる。
- same snapshot と existing events から同じ committed event set / duplicate diagnostics を返す。
- existing event は overwrite / merge / refresh されない。
- commit 後の availability は UI call order に依存しない。
- undo/replay、engine serialize/reload、Web slot save/reloadで event presence が定義どおり一致する。

## Remaining G2 direction decisions

G2 前に決める項目は次の 3 件に限定する。

1. **Direction**: Contract A recommendation を accept するか、reject して G1 を再探索するか。reject は Contract B の自動採用を意味しない。
2. **Public / diagnostic surface**: reusable rule、choice condition、explanation API の public JSON・TypeScript 名と、current `getAvailableChoices(): Choice[]` を保つ diagnostic delivery（sibling API または Dashboard deterministic recomputation）を一つのAPI surface判断として固定する。
3. **Fixture / spec identity**: G0 の未完了 v0 human baseline を保護するため、G2 が current originality probe を進化させるか別 fixture を追加するかを決め、新 spec ID の要否も同じ判断に含める。

## Proposed G2 IMPLEMENT packet outline — data only

Implementation authority: `none`

- **Outcome**: same Mira scenario で reusable knowledge rule が `follow_semantic_change` の availability を SessionState mutation なしに決め、player copy と explanation fact が分離される。
- **Why now**: H0 比較では A が current/B より authored wiring と lifecycle surface を減らし、現在の route bottleneck を直接閉じる。
- **Anchors**: `docs/INVARIANTS.md`; SP-KNOW-001 implemented v0; this comparison; originality probe / readback / review; TS-as-SDK-source boundary。
- **Scope**: proposed rule/condition schema、shared pure evaluator、direct availability path、inference parity、model-aware cache invalidation、Dashboard/readback explanation、same-scenario fixture、TS/Web tests、canonical docs sync。
- **Non-goals**: persistent perception event materialization、B lifecycle service、Story prose rewrite、broad UI redesign、Unity implementation/publication、WritingPage、provider/API/auth/payment、dependencies/security/toolchain work。
- **Success signals**: A invariants pass; wiring count stays at 5 primary units (or documented equivalent); missing/fallback diagnostics are stable; player copy has no raw diagnostics; model switch cannot return stale choice; G0 review debt remains separate。
- **Validation budget**: schema/model integrity; focused engine condition/cache tests; current originality route regression; focused Web/Dashboard E2E; model sync; relevant build; C# parity is a separately approved later slice。
- **Hard stops**: invariant conflict、irreversible public schema/API decision without H1 direction、TS/C# semantic divergence、new dependency、human creative choice entering technical contract。
- **Closeout**: owning spec/index if lifecycle changes、roadmap/HANDOVER、review/readback、focused evidence、explicit-path commit/push、remote parity。

## Authority boundary

- SP-KNOW-001 の node-triggered v0 `done` scope は変わらない。
- A/B は現行 schema、runtime、canonical model に未実装。
- G1 status は `proposed`、implementation authority は `none`。
- G0 human review は docs validation や automation で完了扱いにしない。
- decision log、spec-index、product source、schema、model、test、Unity、dependency はこの H0 で変更しない。

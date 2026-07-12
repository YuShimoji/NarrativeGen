# SP-KNOW-002: Knowledge-Derived Choice Availability

**Status**: done | **Pct**: 100 | **Cat**: core

Normative for: G2 TypeScript / Web knowledge-derived choice availability

Updated: 2026-07-13

## Purpose

Character Knowledge の anomaly semantics を reusable rule としてモデルに置き、
`getAvailableChoices(session, model): Choice[]` の返す選択肢を
`SessionState` mutation なしに変える。

この仕様は、2026-07-12 に user が
[Contract A](../samples/originality-spine-policy-contract-comparison.md) を採用し、
JSON / TypeScript / diagnostic / fixture defaults を承認した結果を所有する。

Responsibility boundaries:

- [SP-KNOW-001](character-knowledge.md) は node-triggered
  `PerceptionPolicy` が persistent perception event を作る v0 を所有し、`done` のまま。
- SP-KNOW-002 は pure choice availability を所有し、knowledge-derived event を作らない。
- Contract B の broader deterministic event generation は将来契約であり、本仕様には含めない。
- Unity / C# parity と Choice Consequence Lens は別スライスであり、本仕様の完了条件ではない。

## Approved Model Contract

Dictionary key が canonical rule ID である optional top-level
`knowledgeRules` を追加する。

```typescript
interface KnowledgeRule {
  character: string
  entity: string
  domain: string
  expectations: Record<string, number>
}

interface Model {
  knowledgeRules?: Record<string, KnowledgeRule>
}
```

Choice condition は次の shape のみを追加する。

```typescript
type KnowledgeRuleCondition = {
  type: 'knowledgeRule'
  rule: string
  result: 'noticed'
}
```

`not noticed` は新しい result enum を追加せず、既存の recursive `not`
condition で表す。`knowledgeRules` を持たない既存モデルは後方互換である。

## Public TypeScript Contract

Node.js と browser entry point は同じ pure evaluator と diagnostic types を
export する。

```typescript
type KnowledgeProfileMatch = 'exact' | 'general' | 'none'

type KnowledgeRuleMissingReason =
  | 'rule_missing'
  | 'character_missing'
  | 'entity_missing'
  | 'profile_missing'
  | 'expectation_missing'
  | 'property_missing_or_non_numeric'

interface KnowledgeEvaluationFact {
  ruleId: string
  characterId?: string
  entityId?: string
  requestedDomain?: string
  matchedDomain?: string
  profileMatch: KnowledgeProfileMatch
  noticed: boolean
  anomalies: AnomalyResult[]
  totalDeviation: number
  missingReason?: KnowledgeRuleMissingReason
}

evaluateKnowledgeRule(
  session: SessionState,
  model: Model,
  ruleId: string,
): KnowledgeEvaluationFact
```

`session` は condition API と将来の cross-runtime parity のため引数に残すが、
G2 rule は session を読み書きしない。`getAvailableChoices()` の引数と返り値は
変更しない。

## Deterministic Evaluation

Missing / malformed input は次の precedence で fail closed する。

1. rule 不在 -> `rule_missing`
2. character 不在 -> `character_missing`
3. entity 不在 -> `entity_missing`
4. expectations 不在、空、object でない、または有限数でない値を含む -> `expectation_missing`
5. requested domain と `general` の双方に usable profile がない、または選択候補の domain / tolerance が malformed -> `profile_missing`
6. expected property が継承解決後も不在、または有限の numeric `defaultValue` でない -> `property_missing_or_non_numeric`
7. それ以外は既存 anomaly detector で全 expectations を評価する

Profile selection は requested domain の exact match を先に使い、なければ
`general` を使う。fact は `requestedDomain`、`matchedDomain` と
`profileMatch: exact | general | none` を分離して記録する。
Dictionary lookup は own property だけを definition として扱い、`toString` や
`constructor` のような prototype 継承名は missing precedence に従う。

Rule は、`missingReason` がなく、かつ一つ以上の anomaly が tolerance を超えて
`noticed === true` のときだけ pass する。一つの expected property が不正なら、
残りだけを部分評価せず rule 全体を fail closed にする。

## Purity And Cache Contract

`evaluateKnowledgeRule()` と choice enumeration は次を行わない。

- event の create / overwrite / merge / delete / refresh
- time increment、node transition
- flag / resource / variable / inventory mutation
- session、model、rule、character、entity、profile、expectations の mutation

同じ model/session/rule は同じ fact と ordered choices を返す。availability
evaluation 前後の serialized `SessionState` は byte-for-byte identical である。

Condition / choices cache は SessionState だけでなく、model object identity と、
少なくとも `knowledgeRules`、`characters`、`entities`、current node の serialized
semantics を key に含める。これにより別 model への切替、rule / profile /
entity property の in-place edit、current choice condition の edit は stale result を
再利用しない。`clearSessionCaches()` は明示的な全消去 API として残す。

## Inference Contract

Direct choice evaluation と inference registry の `knowledgeRule` evaluator は
同じ `evaluateKnowledgeRule()` を呼ぶ。anomaly、profile fallback、missing semantics
を registry 側へ複製しない。

`EvaluationContext` は optional `model` と `session` を持つ。どちらかがなければ
registry evaluator は false を返す。capability discovery は `knowledgeRule` を
supported condition として報告する。

現在の dependency graph は mutable session key の依存だけを表す。
`knowledgeRule` の `getDependencies()` は空集合を返し、character / entity /
rule の model-only dependency や richer What-if provenance を実装済みとは扱わない。

## Schema And Integrity

Canonical JSON Schema は次を保証する。

- top-level `knowledgeRules` は optional dictionary
- rule value は approved four fields を required とし `additionalProperties: false`
- `expectations` は一つ以上の numeric property を必要とする
- condition は exact `type/rule/result` shape で `additionalProperties: false`
- `and` / `or` / `not` 内でも同じ condition reference を再帰利用できる

`assertModelIntegrity()` は次を検証する。

- 各 rule の character と entity が存在する
- choice conditions と ConversationTemplate `sessionConditions` の
  recursive `and` / `or` / `not` 内を含め、全 `knowledgeRule` reference が解決する

Schema を通さない in-memory call に対しては public evaluator の stable
`missingReason` が runtime guard になる。

## Web Tester / Dashboard Boundary

Designer Dashboard の既存 `NarrativeGen独自プリミティブ` panel は、日本語を
第一表示にして次を示す。

- rule definition count と current-node use count
- rule ID と noticed result
- requested / matched domain
- profile match
- missing reason
- available choice への attribution
- policy-derived event count と
  `event_mira_perceives_receipt_contradiction` の absence/presence

Dashboard は current node の recursive choice conditions を読み、engine の
`getAvailableChoices()` と同じ public evaluator を呼ぶ read-only surface である。
Story copy には rule ID、domain token、profile match、missing reason、raw anomaly、
cache detail を表示しない。

## Fixed G2 Probe

Canonical fixture は
`models/examples/procedural-choice-spine-probe.json`。G0 baseline の
`models/examples/originality-spine-probe.json` は置換・意味変更しない。

G2 route:

```text
desk
  -> ask_mira_reframe
memory_reframed
  -> follow_semantic_change
semantic_end
```

The fixture preserves Mira、`receipt_fragment`、`archive_records`、expected
`credibility = 50`、actual 72、`event_mira_reframes_receipt`、ConversationTemplate、
Dynamic Text、`treat_as_old_clue`。`follow_semantic_change` は
`mira_receipt_contradiction` knowledge rule で開く。

`event_mira_reframes_receipt` は既存の player action event として残るが、
knowledge-derived `event_mira_perceives_receipt_contradiction` は model に存在せず、
choice enumeration 前後にも生成されない。この区別は「全 event がない」ではなく、
Contract B 型の perception event materialization がないことを意味する。

## Evidence And Completion Gate

Required evidence:

- exact / general / all missing-reason cases と multi-expectation fail-closed test
- repeated evaluator / ordered choices equality
- serialized SessionState invariance と zero knowledge-derived event mutation
- positive / negative availability と nested integrity validation
- model switch と rule / character / entity edit の stale-cache prevention
- direct evaluator / inference registry parity と capability reporting
- procedural probe route、old originality probe regression、sample-switch isolation
- Japanese-first Dashboard facts と raw diagnostic-free Story copy
- schema/model validation、focused browser evidence、build、safety、Git/CI follow-through

全 acceptance evidence と implementation commit に紐づく CI の成功を
2026-07-13 closeout で確認したため、lifecycle は `done / 100`。以後この
contract を変更する場合は同じ purity、cache、old/new probe regression、CI gateを再確認する。

## Deferred Boundaries

- Contract B persistent knowledge-event generation
- generalized lifecycle checkpoints / cascades / duplicate / lifetime service
- Unity / C# implementation and visual acceptance
- G3 Choice Consequence Lens
- broad UI or Story rewrite
- dependency、security/toolchain、WritingPage、provider/API/auth/payment、publication

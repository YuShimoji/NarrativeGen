# SP-KNOW-001: Character Knowledge Model

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

キャラクターごとの知識プロファイルを定義し、Entity プロパティの認識精度を制御する。anomaly-detector と接続して「キャラクターがある Entity をどう知覚するか」をシミュレートする。

## データモデル

### CharacterDef

```typescript
interface CharacterDef {
  id: string
  name: string
  knowledgeProfiles: KnowledgeProfile[]
}
```

### PerceptionResult

```typescript
interface PerceptionResult {
  characterId: string
  entityId: string
  anomalies: AnomalyResult[]
  totalDeviation: number
  noticed: boolean
}
```

### PerceptionPolicy

`PerceptionPolicy` is a narrow model-level hook for route-safe perception. It
does not replace `perceiveEntity`; it declares when route context should run a
character's knowledge profile and materialize the resulting perception event.
The v0 trigger shape is intentionally small:

```typescript
interface PerceptionPolicy {
  id: string
  trigger: { node: string }
  character: string
  entity: string
  domain: string
  expectations: Record<string, number>
  eventId?: string
  eventName?: string
  onlyIfNoticed?: boolean
}
```

Runtime behavior: when the session reaches `trigger.node`,
`applyPerceptionPolicies()` derives the same perception event shape as
`perceiveEntity`, adds `policy_source` / `policy_trigger_node`, and skips
duplicate event creation if the policy event already exists.

### Relationship to SP-KNOW-002

The implemented node-triggered v0 contract above remains this spec's shipped
`done` scope. On 2026-07-12 the user accepted Contract A from the non-normative
[G1 policy comparison](../samples/originality-spine-policy-contract-comparison.md).
The resulting reusable, SessionState-pure choice-availability contract is
owned separately by [SP-KNOW-002](knowledge-derived-choice-availability.md).

SP-KNOW-002 does not reinterpret this `PerceptionPolicy`, does not generate a
knowledge-derived perception event during choice enumeration, and does not
complete Unity parity. Future Contract B event materialization remains a third,
deferred lifecycle concern rather than an extension silently folded into
SP-KNOW-001 or SP-KNOW-002.

## API

```typescript
findKnowledgeProfile(character, domain): KnowledgeProfile | undefined
perceiveEntity(character, entityId, expectations, domain, entities): PerceptionResult
applyPerceptionPolicies(session, model): SessionState
```

### findKnowledgeProfile

1. `domain` に完全一致するプロファイルを探す
2. なければ `domain === 'general'` をフォールバック
3. それもなければ undefined

### perceiveEntity

1. findKnowledgeProfile でプロファイルを取得
2. detectAllAnomalies で期待値と実値を比較
3. 全 anomaly の deviation を合算して totalDeviation を算出
4. いずれかの anomaly が `anomalous` なら `noticed = true`

## 使用例

```typescript
const detective: CharacterDef = {
  id: 'detective_a', name: 'Detective A',
  knowledgeProfiles: [
    { domain: 'modern_products', accuracy: 0.9, tolerance: 0.1 },
    { domain: 'general', accuracy: 0.5, tolerance: 0.2 },
  ],
}

const result = perceiveEntity(detective, 'cheeseburger',
  { weight: 200 }, 'modern_products', model.entities)
// result.noticed = true (250 is outside 200 ±10%)
```

## 依存

- SP-ANOMALY-001: detectAllAnomalies, KnowledgeProfile
- SP-PROP-001: resolveProperty (via anomaly-detector)
- SP-KNOW-002: reusable pure knowledge rule and choice availability (separate contract)

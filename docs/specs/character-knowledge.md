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

## API

```typescript
findKnowledgeProfile(character, domain): KnowledgeProfile | undefined
perceiveEntity(character, entityId, expectations, domain, entities): PerceptionResult
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

# SP-ANOMALY-001: Property Anomaly Detection

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

キャラクターの知識モデル (期待値 + 許容範囲) と Entity の実プロパティ値を比較し、違和感スコアを算出する。原初ビジョン (ORIGINAL_DESIGN_PHILOSOPHY.md 5.1) の実装。

## データモデル

### KnowledgeProfile

キャラクターが持つ特定ドメインの知識精度。

```typescript
interface KnowledgeProfile {
  domain: string      // 知識ドメイン (例: 'modern_products', 'food_items')
  accuracy: number    // 精度 0-1 (0.9 = 90%正確な期待値を持つ)
  tolerance: number   // 許容範囲 0-1 (0.05 = ±5%以内は正常とみなす)
}
```

### AnomalyResult

検出結果。

```typescript
interface AnomalyResult {
  entityId: string
  propertyKey: string
  expectedValue: number
  actualValue: number
  toleranceRange: [number, number]  // [min, max] の許容範囲
  deviation: number                  // 逸脱度 (0=完全一致, 1=許容境界, >1=違和感)
  anomalous: boolean                 // deviation > 1
}
```

## API

```typescript
function detectAnomaly(
  entityId: string,
  propertyKey: string,
  expectedValue: number,
  knowledge: KnowledgeProfile,
  entities: Record<string, EntityDef>
): AnomalyResult | null

function detectAllAnomalies(
  entityId: string,
  expectations: Record<string, number>,
  knowledge: KnowledgeProfile,
  entities: Record<string, EntityDef>
): AnomalyResult[]
```

## 計算ロジック

1. `resolveProperty(entityId, propertyKey, entities)` で実際値を取得
2. 許容範囲: `expectedValue * (1 ± tolerance)`
3. 逸脱度: `|actualValue - expectedValue| / (expectedValue * tolerance)`
4. `deviation > 1` なら `anomalous = true`

### 例

- 期待値: 250g, tolerance: 0.1 (±10%)
- 許容範囲: 225g - 275g
- 実際値: 300g → deviation = (300-250)/(250*0.1) = 2.0 → anomalous

## 依存

- SP-PROP-001 (done): resolveProperty でプロパティ値を解決

## 競合回避

- 5.2 (事象Entity動的生成) は別Worker。本モジュールは独立した `anomaly-detector.ts` として実装
- types.ts / SessionState への変更なし

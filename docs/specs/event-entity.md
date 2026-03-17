# SP-EVENT-001: Dynamic Event Entity Generation

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

プレイヤーの選択・違和感検出・ストーリー進行に応じて、新たな「事象Entity」をセッション中に動的生成する。原初ビジョン (ORIGINAL_DESIGN_PHILOSOPHY.md 5.2) の実装。

事象Entityは通常のEntityDefと同じ構造を持ち、Dynamic Text (`[event_id.property]`) や条件 (`hasEvent`) で参照可能。セッション保存・復元にも対応する。

## 依存

- SP-PROP-001 (done): EntityDef / PropertyDef 型定義
- SP-ANOMALY-001 (done): detectAnomaly → 違和感検出結果をイベント化
- SP-TEXT-001 (done): expandTemplate でイベントプロパティ参照

## 競合回避

- 4.1 (言い換え辞書拡張): paraphrase.ts 系に触れない
- 5.1 (SP-ANOMALY-001): anomaly-detector.ts は import のみ、変更しない
- types.ts への変更は最小限 (SessionState.events フィールド追加 + Effect union 拡張 + Condition union 拡張)

## データモデル

### SessionState 拡張

```typescript
interface SessionState {
  // ... existing fields ...
  events: Record<string, EntityDef>  // 動的生成された事象Entity
}
```

- `events` はデフォルト空オブジェクト `{}`
- 後方互換: 既存セッションで `events` が undefined の場合は `{}` として扱う
- serialize/deserialize に含める

### createEvent Effect

```typescript
{ type: 'createEvent'; id: string; name: string; properties?: Record<string, { defaultValue: string | number | boolean }> }
```

- `id`: イベントEntity ID (一意)。同一IDで再createした場合は上書き (最新状態を反映)
- `name`: 表示名
- `properties`: 簡略PropertyDef (defaultValue のみ必須。type は defaultValue から推論)

### hasEvent Condition

```typescript
{ type: 'hasEvent'; key: string; value: boolean }
```

- `key`: イベントEntity ID
- `value`: true = 存在する、false = 存在しない

## API

### event-entity.ts

```typescript
/**
 * Create a new event entity from an effect definition.
 * Properties are normalized to full PropertyDef format.
 */
function createEventEntity(
  effect: CreateEventEffect,
  session: SessionState
): SessionState

/**
 * Check if an event entity exists in the session.
 */
function hasEvent(
  eventId: string,
  session: SessionState
): boolean

/**
 * Convenience: create event entity from anomaly detection result.
 * Generates standardized properties from AnomalyResult.
 */
function createEventFromAnomaly(
  anomaly: AnomalyResult,
  session: SessionState,
  options?: { idPrefix?: string; extraProperties?: Record<string, { defaultValue: string | number | boolean }> }
): SessionState
```

## 統合ポイント

### template.ts 統合

`expandTemplate` が `[event_id.property]` を解決するとき:
1. まず `model.entities` から探索 (既存動作)
2. 見つからなければ `session.events` から探索 (新規)

### 推論レジストリ統合

- `createEventApplicator`: EffectApplicator として登録
- `hasEventEvaluator`: ConditionEvaluator として登録

### condition-effect-ops.ts 統合

- `evalCondition`: `hasEvent` 分岐追加
- `applyEffect`: `createEvent` 分岐追加

## テストモデル

`models/examples/event_test.json`:
- 選択肢から `createEvent` エフェクトで事象Entity生成
- `hasEvent` 条件で後続選択肢の出現を制御
- `[event_id.property]` でテキスト展開

## 設計判断

| 判断 | 選択 | 理由 |
|------|------|------|
| events の格納先 | SessionState.events | Model.entities は静的定義。動的生成はセッション側が適切 |
| 同一ID再create | 上書き | イベントの状態更新を自然に表現 (例: 怒り度の変化) |
| PropertyDef 簡略化 | defaultValue のみ必須 | Effect 記述を軽くする。type は推論可能 |
| event と entity の名前空間 | 分離 (session.events vs model.entities) | 静的定義と動的生成の混同を防ぐ。template展開時は entities → events の順で探索 |

## Web Tester GUI 統合

### condition-effect-editor.js

- **hasEvent 条件**: ドロップダウン「イベント存在」→ キー入力 (イベントID) + 値 (true/false)
- **createEvent 効果**: ドロップダウン「イベント生成」→ イベントID + イベント名
  - **プロパティエディタ**: 折りたたみ式の key=value ペアリスト
  - 各プロパティは `{ defaultValue }` として保存 (type は推論)
  - +追加/×削除ボタンで動的編集
  - 値の型自動判定: true/false → boolean, 数値 → number, その他 → string

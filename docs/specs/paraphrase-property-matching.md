# SP-PARA-002: Paraphrase Property Matching Extension

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

SP-PARA-001 (基本言い換え辞書) を拡張し、Entity-Property システム (SP-PROP-001) と連携したプロパティマッチング言い換え選択を実現する。原初ビジョン §4.2 「選択条件」の実装。

## 前提

- SP-PARA-001 (done): 基本同義語辞書 + 文体変換 + 決定的PRNG選択
- SP-PROP-001 (done): EntityDef.properties + 継承解決 (resolveProperty)
- SP-TEXT-001 (done): テンプレート展開 ([entity.property], {variable})

## 設計

### 1. ConditionalVariant 型

辞書エントリに条件付きバリアントを追加する。既存の `string[]` との後方互換を維持。

```typescript
/** 条件付き言い換えバリアント */
export interface ConditionalVariant {
  text: string
  /** プロパティ値によるマッチ条件 (key → 期待値) */
  match?: Record<string, string | number | boolean>
  /** 選択優先度 (デフォルト: 1.0) */
  weight?: number
}

/** 辞書エントリ: 文字列 (無条件) または条件付きバリアント */
export type ParaphraseEntry = string | ConditionalVariant

/** プロパティ対応辞書 */
export type PropertyAwareLexicon = Record<string, ParaphraseEntry[]>
```

後方互換: `ParaphraseLexicon` (= `Record<string, string[]>`) は `PropertyAwareLexicon` のサブセットとして扱える。`string` エントリは `{ text: string }` と等価。

### 2. ParaphraseContext

言い換え選択時にエンティティコンテキストを渡す。

```typescript
/** 言い換え選択コンテキスト */
export interface ParaphraseContext {
  /** 対象エンティティID */
  entityId?: string
  /** 解決済みプロパティ (getEntityProperties の戻り値) */
  properties?: Record<string, { defaultValue?: string | number | boolean }>
}
```

### 3. UsageHistory (使用履歴)

重複回避のための使用履歴。原初ビジョン §4.2 「使用履歴: 重複回避のための使用回数記録」。

```typescript
/** バリアント使用回数 (variant text → count) */
export type UsageHistory = Record<string, number>

export function createUsageHistory(): UsageHistory
export function recordUsage(history: UsageHistory, text: string): void
```

### 4. 選択アルゴリズム

`applySynonyms` 内の選択ロジックを拡張:

1. テキスト内のキーにマッチする辞書エントリを収集
2. 各バリアントの `match` 条件を `context.properties` に対して評価
   - `match` なし → 常に候補
   - `match` あり → 全条件が一致する場合のみ候補
3. 条件付き候補が1つ以上ある場合、条件付き候補のみから選択 (具体的条件を優先)
4. 候補内で `weight` と使用履歴スコアを組み合わせてスコアリング
   - `score = weight / (usageCount + 1)`
5. スコア最高群の中からPRNG選択 (決定論的)

### 5. ParaphraseOptions 拡張

```typescript
export interface ParaphraseOptions {
  variantCount?: number
  style?: ParaphraseStyle
  seed?: number
  lexicon?: PropertyAwareLexicon  // 既存: ParaphraseLexicon → 拡張型に変更
  context?: ParaphraseContext     // NEW: エンティティコンテキスト
  usageHistory?: UsageHistory     // NEW: 使用履歴
}
```

### 6. ヘルパー関数

```typescript
/**
 * Model と EntityDef から ParaphraseContext を構築する。
 * resolveProperty + getEntityProperties を内部で呼び出す。
 */
export function buildParaphraseContext(
  entityId: string,
  entities: Record<string, EntityDef>
): ParaphraseContext
```

## API 変更一覧

| 関数 | 変更 |
|------|------|
| `paraphraseJa` | `options.context` / `options.usageHistory` 追加 |
| `chooseParaphrase` | 同上 |
| `setParaphraseLexicon` | `PropertyAwareLexicon` 受容 (後方互換) |
| `getParaphraseLexicon` | `PropertyAwareLexicon` 返却 |
| `buildParaphraseContext` | 新規 |
| `createUsageHistory` | 新規 |
| `recordUsage` | 新規 |

## 後方互換

- 既存の `ParaphraseLexicon` (`Record<string, string[]>`) は `PropertyAwareLexicon` として有効
- `context` / `usageHistory` 未指定時は SP-PARA-001 と同一の動作
- 既存テスト (8件) はそのまま通過すること

## テスト計画

1. 条件付きバリアント: match 条件が合致するバリアントを選択する
2. 条件不一致時: 無条件バリアントにフォールバックする
3. 混在辞書: string と ConditionalVariant の混在で動作する
4. 使用履歴: 使用済みバリアントより未使用バリアントを優先する
5. 使用履歴リセット: 全バリアント使用済み時はカウントリセットで再選択
6. weight: 重み付きバリアントの選択確率が偏る
7. buildParaphraseContext: EntityDef からコンテキスト構築
8. 後方互換: 既存テスト全通過

# SP-001: Engine Core API

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

`@narrativegen/engine-ts` のコアAPI仕様。モデルの読み込み、セッション管理、選択肢の評価・適用を提供する。

## エントリポイント

| エントリ | ファイル | 用途 | fs依存 |
|----------|----------|------|--------|
| Node.js | `index.ts` | サーバー / CLI | あり (schema読み込み) |
| Browser | `browser.ts` | ブラウザ / web-tester | なし |

### Node.js エントリ (`index.ts`)

```typescript
loadModel(modelData: unknown, options?: ValidationOptions): Model
startSession(model: Model, initial?: Partial<SessionState>): SessionState
getAvailableChoices(session: SessionState, model: Model): Choice[]
applyChoice(session: SessionState, model: Model, choiceId: string): SessionState
serialize(session: SessionState): string
deserialize(payload: string): SessionState
```

- `loadModel`: Ajv で `playthrough.schema.json` に対してバリデーション + 整合性チェック (重複ID、参照整合性、循環参照)
- `startSession`: モデルの `startNode` からセッションを開始。初期 flags/resources はモデルのデフォルト + 引数で上書き
- `getAvailableChoices`: 現在ノードの選択肢のうち、条件を満たすもののみ返す (メモ化キャッシュ付き)
- `applyChoice`: 選択肢のエフェクトを適用し、ターゲットノードへ遷移。time +1
- `serialize` / `deserialize`: SessionState の JSON シリアライズ

### Browser エントリ (`browser.ts`)

Node.js エントリと同等の `startSession`, `getAvailableChoices`, `applyChoice` を提供。
schema バリデーション (`loadModel`) は含まない。

追加エクスポート:
- `chooseParaphrase`, `paraphraseJa`, `getParaphraseLexicon`, `setParaphraseLexicon` (言い換えユーティリティ)
- `createAIProvider`, `MockAIProvider`, `AIProvider`, `AIConfig`, `StoryContext`, `ParaphraseOptions` (AI 統合)

## 型定義 (`types.ts`)

### Model

```typescript
interface Model {
  modelType: string
  startNode: string
  flags?: FlagState       // Record<string, boolean>
  resources?: ResourceState // Record<string, number>
  entities?: Record<string, EntityDef>  // アイテム/アクター定義
  nodes: Record<string, NodeDef>
}
```

### NodeDef

```typescript
interface NodeDef {
  id: string
  text?: string
  choices?: Choice[]
}
```

### Choice

```typescript
interface Choice {
  id: string
  text: string
  target: string
  conditions?: Condition[]
  effects?: Effect[]
  outcome?: ChoiceOutcome | null
}
```

### SessionState

```typescript
interface SessionState {
  nodeId: string
  flags: FlagState
  resources: ResourceState
  variables: VariableState  // Record<string, string | number>
  inventory: string[]       // 所持アイテムIDリスト (ユニーク)
  time: number
}
```

## 条件 (Condition)

| type | フィールド | 評価ロジック |
|------|-----------|-------------|
| `flag` | `key`, `value: boolean` | `flags[key] === value` |
| `resource` | `key`, `op`, `value: number` | `resources[key] op value` |
| `variable` | `key`, `op`, `value` | 文字列: `==`, `!=`, `contains`, `!contains` / 数値: `>=`, `<=`, `>`, `<` |
| `hasItem` | `key`, `value: boolean` | `inventory` にアイテムが存在するか (case-insensitive) |
| `timeWindow` | `start`, `end` | `time >= start && time <= end` |
| `and` | `conditions: Condition[]` | 全条件が真 |
| `or` | `conditions: Condition[]` | いずれかの条件が真 |
| `not` | `condition: Condition` | 条件の否定 |

## エフェクト (Effect)

| type | フィールド | 適用ロジック |
|------|-----------|-------------|
| `setFlag` | `key`, `value: boolean` | `flags[key] = value` |
| `addResource` | `key`, `delta: number` | `resources[key] += delta` |
| `setVariable` | `key`, `value` | `variables[key] = value` |
| `modifyVariable` | `key`, `op: +\|-\|*\|/`, `value: number` | 数値演算。0除算はスキップ |
| `addItem` | `key: string` | `inventory` にアイテム追加 (重複時 no-op, case-insensitive) |
| `removeItem` | `key: string` | `inventory` からアイテム除去 (不在時 no-op, case-insensitive) |
| `goto` | `target: string` | `nodeId = target` (通常の target 遷移をオーバーライド) |

## バリデーション (`assertModelIntegrity`)

1. **DUPLICATE_ID**: ノードID / 選択肢IDの重複
2. **MISSING_REFERENCE**: startNode不在 / 選択肢targetの参照先不在 / gotoエフェクトの参照先不在
3. **CIRCULAR_REFERENCE**: `allowCircularReferences: false` の場合のみ検出 (DFS)

## メモ化キャッシュ (`session-ops.ts`)

- `conditionCache`: 条件評価結果をキャッシュ (上限 10,000 エントリ → 超過時クリア)
- `choicesCache`: 選択肢評価結果をキャッシュ (上限 1,000 エントリ → 超過時クリア)
- キーは SessionState + Condition の JSON.stringify

## ノードID解決 (`resolver.ts`)

グループ階層を持つノードIDの解決ルール:

| パターン | 例 | 解決先 |
|----------|---|--------|
| 絶対パス | `/a/b` | `a/b` |
| ローカルID | `next` | `currentGroup/next` |
| 相対 (./...) | `./next` | `currentGroup/next` |
| 親参照 (../...) | `../other/start` | `parentGroup/other/start` |

## テスト

- 10ファイル / 73テスト (vitest)
- engine.test.ts: 基本フロー
- validation.test.ts: バリデーション強化
- inference.test.ts: 推論システム
- basic.spec.ts: 例モデルの読み込み→プレイスルー

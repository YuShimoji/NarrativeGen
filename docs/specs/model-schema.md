# SP-SCHEMA-001: Model Schema

**Status**: done | **Pct**: 100 | **Cat**: data

## 概要

NarrativeGen のプレイスルーモデルの JSON Schema 仕様。`models/schema/playthrough.schema.json` で定義。

## スキーマ構造

### 必須フィールド

| フィールド | 型 | 説明 |
|-----------|---|------|
| `modelType` | `string` | `"adventure-playthrough"` 固定 |
| `startNode` | `string` | 開始ノードのID |
| `nodes` | `Record<string, NodeDef>` | ノード定義のマップ (キー = ノードID) |

### オプションフィールド

| フィールド | 型 | 説明 |
|-----------|---|------|
| `flags` | `Record<string, boolean>` | 初期フラグ状態 |
| `resources` | `Record<string, number>` | 初期リソース値 |
| `variables` | `Record<string, string\|number>` | 初期変数値 (startSession でマージ) |
| `entities` | `Record<string, EntityDef>` | エンティティ定義 (id, name, description, cost) |

### NodeDef

| フィールド | 必須 | 型 | 説明 |
|-----------|------|---|------|
| `id` | はい | `string` | ノード一意識別子 |
| `text` | いいえ | `string` | ノード本文 |
| `choices` | いいえ | `ChoiceDef[]` | 選択肢配列 |

### ChoiceDef

| フィールド | 必須 | 型 | 説明 |
|-----------|------|---|------|
| `id` | はい | `string` | 選択肢一意識別子 |
| `text` | はい | `string` | 選択肢テキスト |
| `target` | はい | `string` | 遷移先ノードID |
| `conditions` | いいえ | `Condition[]` | 条件配列 |
| `effects` | いいえ | `Effect[]` | 効果配列 |
| `outcome` | いいえ | `Outcome` | 選択結果 (type, value) |

### Condition 型 (10種、全て additionalProperties: false、$ref 再帰定義)

| type | 必須フィールド | 説明 |
|------|--------------|------|
| `flag` | `key: string, value: boolean` | フラグ状態判定 |
| `resource` | `key: string, op: enum, value: number` | リソース比較 (>=, <=, >, <, ==) |
| `variable` | `key: string, op: enum, value: string\|number` | 変数比較 (==, !=, contains, !contains, >=, <=, >, <) |
| `timeWindow` | `start: number, end: number` | 時間帯条件 |
| `hasItem` | `key: string, value: boolean` | インベントリ所持判定 |
| `property` | `entity: string, key: string, op: enum, value: string\|number\|boolean` | エンティティプロパティ比較 |
| `hasEvent` | `key: string, value: boolean` | イベント存在判定 |
| `and` | `conditions: Condition[]` | 全条件を満たす (論理AND) |
| `or` | `conditions: Condition[]` | いずれかの条件を満たす (論理OR) |
| `not` | `condition: Condition` | 条件の否定 (論理NOT) |

### Effect 型 (7種、全て additionalProperties: false)

| type | 必須フィールド | 説明 |
|------|--------------|------|
| `setFlag` | `key: string, value: boolean` | フラグ設定 |
| `addResource` | `key: string, delta: number` | リソース増減 |
| `setVariable` | `key: string, value: string\|number` | 変数設定 |
| `modifyVariable` | `key: string, op: enum, value: number` | 変数演算 (+, -, *, /) |
| `goto` | `target: string` | ノード遷移 |
| `addItem` | `key: string` | アイテム追加 |
| `removeItem` | `key: string` | アイテム削除 |

### EntityDef

| フィールド | 必須 | 型 | 説明 |
|-----------|------|---|------|
| `id` | はい | `string` | エンティティ一意識別子 |
| `name` | はい | `string` | 表示名 |
| `description` | いいえ | `string` | 説明文 |
| `cost` | いいえ | `number` | コスト値 |

## バリデーション層

### 1. JSON Schema バリデーション (Ajv)

`playthrough.schema.json` による構造検証:
- 必須フィールドの存在確認
- 型チェック (string, number, boolean, object, array)
- Condition/Effect の各 type に対する厳密な schema 定義 (oneOf + additionalProperties: false)
- EntityDef の構造検証 (additionalProperties: false)
- ルートの additionalProperties: false

### 2. 整合性チェック (`assertModelIntegrity`)

JSON Schema 通過後に実行されるロジカルバリデーション:
- ノードIDの一意性 (node.id === nodeKey)
- 選択肢IDの一意性 (ノード内)
- startNode の参照先存在
- 選択肢 target の参照先存在
- goto エフェクトの参照先存在
- 循環参照検出 (オプション)

## 例モデル (13件、全て検証合格)

| ファイル | ノード数 | 特徴 |
|---------|---------|------|
| `linear.json` | 8 | 単純分岐、条件なし |
| `quest.json` | 13 | flags + resources (gold/wood) |
| `trading.json` | 15 | resources + variables + modifyVariable |
| `branching_flags.json` | - | フラグ分岐 |
| `multiple_endings.json` | - | マルチエンディング |
| `resource_management.json` | - | リソース管理 |
| `time_gated.json` | - | 時間帯条件 |
| `tutorial.json` | - | チュートリアル構造 |
| `property_test.json` | - | Entity-Property 継承 + rangeMin/rangeMax |
| `event_test.json` | - | createEvent + hasEvent |
| `inventory_test.json` | - | addItem/removeItem + hasItem |
| `integration_test.json` | - | Entity + Dynamic Text + ConversationTemplate + Event + Inventory |
| `full_integration.json` | 14 | 全機能横断: Entity継承 + Dynamic Text + ConversationTemplate + Event + Inventory + Variables + and条件 |

## スコープ外

以下は将来検討事項としてスコープ外:
- lexicon.schema.json との連携
- YAML / Ink 形式の入力サポート
- モデルのバージョニング

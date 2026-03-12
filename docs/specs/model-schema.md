# SP-002: Model Schema

**Status**: done | **Pct**: 80 | **Cat**: data

## 概要

NarrativeGen のプレイスルーモデルの JSON Schema 仕様。`models/schema/playthrough.schema.json` で定義。

## スキーマ構造

### 必須フィールド

| フィールド | 型 | 説明 |
|-----------|---|------|
| `modelType` | `string` | モデルの種別 (例: `"adventure-playthrough"`) |
| `startNode` | `string` | 開始ノードのID |
| `nodes` | `Record<string, NodeDef>` | ノード定義のマップ (キー = ノードID) |

### オプションフィールド

| フィールド | 型 | 説明 |
|-----------|---|------|
| `flags` | `Record<string, boolean>` | 初期フラグ状態 |
| `resources` | `Record<string, number>` | 初期リソース値 |

## バリデーション層

### 1. JSON Schema バリデーション (Ajv)

`playthrough.schema.json` による構造検証:
- 必須フィールドの存在確認
- 型チェック (string, number, boolean, object, array)
- Condition/Effect は `type` フィールドのみ required、その他は `additionalProperties: true` (緩い検証)

### 2. 整合性チェック (`assertModelIntegrity`)

JSON Schema 通過後に実行されるロジカルバリデーション:
- ノードIDの一意性 (node.id === nodeKey)
- 選択肢IDの一意性 (ノード内)
- startNode の参照先存在
- 選択肢 target の参照先存在
- goto エフェクトの参照先存在
- 循環参照検出 (オプション)

## 例モデル

### `models/examples/linear.json`

8ノードの冒険モデル。条件・エフェクトなし、単純分岐。

```
start ─┬─ room_description ─┬─ hallway ─── ending
       │                     └─ window_view ─┘
       └─ with_candle ─┬─ scratches ─ found_key ─ hallway
                        └─ hallway
```

## 未実装・検討事項

- [ ] Condition/Effect の各 type に対する厳密な schema 定義 (現在は additionalProperties: true)
- [ ] lexicon.schema.json との連携
- [ ] YAML / Ink 形式の入力サポート
- [ ] モデルのバージョニング

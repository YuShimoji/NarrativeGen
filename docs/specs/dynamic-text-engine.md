# SP-TEXT-001: Dynamic Text Engine

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

ノードテキスト内で Entity プロパティや変数を動的に展開する構文エンジン。
原初ビジョンの「構文ベース生成エンジン」(ORIGINAL_DESIGN_PHILOSOPHY.md 3) の Phase 1 実装。

## 構文

### Entity 参照 (`[角括弧]`)

| 構文 | 展開先 | 例 |
|------|--------|-----|
| `[entity_id]` | EntityDef.name | `[cheeseburger]` → "Cheeseburger" |
| `[entity_id.name]` | EntityDef.name | 明示的参照 |
| `[entity_id.description]` | EntityDef.description | 説明文参照 |
| `[entity_id.cost]` | EntityDef.cost | コスト値 |
| `[entity_id.property_key]` | PropertyDef.defaultValue (継承解決) | `[cheeseburger.weight]` → "250" |

### 変数参照 (`{波括弧}`)

| 構文 | 展開先 | 備考 |
|------|--------|------|
| `{variable_name}` | SessionState.variables | 既存互換 |
| `{flag_name}` | SessionState.flags | boolean → "true"/"false" |
| `{resource_name}` | SessionState.resources | number → 文字列 |

### 未解決参照の扱い

- Entity が存在しない: `[entity_id]` のまま残す (エラーにしない)
- プロパティが存在しない: `[entity_id.property]` のまま残す
- 変数が存在しない: `{variable_name}` のまま残す

## API

```typescript
function expandTemplate(
  text: string,
  model: Model,
  session: SessionState
): string
```

- NodeDef.text を入力として受け取り、展開済みテキストを返す
- `[...]` と `{...}` を処理
- ネストは Phase 1 では非対応

## 依存

- SP-PROP-001 (Entity-Property System): `resolveProperty` でプロパティ値を解決

## Phase 分割

- **Phase 1**: `[entity]` / `[entity.property]` + `{variable}` の単純置換
- **Phase 2**: Web Tester 統合 (ストーリー表示時に自動展開)
- **Phase 3**: 条件付きセクション、ランダム選択、使用履歴

## 受け入れ条件

1. `[entity_id]` が EntityDef.name に展開される
2. `[entity_id.property]` が継承解決された defaultValue に展開される
3. `{variable}` が SessionState の値に展開される
4. 未定義の参照はそのまま残る
5. 既存モデル (entities なし) に対して副作用なし

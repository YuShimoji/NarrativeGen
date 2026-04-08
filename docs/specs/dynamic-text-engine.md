# SP-TEXT-001: Dynamic Text Engine

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

ノードテキスト内で Entity プロパティや変数を動的に展開する構文エンジン。
原初ビジョンの「構文ベース生成エンジン」(ORIGINAL_DESIGN_PHILOSOPHY.md 3) の Phase 1 実装。

**全体パイプライン（表示までの段階順・主対象の定義）**: `narrative-text-generation-pipeline.md`（SP-TGEN-001）。

### SP-TGEN 段階0（レガシー表記）の所在

著者が `{flag:key}` / `{resource:key}` / `{variable:key}` / `{nodeId}` / `{time}` を本文に書いた場合の展開は、engine-ts では **`packages/engine-ts/src/template.ts`** の `applyLegacySessionPlaceholders` が担当し、`expandTemplate` / `expandTemplateWithTracking` の先頭で一度だけ適用される。段階モデル・Undo/セーブとの関係は **SP-TGEN-001** を正とする。本書（SP-TEXT-001）は角括弧・単純 `{name}` 中心の Phase 1 説明に留まる。

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

## エクスポート方針（2026-04 確定）

Dynamic Text を外部形式へ出力する場合は、次の3区分で扱う。

### 1) 変換対象

- `{variable}`: 出力先フォーマットの変数構文に変換する（例: Yarn の `$variable`）
- 単純条件セクション `{?flag:text}`: 出力先に条件構文がある場合のみ変換する

### 2) 非対応構文

- `[entity.property]` の継承解決を前提とする表現
- `[entity~]` の追跡依存表現
- 会話テンプレート等のランタイム挿入依存表現

### 3) フォールバック

- 非対応構文は「静的展開」せず、原文を保持したまま出力する
- 併せてエクスポート仕様側に「損失情報」として明記する
- 暗黙変換で意味を変えない（可読性より意味保存を優先）

関連: `docs/specs/yarn-spinner-export.md`

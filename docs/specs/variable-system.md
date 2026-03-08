# 変数システム拡張仕様 (Variable System Extension)

## 概要

変数システムを文字列のみから文字列・数値両対応に拡張し、数値演算機能を追加。

## 仕様ID

SP-VAR-001

## ステータス

done (実装完了: 2026-03-09)

## 型定義

### VariableState

```typescript
type VariableState = Record<string, string | number>
```

- 各変数は文字列または数値を保持できる
- 未定義の変数は空文字列`''`として扱われる（後方互換性）

## 条件評価 (Condition)

### 変数条件 (variable)

```typescript
{
  type: 'variable'
  key: string
  op: '==' | '!=' | 'contains' | '!contains' | '>=' | '<=' | '>' | '<'
  value: string | number
}
```

**演算子別の振る舞い:**

#### 等価・非等価 (`==`, `!=`)
- 厳密等価（`===`, `!==`）で比較
- 型が異なれば常に不等

#### 文字列操作 (`contains`, `!contains`)
- 変数値・比較値がともに文字列の場合のみ有効
- どちらかが数値の場合、`contains`は`false`、`!contains`は`true`

#### 数値比較 (`>=`, `<=`, `>`, `<`)
- 変数値・比較値がともに数値の場合のみ有効
- どちらかが文字列の場合は`false`

## 効果適用 (Effect)

### 変数代入 (setVariable)

```typescript
{
  type: 'setVariable'
  key: string
  value: string | number
}
```

- 指定した値（文字列または数値）を変数に直接代入

### 変数演算 (modifyVariable)

```typescript
{
  type: 'modifyVariable'
  key: string
  op: '+' | '-' | '*' | '/'
  value: number
}
```

**演算規則:**

- 変数の現在値が数値の場合: その値を使用
- 変数の現在値が文字列または未定義: `0`として扱う
- 除算時にvalue=0の場合: 現在値を変更せず維持（ゼロ除算回避）
- 演算結果は常に数値として変数に格納

**演算例:**

```javascript
// 初期値: variables = { score: 10, name: "Alice" }

// score + 5
{ type: 'modifyVariable', key: 'score', op: '+', value: 5 }
// → variables.score = 15

// name + 1 (文字列は0として扱われる)
{ type: 'modifyVariable', key: 'name', op: '+', value: 1 }
// → variables.name = 1 (数値型に変換)

// score / 0 (ゼロ除算)
{ type: 'modifyVariable', key: 'score', op: '/', value: 0 }
// → variables.score = 15 (変更なし)
```

## UI実装 (condition-effect-editor.js)

### 条件エディタ

- 演算子選択: 文字列操作・等価・数値比較を区別して表示
- 値入力: 数値判定は`Number.isFinite(Number(value))`を使用（自動判定）

### 効果エディタ

- setVariable: 入力値が数値形式なら数値型、それ以外は文字列型として設定
- modifyVariable: 四則演算専用UI（演算子ドロップダウン + 数値入力）

## エクスポート互換性

### Yarn Spinner

- setVariable → `<<set $key = value>>`
- modifyVariable → `<<set $key = {$key} {op} {value}>>`（式展開）

### Twine/Ink

- 変数型情報は失われる（Twine SugarCube: 自動型推論、Ink: 数値はそのまま）

## 暗黙仕様 (実装中の判断事項)

以下は実装時に決定された挙動で、コード内に暗黙的に埋め込まれている:

1. **未定義変数のデフォルト値**: 空文字列`''`（evalCondition内の`variables[cond.key] ?? ''`）
2. **厳密等価の使用**: `==`条件は`===`で実装（型強制なし）
3. **数値演算時の型変換**: 文字列・未定義は`0`として扱う
4. **ゼロ除算の処理**: 除算時に除数が`0`なら変更なし（エラーを投げない）
5. **UI数値判定**: `Number.isFinite(Number(value))`での自動判定（入力文字列→数値型への変換）

## 関連ファイル

- `packages/engine-ts/src/types.ts` -- 型定義拡張
- `packages/engine-ts/src/condition-effect-ops.ts` -- 条件評価・効果適用ロジック（共通実装）
- `packages/engine-ts/src/session-ops.ts` -- 条件評価キャッシュラッパー
- `packages/engine-ts/src/index.ts` -- Node.jsエントリポイント
- `packages/engine-ts/src/browser.ts` -- ブラウザエントリポイント
- `apps/web-tester/src/ui/condition-effect-editor.js` -- 条件・効果エディタUI
- `models/schema/playthrough.schema.json` -- JSONスキーマ定義
- `apps/web-tester/src/features/export/formatters/YarnFormatter.js` -- Yarn Spinner出力対応

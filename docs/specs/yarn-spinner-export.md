# Yarn Spinner エクスポート仕様

## 概要

NarrativeGen ModelをYarn Spinner 2.x形式（.yarn）にエクスポートする。

## 仕様ID

SP-EXP-YARN-001

## ステータス

done (実装完了: 2026-03-09)

## Yarn Spinner 2.x形式の基礎

### ノード構造

```yarn
title: NodeID
tags:
---
ノード本文
選択肢 [[選択肢テキスト|TargetNodeID]]
===
```

- `title:` ノードID
- `tags:` タグ（オプション、空でも記述）
- `---` ヘッダー終了
- `===` ノード終了

### コマンド

- `<<set $variable = value>>` -- 変数代入
- `<<if $condition>> ... <<endif>>` -- 条件分岐
- `<<jump NodeID>>` -- ノードジャンプ
- `<<declare $variable = defaultValue>>` -- 変数宣言（ファイル冒頭）

### 選択肢

- `-> 選択肢テキスト` -- ショートカット形式（次の行にジャンプ先記述）
- `[[選択肢テキスト|TargetNodeID]]` -- インラインリンク形式

## NarrativeGen → Yarn Spinnerマッピング

### 変数宣言（ファイル冒頭）

model.flags, model.resources, model.variablesから自動生成:

```yarn
<<declare $flagName = true (or false)>>
<<declare $resourceName = 0>>
<<declare $variableName = "" (or 0)>>
```

- フラグ: 真偽値（model.flags[key]のデフォルト値）
- リソース: 数値0
- 変数: 文字列`""`または数値`0`（型に応じて）

### ノード本文

- `node.text` をそのまま出力（改行含む）

### 選択肢（Choice）

条件なし選択肢:
```yarn
[[{choice.text}|{choice.target}]]
```

条件付き選択肢（1条件の場合）:
```yarn
<<if {condition}>>
  [[{choice.text}|{choice.target}]]
<<endif>>
```

条件付き選択肢（複数条件 and結合の場合）:
```yarn
<<if {cond1} && {cond2} && ...>>
  [[{choice.text}|{choice.target}]]
<<endif>>
```

### 条件（Condition）のマッピング

| NarrativeGen | Yarn Spinner | 備考 |
|--------------|--------------|------|
| `{type:'flag', key, value:true}` | `$key` | フラグが真 |
| `{type:'flag', key, value:false}` | `!$key` | フラグが偽 |
| `{type:'resource', key, op, value}` | `$key {op} {value}` | 数値比較 |
| `{type:'variable', key, op:'==', value}` | `$key == {value}` | 等価（文字列は`""`で囲む） |
| `{type:'variable', key, op:'!=', value}` | `$key != {value}` | 非等価 |
| `{type:'variable', key, op:'>=', value}` | `$key >= {value}` | 数値比較 |
| `{type:'variable', key, op:'<=', value}` | `$key <= {value}` | 数値比較 |
| `{type:'variable', key, op:'>', value}` | `$key > {value}` | 数値比較 |
| `{type:'variable', key, op:'<', value}` | `$key < {value}` | 数値比較 |
| `{type:'variable', key, op:'contains', value}` | *(非対応)* | Yarn Spinnerに直接的な文字列contains演算子なし |
| `{type:'variable', key, op:'!contains', value}` | *(非対応)* | 同上 |
| `{type:'timeWindow', start, end}` | *(非対応)* | Yarn Spinnerにtime変数概念なし |
| `{type:'and', conditions}` | `cond1 && cond2 && ...` | 論理積 |
| `{type:'or', conditions}` | `cond1 || cond2 || ...` | 論理和 |
| `{type:'not', condition}` | `!(cond)` | 論理否定 |

**非対応条件の扱い:**
- `contains` / `!contains`: 常に真として出力（`/* UNSUPPORTED: contains */`コメント付き）
- `timeWindow`: 常に真として出力（`/* UNSUPPORTED: timeWindow */`コメント付き）

### 効果（Effect）のマッピング

| NarrativeGen | Yarn Spinner | 備考 |
|--------------|--------------|------|
| `{type:'setFlag', key, value}` | `<<set $key = {value}>>` | 真偽値 |
| `{type:'addResource', key, delta}` | `<<set $key = {$key} + {delta}>>` | 加算（負数可） |
| `{type:'setVariable', key, value}` | `<<set $key = {value}>>` | 文字列は`""`で囲む |
| `{type:'modifyVariable', key, op, value}` | `<<set $key = {$key} {op} {value}>>` | 四則演算 |
| `{type:'goto', target}` | `<<jump {target}>>` | ノードジャンプ |

**効果の配置:**
- 選択肢に`effects`がある場合、選択肢リンクの直後（次の行）に`<<set>>`/`<<jump>>`を出力

### Start node特殊処理

NarrativeGenの`model.startNode`がモデル内ノードの場合:
- 冒頭に`Start`ノード（ダミー）を生成
- `Start`ノードは`<<jump {model.startNode}>>`のみを含む

**理由:** Yarn Spinnerは`Start`ノードから実行を開始する慣例があるため

### ID制約

- Yarn SpinnerのノードIDにはピリオド`.`が使用できない
- NarrativeGenのノードID内の`.`は`_`に置換される（例: `node.1` → `node_1`）

## 損失情報（NarrativeGen固有機能）

以下の機能はYarn Spinnerに直接対応する概念がないため、エクスポート時に失われる:

- **ParaphraseLexicon** / **ParaphraseStyle** -- 言い換え辞書・スタイル
- **ChoiceOutcome** -- 選択肢選択後の追加テキスト
- **timeWindow条件** -- 時間窓による条件分岐
- **contains/!contains変数条件** -- 文字列包含判定

これらの情報は`.yarn`ファイルには含まれず、エクスポート形式の制約となる。

## 関連ファイル

- `apps/web-tester/src/features/export/formatters/YarnFormatter.js` -- 実装本体
- `apps/web-tester/main.js` -- フォーマッター登録
- `apps/web-tester/scripts/verify-export-formatters.mjs` -- 自動テスト
- `docs/AUTHORING_DESIGN_DISCUSSION.md` -- 互換出力としての位置づけ解説

## テストカバレッジ

`verify-export-formatters.mjs`で以下を検証:

- 基本ノード構造・選択肢出力
- 条件付き選択肢（flag, resource, variable各条件）
- 効果の出力（setFlag, addResource, setVariable, modifyVariable, goto）
- Start node特殊処理
- ID sanitization（`.` → `_`）
- 変数宣言生成

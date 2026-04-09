# SP-DTYARN-001: Dynamic Text → Yarn Spinner エクスポート（計画）

**Status**: partial | **Pct**: 68 | **Cat**: data

## 目的

`SP-TEXT-001`（Dynamic Text）および会話テンプレート追記後の本文を、Yarn Spinner 2.x が解釈可能な命令に近い形で `.yarn` に出力する。現行 [yarn-spinner-export.md](yarn-spinner-export.md) はプレースホルダの多くをプレーン文字列化しており、`[entity.prop]` や `{?条件:…}` を Yarn ネイティブに寄せる余地がある。

## スコープ（最小実装 2026-04-08）

1. **対象構文（実装済）**: `{variable}`、`{?flag:...}`、`{?!flag:...}` を `YarnFormatter` 内で Yarn 互換構文へ変換。
2. **非対象（当面）**: 本文中のネストした `and`/`or` 条件節、`ParaphraseLexicon` 由来の決定的バリアント、`[entity~]` テンプレ。

## スコープ（次段 2026-04-09）

1. **`[entity]` / `[entity.property]`**: `model.entities` が存在するときのみ置換。`$entity_name`（`name` フィールド）および各 `properties[].defaultValue` を `<<declare>>` し、本文では `{$entity_seg}` / `{$entity_seg_propseg}` 形式へ（`seg` は英数字・アンダースコア以外を `_` に正規化）。プロパティキーは **先頭の `.` 以降をすべて** キーとみなす（`[a.b.c]` → entity `a`、prop `b.c` → 変数名はセグメント結合）。
2. **数値比較の動的条件（段階1）**: `{?key op val:text}` / `{?!key op val:text}`（`op` は `>=` `<=` `>` `<` `==` `!=`）。`val` が数値トークンのときは数値として、それ以外は Yarn 文字列リテラルとして出力。本文は単一行〜短いブロックを想定（複数行・ネストは未保証）。
3. **実装場所**: `apps/web-tester/src/features/export/formatters/YarnFormatter.js`、`apps/web-tester/scripts/verify-export-formatters.mjs`。

## 受け入れ条件（最小実装）

- `verify-export-formatters` で `{variable}` / `{?flag:...}` / `{?!flag:...}` の変換回帰テストが通る。
- 既存の Yarn エクスポート（SP-EXP-YARN-001）を壊さない。

## 関連

- [yarn-spinner-export.md](yarn-spinner-export.md)（SP-EXP-YARN-001）
- [dynamic-text-engine.md](dynamic-text-engine.md)（SP-TEXT-001）
- [project-status.md](../project-status.md) N04

## 履歴

- 2026-04-08: 推奨開発プラン Phase D に基づきスタブ作成。
- 2026-04-08: 最小実装追加（`YarnFormatter` で `{variable}` / `{?flag:...}` / `{?!flag:...}` 変換、`verify-export-formatters` 回帰テスト追加）。
- 2026-04-09: 次段（`[entity]` / `[entity.prop]`、`<<declare>>`、数値比較 `{?key op val:...}`）を実装し検証スクリプトを拡張。

# SP-DTYARN-001: Dynamic Text → Yarn Spinner エクスポート（計画）

**Status**: partial | **Pct**: 45 | **Cat**: data

## 目的

`SP-TEXT-001`（Dynamic Text）および会話テンプレート追記後の本文を、Yarn Spinner 2.x が解釈可能な命令に近い形で `.yarn` に出力する。現行 [yarn-spinner-export.md](yarn-spinner-export.md) はプレースホルダの多くをプレーン文字列化しており、`[entity.prop]` や `{?条件:…}` を Yarn ネイティブに寄せる余地がある。

## スコープ（最小実装 2026-04-08）

1. **対象構文（実装済）**: `{variable}`、`{?flag:...}`、`{?!flag:...}` を `YarnFormatter` 内で Yarn 互換構文へ変換。
2. **非対象（当面）**: `[entity.property]`、複雑な `and`/`or` 条件節、`ParaphraseLexicon` 由来の決定的バリアント。
3. **実装場所**: `apps/web-tester/src/features/export/formatters/YarnFormatter.js`（正規化処理を内包）。

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

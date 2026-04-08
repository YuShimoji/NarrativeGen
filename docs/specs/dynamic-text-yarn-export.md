# SP-DTYARN-001: Dynamic Text → Yarn Spinner エクスポート（計画）

**Status**: partial | **Pct**: 5 | **Cat**: data

## 目的

`SP-TEXT-001`（Dynamic Text）および会話テンプレート追記後の本文を、Yarn Spinner 2.x が解釈可能な命令に近い形で `.yarn` に出力する。現行 [yarn-spinner-export.md](yarn-spinner-export.md) はプレースホルダの多くをプレーン文字列化しており、`[entity.prop]` や `{?条件:…}` を Yarn ネイティブに寄せる余地がある。

## スコープ（未確定・実装前）

1. **対象構文**: 最低限 `[entity.property]`、`{variable}`、`{?flag:…}` 程度から段階的に。
2. **非対象（当面）**: `ParaphraseLexicon` 由来の決定的バリアント、複雑な `and`/`or` 条件の Yarn 表現。
3. **実装場所**: `packages/engine-ts` の正規化ヘルパ（任意）+ `apps/web-tester` の `YarnFormatter`（または `formatters/` 配下）。

## 受け入れ条件（案・実装時に確定）

- `writer_tutorial.json` 等、Dynamic Text を含むサンプル1件以上でエクスポート結果が Yarn Spinner 公式ツールまたはプロジェクトでパース可能。
- `verify-export-formatters` に回帰テストを1件以上追加。

## 関連

- [yarn-spinner-export.md](yarn-spinner-export.md)（SP-EXP-YARN-001）
- [dynamic-text-engine.md](dynamic-text-engine.md)（SP-TEXT-001）
- [project-status.md](../project-status.md) N04

## 履歴

- 2026-04-08: 推奨開発プラン Phase D に基づきスタブ作成。

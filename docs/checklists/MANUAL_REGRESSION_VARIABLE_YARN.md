# 手動回帰（変数・Yarn エクスポート）

最終更新: 2026-04-09

目的: [docs/TECHNICAL_DEBT.md](../TECHNICAL_DEBT.md) §7 の「変数/Yarn 回帰」を 5〜10 分で切れる手順に固定する。

## 自動化との分担

- **E2E / スクリプト済み**: ルート `npm run test:engine`、`verify-export-formatters`（CI の web-tester ビルド内）、主要プレイ導線の Playwright。
- **本チェック**: GUI での目視・操作感、および壊れた JSON を 1 件入れてのエラー表示。

## 手順（最短）

1. `npm run dev` で Web Tester を起動する。
2. モデル `variable_system` または `integration_test` を読み込み実行する。
3. **変数**: 条件に数値変数を含むノードへプレイで到達し、本文の `{variable}` 展開と選択後の値が期待どおりか確認する。
4. **modifyVariable**: 当該選択後にデバッグ/状態表示で変数が更新されているか確認する。
5. **Yarn エクスポート**: 「エクスポート」から Yarn を選び、生成 `.yarn` に `<<set>>` 等が含まれ、致命的に壊れていないことを目視する（Dynamic Text 非変換は [yarn-spinner-export.md](../specs/yarn-spinner-export.md) の方針どおりでよい）。

## ネガティブ（import）

1. スキーマ違反の小さな JSON を「読込」で開く。
2. バリデーションエラーがユーザーに分かる形で出ること（コンソールのみに沈黙しないこと）。

## 記録

- 実施日と Pass/Fail を [docs/TECHNICAL_DEBT.md](../TECHNICAL_DEBT.md) §7 のチェックに合わせて更新する。

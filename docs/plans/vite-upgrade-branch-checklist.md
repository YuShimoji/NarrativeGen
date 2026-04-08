# Vite / Rollup / esbuild 更新用チェックリスト（専用ブランチ）

`main` 直マージは行わず、`feat/vite-upgrade` 等のブランチで実施する。根拠: [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) Phase 5。

## 手順

1. `git checkout -b feat/vite-upgrade`（ブランチ名は任意）
2. `package.json` / `apps/web-tester/package.json` / `packages/engine-ts/package.json` で Vite・関連を更新
3. ルート `overrides` の `rollup` → `@rollup/wasm-node` が依然として必要か確認（Windows/CI 向け）
4. `npm ci`
5. `npm run build:all`
6. `npm run test:engine`
7. `npm run test:e2e`（または CI 相当）
8. `npm run lint`（該当ワークスペース）
9. 問題なければ PR → `main`

## 失敗時

- Rollup ネイティブバイナリ依存: wasm override の維持または `optionalDependencies` の見直し
- Playwright: `playwright.config.js` の `webServer` と Node バージョンの組み合わせを確認

## 履歴

- 2026-04-08: 推奨開発プラン Phase D の運用メモとして追加（バージョンは固定しない）。

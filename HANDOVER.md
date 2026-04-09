# 作業申し送り

## 最終更新

- **日時**: 2026-04-09
- **ブランチ**: `main`（trunk-based）
- **直近**: `feat/vite-upgrade` を `main` にマージ（Vite 8、engine-ts lint 基線、SP-DTYARN-001 次段、index.html a11y スライス、play-immersion AC-5 安定化）。既存の `play-media-bgm-ac`・SP-PLAY-001 done・WritingPage No-Go・E2E #81〜#83 トラッキングは維持。
- **ロードマップの正**: `docs/plans/DEVELOPMENT_PLAN.md`（実行版 `docs/plans/ROADMAP_EXECUTION_2026.md` と Phase 6 以降セクション）

## プロジェクト概要

ナラティブ生成システム。ノード・選択肢ベースのストーリーモデルを JSON 形式で定義し、TypeScript エンジンで実行、Web UI でプレビュー・編集する。

### ワークスペース構成

```text
NarrativeGen/
  packages/engine-ts/    # ストーリーエンジン (TypeScript, Vitest)
  packages/backend/      # Express REST API (port 3001)
  packages/sdk-unity/    # Unity C# SDK (UPM パッケージ形式)
  packages/tests/        # C# ユニットテスト (.NET 9)
  apps/web-tester/       # Web UI (Vite, Playwright E2E)
  models/                # サンプルモデル + JSON スキーマ
  docs/                  # 仕様書・プラン・ガバナンス
```

## 現在の状態

### CI・テスト

- **GitHub Actions**: `governance`（ルート `npm ci` + `check:spec-index` / `check:models-sync` / `check:encoding-safety`）、`engine-ts`、`web-tester`、`sdk-unity`（.NET 9）
- **engine-ts**: Vitest 264 件前後（`npm run test:engine`）
- **web-tester**: Vite 8 ビルド、`verify-export-formatters`
- **E2E**: Playwright（`apps/web-tester/tests/e2e`）
- **C#**: `packages/tests/NarrativeGen.Tests` で `dotnet test`

### 仕様書（spec-index.json）

- **エントリ**: 36 件（`SP-WP-001` 含む。`npm run check:spec-index` で検証）
- **partial**: SP-009、SP-UNITY-001、SP-TGEN-001、SP-DTYARN-001、SP-WP-001 ほか
- **SP-PLAY-001**: done（100%）
- **SP-PIPE-001**: done（デザイナパイプライン。WritingPage 連携は延期）

## 既知の課題

- E2E バッチで稀に失敗しうる（`play-immersion` AC-5 は `waitForFunction` で緩和。恒久対策は [#81](https://github.com/YuShimoji/NarrativeGen/issues/81)〜[#83](https://github.com/YuShimoji/NarrativeGen/issues/83) / `docs/tasks/FLAKY_ISSUES_TRACKER.md`）
- SP-PLAY-001: **done**（AC-9〜12 は `play-media-bgm-ac.spec.js` + 検証表で Pass）
- Dynamic Text の Yarn（SP-DTYARN-001）: `[entity]` / `[entity.prop]`・数値比較 `{?key op val:…}` まで。ネスト and/or・`[entity~]` 等は `docs/specs/dynamic-text-yarn-export.md` 参照
- リポジトリ内のソース配置は `**packages/`（小文字）** を正とする。Unity 側の埋め込み先は `**Packages/`**（`packages/sdk-unity/README.md` 参照）

## 次の推奨作業

1. **SP-UNITY-001 残差**: NuGet 配布、`expandTemplate` エッジの列挙とテスト拡充（`unity-sdk.md`・四半期パリティ監査）
2. **SP-DTYARN-001 継続**: ネスト条件・`[entity~]` 等の仕様固定と実装
3. **SP-009 / Phase 8**: graph・debug・モーダルの a11y・レスポンシブ水平展開（`docs/plans/ui-a11y-responsive-issues.md`）
4. **TD §7 / E2E**: import ネガティブ手動確認または E2E 化の検討、flaky Issue の消化

**スコープ外（ゲート通過まで）**: WritingPage 実装は `writingpage-io-contract.md` が No-Go の間は行わない。

## 実行ロードマップ（2026 Q2-Q4）

- 実行版: `docs/plans/ROADMAP_EXECUTION_2026.md`
- **短期**: SP-UNITY-001 残差、E2E 恒久対策（#81〜#83）、SP-DTYARN 継続
- **中期**: a11y・レスポンシブ、回帰戦略、Dynamic Text / Yarn 境界の残タスク
- **長期**: WritingPage（ゲート Pass 後）、Unity 配布、品質ゲート高度化

## 中期実装の更新点（2026-04）

- Web Tester a11y baseline（bootstrap + tabpanel/dialog スライス + `index.html` 追記）
- モバイル/タブレット baseline responsive（`main.css` / `play.css`）
- E2E runbook・flaky トラッカー
- SP-DTYARN-001 次段（YarnFormatter + verify-export-formatters）
- WritingPage I/O 契約と着手ゲート（No-Go 記録）

## 再開手順

```bash
git fetch origin && git pull
npm ci
npm run check:safety
npm run check:spec-index
npm run test:engine
npm run test:e2e
npm run build:all
npm run dev
# → http://localhost:5173/
```

C#:

```powershell
dotnet test .\packages\tests\NarrativeGen.Tests
```

---

技術的負債: `docs/TECHNICAL_DEBT.md`
E2E フレーク運用: `docs/operations/E2E_FLAKE_RUNBOOK.md`
依存・encoding 運用メモ: `docs/operations/DEPENDENCY_ENCODING_OPS.md`
変数/Yarn 手動回帰: `docs/checklists/MANUAL_REGRESSION_VARIABLE_YARN.md`
flaky 候補トラッカー: `docs/tasks/FLAKY_ISSUES_TRACKER.md`
画面別 a11y/レスポンシブチェック: `docs/checklists/A11Y_RESPONSIVE_CHECKLIST.md`
WritingPage 準備仕様: `docs/specs/writingpage-io-contract.md`
spec-index レビュー例: `docs/operations/SPEC_INDEX_REVIEW_EXAMPLES.md` / `docs/governance/spec-change-review-examples.md`
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → http://localhost:3000/spec-viewer.html）

## 次プラン策定前の整理（推奨）

1. `git fetch origin` し、`main` が `origin/main` と一致していること
2. `npm run check:safety`
3. オプション: `npm run test:engine` と代表 E2E（例: `npm run test:e2e -- tests/e2e/play-media-bgm-ac.spec.js --project=chromium`）
4. 未クローズの追跡: [Issues（flaky 系 #81〜#83）](https://github.com/YuShimoji/NarrativeGen/issues?q=is%3Aissue+is%3Aopen) と `docs/tasks/FLAKY_ISSUES_TRACKER.md`

Edge で BGM AC を追加検証するときは `apps/web-tester` で `set PW_EDGE=1` のうえ `npx playwright test tests/e2e/play-media-bgm-ac.spec.js --project=msedge`（Windows）。

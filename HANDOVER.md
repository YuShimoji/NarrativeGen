# 作業申し送り

## 最終更新

- **日時**: 2026-04-09
- **ブランチ**: `main` (trunk-based)
- **直近**: `play-media-bgm-ac.spec.js` で AC-9〜12 を機械検証・SP-PLAY-001 を `done` 化、flaky を [#81](https://github.com/YuShimoji/NarrativeGen/issues/81)〜[#83](https://github.com/YuShimoji/NarrativeGen/issues/83) に起票、`writingpage-io-contract` でゲート **No-Go** を記録（`ccd6c80` まで `origin/main` に反映済み）

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
- **web-tester**: Vite ビルド、`verify-export-formatters`
- **E2E**: Playwright（`apps/web-tester/tests/e2e`）
- **C#**: `packages/tests/NarrativeGen.Tests` で `dotnet test`

### 仕様書（spec-index.json）

- **エントリ**: 35 件（`npm run check:spec-index` で検証）
- **partial**: SP-009 Technical Debt、SP-UNITY-001、SP-TGEN-001、SP-WP-001（WritingPage I/O 契約・準備）
- **SP-PIPE-001**: done（デザイナパイプライン。WritingPage 連携は延期）

## 既知の課題

- E2E バッチで稀に失敗しうる（`play-immersion` AC-5 は `toContainText` 待機で緩和）
- SP-PLAY-001: **done**（AC-9〜12 は `play-media-bgm-ac.spec.js` + 検証表で Pass 確定）
- Dynamic Text の Yarn ネイティブ変換は未対応
- リポジトリ内のソース配置は `**packages/`（小文字）** を正とする（現役ドキュメント表記を統一済み）。Unity 側の埋め込み先フォルダ名はエディタ既定の `**Packages/`** のまま（`packages/sdk-unity/README.md` 参照）

## 次の推奨作業

1. **SP-UNITY-001 残差**: NuGet 配布、`expandTemplate` エッジの列挙とテスト拡充（`unity-sdk.md` 参照）
2. **TD §7**: import ネガティブ手動確認、または追加 E2E 化の検討
3. **WritingPage**: 外部フォーマット安定後にゲート再判定（現状 No-Go は `writingpage-io-contract.md` 参照）

## 実行ロードマップ（2026 Q2-Q4）

- 実行版: `docs/plans/ROADMAP_EXECUTION_2026.md`
- **短期**: SP-PLAY-001 は完了済み。**SP-UNITY-001** の残差と **E2E 恒久対策（#81〜#83）** を優先
- **中期**: a11y・レスポンシブ改善、回帰戦略再設計、Dynamic Text 変換方針確定
- **長期**: WritingPage 連携、Unity 配布改善、品質ゲート高度化

## 中期実装の更新点（2026-04）

- Web Tester a11y baseline を導入（tab/landmark/modal）
- モバイル/タブレット baseline responsive を導入（main.css/play.css）
- E2E 運用を runbook 化し、手動確認との責務境界を明文化
- Dynamic Text エクスポート方針を仕様に確定反映
- WritingPage 連携準備として I/O 契約と着手ゲートを仕様化

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
spec-index レビュー例: `docs/operations/SPEC_INDEX_REVIEW_EXAMPLES.md`
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → http://localhost:3000/spec-viewer.html）

## 次プラン策定前の整理（推奨）

次の開発プランを書く直前に、次を一度通すと状態が揃う。

1. `git fetch origin` し、`main` が `origin/main` と一致していること（未 push がないこと）
2. `npm run check:safety`（spec-index / encoding / models-sync）
3. オプション: `npm run test:engine` と代表 E2E（例: `npm run test:e2e -- tests/e2e/play-media-bgm-ac.spec.js --project=chromium`）
4. 未クローズの追跡: [Issues（flaky 系 #81〜#83）](https://github.com/YuShimoji/NarrativeGen/issues?q=is%3Aissue+is%3Aopen) と `docs/tasks/FLAKY_ISSUES_TRACKER.md`

Edge で BGM AC を追加検証するときは `apps/web-tester` で `set PW_EDGE=1` のうえ `npx playwright test tests/e2e/play-media-bgm-ac.spec.js --project=msedge`（Windows）。
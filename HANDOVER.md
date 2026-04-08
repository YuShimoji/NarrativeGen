# 作業申し送り

## 最終更新

- **日時**: 2026-04-09
- **ブランチ**: `main` (trunk-based)
- **直近**: 次作業実行プラン反映（SP-PLAY-001 AC-9〜12 記録ルール確定、a11y チェックリスト完了、flaky トラッカー、WritingPage I/O 契約 `SP-WP-001`）

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
- **partial**: SP-009 Technical Debt、SP-UNITY-001、SP-TGEN-001、SP-PLAY-001、SP-WP-001（WritingPage I/O 契約・準備）
- **SP-PIPE-001**: done（デザイナパイプライン。WritingPage 連携は延期）

## 既知の課題

- E2E バッチで稀に失敗しうる（`play-immersion` AC-5 は `toContainText` 待機で緩和）
- SP-PLAY-001: AC-9〜12 は検証表で `Ready` まで確定済み。実機の `Pass/Fail` は担当者が追記する
- Dynamic Text の Yarn ネイティブ変換は未対応
- リポジトリ内のソース配置は **`packages/`（小文字）** を正とする（現役ドキュメント表記を統一済み）。Unity 側の埋め込み先フォルダ名はエディタ既定の **`Packages/`** のまま（`packages/sdk-unity/README.md` 参照）

## 次の推奨作業

1. **play-immersion 検証表の確定更新**: AC-9〜12 の `Ready` を `Pass/Fail` に更新
2. **flaky 候補の issue 化**: `docs/tasks/FLAKY_ISSUES_TRACKER.md` の再発ケースを昇格
3. **WritingPage 実装可否の判定**: `docs/specs/writingpage-io-contract.md` の着手ゲート充足確認

## 実行ロードマップ（2026 Q2-Q4）

- 実行版: `docs/plans/ROADMAP_EXECUTION_2026.md`
- **短期**: SP-PLAY-001 / SP-UNITY-001 / E2E 安定化の完了
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
flaky 候補トラッカー: `docs/tasks/FLAKY_ISSUES_TRACKER.md`
画面別 a11y/レスポンシブチェック: `docs/checklists/A11Y_RESPONSIVE_CHECKLIST.md`
WritingPage 準備仕様: `docs/specs/writingpage-io-contract.md`
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → http://localhost:3000/spec-viewer.html）

# 作業申し送り

## 最終更新

- **日時**: 2026-04-07
- **ブランチ**: `main` (trunk-based)
- **直近**: CI `governance` ジョブ追加、SP-HIST-001 スタブ仕様、`npm audit fix` ロック更新、Unity SP-TGEN スライス2（C#）

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

- **エントリ**: 34 件（SP-HIST-001 は `docs/specs/session-history.md` を参照）
- **partial**: SP-009 Technical Debt、SP-UNITY-001、SP-TGEN-001、SP-PLAY-001
- **SP-PIPE-001**: done（デザイナパイプライン。WritingPage 連携は延期）

## 既知の課題

- E2E バッチで稀に失敗しうる（`play-immersion` AC-5 は `toContainText` 待機で緩和）
- SP-PLAY-001: AC-9〜12 は `docs/specs/play-immersion.md` の検証表への人的記入が残る
- Dynamic Text の Yarn ネイティブ変換は未対応
- リポジトリ内のソース配置は **`packages/`（小文字）** を正とする（現役ドキュメント表記を統一済み）。Unity 側の埋め込み先フォルダ名はエディタ既定の **`Packages/`** のまま（`packages/sdk-unity/README.md` 参照）

## 次の推奨作業

1. **play-immersion 検証表**: AC-9〜12 を実機で確認し表に記入
2. **BL-TGEN-META**: `model.metadata` ランタイム展開の要否を決め Issue 化
3. **Vite 系更新**: 専用ブランチでメジャーアップ検証（`docs/plans/DEVELOPMENT_PLAN.md` ロードマップ参照）

## 再開手順

```bash
git fetch origin && git pull
npm ci
npm run check:spec-index
npm run test:engine
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
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → http://localhost:3000/spec-viewer.html）

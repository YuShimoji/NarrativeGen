# 作業申し送り

## 最終更新

- **日時**: 2026-04-08
- **ブランチ**: `main` (trunk-based)
- **直近**: SP-PLAY-001 検証表・E2E 強化、`hasEvent`/`createEvent` を Unity InferenceRegistry に追加、BL-TGEN-META 決定ログ・issue stub、spec スタブ（SP-DTYARN-001）、a11y 小修正、仕様レビュー例ドキュメント

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

- **エントリ**: 35 件前後（SP-DTYARN-001 スタブ追加。件数は `npm run check:spec-index` で確認）
- **partial**: SP-009 Technical Debt、SP-UNITY-001、SP-TGEN-001、SP-DTYARN-001 ほか
- **SP-PLAY-001**: done（100%）
- **SP-PIPE-001**: done（デザイナパイプライン。WritingPage 連携は延期）

## 既知の課題

- E2E バッチで稀に失敗しうる（`play-immersion` AC-5 は `toContainText` 待機で緩和）
- Dynamic Text の Yarn ネイティブ変換は [docs/specs/dynamic-text-yarn-export.md](docs/specs/dynamic-text-yarn-export.md)（SP-DTYARN-001）で計画のみ
- リポジトリ内のソース配置は **`packages/`（小文字）** を正とする（現役ドキュメント表記を統一済み）。Unity 側の埋め込み先フォルダ名はエディタ既定の **`Packages/`** のまま（`packages/sdk-unity/README.md` 参照）

## 次の推奨作業

1. **Vite 系更新**: [docs/plans/vite-upgrade-branch-checklist.md](docs/plans/vite-upgrade-branch-checklist.md) に従い専用ブランチで検証
2. **SP-DTYARN-001**: Dynamic Text → Yarn の受け入れ条件を固め実装着手
3. **UI a11y / レスポンシブ**: [docs/plans/ui-a11y-responsive-issues.md](docs/plans/ui-a11y-responsive-issues.md) を単位に Issue 化

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

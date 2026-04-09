# 作業申し送り

## 最終更新

- **日時**: 2026-04-09
- **ブランチ**: `feat/vite-upgrade`（Phase 6: Vite 8 を `main` へマージするまでの作業ブランチ）
- **直近**: 次期推奨開発プランを `docs/plans/DEVELOPMENT_PLAN.md`（Phase 6 以降）に反映。ローカル `main` は `origin/main` と整合済みの前提。engine-ts lint 基線整理済み（2026-04-09）。
- **ロードマップの正**: `docs/plans/DEVELOPMENT_PLAN.md` の「2026-04 後半〜」表（Phase 6〜8・並列トラック）。

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
- Dynamic Text の Yarn 変換（SP-DTYARN-001）: `[entity]` / `[entity.prop]`・数値比較 `{?key op val:…}` まで拡張（2026-04-09）。詳細は `docs/specs/dynamic-text-yarn-export.md`
- リポジトリ内のソース配置は `**packages/`（小文字）** を正とする（現役ドキュメント表記を統一済み）。Unity 側の埋め込み先フォルダ名はエディタ既定の `**Packages/`** のまま（`packages/sdk-unity/README.md` 参照）

## 次の推奨作業（Phase 6 以降と同一順）

1. **Phase 6 — Vite 8**: `feat/vite-upgrade` を PR 化し、CI・ローカル E2E 後に `main` マージ
2. **Phase 7 — SP-DTYARN-001 次段**: `[entity.property]` と段階的な複合条件の Yarn 表現（仕様→`YarnFormatter.js`→`verify-export-formatters`）
3. **Phase 8 — SP-009 横展開**: graph / debug / modal の a11y・レスポンシブ（画面単位スライス）
4. **並列**: Playwright 間欠安定化、`SP-UNITY-001` 残パリティ（`docs/specs/unity-sdk.md`・C# テスト）

**スコープ外（方針維持）**: WritingPage 連携は外部フォーマット安定まで実装しない（`docs/specs/pipeline-workflow.md`）。

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
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → [http://localhost:3000/spec-viewer.html）](http://localhost:3000/spec-viewer.html）)
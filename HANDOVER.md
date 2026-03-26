# 作業申し送り

## 最終更新

- **日時**: 2026-03-26
- **ブランチ**: `main` (trunk-based)
- **最新コミット**: session 15 nightshift (安定版化: Excise + Advance + docs)
- **origin/main**: +9 commits ahead (未push)

## プロジェクト概要

ナラティブ生成システム。ノード・選択肢ベースのストーリーモデルを JSON 形式で定義し、TypeScript エンジンで実行、Web UI でプレビュー・編集する。

### ワークスペース構成

```text
NarrativeGen/
  packages/engine-ts/    # ストーリーエンジン (TypeScript, Vitest)
  packages/backend/      # Express REST API (port 3001)
  packages/sdk-unity/    # Unity C# SDK (UPM パッケージ形式)
  packages/tests/        # C# ユニットテスト
  apps/web-tester/       # Web UI (Vite, Playwright E2E)
  models/                # サンプルモデル (16ファイル) + JSON スキーマ
  docs/                  # 仕様書・プラン・ガバナンス
```

## 現在の状態

### CI・テスト

- **engine-ts**: 250 テスト全合格 (20 ファイル)
- **web-tester**: Vite ビルド成功
- **E2E**: 57 件 (6 spec files)
- **モデル検証**: 16 モデル通過

### 仕様書

- **spec-index.json**: 33 エントリ
- **done**: 29 件
- **partial**: 3 件 (SP-009 Technical Debt 90%, SP-UNITY-001 Unity SDK 85%, SP-PLAY-001 Play Immersion 95%)
- **todo**: 1 件 (SP-PIPE-001 Pipeline Workflow 10%)

### Session 15 の成果 (2026-03-26 nightshift)

- **Excise**: デッドコード8ファイル削除 (1072+行)
  - PHASE-2A-COMPLETE.md, copy-models.js, verify-phase-2a.mjs, verify-phase2b.sh
  - hierarchy-integration-example.js, theme-manager.js, csv-exporter.js
  - utils/logger.js (src/core/logger.js に統合)
- **Excise**: 陳腐化docs 2件 archive移動 (WORKFLOW_STATE_SSOT.md, WEB_TESTER_BROWSER_VERIFICATION.md)
- **Advance**: Empty State UI追加 (ストーリータブ + グラフタブにプレースホルダー)
- **Advance**: サイドバートグルCSS修正 (.sidebar-hidden ルール欠落バグ)
- **docs**: spec-index に SP-HIST-001 (Session History) 追加 → 33エントリ
- **docs**: NarrativeGen_Reference_Wiki.md 更新 (Vite修正 + 6セクション追加)
- **docs**: OpenSpec-WebTester.md デッドリンク6件修正
- **docs**: TECHNICAL_DEBT.md session 15 完了4件追記
- **Visual Audit 実施**: 画面走査完了、empty state 動作確認

## 既知の課題

- E2Eバッチ実行で間欠的に1件失敗 (AC-5 mode toggle、CPU競合)
- SP-PLAY-001 手動確認未了 (ブラウザで画像/BGM操作感検証)
- Unity SDK パリティ未完 (TS側7機能の移植)
- Dynamic Text構文のYarnネイティブ変換未対応
- Pipeline仕様が初期ドラフト段階 (HUMAN_AUTHORITY確認待ち)
- Packages/ (大文字P) はWindowsケース非感受性のため削除不可 (packages/と同一)

## 次の推奨作業

1. **Pipeline仕様レビュー**: SP-PIPE-001 ドラフトの方向性確認 (HUMAN_AUTHORITY)
2. **SP-PLAY-001 手動確認**: 画像/BGMの操作感検証 → pct 100%化
3. **Unity SDK パリティ**: TS側7機能のC#移植 (別セッション推奨)
4. **WritingPage連携仕様策定**: 双方向連携の具体設計

## 再開手順

```bash
git fetch origin && git pull
npm ci
npm run build:engine
npm run test:engine
npm run build:tester
npm run dev
# → http://localhost:5173/
```

---

技術的負債: `docs/TECHNICAL_DEBT.md`
仕様書一覧: `docs/spec-viewer.html`（`npx serve docs` → http://localhost:3000/spec-viewer.html）

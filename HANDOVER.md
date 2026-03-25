# 作業申し送り

## 最終更新

- **日時**: 2026-03-26
- **ブランチ**: `main` (trunk-based)
- **最新コミット**: session 14 nightshift (レガシー根絶 + 棚卸し)
- **origin/main**: +5 commits ahead (未push)

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

- **spec-index.json**: 32 エントリ
- **done**: 28 件
- **partial**: 3 件 (SP-009 Technical Debt 90%, SP-UNITY-001 Unity SDK 85%, SP-PLAY-001 Play Immersion 95%)
- **todo**: 1 件 (SP-PIPE-001 Pipeline Workflow 10%)

### Session 12 の成果 (2026-03-22)

- SP-PLAY-001 Phase 2 実装完了: シーン画像 + BGM
  - AudioManager: HTMLAudioElement ダブルバッファリング、クロスフェード、autoplay対応
  - PlayRenderer: 画像表示 (テキスト上部)、BGM制御、レンダーキュー追加
  - スキーマ拡張: node.presentation.image/bgm + settings.presentation.defaultBgm/bgmVolume/bgmCrossfadeDuration
  - engine-ts types.ts: NodePresentation/PresentationSettings インターフェース追加
  - media-test.json テストモデル追加
  - E2E: Phase 2 5件新規追加、全パス。バッチ全体 135 passed / 1 flaky
- E2Eバッチ安定化: workers=2, timeout=45s, retries=1
- model sync script: `npm run sync:models` / `check:models-sync`
- saveGuiBtn PlayRenderer未初期化バグ修正
- cancelGuiBtn修正: 編集キャンセル後のstory/choices表示復帰

### Session 13 の成果 (2026-03-23 nightshift)

- docs debt消化: AI_CONTEXT.md整理、HANDOVER.md/TASKS.md session 12反映
- Pipeline仕様ドラフト策定: docs/specs/pipeline-workflow.md (SP-PIPE-001)
- BLIND_SPOTS.md整理: 陳腐化項目の更新
- spec-index.json同期

### Session 14 の成果 (2026-03-26 nightshift)

- 全体棚卸し + docs/project-status.md 作成 (全機能ステータス表)
- レガシー根絶:
  - 孤立ドキュメント4件削除 (hands-on-testing.md, API_ENDPOINTS.md, API_DEVELOPMENT_WORKFLOW.md, test-ai-features.md)
  - 偽テスト1件削除 (hierarchy-state.test.js: ブラウザコンソール手動確認用)
  - 陳腐化docs 6件をarchive移動 (AI_CONTEXT.md, MIGRATION_NOTES.md, QUICK_START_PHASE2.md, node-hierarchy-design.md, reference.md, OpenSpec.md)
  - SP-004 (legacy) をspec-indexから除去
  - docs/troubleshooting.md の旧ブランチ参照 (master→main) 修正

## 既知の課題

- E2Eバッチ実行で間欠的に1件失敗 (AC-5 mode toggle、CPU競合)
- SP-PLAY-001 手動確認未了 (ブラウザで画像/BGM操作感検証)
- Unity SDK パリティ未完 (TS側7機能の移植)
- Dynamic Text構文のYarnネイティブ変換未対応
- Pipeline仕様が初期ドラフト段階 (HUMAN_AUTHORITY確認待ち)
- Packages/ (大文字P) がディスク上に残存 (git管理外、手動削除で可)

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

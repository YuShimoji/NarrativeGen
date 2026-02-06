# Project Handover & Status

**Timestamp**: 2026-02-06T13:30:00+09:00
**Actor**: Cascade
**Type**: Handover
**Mode**: implementation

## 基本情報

- **最終更新**: 2026-02-06T13:30:00+09:00
- **更新者**: Cascade
- **デフォルトブランチ**: open-ws/engine-skeleton-2025-09-02
- **shared-workflows**: .shared-workflows/ (submodule, PR #72 で導入)

## GitHubAutoApprove

GitHubAutoApprove: false

## 現在の目標

- shared-workflows 体系への完全移行（SSOT 整合、タスクチケット化、CI doctor 統合）
- main.js 分割第2弾（nodes-panel.js / tabs.js）
- ドキュメント刷新（AI_CONTEXT.md、TASKS.md → docs/tasks/ チケット化）

## 進捗

### 完了済み

| タスク | 完了日 | 詳細 |
|--------|--------|------|
| ストーリーテキスト改行処理改善 | 2025-10-31 | renderStoryEnhanced() 導入 |
| main.js モジュール分割（第1弾） | 2025-10-31 | handlers/, utils/ への機能分離 |
| OpenSpec 仕様化 | 2025-10-31 | ノード階層構造の技術仕様書 |
| GUIエディタリファクタリング | 2025-12 | アクセサ関数ベースの依存注入 (PR #63) |
| shared-workflows 導入 | 2026-02-06 | サブモジュール追加、SSOT 配置 (PR #72) |
| 環境検証 | 2026-02-06 | build/test/lint 全グリーン (18 tests passed) |

### 未完了（優先度順）

| タスク | 優先度 | 状態 |
|--------|--------|------|
| main.js 分割第2弾 | 高 | 未着手（nodes-panel.js / tabs.js） |
| ノード階層システム Phase 2 | 高 | 未着手（node_group 列対応） |
| CI doctor 統合 | 中 | 未着手 |
| AI UX 改善 | 中 | 未着手 |
| パフォーマンス最適化 | 中 | 未着手 |

## ブロッカー

- sdk-unity CI: Unity ライセンス secrets 未設定（ジョブはコメントアウト中）

## バックログ

- セーブ/ロード機能（ブラウザストレージ）
- バッチ AI 処理
- モデル検証強化（循環参照検出等）

## テスト確認事項（最終検証: 2026-02-06）

- engine-ts: build/lint/test/validate 全グリーン (18 tests, 6 models)
- web-tester: build グリーン (18 modules transformed)
- CI: engine-ts + web-tester ジョブ通過

## 再開手順

1. `git pull origin open-ws/engine-skeleton-2025-09-02`
2. `git submodule update --init --recursive`
3. `npm ci`
4. `npm run build:engine`
5. `node .shared-workflows/scripts/sw-doctor.js --profile shared-orch-bootstrap --format text`
6. `npm run dev:tester` で Web Tester 起動

## リスク

- main.js が 46KB と大きく、分割第2弾が未完了
- TASKS.md と docs/tasks/ の二重管理状態（チケット化で解消予定）

## Proposals

- CI に doctor-health-check ワークフローを追加
- TASKS.md を docs/tasks/ チケットに完全移行し、TASKS.md は参照リンクのみに

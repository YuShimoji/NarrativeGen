# AI Context

## 基本情報

- **最終更新**: 2026-02-06T13:45:00+09:00
- **更新者**: Cascade
- **report_style**: standard
- **mode**: implementation

## プロジェクト概要

**NarrativeGen** — スプレッドシート駆動のナラティブエンジン。CSV/TSV でフラグ・リソース・条件分岐を記述し、TypeScript エンジン + Unity SDK + Web Tester で動作。

## 現在のミッション

- **タイトル**: shared-workflows 体系移行 + ドキュメント刷新
- **Issue**: PR #72 (shared-workflows 導入), PR #73 (SSOT 整合 + チケット化)
- **ブランチ**: open-ws/engine-skeleton-2025-09-02
- **進捗**: Phase 0-2 完了 / Phase 3 進行中

## 次の中断可能点

- Phase 3 (AI_CONTEXT 刷新) 完了後

## 決定事項

- shared-workflows を .shared-workflows/ にサブモジュールとして導入 (PR #72)
- TASKS.md の8タスクを docs/tasks/TASK_101-108 チケットに変換 (PR #73)
- docs/HANDOVER.md を shared-workflows 体系に準拠した形式に更新
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md を単一参照先とする
- GitHubAutoApprove: false（docs/HANDOVER.md に記載）

## リスク/懸念

- main.js が 46KB と大きく、分割第2弾が未完了
- sdk-unity CI: Unity ライセンス secrets 未設定（ジョブはコメントアウト中）
- TASKS.md と docs/tasks/ の二重管理状態（TASKS.md は参照リンクのみに移行予定）

## タスク管理（短期/中期/長期）

### 短期（Next）

- [ ] TASK_101: main.js 分割第2弾（nodes-panel.js / tabs.js）
- [ ] TASK_103: CI Doctor 統合

### 中期（Later）

- [ ] TASK_102: ノード階層システム Phase 2（node_group 列対応）
- [ ] TASK_104: AI UX 改善（採用ボタン）
- [ ] TASK_105: モデル検証強化

### 長期（Someday）

- [ ] TASK_106: パフォーマンス最適化
- [ ] TASK_107: セーブ/ロード機能
- [ ] TASK_108: バッチ AI 処理

## アーキテクチャ概要

```
NarrativeGen/
├── .shared-workflows/     # shared-workflows サブモジュール
├── apps/web-tester/       # Vite ベース Web テスター (main.js 46KB)
│   ├── handlers/          # story-handler, ai-handler, gui-editor 等
│   └── utils/             # csv-parser, csv-exporter, logger, model-utils
├── packages/engine-ts/    # TypeScript コアエンジン (vitest, ajv)
│   └── src/               # index, types, session-ops, game-session, inventory, entities
├── packages/sdk-unity/    # Unity SDK (C#, CI コメントアウト中)
├── models/                # JSON/CSV サンプルモデル + schema
├── docs/                  # HANDOVER, SSOT ルール, tasks/, inbox/
└── .github/workflows/     # CI (engine-ts + web-tester)
```

## 環境

- Node.js 20+, npm workspaces
- engine-ts: 18 tests passed, 6 models validated
- web-tester: Vite build 成功 (18 modules)
- CI: engine-ts + web-tester ジョブ通過
- shared-workflows: sw-doctor bootstrap チェック通過

## 履歴

- 2026-02-06 13:45: AI_CONTEXT.md を shared-workflows テンプレートに準拠して刷新
- 2026-02-06 13:35: TASK_101-108 チケット作成、docs/HANDOVER.md 更新 (PR #73)
- 2026-02-06 13:10: shared-workflows サブモジュール導入、SSOT 配置 (PR #72)
- 2025-12: GUI エディタリファクタリング (PR #63)
- 2025-10-31: main.js 分割第1弾、ストーリーテキスト改行処理改善
- 2025-10-27: OpenSpec 仕様化、スプレッドシート駆動 v2.0

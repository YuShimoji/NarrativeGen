# Worker Prompt: TASK_017 マルチエンディング可視化機能実装

## 参照
- チケット: docs/tasks/TASK_017_MultiEndingVisualization.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- MISSION_LOG: .cursor/MISSION_LOG.md（現在のフェーズ: P4完了、P5実行中）

## 境界
- Focus Area: `apps/web-tester/src/ui/gui-editor.js`のマルチエンディング可視化機能追加、エンディングパス抽出アルゴリズム、ツリー構造表示、到達条件表示
- Forbidden Area: 既存のリアルタイムプレビューパネルの破壊的変更、既存のモデル検証ツールの破壊的変更

## 前提条件
- Tier: 2
- Branch: main
- Report Target: docs/inbox/REPORT_TASK_017_*.md
- GitHubAutoApprove: false（docs/HANDOVER.md参照、pushは手動確認が必要）

## 背景

Phase 4のプレビュー＆検証機能の一部として計画されています。リアルタイムプレビューパネルとモデル検証ツールは実装済みですが、マルチエンディング可視化は未実装です。複数のエンディングがあるストーリーの可視化により、ストーリー構造の理解が容易になります。

## 実装要件

### 1. エンディングパス抽出アルゴリズム

- **BFS/DFS**: 全エンディングパスを抽出する効率的なアルゴリズム（BFS/DFS）を実装
- **エンディングノード判定**: 既存の`ModelValidator`を参考に、エンディングノードを判定

### 2. ツリー構造表示

- **エンディングパス表示**: エンディングパスをツリー構造で表示
- **UI統合**: リアルタイムプレビューパネルに統合、または別パネルとして実装

### 3. 到達条件表示

- **到達条件評価**: 既存の条件評価ロジック（`engine-ts`）を再利用し、各エンディングへの到達条件を表示
- **条件の可視化**: 到達条件を分かりやすく表示

## 参考資料

- `docs/tasks/TASK_017_MultiEndingVisualization.md`: タスクチケット
- `docs/NEXT_PHASE_PROPOSAL.md`: 次フェーズ開発提案（「Phase 4: プレビュー＆検証機能」）
- `apps/web-tester/src/features/model-validator.js`: モデル検証ツール（エンディングノード判定の参考）
- `apps/web-tester/src/ui/gui-editor.js`: GUIエディタマネージャー（リアルタイムプレビューパネルの参考）
- `Packages/engine-ts/`: エンジン（条件評価ロジックの参考）

## 完了条件（DoD）

- [ ] エンディングパス抽出アルゴリズムの実装
- [ ] ツリー構造表示の実装
- [ ] 到達条件表示の実装
- [ ] UI統合（リアルタイムプレビューパネルに統合、または別パネルとして実装）
- [ ] サンプルモデル（multiple_endings.json等）で動作確認
- [ ] `docs/inbox/`にレポート（`REPORT_TASK_017_*.md`）を作成
- [ ] チケットのReport欄にレポートパスを追記

## 注意事項

- エンディングノードの判定ロジックは既存の`ModelValidator`を参考にすること
- 到達条件の評価は既存の条件評価ロジック（`engine-ts`）を再利用すること
- ツリー構造表示は既存のリアルタイムプレビューパネルのスタイルを参考にすること
- 大規模モデル（500ノード以上）でもパフォーマンスを維持すること

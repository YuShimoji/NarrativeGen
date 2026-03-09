# Worker Prompt: TASK_015 Phase 2グラフビューの編集機能実装

## 参照
- チケット: docs/tasks/TASK_015_Phase2GraphViewEditing.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- MISSION_LOG: .cursor/MISSION_LOG.md（現在のフェーズ: P4完了、P5実行中）

## 境界
- Focus Area: `apps/web-tester/src/ui/graph-editor/GraphEditorManager.js`の編集機能追加、ノード追加・削除、エッジ編集、インライン編集、`GuiEditorManager`との状態同期
- Forbidden Area: 既存のリスト形式GUIエディタの破壊的変更、既存のD3.jsグラフの破壊的変更、既存の読み取り専用機能の削除

## 前提条件
- Tier: 2
- Branch: main
- Report Target: docs/inbox/REPORT_TASK_015_*.md
- GitHubAutoApprove: false（docs/HANDOVER.md参照、pushは手動確認が必要）

## 背景

TASK_013で読み取り専用のグラフビュー（スパイク）が実装完了しました。本タスクでは、このグラフビューに編集機能を追加し、読み取り専用から編集可能なグラフエディタへ拡張します。

## 実装要件

### 1. ノード追加・削除機能

- **ノード追加**: ツールパレットからドラッグ＆ドロップ、または右クリックメニューから追加
- **ノード削除**: ノード選択→Deleteキー、または右クリックメニューから削除
- ノード削除時は、関連する選択肢（エッジ）も適切に処理する

### 2. エッジ（選択肢）追加・削除・編集機能

- **エッジ追加**: ノード間をドラッグして接続作成
- **エッジ削除**: エッジ選択→Deleteキー、または右クリックメニューから削除
- **エッジ編集**: エッジ選択→インライン編集、または右クリックメニューから編集

### 3. インライン編集機能

- **ノード編集**: ノードダブルクリックで編集モード、テキスト・選択肢のインライン編集
- **エッジ編集**: エッジ選択→インライン編集、選択肢テキストの編集

### 4. 状態同期

- 編集操作は即座にモデルに反映し、GUIエディタ（`GuiEditorManager`）と同期する
- 既存の`GuiEditorManager`との状態同期を維持

## 参考資料

- `docs/tasks/TASK_015_Phase2GraphViewEditing.md`: タスクチケット
- `docs/NEXT_PHASE_PROPOSAL.md`: 次フェーズ開発提案（「ステップ3：エッジ（選択肢）操作」「ステップ4：インライン編集」）
- `docs/reports/REPORT_TASK_013_Phase2ReadOnlyGraphView.md`: Phase 2グラフビューの実装レポート
- `apps/web-tester/src/ui/graph-editor/GraphEditorManager.js`: 既存のグラフエディタマネージャー
- `apps/web-tester/src/ui/gui-editor.js`: GUIエディタマネージャー（状態同期の参考）

## 完了条件（DoD）

- [ ] ノード追加機能の実装
- [ ] ノード削除機能の実装
- [ ] エッジ（選択肢）追加機能の実装
- [ ] エッジ（選択肢）削除機能の実装
- [ ] インライン編集機能の実装
- [ ] `GuiEditorManager`との状態同期を確認
- [ ] サンプルモデルで動作確認
- [ ] `docs/inbox/`にレポート（`REPORT_TASK_015_*.md`）を作成
- [ ] チケットのReport欄にレポートパスを追記

## 注意事項

- 既存の読み取り専用機能を削除しないこと
- 編集操作は即座にモデルに反映し、GUIエディタと同期すること
- 大規模モデル（500ノード以上）でもパフォーマンスを維持すること

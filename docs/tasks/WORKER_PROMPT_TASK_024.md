# Worker Prompt: TASK_024_Phase2GraphViewDragAndDrop

## 参照
- チケット: docs/tasks/TASK_024_Phase2GraphViewDragAndDrop.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- 既存実装: apps/web-tester/src/ui/graph-editor/GraphEditorManager.js

## 境界
- Focus Area: apps/web-tester/src/ui/graph-editor/, apps/web-tester/src/styles/gui-editor.css
- Forbidden Area: apps/web-tester/src/core/ (原則禁止)

## DoD
- [ ] ノードをマウスドラッグで移動できる
- [ ] 移動中およびドロップ時にグリッドスナップが効く（グリッド機能有効時）
- [ ] 複数選択されている場合、選択された全ノードが相対位置を保って移動する
- [ ] 移動終了時にモデルの座標データが更新される
- [ ] Undo/Redo 履歴に移動操作が記録される
- [ ] エッジ（矢印）がノード移動に追従して再描画される

## 停止条件
- 既存のクリックイベントや複数選択ロジック（Ctrl+Click）と競合して解決困難な場合
- パフォーマンスが著しく低下する場合

## 納品先
- docs/inbox/REPORT_TASK_024_Phase2GraphViewDragAndDrop.md

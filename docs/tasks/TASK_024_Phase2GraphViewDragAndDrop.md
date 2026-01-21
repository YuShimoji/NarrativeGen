# TASK_024: Phase 2 Graph View Drag & Drop Implementation

## Overview
Phase 2 Graph View（読み取り専用スパイクから編集機能実装済み）に対し、直感的なノード配置変更を可能にするドラッグ＆ドロップ機能を実装する。
TASK_021で実装されたグリッドスナップや複数選択機能との連携を考慮する。

## Tier
2

## Status
DONE


## Focus Area
- `apps/web-tester/src/ui/graph-editor/`
- `apps/web-tester/src/styles/gui-editor.css`

## Forbidden Area
- `apps/web-tester/src/core/` (unless absolutely necessary)
- `docs/windsurf_workflow/`

## Constraints
- 既存の `GraphEditorManager.js` のアーキテクチャに従う。
- SVG/D3.js ベースの描画ロジックと競合しないようにイベントハンドリングを行う。
- パフォーマンス（大量ノード時のドラッグ）に配慮する。

## DoD (Definition of Done)
- [x] ノードをマウスドラッグで移動できる
- [x] 移動中およびドロップ時にグリッドスナップが効く（グリッド機能有効時）
- [x] 複数選択されている場合、選択された全ノードが相対位置を保って移動する
- [x] 移動終了時にモデルの座標データが更新される（`appState.updateNodePosition` 等）
- [x] Undo/Redo 履歴に移動操作が記録される
- [x] 画面外へのドラッグ時の挙動（オートスクロール等）が考慮されている（必須ではないが望ましい）
- [x] エッジ（矢印）がノード移動に追従して再描画される

## Reference
- TASK_021 (Advanced Editing) implementation
- `apps/web-tester/src/ui/graph-editor/GraphEditorManager.js`
- Report: `docs/reports/REPORT_TASK_024_Proxy.md`

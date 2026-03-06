# Worker Prompt: TASK_026_GUIEditorAdvancedShortcuts

## 参照
- チケット: docs/tasks/TASK_026_GUIEditorAdvancedShortcuts.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- Existing KeyBindingManager: apps/web-tester/src/ui/KeyBindingManager.js

## 境界
- Focus Area: `apps/web-tester/src/ui/` (KeyBindingManager.js, GraphEditorManager.js, SearchManager.js)
- Forbidden Area: `apps/web-tester/src/core/` (unless necessary), Changing existing shortcuts (Ctrl+S, Ctrl+C/V)

## DoD (Definition of Done)
- [ ] `Ctrl+D`: Duplicates selected nodes.
- [ ] `Delete` / `Backspace`: Deletes selected nodes.
- [ ] `Ctrl+F`: Focuses the search input box.
- [ ] `Space`: Toggles or holds Pan Mode.
- [ ] `Ctrl+Z` / `Ctrl+Y`: Verify Undo/Redo works for new actions.
- [ ] Update test guide or create manual test cases.

## 停止条件
- 既存の Undo/Redo システムが複雑で、複製/削除の統合に大規模なリファクタリングが必要な場合
- ブラウザのデフォルトショートカット（Ctrl+D, Ctrl+F）の無効化が期待通りに動作しない場合

## 納品先
- docs/inbox/REPORT_TASK_026_Shortcuts.md

# Task: GUI Editor Advanced Shortcuts

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-23
Report: docs/reports/REPORT_TASK_026_Shortcuts.md

## Objective
Implement advanced keyboard shortcuts for the GUI Editor to improve workflow efficiency, as planned in the Mid-Term Priority list.

## Context
- `NEXT_TASKS_SUMMARY.md` lists shortcuts as a Mid Priority item (now promoted to High).
- Existing shortcuts: Copy/Paste (Ctrl+C/V), Save (Ctrl+S).
- Missing/Requested:
  - Duplicate (Ctrl+D)
  - Delete (Delete/Backspace)
  - Search (Ctrl+F) - integration with existing search
  - Pan Mode Toggle (Space)
  - Undo/Redo (Ctrl+Z/Y) - Already partially implemented in TASK_018/024, need to verify full coverage.

## Focus Area
- `apps/web-tester/src/ui/`
  - `KeyBindingManager.js`
  - `GraphEditorManager.js`
  - `SearchManager.js`

## Forbidden Area
- `apps/web-tester/src/core/` (unless absolutely necessary)
- Changing existing working shortcuts (Ctrl+S, Ctrl+C/V)

## DoD
- [ ] `Ctrl+D`: Duplicates selected nodes (offset position).
- [ ] `Delete` / `Backspace`: Deletes selected nodes.
- [ ] `Ctrl+F`: Focuses the search input box.
- [ ] `Space`: Toggles or holds Pan Mode (Hand tool).
- [ ] `Ctrl+Z` / `Ctrl+Y`: Verify and ensure Undo/Redo works for these new actions (Duplicate, Delete).
- [ ] Update `docs/GUI_EDITOR_TEST_GUIDE.md` or Create new manual test cases for these shortcuts.

## Notes
- Ensure shortcuts do not conflict with browser defaults where possible (e.g. preventDefault for Ctrl+F/D).

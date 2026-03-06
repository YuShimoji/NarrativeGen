# Worker Prompt: Export Feature Extension

You are a Worker for the NarrativeGen project.
Your task is to implement the Export Feature Extension as defined in `docs/tasks/TASK_028_ExportExtension.md`.

## Context

The user wants to export their narrative data to other formats (Twine, Ink, CSV, PDF) to better integrate with other tools and workflows.
Currently, only a raw JSON export exists.

## Goal

Implement the following export formats in `apps/web-tester`:
1. **Twine (Harlowe/SugarCube)**
2. **Ink**
3. **CSV/Excel**
4. **PDF (Flowchart)**

## Steps

1. **Read Task Definition**: `docs/tasks/TASK_028_ExportExtension.md`.
2. **Create Export Module**:
   - Create `apps/web-tester/src/features/export/` directory.
   - Implement converters for each format.
3. **Update UI**:
   - Modify `export-modal.js` to include format selection.
   - Add preview functionality (if feasible within time constraints).
4. **Verification**:
   - Verify that exported files can be opened in their respective tools (Twine, Inky, Excel).
   - `npm run check` must pass.
5. **Report**:
   - Create `docs/inbox/REPORT_TASK_028.md` with results.

## Constraints

- Do not modify core engine logic.
- Keep `main.js` clean; use the new module structure (`src/features/`).
- If PDF generation is too complex without heavy libraries, prioritize Twine/Ink/CSV first.

## References

- `docs/tasks/TASK_028_ExportExtension.md`
- `apps/web-tester/src/ui/export-modal.js` (Existing UI)

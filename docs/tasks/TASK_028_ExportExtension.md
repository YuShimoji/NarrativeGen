# Task: Export Feature Extension

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-26T22:30:00Z

## Objective

Expand the export functionality to support multiple formats (Twine, Ink, Yarn Spinner, CSV, PDF) to enhance interoperability and collaboration.

## Context

- Existing export only supports internal JSON format.
- `docs/NEXT_TASKS_SUMMARY.md` lists this as a high-priority "Next Implementation" item.
- User request for "Short/Mid/Long term" planning includes this immediate enhancement.

## Unimplemented Items

### 1. New Formats
- **Twine (Harlowe/SugarCube)**: Export generic HTML structure.
- **Ink**: Convert node graph to Ink script format.
- **CSV/Excel**: Export node text and choices for localization/editing.
- **PDF**: Visual flowchart export (using existing Dagre layout or screenshot mechanism).

### 2. Export UI
- Format selection dropdown.
- Preview of exported content (text-based).
- Download button with appropriate MIME types.

## Focus Area

- `apps/web-tester/src/features/export/` (New directory recommended)
- `apps/web-tester/src/ui/export-modal.js`

## Forbidden Area

- Core engine logic (`narrative-engine.js`).
- `main.js` (Do not clutter, use modules).

## PvP (Plan vs Performance)

- **Estimated Time**: 4-6 hours
- **Complexity**: Medium (Format conversion logic)

## Definition of Done (DoD)

- [ ] Twine export implemented and verified (importable in Twine).
- [ ] Ink export implemented and verified.
- [ ] CSV export implemented containing all text content.
- [ ] Export UI allows selecting all new formats.
- [ ] `npm run check` passes.
- [ ] Report created in `docs/inbox/`.

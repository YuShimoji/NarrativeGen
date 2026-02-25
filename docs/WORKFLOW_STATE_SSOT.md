# WORKFLOW_STATE_SSOT

## Current Phase
- P2: Status

## In-progress
- CSV hierarchy import resolution fix
- Automated verification flow for web tester (manual checks minimized)

## Blockers
- `prompts/orchestrator/modules/00_core.md` and phase modules are missing in repository

## Decisions
- Use `docs/windsurf_workflow/EVERY_SESSION.md` as fallback operation SSOT
- Use `data/presentation.json` fixed 5-section response format
- Prefer automated command checks (`verify:web:ci`) over manual browser checks

## Next Tasks
1. Integrate `verify:web:ci` into task completion checklist
2. Address optional Vite dynamic import warning (`browser.js` static + dynamic import mix)
3. Move phase gate decision from P2 to P2.5 after one more stable run

## Next Action
- Run `npm run verify:web:ci` on each related change and record result in MISSION_LOG

## Last Updated
- 2026-02-25

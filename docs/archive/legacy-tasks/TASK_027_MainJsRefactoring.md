# Task: main.js Refactoring

## Background
`main.js` has grown to over 2200 lines and contains mixed responsibilities (initialization, UI bindings, session control, etc.). This makes maintenance and testing difficult.

## Objective
Refactor `main.js` by splitting it into smaller, focused modules while maintaining existing functionality.

## Proposed Structure
- `src/bootstrap.js`: Initialization logic, environment detection
- `src/ui-bindings.js`: DOM element querying and event binding
- `src/session-controller.js`: Game session management logic
- `apps/web-tester/main.js` (or `src/app.js`): Entry point that integrates the above modules

## Requirements
1.  **Strictly Refactoring**: No new features or behavior changes.
2.  **Verify Functionality**: Ensure the app builds and runs correctly after splitting.
3.  **Update Imports**: Fix any import paths affected by the move.

## Definition of Done
- `main.js` is significantly smaller (e.g., < 500 lines or acts as a coordinator).
- New modules (`bootstrap.js`, `ui-bindings.js`, `session-controller.js`) are created and functioning.
- `npm run check` passes.
- Manual smoke test (launch app, start session) passes.

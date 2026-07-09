# Validation

## Install

```bash
npm ci
```

## Development server

```bash
npm run dev
```

Expected Web Tester URL: the Vite URL printed by the command, normally `http://localhost:5173/`.

## Build

```bash
npm run build:all
```

Focused build used for the 2026-07-10 re-kickstart evidence:

```bash
npm run build:engine
```

## Test

```bash
npm run test
```

Useful focused examples:

```bash
npm run test -w @narrativegen/engine-ts -- test/originality-spine-probe.spec.ts
npm run test:e2e -- apps/web-tester/tests/e2e/originality-spine-probe.spec.js --project=chromium
```

## Lint

```bash
npm run lint
```

Note: Web Tester currently reports lint as skipped through its workspace script.

## Preview

```bash
npm run preview
```

## Screenshot capture

```bash
NOT_AVAILABLE_IN_THIS_REPO
```

There is no dedicated screenshot-only npm script. Use `npm run dev` plus Playwright/manual browser capture when a UI BUILD slice requires visual evidence.

## Artifact generation

```bash
npm run build:generated-specimen -w @narrativegen/web-tester
npm run build:authoring-readback -w @narrativegen/web-tester
```

## Governance and safety checks

```bash
npm run check:safety
npm run check:spec-index
npm run check:models-sync
npm run check:encoding-safety
git diff --check
```

## Latest local evidence

| Date | Command | Result | Output |
|---|---|---|---|
| 2026-07-10 | `npm run build:engine` | pass | `artifacts/review/re-kickstart-build-engine-2026-07-10.md` |
| 2026-07-10 | `npm run check:safety` | pass | spec-index 36 entries; encoding scan 327 text files; 18 model files in sync |

## Validation rule

A validation entry is valid only when it includes command, date, result, and output path or log summary.

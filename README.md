# NarrativeGen

NarrativeGen is an interactive narrative engine for node-and-choice stories. It keeps the primary model in JSON, runs through the TypeScript engine, previews and edits in Web Tester, and targets Unity through the C# SDK.

## Resume First

Use [`HANDOVER.md`](HANDOVER.md) as the single restart entrypoint. It contains the current state, recommended next work, validation commands, and links to supporting docs.

- Authoring workflow: [`docs/AUTHORING_GUIDE.md`](docs/AUTHORING_GUIDE.md)
- Roadmap: [`docs/plans/DEVELOPMENT_PLAN.md`](docs/plans/DEVELOPMENT_PLAN.md)
- Spec index: [`docs/spec-index.json`](docs/spec-index.json) / [`docs/spec-viewer.html`](docs/spec-viewer.html)
- Long-term decisions: [`docs/governance/decision-log.md`](docs/governance/decision-log.md)

## Project Layout

- `packages/engine-ts/` - TypeScript story engine
- `packages/backend/` - Express REST API
- `packages/sdk-unity/` - Unity C# SDK in UPM package form
- `packages/tests/` - .NET tests for the Unity SDK
- `apps/web-tester/` - Vite Web Tester UI and Playwright E2E tests
- `models/` - schema, example models, and spreadsheet samples
- `docs/` - specs, operations docs, checklists, and governance notes

## Requirements

- Node.js 20+
- .NET SDK 9 for `packages/tests/NarrativeGen.Tests`
- Unity 2021.3+ for Unity integration

## Common Commands

Run from the repository root unless noted.

```powershell
npm ci
npm run check:safety
npm run test:engine
npm run test:e2e
npm run build:all
npm run dev
```

Useful focused commands:

```powershell
npm run check:spec-index
npm run check:models-sync
npm run check:encoding-safety
npm run validate
dotnet test .\packages\tests\NarrativeGen.Tests
```

Web Tester runs at the Vite URL printed by `npm run dev`, normally `http://localhost:5173/`.

## Core Model and Workflow

- JSON is the primary full-fidelity model format.
- Spreadsheet CSV/TSV import/export supports writer-friendly authoring.
- Web Tester provides visual editing, graph views, validation, play preview, inference UI, and 5-format export.
- Unity SDK follows TypeScript engine parity; TypeScript remains the SDK source of truth.
- WritingPage integration is blocked until the gates in [`docs/specs/writingpage-io-contract.md`](docs/specs/writingpage-io-contract.md) pass.

## Specs

`docs/spec-index.json` is the machine-checked spec index. When adding, removing, or changing spec status, update the index and run:

```powershell
npm run check:spec-index
```

For browser viewing:

```powershell
npx serve docs
```

Then open `http://localhost:3000/spec-viewer.html`.

## Unity SDK

Install as a UPM package:

1. Open Unity Package Manager.
2. Choose `Add package from git URL`.
3. Use `https://github.com/YuShimoji/NarrativeGen.git?path=packages/sdk-unity`.

See [`packages/sdk-unity/README.md`](packages/sdk-unity/README.md) for API details and samples.

## Operations Notes

- Historical planning and session-state files are not kept as repo documents; use Git history when needed.
- Current restart state belongs in `HANDOVER.md`.
- Roadmap intent belongs in `docs/plans/DEVELOPMENT_PLAN.md`.
- Durable decisions belong in `docs/governance/decision-log.md`.
- Encoding and spec safety checks are part of normal doc and config work.

# NarrativeGen

[![CI](https://github.com/YuShimoji/NarrativeGen/actions/workflows/ci.yml/badge.svg)](https://github.com/YuShimoji/NarrativeGen/actions/workflows/ci.yml)

Rebuild from scratch: A narrative playthrough engine and Unity SDK.

- `models/` — JSON schema and sample models
- `packages/sdk-unity/` — Unity-ready SDK package (C# runtime)
- `packages/samples/PlaythroughCli/` — CLI sample project for verification

## Purpose (Rebuild from scratch)

- Break away from the existing project's technical debt and design flaws
- Build a minimal, correct, and maintainable core
- Follow SoC/SOLID principles (Model / Session / Engine)
- Integrate with Unity using a UPM package (`com.NarrativeGen`)

## Setup

### Requirements

- .NET SDK 6 or later
- Unity 2021.3+ (for UPM integration)

### Build (C# runtime)

```powershell
dotnet build .\packages\sdk-unity -c Release
```

### Run sample (CLI)

```powershell
dotnet run --project .\packages\samples\PlaythroughCli
```

## Key State (C#)

`NarrativeGen.Engine` is used to load models, start sessions, get available choices, and apply choices.

- Sample model: `models/examples/linear.json`
- API: `LoadModel(json)`, `StartSession(model)`, `GetAvailableChoices(session, model)`, `ApplyChoice(session, model, choiceId)`

## Test Procedure

1. Verify JSON schema integrity

```powershell
Get-Content .\models\schema\playthrough.schema.json | ConvertFrom-Json | Out-Null
Get-Content .\models\examples\linear.json | ConvertFrom-Json | Out-Null
```

1. Build the runtime

```powershell
dotnet build .\packages\sdk-unity -c Release
```

1. Run the sample

```powershell
dotnet run --project .\packages\samples\PlaythroughCli
```

Expected result:

- The console will display the starting node's text and choices, and then terminate after selecting `c1` or `c2` and reaching the ending node.

## Validate models (Node/Ajv)

Requirements:

- Node.js 18+

```powershell
cd .\packages\engine-ts
cmd /c npm install
cmd /c npm run build
cmd /c npm run validate:models
```

`packages/engine-ts/src/index.ts` の `loadModel()` は JSON Schema による構造検証に加え、`startNode` の存在・ノードID整合・選択肢ターゲット整合などを確認します。エラーは CLI 出力に集約されます。

## Web Tester

### Option 1: Development Server (Recommended)

```powershell
cd .\apps\web-tester
cmd /c npm install
cmd /c npm run dev
```

Then open **http://localhost:5173** (or the port shown in terminal) in your browser.

### Option 2: Static Build & Serve

```powershell
cd .\apps\web-tester
cmd /c npm install
cmd /c npm run build
# Now serve the dist/ directory with any static server
# e.g., VSCode Live Server, python -m http.server, etc.
```

**Important**: When using Live Server or other static servers, open the `dist/` directory (not the project root) to avoid module resolution errors.

### Features

- Load sample models from dropdown or upload custom JSON files via button/drag & drop
- Start sessions and play through choices interactively
- View current state (nodeId, flags, resources, time) in real-time
- GUI editor ("モデルを編集" button) for visual node/choice editing
- Preview story flow and download edited JSON

## Lint/Format (TS)

Run Prettier and ESLint for the TypeScript engine:

```powershell
cd .\packages\engine-ts
cmd /c npm install
cmd /c npm run format
cmd /c npm run lint -- --max-warnings=0
cmd /c npm run lint:fix
```

CI (`.github/workflows/ci.yml`) では `npm run lint -- --max-warnings=0` / `npm run build` / `npm run validate:models` を自動実行し、リポジトリの整合性を常時チェックします。

## Directory Structure

- `models/schema/playthrough.schema.json` — canonical schema
- `models/examples/linear.json` — minimal sample model
- `packages/sdk-unity/Runtime/*.cs` — engine code (Model/Session/Engine/Converters)
- `packages/sdk-unity/package.json` — UPM metadata
- `packages/sdk-unity/Runtime/NarrativeGen.asmdef` — assembly definition
- `packages/samples/PlaythroughCli` — CLI sample project for verification
- `packages/engine-ts/` — TypeScript engine and tools (Ajv validation)

## Run tests (C#)

```powershell
dotnet test .\packages\tests\NarrativeGen.Tests -c Release
```

The NUnit smoke test `EngineSmokeTests` loads `models/examples/linear.json`, plays through `start -> scene1 -> end`, and asserts that the engine returns expected nodes and zero choices at the end.

## Development Notes

- Design principles and decision logs are documented in `docs/architecture.md` and `choices-driven-development.md`
- TypeScript engine の型検証・整合チェック仕様も `docs/architecture.md` を参照
- Refactoring should be done in small steps, with updated documentation and test procedures before committing/pushing.

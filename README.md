# NarrativeGen

Rebuild from scratch: A narrative playthrough engine and Unity SDK.

- `models/` — JSON schema and sample models
- `packages/sdk-unity/` — Unity-ready SDK package (C# runtime)
- `packages/samples/PlaythroughCli/` — CLI sample project for verification

## Purpose (Rebuild from scratch)

- Break away from the existing project's technical debt and design flaws
- Build a minimal, correct, and maintainable core
- Follow SoC/SOLID principles (Model / Session / Engine)
- Integrate with Unity using a UPM package (`com.vastcore.narrativegen`)

## Setup

### Requirements

- .NET SDK 6 or later
- Unity 2021.3+ (for UPM integration)

1. Build the runtime

```powershell
dotnet build .\packages\sdk-unity -c Release
```

1. Run the sample

```powershell
dotnet run --project .\packages\samples\PlaythroughCli
```

## Validate models (Node/Ajv)

Requirements:

- Node.js 18+

Steps:

```powershell
cd .\packages\engine-ts
cmd /c npm install
cmd /c npm run build
cmd /c npm run validate:models
```

## Directory Structure

- `models/schema/playthrough.schema.json` — canonical schema
- `models/examples/linear.json` — minimal sample model
- `packages/sdk-unity/Runtime/*.cs` — engine code (Model/Session/Engine/Converters)
- `packages/sdk-unity/package.json` — UPM metadata
- `packages/sdk-unity/Runtime/VastCore.NarrativeGen.asmdef` — assembly definition
- `packages/samples/PlaythroughCli` — CLI sample project for verification
- `packages/engine-ts/` — TypeScript engine and tools (Ajv validation)

## Development Notes

- Design principles and decision logs are documented in `docs/architecture.md` and `choices-driven-development.md`
- Refactoring should be done in small steps, with updated documentation and test procedures before committing/pushing.

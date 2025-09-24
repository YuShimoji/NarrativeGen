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

### Build (C# runtime)

```powershell
dotnet build .\packages\sdk-unity -c Release
```

### Run sample (CLI)

```powershell
dotnet run --project .\packages\samples\PlaythroughCli
```

## Key State (C#)

`VastCore.NarrativeGen.Engine` is used to load models, start sessions, get available choices, and apply choices.

- Sample model: `models/examples/linear.json`
- API: `LoadModel(json)`, `StartSession(model)`, `GetAvailableChoices(session, model)`, `ApplyChoice(session, model, choiceId)`

## Test Procedure

1. Verify JSON schema integrity

   ```powershell
   Get-Content .\models\schema\playthrough.schema.json | ConvertFrom-Json | Out-Null
   Get-Content .\models\examples\linear.json | ConvertFrom-Json | Out-Null
   ```

2. Build the runtime

   ```powershell
   dotnet build .\packages\sdk-unity -c Release
   ```

3. Run the sample

   ```powershell
   dotnet run --project .\packages\samples\PlaythroughCli
   ```

Expected result:

- The console will display the starting node's text and choices, and then terminate after selecting `c1` or `c2` and reaching the ending node.

## Directory Structure

- `models/schema/playthrough.schema.json` — canonical schema
- `models/examples/linear.json` — minimal sample model
- `packages/sdk-unity/Runtime/*.cs` — engine code (Model/Session/Engine/Converters)
- `packages/sdk-unity/package.json` — UPM metadata
- `packages/sdk-unity/Runtime/VastCore.NarrativeGen.asmdef` — assembly definition
- `packages/samples/PlaythroughCli` — CLI sample project for verification

## Development Notes

- Design principles and decision logs are documented in `docs/architecture.md` and `choices-driven-development.md`
- Refactoring should be done in small steps, with updated documentation and test procedures before committing/pushing.

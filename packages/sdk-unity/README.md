# NarrativeGen Unity SDK

Minimal C# SDK mirroring the TypeScript engine API. Intended for use in Unity as a UPM package.

## Installation

### Option 1: Unity Package Manager (Recommended)

1. Open Unity Package Manager (Window > Package Manager)
2. Click "+" > "Add package from git URL"
3. Enter: `https://github.com/YuShimoji/NarrativeGen.git?path=packages/sdk-unity`

### Option 2: Manual Installation

1. Clone this repository
2. Copy `packages/sdk-unity` folder into your Unity project's `Packages/` directory

## Dependencies

Requires:
- Unity 2021.3 or later
- `com.unity.nuget.newtonsoft-json` (automatically installed via UPM)

## API Overview

- `Engine.LoadModel(json)` - Parse and validate JSON model
- `Engine.StartSession(model, initialState?)` - Create new session
- `Engine.GetAvailableChoices(session, model)` - Get choices for current node
- `Engine.ApplyChoice(session, model, choiceId)` - Apply choice and advance state
- `Engine.Serialize(session)` / `Engine.Deserialize(payload)` - Session persistence

## Quick Example

```csharp
using UnityEngine;
using NarrativeGen;

public class NarrativeController : MonoBehaviour
{
    public TextAsset modelJson; // Assign in Inspector

    void Start()
    {
        var model = Engine.LoadModel(modelJson.text);
        var session = Engine.StartSession(model);

        var choices = Engine.GetAvailableChoices(session, model);
        if (choices.Count > 0)
        {
            session = Engine.ApplyChoice(session, model, choices[0].Id);
            Debug.Log($"Moved to node: {session.CurrentNodeId}");
        }
    }
}
```

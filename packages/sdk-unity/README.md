# NarrativeGen Unity SDK (stub)

Minimal C# SDK mirroring the TypeScript engine API. Intended for use in Unity.

API sketch:

- LoadModel(json)
- StartSession(initialState)
- GetAvailableChoices(session)
- ApplyChoice(session, choiceId)
- Serialize(session) / Deserialize(payload)

This stub compiles as a .NET class library; Unity integration and full feature parity will be added later.

## Quick Example

```csharp
using System;
using System.IO;
using NarrativeGen;

class Example
{
    static void Main()
    {
        var json = File.ReadAllText("path/to/models/examples/linear.json");
        var model = Engine.LoadModel(json);
        var session = Engine.StartSession(model);

        var choices = Engine.GetAvailableChoices(session, model);
        foreach (var c in choices)
        {
            Console.WriteLine($"Choice: {c.Id} - {c.Text}");
        }

        // Apply the first available choice
        if (choices.Count > 0)
        {
            session = Engine.ApplyChoice(session, model, choices[0].Id);
            Console.WriteLine($"Moved to node: {session.CurrentNodeId}");
        }
    }
}
```

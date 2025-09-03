# NarrativeGen Unity SDK (stub)

Minimal C# SDK mirroring the TypeScript engine API. Intended for use in Unity.

API sketch:
- LoadModel(json)
- StartSession(initialState)
- GetAvailableChoices(session)
- ApplyChoice(session, choiceId)
- Serialize(session) / Deserialize(payload)

This stub compiles as a .NET class library; Unity integration and full feature parity will be added later.

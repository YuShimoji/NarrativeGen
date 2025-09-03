# NarrativeGen

Core narrative playthrough engine and models.

- packages/engine-ts: TypeScript engine (Node/Browser)
- packages/sdk-unity: C# SDK stub for Unity
- models/: Canonical JSON Schema and example models

## Quick Start (engine-ts)

- Install: `npm install` (in `packages/engine-ts`)
- Build: `npm run build`
- Test: `npm test`

Minimal usage:
```ts
import { loadModel, startSession, getAvailableChoices, applyChoice } from './dist/index.js'
import model from '../models/examples/linear.json' assert { type: 'json' }

const validated = loadModel(model)
let session = startSession(validated)
console.log(getAvailableChoices(session))
session = applyChoice(session, validated, 'c1')
```

## Repository layout
- models/schema/playthrough.schema.json — canonical schema
- models/examples/*.json — sample models
- packages/engine-ts — engine API
- packages/sdk-unity — Unity-ready SDK stub

## CI
GitHub Actions workflow runs tests and model validation under `packages/engine-ts`.

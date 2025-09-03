import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadModel, startSession, getAvailableChoices, applyChoice, serialize, deserialize } from '../src/index'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelsDir = path.resolve(__dirname, '../../..', 'models', 'examples')

describe('engine basic flow', () => {
  it('loads and validates a model, plays one step', () => {
    const linearPath = path.join(modelsDir, 'linear.json')
    const modelJson = JSON.parse(fs.readFileSync(linearPath, 'utf-8'))
    const model = loadModel(modelJson)
    let session = startSession(model)
    const choices = getAvailableChoices(session, model)
    expect(choices.length).toBeGreaterThan(0)
    const first = choices[0]
    session = applyChoice(session, model, first.id)
    expect(session.nodeId).not.toBe(model.startNode)
    const payload = serialize(session)
    const roundtrip = deserialize(payload)
    expect(roundtrip.nodeId).toBe(session.nodeId)
  })
})

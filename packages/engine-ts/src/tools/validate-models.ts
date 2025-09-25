import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadModel, startSession, getAvailableChoices, applyChoice } from '../index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelsDir = path.resolve(__dirname, '../../../..', 'models', 'examples')

function validateAll() {
  const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.json'))
  let okCount = 0
  for (const f of files) {
    const full = path.join(modelsDir, f)
    const json = JSON.parse(fs.readFileSync(full, 'utf-8'))
    const model = loadModel(json)
    // simple smoke run
    let session = startSession(model)
    const choices = getAvailableChoices(session, model)
    if (choices[0]) {
      session = applyChoice(session, model, choices[0].id)
    }
    okCount++
    console.log(`Validated: ${f}`)
  }
  console.log(`Validated ${okCount} model(s).`)
}

validateAll()

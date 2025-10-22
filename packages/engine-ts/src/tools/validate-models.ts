import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// eslint-disable-next-line import/no-unresolved
import { loadModel, startSession, getAvailableChoices, applyChoice } from '../index.js'

function readJsonFile(filePath: string): unknown {
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content) as unknown
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelsDir = path.resolve(__dirname, '../../../..', 'models', 'examples')

function validateAll() {
  const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.json'))
  let okCount = 0
  for (const f of files) {
    const full = path.join(modelsDir, f)
    const jsonData = readJsonFile(full)
    const model = loadModel(jsonData)
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

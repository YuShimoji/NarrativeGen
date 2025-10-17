import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import Ajv from 'ajv'

import type { Model } from './types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadSchema(): any {
  const schemaPath = path.resolve(
    __dirname,
    '../../..',
    'models',
    'schema',
    'playthrough.schema.json',
  )
  const json = fs.readFileSync(schemaPath, 'utf-8')
  return JSON.parse(json)
}

export function loadModel(model: any): Model {
  const ajv = new Ajv({ allErrors: true, strict: false })
  const schema = loadSchema()
  const validate = ajv.compile(schema)
  const ok = validate(model)
  if (!ok) {
    const err = ajv.errorsText(validate.errors, { separator: '\n' })
    throw new Error(`Model validation failed:\n${err}`)
  }
  return model as Model
}

export { deserialize, applyChoice, getAvailableChoices, serialize, startSession } from './session-ops'
export { GameSession, type GameSessionOptions } from './game-session'
export { Inventory } from './inventory'
export type { Entity } from './entities'
export { parseEntitiesCsv, loadEntitiesFromFile } from './entities'
export * from './types'

import { parseCsvLine } from './file-utils.js'

const MODEL_TYPE = 'adventure-playthrough'

function normalizeHeader(header) {
  return String(header || '').trim().toLowerCase().replace(/\s+/g, '_')
}

function buildHeaderIndex(headers) {
  const index = new Map()
  headers.forEach((header, i) => {
    index.set(normalizeHeader(header), i)
  })
  return index
}

function findIndex(index, names) {
  for (const name of names) {
    const idx = index.get(normalizeHeader(name))
    if (idx !== undefined) return idx
  }
  return -1
}

function cell(cells, idx) {
  return idx >= 0 ? String(cells[idx] ?? '').trim() : ''
}

function detectDelimiter(text, filename = '') {
  if (filename.toLowerCase().endsWith('.tsv')) return '\t'
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? ''
  return firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ','
}

function parseRows(text, delimiter) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => parseCsvLine(line, delimiter))
}

function parseBoolean(value) {
  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  throw new Error(`Expected boolean value, got "${value}"`)
}

function parseNumber(value) {
  const parsed = Number.parseFloat(String(value).trim())
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected numeric value, got "${value}"`)
  }
  return parsed
}

function parseVariableValue(value) {
  const trimmed = String(value).trim()
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number.parseFloat(trimmed)
  return trimmed
}

function parseKeyValuePairs(text, type) {
  const result = {}
  if (!text) return result

  for (const rawPair of String(text).split(';')) {
    const pair = rawPair.trim()
    if (!pair) continue

    const eq = pair.indexOf('=')
    if (eq <= 0) {
      throw new Error(`Expected key=value pair, got "${pair}"`)
    }

    const key = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim()
    if (!key) continue

    if (type === 'boolean') {
      result[key] = parseBoolean(value)
    } else if (type === 'number') {
      result[key] = parseNumber(value)
    } else {
      result[key] = parseVariableValue(value)
    }
  }

  return result
}

function parseInitialState(firstDataRow, index) {
  return {
    flags: parseKeyValuePairs(cell(firstDataRow, findIndex(index, ['initial_flags'])), 'boolean'),
    resources: parseKeyValuePairs(cell(firstDataRow, findIndex(index, ['initial_resources'])), 'number'),
    variables: parseKeyValuePairs(cell(firstDataRow, findIndex(index, ['initial_variables'])), 'variable'),
  }
}

function parseJsonObjectCell(rawValue, label) {
  if (!rawValue) return null

  let parsed
  try {
    parsed = JSON.parse(rawValue)
  } catch (error) {
    throw new Error(`${label} JSON parse failed: ${error.message}`)
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`)
  }

  return parsed
}

function parseComparison(raw, label) {
  const match = String(raw).trim().match(/^([A-Za-z0-9_.-]+)\s*(>=|<=|==|!=|>|<|contains|!contains)\s*(.+)$/)
  if (!match) throw new Error(`Invalid ${label} expression "${raw}"`)
  return {
    key: match[1].trim(),
    op: match[2],
    value: match[3].trim(),
  }
}

function parseConditions(text) {
  if (!text) return []
  return String(text).split(';').map((raw) => {
    const token = raw.trim()
    if (!token) return null

    if (token.startsWith('flag:')) {
      const body = token.slice(5)
      const match = body.match(/^(.+?)(?:==|=)(.+)$/)
      if (!match) throw new Error(`Flag condition must use equality: "${token}"`)
      const key = match[1].trim()
      const value = match[2].trim()
      return { type: 'flag', key, value: parseBoolean(value) }
    }

    if (token.startsWith('resource:')) {
      const parsed = parseComparison(token.slice(9), 'resource condition')
      if (parsed.op === '!=' || parsed.op === 'contains' || parsed.op === '!contains') {
        throw new Error(`Resource condition uses unsupported operator "${parsed.op}"`)
      }
      return { type: 'resource', key: parsed.key, op: parsed.op, value: parseNumber(parsed.value) }
    }

    if (token.startsWith('variable:') || token.startsWith('var:')) {
      const body = token.startsWith('variable:') ? token.slice(9) : token.slice(4)
      const parsed = parseComparison(body, 'variable condition')
      const numericOps = new Set(['>=', '<=', '>', '<'])
      return {
        type: 'variable',
        key: parsed.key,
        op: parsed.op,
        value: numericOps.has(parsed.op) ? parseNumber(parsed.value) : parseVariableValue(parsed.value),
      }
    }

    if (token.startsWith('timeWindow:')) {
      const [start, end] = token.slice(11).split('-').map((value) => parseNumber(value))
      return { type: 'timeWindow', start, end }
    }

    if (token.startsWith('hasItem:')) {
      const parsed = parseComparison(token.slice(8), 'inventory condition')
      return { type: 'hasItem', key: parsed.key, value: parseBoolean(parsed.value) }
    }

    throw new Error(`Unknown condition token "${token}"`)
  }).filter(Boolean)
}

function parseEffects(text) {
  if (!text) return []
  return String(text).split(';').map((raw) => {
    const token = raw.trim()
    if (!token) return null

    if (token.startsWith('setFlag:')) {
      const eq = token.indexOf('=')
      if (eq < 0) throw new Error(`Invalid setFlag effect "${token}"`)
      return {
        type: 'setFlag',
        key: token.slice(8, eq).trim(),
        value: parseBoolean(token.slice(eq + 1)),
      }
    }

    if (token.startsWith('addResource:')) {
      const eq = token.indexOf('=')
      if (eq < 0) throw new Error(`Invalid addResource effect "${token}"`)
      return {
        type: 'addResource',
        key: token.slice(12, eq).trim(),
        delta: parseNumber(token.slice(eq + 1)),
      }
    }

    if (token.startsWith('setVariable:')) {
      const eq = token.indexOf('=')
      if (eq < 0) throw new Error(`Invalid setVariable effect "${token}"`)
      return {
        type: 'setVariable',
        key: token.slice(12, eq).trim(),
        value: parseVariableValue(token.slice(eq + 1)),
      }
    }

    if (token.startsWith('addItem:')) {
      return { type: 'addItem', key: token.slice(8).trim() }
    }

    if (token.startsWith('removeItem:')) {
      return { type: 'removeItem', key: token.slice(11).trim() }
    }

    if (token.startsWith('goto:')) {
      return { type: 'goto', target: token.slice(5).trim() }
    }

    throw new Error(`Unknown effect token "${token}"`)
  }).filter(Boolean)
}

function normalizeObjectArray(value, label, rowNumber, choiceId) {
  if (value == null) return undefined
  if (!Array.isArray(value)) {
    throw new Error(`Row ${rowNumber}: ${label} for choice "${choiceId}" must be an array`)
  }
  return value.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Row ${rowNumber}: ${label} for choice "${choiceId}" must contain objects`)
    }
    return { ...entry }
  })
}

function normalizeChoice(choice, rowNumber, index) {
  if (!choice || typeof choice !== 'object' || Array.isArray(choice)) {
    throw new Error(`Row ${rowNumber}: choice ${index + 1} must be an object`)
  }

  const id = String(choice.id || `choice_${index + 1}`).trim()
  const text = String(choice.text || '').trim()
  const target = choice.target == null ? '' : String(choice.target).trim()
  const normalized = { id, text, target }

  const conditions = normalizeObjectArray(choice.conditions, 'conditions', rowNumber, id)
  if (conditions) normalized.conditions = conditions
  const effects = normalizeObjectArray(choice.effects, 'effects', rowNumber, id)
  if (effects) normalized.effects = effects
  if (choice.outcome && typeof choice.outcome === 'object' && !Array.isArray(choice.outcome)) {
    normalized.outcome = { ...choice.outcome }
  }

  return normalized
}

function parseChoicesJson(rawChoices, rowNumber) {
  if (!rawChoices) return []
  let parsed
  try {
    parsed = JSON.parse(rawChoices)
  } catch (error) {
    throw new Error(`Row ${rowNumber}: choices JSON parse failed: ${error.message}`)
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`Row ${rowNumber}: choices must be a JSON array`)
  }
  return parsed.map((choice, index) => normalizeChoice(choice, rowNumber, index))
}

function getModelType(firstDataRow, index) {
  return cell(firstDataRow, findIndex(index, ['model_type', 'modeltype'])) || MODEL_TYPE
}

function buildModel({ firstDataRow, index, startNode, nodes }) {
  const initial = parseInitialState(firstDataRow, index)
  const model = {
    modelType: getModelType(firstDataRow, index),
    startNode,
    flags: initial.flags,
    resources: initial.resources,
    variables: initial.variables,
    nodes,
  }

  const settingsPresentation = parseJsonObjectCell(
    cell(firstDataRow, findIndex(index, ['settings_presentation', 'presentation_settings'])),
    'settings_presentation'
  )
  if (settingsPresentation) {
    model.settings = { presentation: settingsPresentation }
  }

  return model
}

function parseCompactRows(rows, index) {
  const idIdx = findIndex(index, ['id'])
  const speakerIdx = findIndex(index, ['speaker'])
  const textIdx = findIndex(index, ['text'])
  const choicesIdx = findIndex(index, ['choices'])
  const startNodeIdx = findIndex(index, ['start_node', 'startnode'])

  const nodes = {}
  let firstDataRow = null
  let startNode = ''

  rows.slice(1).forEach((row, rowOffset) => {
    const rowNumber = rowOffset + 2
    const nodeId = cell(row, idIdx)
    if (!nodeId) return

    if (!firstDataRow) {
      firstDataRow = row
      startNode = cell(row, startNodeIdx) || nodeId
    }

    const node = {
      id: nodeId,
      text: cell(row, textIdx),
      choices: parseChoicesJson(cell(row, choicesIdx), rowNumber),
    }
    const speaker = cell(row, speakerIdx)
    if (speaker) node.speaker = speaker

    nodes[nodeId] = node
  })

  if (!firstDataRow || !startNode) throw new Error('CSV does not contain any node rows')
  return buildModel({ firstDataRow, index, startNode, nodes })
}

function parseSplitRows(rows, index) {
  const nodeIdIdx = findIndex(index, ['node_id'])
  const speakerIdx = findIndex(index, ['speaker'])
  const nodeTextIdx = findIndex(index, ['node_text'])
  const choiceIdIdx = findIndex(index, ['choice_id'])
  const choiceTextIdx = findIndex(index, ['choice_text'])
  const choiceTargetIdx = findIndex(index, ['choice_target'])
  const choiceConditionsIdx = findIndex(index, ['choice_conditions'])
  const choiceEffectsIdx = findIndex(index, ['choice_effects'])
  const outcomeTypeIdx = findIndex(index, ['choice_outcome_type'])
  const outcomeValueIdx = findIndex(index, ['choice_outcome_value'])
  const startNodeIdx = findIndex(index, ['start_node', 'startnode'])

  const nodes = {}
  let firstDataRow = null
  let startNode = ''

  rows.slice(1).forEach((row, rowOffset) => {
    const rowNumber = rowOffset + 2
    const nodeId = cell(row, nodeIdIdx)
    if (!nodeId) return

    if (!firstDataRow) {
      firstDataRow = row
      startNode = cell(row, startNodeIdx) || nodeId
    }

    if (!nodes[nodeId]) {
      nodes[nodeId] = { id: nodeId, text: '', choices: [] }
    }

    const speaker = cell(row, speakerIdx)
    if (speaker) nodes[nodeId].speaker = speaker

    const nodeText = cell(row, nodeTextIdx)
    if (nodeText) nodes[nodeId].text = nodeText

    const choiceId = cell(row, choiceIdIdx)
    const choiceText = cell(row, choiceTextIdx)
    const choiceTarget = cell(row, choiceTargetIdx)
    if (!choiceId && !choiceText && !choiceTarget) return

    const choice = {
      id: choiceId || `${nodeId}_choice_${nodes[nodeId].choices.length + 1}`,
      text: choiceText,
      target: choiceTarget,
    }

    const conditions = parseConditions(cell(row, choiceConditionsIdx))
    if (conditions.length > 0) choice.conditions = conditions
    const effects = parseEffects(cell(row, choiceEffectsIdx))
    if (effects.length > 0) choice.effects = effects

    const outcomeType = cell(row, outcomeTypeIdx)
    if (outcomeType) {
      choice.outcome = { type: outcomeType }
      const outcomeValue = cell(row, outcomeValueIdx)
      if (outcomeValue) choice.outcome.value = outcomeValue
    }

    nodes[nodeId].choices.push(choice)
  })

  if (!firstDataRow || !startNode) throw new Error('CSV does not contain any node rows')
  return buildModel({ firstDataRow, index, startNode, nodes })
}

export function isCsvModelFileName(filename = '') {
  return /\.(csv|tsv)$/i.test(filename)
}

export function parseCsvModel(text, options = {}) {
  const delimiter = detectDelimiter(text, options.filename)
  const rows = parseRows(text, delimiter)
  if (rows.length < 2) throw new Error('CSV must include a header and at least one node row')

  const index = buildHeaderIndex(rows[0])
  const hasCompactColumns = findIndex(index, ['id']) >= 0 && findIndex(index, ['text']) >= 0
  const hasSplitColumns = findIndex(index, ['node_id']) >= 0 && findIndex(index, ['node_text']) >= 0

  if (hasCompactColumns) return parseCompactRows(rows, index)
  if (hasSplitColumns) return parseSplitRows(rows, index)

  throw new Error('CSV must include id/text/choices or node_id/node_text columns')
}

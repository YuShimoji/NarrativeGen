import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { resolveNodeId } from '../../../packages/engine-ts/dist/resolver.js'
import { parseCsvLine, parseEffects } from '../utils/csv-parser.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const csvPath = path.resolve(__dirname, '../models/examples/test_hierarchy.csv')
const text = fs.readFileSync(csvPath, 'utf-8')
const delim = text.includes('\t') ? '\t' : ','
const rows = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

if (rows.length < 2) {
  throw new Error('CSV has no data rows')
}

const headers = parseCsvLine(rows[0], delim).map((h) => h.trim())
const idx = {
  node_group: headers.indexOf('node_group'),
  node_id: headers.indexOf('node_id'),
  choice_target: headers.indexOf('choice_target'),
  choice_effects: headers.indexOf('choice_effects'),
}

const nodes = {}
const pendingChoices = []

for (let i = 1; i < rows.length; i++) {
  const cells = parseCsvLine(rows[i], delim)
  const group = idx.node_group >= 0 ? (cells[idx.node_group] || '').trim() : ''
  const localId = idx.node_id >= 0 ? (cells[idx.node_id] || '').trim() : ''
  if (!localId) continue

  const canonicalId = group ? `${group}/${localId}` : localId
  if (!nodes[canonicalId]) {
    nodes[canonicalId] = { id: canonicalId, choices: [] }
  }

  const rawTarget = idx.choice_target >= 0 ? (cells[idx.choice_target] || '').trim() : ''
  const resolvedTarget = rawTarget ? resolveNodeId(rawTarget, group) : canonicalId
  const normalizedTarget = resolvedTarget || '__ROOT__'

  const rawEffects = idx.choice_effects >= 0 ? (cells[idx.choice_effects] || '').trim() : ''
  const effects = rawEffects ? parseEffects(rawEffects) : []
  effects.forEach((effect) => {
    if (effect.type === 'goto' && effect.target) {
      effect.target = resolveNodeId(effect.target, group) || '__ROOT__'
    }
  })

  if (rawTarget || effects.length > 0) {
    pendingChoices.push({ source: canonicalId, target: normalizedTarget, effects })
  }
}

const allNodeIds = Object.keys(nodes)
const rootNode = allNodeIds.find((id) => !id.includes('/')) || allNodeIds[0]
if (!rootNode) {
  throw new Error('No nodes found')
}

pendingChoices.forEach((choice) => {
  const target = choice.target === '__ROOT__' ? rootNode : choice.target
  if (!nodes[target]) {
    throw new Error(`Missing choice target: ${target} (from ${choice.source})`)
  }
  choice.effects.forEach((effect) => {
    if (effect.type === 'goto') {
      const gotoTarget = effect.target === '__ROOT__' ? rootNode : effect.target
      if (!nodes[gotoTarget]) {
        throw new Error(`Missing goto target: ${gotoTarget} (from ${choice.source})`)
      }
    }
  })
})

console.log(`Hierarchy CSV verification passed: ${allNodeIds.length} nodes, ${pendingChoices.length} transitions`)

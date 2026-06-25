import { describe, expect, it } from 'vitest'
import {
  applyChoice,
  createAIProvider,
  getAvailableChoices,
  loadModel,
  startSession,
} from '../src/index.js'
import { expandTemplate } from '../src/template.js'
import type { Choice, Model } from '../src/types.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelPath = path.resolve(__dirname, '../../../models/examples/vertical-slice.json')
const csvPath = path.resolve(__dirname, '../../../models/spreadsheets/vertical-slice.csv')

const raw = JSON.parse(fs.readFileSync(modelPath, 'utf-8'))

function ids(choices: Choice[]): string[] {
  return choices.map((choice) => choice.id)
}

function applyRoute(model: Model, route: string[]) {
  let session = startSession(model)
  for (const choiceId of route) {
    session = applyChoice(session, model, choiceId)
  }
  return session
}

function reachableNodeIds(model: Model): Set<string> {
  const reachable = new Set<string>()
  const queue = [model.startNode]

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    if (reachable.has(nodeId)) continue
    const node = model.nodes[nodeId]
    if (!node) continue
    reachable.add(nodeId)

    for (const choice of node.choices ?? []) {
      if (choice.target && !reachable.has(choice.target)) {
        queue.push(choice.target)
      }
    }
  }

  return reachable
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current)
  return cells
}

describe('vertical-slice.json - playable first acceptance', () => {
  const model = loadModel(raw)

  it('is the canonical 10-15 node playable slice artifact', () => {
    expect(model.startNode).toBe('desk')
    expect(Object.keys(model.nodes)).toHaveLength(12)
    expect(model.flags).toMatchObject({
      found_hook: false,
      trusted_mira: false,
      ai_draft_adopted: false,
    })
    expect(model.resources).toMatchObject({ focus: 2, evidence: 0 })
    expect(model.variables?.lead_name).toBe('the missing bell')
  })

  it('has no statically unreachable nodes', () => {
    expect([...reachableNodeIds(model)].sort()).toEqual(Object.keys(model.nodes).sort())
  })

  it('plays hook-to-proof route to the proof ending', () => {
    const session = applyRoute(model, [
      'open_notebook',
      'interview_mira',
      'ask_key',
      'decode_ledger',
      'publish_with_proof',
    ])

    expect(session.nodeId).toBe('truth_end')
    expect(session.flags.found_hook).toBe(true)
    expect(session.flags.trusted_mira).toBe(true)
    expect(session.resources.evidence).toBe(3)
    expect(session.resources.focus).toBe(1)
    expect(session.variables.lead_name).toBe('the clocktower bell')
  })

  it('keeps the under-evidenced branch playable while hiding proof-gated choices', () => {
    let session = applyRoute(model, ['listen_alley', 'follow_footprints'])
    expect(session.nodeId).toBe('archive')
    expect(session.resources.evidence).toBe(1)
    expect(ids(getAvailableChoices(session, model))).toEqual(['take_obvious_answer'])

    session = applyChoice(session, model, 'take_obvious_answer')
    expect(session.nodeId).toBe('false_end')
  })

  it('plays the mock-adoption lane as a connected node path', () => {
    let session = applyRoute(model, ['open_notebook', 'draft_scene'])
    expect(session.nodeId).toBe('drafting')

    session = applyChoice(session, model, 'use_mock_ai')
    expect(session.nodeId).toBe('ai_mock_scene')
    expect(session.flags.ai_draft_adopted).toBe(true)
    expect(session.variables.draft_status).toBe('mock scene adopted')

    session = applyChoice(session, model, 'connect_ai_archive')
    expect(session.nodeId).toBe('archive')
    expect(session.resources.evidence).toBe(3)
    expect(ids(getAvailableChoices(session, model))).toContain('decode_ledger')
  })

  it('expands dynamic text on the played route', () => {
    const session = applyRoute(model, [
      'open_notebook',
      'interview_mira',
      'ask_key',
      'decode_ledger',
    ])
    const text = expandTemplate(model.nodes.reveal.text!, model, session)

    expect(text).toContain('the clocktower bell')
    expect(text).toContain('Evidence: 3')
    expect(text).toContain('You have enough proof to publish.')
  })

  it('survives JSON save and reload with the same route intact', () => {
    const saved = JSON.stringify(model, null, 2)
    const reloaded = loadModel(JSON.parse(saved))
    const session = applyRoute(reloaded, [
      'open_notebook',
      'interview_mira',
      'ask_key',
      'decode_ledger',
      'publish_with_proof',
    ])

    expect(session.nodeId).toBe('truth_end')
  })

  it('can adopt a mock provider result into the graph and keep it after reload', async () => {
    const provider = createAIProvider({ provider: 'mock' })
    const generatedText = await provider.generateNextNode({
      previousNodes: [{ id: 'drafting', text: model.nodes.drafting.text ?? '' }],
      currentNodeText: model.nodes.drafting.text ?? '',
      choiceText: 'Adopt continuation',
    })

    const adoptedModel = loadModel(JSON.parse(JSON.stringify(model))) as Model
    adoptedModel.nodes.ai_adopted_node = {
      id: 'ai_adopted_node',
      text: generatedText,
      choices: [{ id: 'continue_to_archive', text: 'Connect to the archive', target: 'archive' }],
    }
    adoptedModel.nodes.drafting.choices = [
      ...(adoptedModel.nodes.drafting.choices ?? []),
      { id: 'adopt_generated_node', text: 'Adopt generated node', target: 'ai_adopted_node' },
    ]

    const reloaded = loadModel(JSON.parse(JSON.stringify(adoptedModel)))
    let session = startSession(reloaded, {
      nodeId: 'drafting',
      flags: { ...reloaded.flags, found_hook: true },
      resources: { ...reloaded.resources, evidence: 1 },
      variables: { ...reloaded.variables, draft_status: 'mock generated' },
    })

    expect(Object.keys(reloaded.nodes)).toHaveLength(13)
    expect(ids(getAvailableChoices(session, reloaded))).toContain('adopt_generated_node')

    session = applyChoice(session, reloaded, 'adopt_generated_node')
    expect(session.nodeId).toBe('ai_adopted_node')
    expect(reloaded.nodes.ai_adopted_node.text).toBeTruthy()

    session = applyChoice(session, reloaded, 'continue_to_archive')
    expect(session.nodeId).toBe('archive')
  })
})

describe('vertical-slice.csv - writer-facing companion artifact', () => {
  it('is readable and keeps JSON choices parseable', () => {
    const lines = fs.readFileSync(csvPath, 'utf-8').trim().split(/\r?\n/)
    const header = parseCsvLine(lines[0])

    expect(header).toEqual([
      'id',
      'speaker',
      'text',
      'choices',
      'model_type',
      'start_node',
      'initial_flags',
      'initial_resources',
      'initial_variables',
      'settings_presentation',
    ])
    expect(lines).toHaveLength(13)

    const rows = lines.slice(1).map(parseCsvLine)
    expect(rows.map((row) => row[0])).toContain('desk')
    expect(rows.map((row) => row[0])).toContain('truth_end')
    expect(rows.find((row) => row[0] === 'mira')?.[1]).toBe('Mira')
    expect(rows[0][4]).toBe('adventure-playthrough')
    expect(rows[0][5]).toBe('desk')
    expect(rows[0][6]).toContain('found_hook=false')
    expect(rows[0][7]).toContain('focus=2')
    expect(rows[0][8]).toContain('lead_name=the missing bell')
    expect(JSON.parse(rows[0][9])).toEqual({
      defaultTransition: 'append-scroll',
      paragraphDelay: 60,
      transitionDuration: 180,
    })

    for (const row of rows) {
      expect(() => JSON.parse(row[3])).not.toThrow()
    }
  })
})

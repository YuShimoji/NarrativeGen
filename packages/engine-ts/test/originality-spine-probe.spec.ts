import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  applyChoice,
  getAvailableChoices,
  loadModel,
  resolveNarrativeDisplayText,
  startSession,
} from '../src/index.js'
import type { Choice, Model } from '../src/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelPath = path.resolve(__dirname, '../../../models/examples/originality-spine-probe.json')
const raw = JSON.parse(fs.readFileSync(modelPath, 'utf-8'))

function ids(choices: Choice[]): string[] {
  return choices.map((choice) => choice.id)
}

describe('originality-spine-probe.json', () => {
  const model = loadModel(raw) as Model

  it('starts as a compact playable originality probe without evidence resources', () => {
    expect(model.startNode).toBe('desk')
    expect(Object.keys(model.nodes)).toHaveLength(4)
    expect(model.resources).toEqual({})
    expect(model.entities?.receipt_fragment?.properties?.contradiction?.defaultValue)
      .toBe('signed after the bell was sealed')
    expect(model.characters?.mira?.knowledgeProfiles[0].domain).toBe('archive_records')
    expect(model.conversationTemplates?.[0].id).toBe('mira_archive_reframe')
  })

  it('renders entity-property dynamic text on the start node', () => {
    const session = startSession(model)
    const text = resolveNarrativeDisplayText(model.nodes.desk.text!, model, session)

    expect(text).toContain('provenance=clocktower archive desk')
    expect(text).toContain("owner=Mira's mentor")
    expect(text).toContain('credibility=72')
    expect(text).toContain('Mira still reads it as a loose clue.')
  })

  it('creates an event, gates the next route, and appends a conversation template', () => {
    let session = startSession(model)
    expect(ids(getAvailableChoices(session, model))).toEqual([
      'ask_mira_reframe',
      'treat_as_old_clue',
    ])

    session = applyChoice(session, model, 'ask_mira_reframe')
    expect(session.nodeId).toBe('memory_reframed')
    expect(session.flags.meaning_locked).toBe(false)
    expect(session.variables.receipt_reading).toBe('witnessed contradiction')
    expect(session.events.event_mira_reframes_receipt.properties?.semantic_change.defaultValue)
      .toBe('witnessed contradiction')
    expect(ids(getAvailableChoices(session, model))).toEqual(['follow_semantic_change'])

    const text = resolveNarrativeDisplayText(model.nodes.memory_reframed.text!, model, session)
    expect(text).toContain('Mira reframed the receipt changes Receipt Fragment')
    expect(text).toContain('Template response:')
    expect(text).toContain('not as evidence points')

    session = applyChoice(session, model, 'follow_semantic_change')
    expect(session.nodeId).toBe('semantic_end')
  })
})

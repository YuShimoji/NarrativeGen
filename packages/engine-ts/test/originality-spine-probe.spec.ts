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
    expect(model.perceptionPolicies?.[0].id).toBe('mira_receipt_contradiction_policy')
    expect(model.perceptionPolicies?.[0].trigger.node).toBe('memory_reframed')
    expect(model.conversationTemplates?.[0].id).toBe('mira_archive_reframe')
  })

  it('renders entity-property dynamic text on the start node', () => {
    const session = startSession(model)
    const text = resolveNarrativeDisplayText(model.nodes.desk.text!, model, session)

    expect(text).toContain('ミラはレシート片を机に置く')
    expect(text).toContain('出所はclocktower archive desk')
    expect(text).toContain("持ち主はMira's mentor")
    expect(text).toContain('記録上の信用度は72')
    expect(text).toContain('ばらばらの手掛かり')
  })

  it('runs Character Knowledge perception, gates the next route, and appends a conversation template', () => {
    let session = startSession(model)
    const askMira = model.nodes.desk.choices?.find((choice) => choice.id === 'ask_mira_reframe')
    expect(askMira?.effects?.some((effect) => effect.type === 'perceiveEntity')).toBe(false)
    expect(session.events.event_mira_perceives_receipt_contradiction).toBeUndefined()
    expect(ids(getAvailableChoices(session, model))).toEqual([
      'ask_mira_reframe',
      'treat_as_old_clue',
    ])

    session = applyChoice(session, model, 'ask_mira_reframe')
    expect(session.nodeId).toBe('memory_reframed')
    expect(session.flags.meaning_locked).toBe(false)
    expect(session.variables.receipt_reading).toBe('目撃された矛盾')
    expect(session.events.event_mira_perceives_receipt_contradiction.properties?.knowledge_source.defaultValue)
      .toBe('perceiveEntity')
    expect(session.events.event_mira_perceives_receipt_contradiction.properties?.policy_source.defaultValue)
      .toBe('perceptionPolicy:mira_receipt_contradiction_policy')
    expect(session.events.event_mira_perceives_receipt_contradiction.properties?.policy_trigger_node.defaultValue)
      .toBe('memory_reframed')
    expect(session.events.event_mira_perceives_receipt_contradiction.properties?.perception_noticed.defaultValue)
      .toBe(true)
    expect(session.events.event_mira_perceives_receipt_contradiction.properties?.primary_property.defaultValue)
      .toBe('credibility')
    expect(session.events.event_mira_reframes_receipt.properties?.semantic_change.defaultValue)
      .toBe('目撃された矛盾')
    expect(ids(getAvailableChoices(session, model))).toEqual(['follow_semantic_change'])

    const text = resolveNarrativeDisplayText(model.nodes.memory_reframed.text!, model, session)
    expect(text).toContain('ミラは南書庫の記録と照合し')
    expect(text).toContain('目撃された矛盾として読み替える')
    expect(text).toContain('ミラの補足:')
    expect(text).toContain('証拠点ではなく')
    expect(text).not.toContain('perceptionPolicy:mira_receipt_contradiction_policy')
    expect(text).not.toContain('noticed=true')
    expect(text).not.toContain('trigger=memory_reframed')
    expect(text).not.toContain('Template response:')

    session = applyChoice(session, model, 'follow_semantic_change')
    expect(session.nodeId).toBe('semantic_end')
  })
})

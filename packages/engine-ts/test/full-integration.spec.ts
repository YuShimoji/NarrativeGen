import { describe, it, expect } from 'vitest'
import { loadModel, startSession, getAvailableChoices, applyChoice } from '../src/index.js'
import { expandTemplate } from '../src/template.js'
import { findMatchingTemplates } from '../src/conversation-templates.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelPath = path.resolve(__dirname, '../../../models/examples/full_integration.json')
const raw = JSON.parse(fs.readFileSync(modelPath, 'utf-8'))

describe('full_integration.json - session routes', () => {
  const model = loadModel(raw)

  it('loads and validates', () => {
    expect(model.startNode).toBe('market_entrance')
    expect(Object.keys(model.nodes)).toHaveLength(14)
    expect(Object.keys(model.entities!)).toHaveLength(5)
    expect(model.conversationTemplates).toHaveLength(3)
    expect(model.variables).toHaveProperty('last_visited')
    expect(model.variables).toHaveProperty('noted_smell')
  })

  it('starts at market_entrance with correct initial choices', () => {
    const session = startSession(model)
    expect(session.nodeId).toBe('market_entrance')
    const choices = getAvailableChoices(session, model)
    // met_herbalist=false: talk_herbalist available, examine_remedy not
    expect(choices.map(c => c.id)).toContain('talk_herbalist')
    expect(choices.map(c => c.id)).not.toContain('examine_remedy')
    expect(choices.map(c => c.id)).toContain('visit_scholar')
    // no toxicity_anomaly event yet: check_evidence not available
    expect(choices.map(c => c.id)).not.toContain('check_evidence')
  })

  it('Dynamic Text: entity references at start', () => {
    const session = startSession(model)
    const text = expandTemplate(model.nodes.market_entrance.text!, model, session)
    expect(text).toContain('Moonpetal Remedy')
    expect(text).toContain('deep violet')
    expect(text).toContain('A woman in green robes')
    expect(text).toContain('50') // reputation
  })

  it('route: talk herbalist → buy remedy → inventory', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'talk_herbalist')
    expect(session.nodeId).toBe('herbalist_stall')
    expect(session.flags.met_herbalist).toBe(true)
    expect(session.variables.last_visited).toBe('herbalist')

    // herbalist text references
    const text = expandTemplate(model.nodes.herbalist_stall.text!, model, session)
    expect(text).toContain('Moonpetal Remedy')
    expect(text).toContain('30') // cost
    expect(text).toContain('bitter almond') // smell

    // buy remedy
    session = applyChoice(session, model, 'buy_remedy')
    expect(session.nodeId).toBe('bought_remedy')
    expect(session.inventory).toContain('suspect_remedy')
    expect(session.resources.reputation).toBe(55)
  })

  it('route: herbalist → examine → test toxicity → createEvent', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'talk_herbalist')
    session = applyChoice(session, model, 'decline') // back to market

    // now met_herbalist=true: examine_remedy available
    const choices = getAvailableChoices(session, model)
    expect(choices.map(c => c.id)).toContain('examine_remedy')

    session = applyChoice(session, model, 'examine_remedy')
    expect(session.nodeId).toBe('examine_remedy')

    // test toxicity: creates event
    session = applyChoice(session, model, 'test_toxicity')
    expect(session.nodeId).toBe('test_result')
    expect(session.flags.examined_remedy).toBe(true)
    expect(session.resources.knowledge).toBe(20)
    expect(session.events).toHaveProperty('toxicity_anomaly')
    expect(session.events.toxicity_anomaly.properties!.severity.defaultValue).toBe(72)
    expect(session.events.toxicity_anomaly.properties!.category.defaultValue).toBe('poison')
  })

  it('route: scholar → poison lecture → knowledge + items', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'visit_scholar')
    expect(session.nodeId).toBe('scholar_library')

    session = applyChoice(session, model, 'ask_poisons')
    expect(session.nodeId).toBe('poison_lecture')
    expect(session.flags.consulted_scholar).toBe(true)
    expect(session.resources.knowledge).toBe(15)
    expect(session.inventory).toContain('scholar_notes')
  })

  it('full route: herbalist → examine → test → scholar → antidote → confront full', () => {
    let session = startSession(model)

    // meet herbalist
    session = applyChoice(session, model, 'talk_herbalist')
    session = applyChoice(session, model, 'decline')

    // examine remedy → test toxicity: knowledge=20
    session = applyChoice(session, model, 'examine_remedy')
    session = applyChoice(session, model, 'test_toxicity')
    expect(session.resources.knowledge).toBe(20)

    // gather more → scholar: knowledge=35
    session = applyChoice(session, model, 'gather_more')
    session = applyChoice(session, model, 'visit_scholar')
    session = applyChoice(session, model, 'ask_poisons') // +15
    expect(session.resources.knowledge).toBe(35)

    // back to market → scholar → ask antidote (requires toxicity_anomaly event): knowledge=45
    session = applyChoice(session, model, 'thank_scholar')
    session = applyChoice(session, model, 'visit_scholar')
    session = applyChoice(session, model, 'ask_antidote') // +10
    expect(session.resources.knowledge).toBe(45)

    // buy antidote
    session = applyChoice(session, model, 'buy_antidote')
    expect(session.inventory).toContain('antidote_herb')
    expect(session.flags.identified_poison).toBe(true)

    // confront with full evidence (knowledge>=30, identified_poison, consulted_scholar, has scholar_notes)
    session = applyChoice(session, model, 'to_confrontation')
    expect(session.nodeId).toBe('confrontation')

    const choices = getAvailableChoices(session, model)
    expect(choices.map(c => c.id)).toContain('full_accusation')

    session = applyChoice(session, model, 'full_accusation')
    expect(session.nodeId).toBe('resolution_full')
    expect(session.resources.reputation).toBe(80)
    expect(session.events).toHaveProperty('herbalist_exposed')

    // check final text
    const text = expandTemplate(model.nodes.resolution_full.text!, model, session)
    expect(text).toContain('deep violet')
    expect(text).toContain('bitter almond')
    expect(text).toContain('72')
    expect(text).toContain('fresh mint')
  })

  it('ConversationTemplate: toxicity_warning fires on severity >= 50', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'talk_herbalist')
    session = applyChoice(session, model, 'decline')
    session = applyChoice(session, model, 'examine_remedy')

    // before test: no event
    let matches = findMatchingTemplates(model.conversationTemplates!, session, model)
    expect(matches.find(m => m.templateId === 'toxicity_warning')).toBeUndefined()

    // test toxicity: creates toxicity_anomaly with severity=72
    session = applyChoice(session, model, 'test_toxicity')
    matches = findMatchingTemplates(model.conversationTemplates!, session, model)
    const warning = matches.find(m => m.templateId === 'toxicity_warning')
    expect(warning).toBeDefined()
    expect(warning!.expandedText).toContain('dangerously high')
  })

  it('ConversationTemplate: scholarly_insight requires both event + flag', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'talk_herbalist')
    session = applyChoice(session, model, 'decline')
    session = applyChoice(session, model, 'examine_remedy')
    session = applyChoice(session, model, 'test_toxicity')

    // event exists but consulted_scholar=false → scholarly_insight should NOT fire
    let matches = findMatchingTemplates(model.conversationTemplates!, session, model)
    expect(matches.find(m => m.templateId === 'scholarly_insight')).toBeUndefined()

    // consult scholar
    session = applyChoice(session, model, 'gather_more')
    session = applyChoice(session, model, 'visit_scholar')
    session = applyChoice(session, model, 'ask_poisons')

    // now both event + flag → scholarly_insight fires
    matches = findMatchingTemplates(model.conversationTemplates!, session, model)
    const insight = matches.find(m => m.templateId === 'scholarly_insight')
    expect(insight).toBeDefined()
    expect(insight!.expandedText).toContain('Bitter almond')
  })

  it('entity inheritance: medicine inherits from substance', () => {
    const session = startSession(model)
    // medicine.toxicity should resolve to 0 (from substance)
    const text = expandTemplate('[medicine.toxicity]', model, session)
    expect(text).toBe('0')
    // suspect_remedy overrides toxicity to 72
    const text2 = expandTemplate('[suspect_remedy.toxicity]', model, session)
    expect(text2).toBe('72')
  })

  it('variable tracking: noted_smell via smell_test', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'talk_herbalist')
    session = applyChoice(session, model, 'decline')
    session = applyChoice(session, model, 'examine_remedy')
    session = applyChoice(session, model, 'smell_test')
    expect(session.nodeId).toBe('smell_analysis')
    expect(session.variables.noted_smell).toBe('bitter almond')
    expect(session.resources.knowledge).toBe(10)

    const text = expandTemplate(model.nodes.smell_analysis.text!, model, session)
    expect(text).toContain('bitter almond')
    expect(text).toContain("You should consult an expert")
  })
})

import { describe, it, expect } from 'vitest'
import { loadModel, startSession, getAvailableChoices, applyChoice } from '../src/index.js'
import { expandTemplate } from '../src/template.js'
import { findMatchingTemplates } from '../src/conversation-templates.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelPath = path.resolve(__dirname, '../../../models/examples/writer_tutorial.json')
const raw = JSON.parse(fs.readFileSync(modelPath, 'utf-8'))

describe('writer_tutorial.json - session routes', () => {
  const model = loadModel(raw)

  it('loads and validates', () => {
    expect(model.startNode).toBe('apartment')
    expect(Object.keys(model.nodes)).toHaveLength(12)
    expect(Object.keys(model.entities!)).toHaveLength(4)
    expect(model.conversationTemplates).toHaveLength(3)
  })

  it('starts at apartment with 2 choices', () => {
    const session = startSession(model)
    expect(session.nodeId).toBe('apartment')
    const choices = getAvailableChoices(session, model)
    expect(choices).toHaveLength(2)
    expect(choices.map(c => c.id)).toContain('pick_up_letter')
    expect(choices.map(c => c.id)).toContain('ignore_letter')
  })

  it('route: pick up letter → examine → envelope details', () => {
    let session = startSession(model)

    // pick up letter
    session = applyChoice(session, model, 'pick_up_letter')
    expect(session.nodeId).toBe('examine_letter')
    expect(session.flags.found_letter).toBe(true)
    expect(session.inventory).toContain('letter')

    // examine envelope
    session = applyChoice(session, model, 'examine_envelope')
    expect(session.nodeId).toBe('envelope_details')
    expect(session.flags.examined_envelope).toBe(true)
    expect(session.resources.clues).toBe(1)
    expect(session.variables.letter_content).toBe('Room 404 warning')
  })

  it('route: ignore letter → work regret → pick up', () => {
    let session = startSession(model)

    // ignore letter
    session = applyChoice(session, model, 'ignore_letter')
    expect(session.nodeId).toBe('work_regret')
    expect(session.flags.found_letter).toBe(false)

    // conditional text check
    const text = expandTemplate(model.nodes.work_regret.text!, model, session)
    expect(text).toContain('The letter seems to be waiting for you')

    // finally pick up
    session = applyChoice(session, model, 'finally_pick_up')
    expect(session.nodeId).toBe('examine_letter')
    expect(session.flags.found_letter).toBe(true)
    expect(session.inventory).toContain('letter')
  })

  it('route: polite manager → trust + clues gate → reveals', () => {
    let session = startSession(model)

    // pick up → examine → ask manager
    session = applyChoice(session, model, 'pick_up_letter')
    session = applyChoice(session, model, 'examine_envelope') // clues=1
    session = applyChoice(session, model, 'to_manager')
    expect(session.nodeId).toBe('manager_office')

    // ask politely: trust +10 (50→60), clues +1 (1→2)
    session = applyChoice(session, model, 'ask_politely')
    expect(session.nodeId).toBe('manager_response_polite')
    expect(session.resources.trust).toBe(60)
    expect(session.resources.clues).toBe(2)
    expect(session.flags.talked_to_manager).toBe(true)

    // press further: requires trust>=50 AND clues>=2 — should be available
    const choices = getAvailableChoices(session, model)
    expect(choices.map(c => c.id)).toContain('press_further')

    session = applyChoice(session, model, 'press_further')
    expect(session.nodeId).toBe('manager_reveals')
    expect(session.variables.suspect_name).toBe('Dr. Hayashi')
    expect(session.resources.clues).toBe(4)
  })

  it('route: show letter → manager confronted → demand letter back → createEvent', () => {
    let session = startSession(model)

    // pick up letter → ask manager
    session = applyChoice(session, model, 'pick_up_letter')
    session = applyChoice(session, model, 'ask_manager')
    expect(session.nodeId).toBe('manager_office')

    // show letter (requires hasItem:letter)
    const choices = getAvailableChoices(session, model)
    expect(choices.map(c => c.id)).toContain('show_letter')

    session = applyChoice(session, model, 'show_letter')
    expect(session.nodeId).toBe('manager_response_confronted')
    expect(session.resources.trust).toBe(30) // 50 - 20
    expect(session.resources.clues).toBe(2)

    // demand letter back → createEvent + removeItem
    session = applyChoice(session, model, 'demand_letter_back')
    expect(session.nodeId).toBe('manager_reveals')
    expect(session.inventory).not.toContain('letter')
    expect(session.events).toHaveProperty('manager_panicked')
    expect(session.events.manager_panicked.properties!.fear_level.defaultValue).toBe(80)
    expect(session.variables.suspect_name).toBe('Dr. Hayashi')
  })

  it('route: show letter → let him keep → showed_mercy event', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'pick_up_letter')
    session = applyChoice(session, model, 'ask_manager')
    session = applyChoice(session, model, 'show_letter')

    // let him keep: removeItem + trust +20 + createEvent showed_mercy
    session = applyChoice(session, model, 'let_him_keep')
    expect(session.nodeId).toBe('hallway')
    expect(session.inventory).not.toContain('letter')
    expect(session.resources.trust).toBe(50) // 50 - 20 + 20
    expect(session.events).toHaveProperty('showed_mercy')
  })

  it('hallway: room key gate works', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'pick_up_letter')
    session = applyChoice(session, model, 'ask_manager')
    session = applyChoice(session, model, 'ask_politely')
    session = applyChoice(session, model, 'accept_answer')
    expect(session.nodeId).toBe('hallway')

    // without room_key: no "enter_room_key", has "knock_door" and "go_back_manager"
    let choices = getAvailableChoices(session, model)
    expect(choices.map(c => c.id)).not.toContain('enter_room_key')
    expect(choices.map(c => c.id)).toContain('knock_door')

    // knock → locked
    session = applyChoice(session, model, 'knock_door')
    expect(session.nodeId).toBe('room_404_locked')
  })

  it('full route: pick up → envelope → polite → press → key → room 404 → conclusion', () => {
    let session = startSession(model)

    // pick up letter
    session = applyChoice(session, model, 'pick_up_letter')
    // examine envelope: clues=1
    session = applyChoice(session, model, 'examine_envelope')
    // go to manager
    session = applyChoice(session, model, 'to_manager')
    // ask politely: trust=60, clues=2
    session = applyChoice(session, model, 'ask_politely')
    // press further: clues=4, suspect_name=Dr. Hayashi
    session = applyChoice(session, model, 'press_further')
    expect(session.nodeId).toBe('manager_reveals')

    // get key: addItem room_key, clues=5
    session = applyChoice(session, model, 'investigate_room')
    expect(session.inventory).toContain('room_key')

    // need to get to hallway - manager_reveals goes directly to room_404 via investigate_room
    // Actually investigate_room goes to room_404
    expect(session.nodeId).toBe('room_404')

    // read papers: requires clues >= 4 (have 5)
    const choices = getAvailableChoices(session, model)
    expect(choices.map(c => c.id)).toContain('read_papers')

    session = applyChoice(session, model, 'read_papers')
    expect(session.nodeId).toBe('conclusion')
    expect(session.flags.discovered_truth).toBe(true)
    expect(session.events).toHaveProperty('truth_discovered')

    // conclusion text with dynamic references
    const text = expandTemplate(model.nodes.conclusion.text!, model, session)
    expect(text).toContain('Dr. Hayashi')
    expect(text).toContain('Found')
    expect(text).toContain('Montblanc')
    expect(text).toContain('dark blue')
  })

  it('Dynamic Text: entity references expand correctly', () => {
    const session = startSession(model)
    const text = expandTemplate('[manager] is here. Ink: [letter.ink_color]. Brand: [pen.brand].', model, session)
    expect(text).toBe('Mr. Tanaka is here. Ink: dark blue. Brand: Montblanc.')
  })

  it('Dynamic Text: conditional sections', () => {
    let session = startSession(model)
    // flag false
    expect(expandTemplate('{?found_letter:Yes}{?!found_letter:No}', model, session)).toBe('No')
    // set flag
    session = applyChoice(session, model, 'pick_up_letter')
    expect(expandTemplate('{?found_letter:Yes}{?!found_letter:No}', model, session)).toBe('Yes')
  })

  it('Dynamic Text: resource comparison', () => {
    let session = startSession(model)
    expect(expandTemplate('{?clues>=4:Enough}{?clues<4:Not enough}', model, session)).toBe('Not enough')

    // accumulate clues
    session = applyChoice(session, model, 'pick_up_letter')
    session = applyChoice(session, model, 'examine_envelope') // 1
    session = applyChoice(session, model, 'to_manager')
    session = applyChoice(session, model, 'ask_politely') // 2
    session = applyChoice(session, model, 'press_further') // 4
    expect(expandTemplate('{?clues>=4:Enough}', model, session)).toBe('Enough')
  })

  it('ConversationTemplate: evidence mounting fires at clues >= 3', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'pick_up_letter')
    session = applyChoice(session, model, 'examine_envelope') // clues=1
    session = applyChoice(session, model, 'to_manager')
    session = applyChoice(session, model, 'ask_politely') // clues=2

    // clues=2, template requires >=3 → should not match
    let matches = findMatchingTemplates(model.conversationTemplates!, session, model)
    const evidenceMatch = matches.find(m => m.templateId === 'tmpl_evidence_mounting')
    expect(evidenceMatch).toBeUndefined()

    // press further: clues=4
    session = applyChoice(session, model, 'press_further')
    matches = findMatchingTemplates(model.conversationTemplates!, session, model)
    const evidenceMatch2 = matches.find(m => m.templateId === 'tmpl_evidence_mounting')
    expect(evidenceMatch2).toBeDefined()
    expect(evidenceMatch2!.expandedText).toContain('4 clues')
  })

  it('ConversationTemplate: event match fires on fear_level >= 70', () => {
    let session = startSession(model)
    session = applyChoice(session, model, 'pick_up_letter')
    session = applyChoice(session, model, 'ask_manager')
    session = applyChoice(session, model, 'show_letter')

    // no event yet
    let matches = findMatchingTemplates(model.conversationTemplates!, session, model)
    expect(matches.find(m => m.templateId === 'tmpl_event_reaction')).toBeUndefined()

    // demand letter back: creates manager_panicked with fear_level=80
    session = applyChoice(session, model, 'demand_letter_back')
    matches = findMatchingTemplates(model.conversationTemplates!, session, model)
    const eventMatch = matches.find(m => m.templateId === 'tmpl_event_reaction')
    expect(eventMatch).toBeDefined()
  })
})

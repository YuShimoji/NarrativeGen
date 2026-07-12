import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { beforeEach, describe, expect, it } from 'vitest'

import {
  applyChoice,
  clearSessionCaches,
  evaluateKnowledgeRule,
  getAvailableChoices,
  loadModel,
  serialize,
  startSession,
} from '../src/index.js'
import type { Choice, Model, SessionState } from '../src/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const proceduralPath = path.resolve(
  __dirname,
  '../../../models/examples/procedural-choice-spine-probe.json',
)
const originalityPath = path.resolve(
  __dirname,
  '../../../models/examples/originality-spine-probe.json',
)
const proceduralRaw = JSON.parse(fs.readFileSync(proceduralPath, 'utf-8'))
const originalityRaw = JSON.parse(fs.readFileSync(originalityPath, 'utf-8'))

const RULE_ID = 'mira_receipt_contradiction'
const PERCEPTION_EVENT_ID = 'event_mira_perceives_receipt_contradiction'

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function loadProceduralModel(): Model {
  return loadModel(cloneJson(proceduralRaw)) as Model
}

function loadOriginalityModel(): Model {
  return loadModel(cloneJson(originalityRaw)) as Model
}

function ids(choices: Choice[]): string[] {
  return choices.map((choice) => choice.id)
}

function reachMemoryReframed(model: Model): SessionState {
  return applyChoice(startSession(model), model, 'ask_mira_reframe')
}

describe('procedural-choice-spine-probe.json', () => {
  beforeEach(() => {
    clearSessionCaches()
  })

  it('uses one reusable knowledge rule and contains no perception-policy event wiring', () => {
    const model = loadProceduralModel()
    const follow = model.nodes.memory_reframed.choices?.find(
      (choice) => choice.id === 'follow_semantic_change',
    )

    expect(model.knowledgeRules?.[RULE_ID]).toEqual({
      character: 'mira',
      entity: 'receipt_fragment',
      domain: 'archive_records',
      expectations: { credibility: 50 },
    })
    expect(follow?.conditions).toEqual([
      { type: 'knowledgeRule', rule: RULE_ID, result: 'noticed' },
    ])
    expect(model.perceptionPolicies).toBeUndefined()
    expect(JSON.stringify(model)).not.toContain(PERCEPTION_EVENT_ID)
  })

  it('opens the semantic route through the rule and reaches semantic_end', () => {
    const model = loadProceduralModel()
    let session = startSession(model)

    expect(ids(getAvailableChoices(session, model))).toEqual([
      'ask_mira_reframe',
      'treat_as_old_clue',
    ])
    expect(session.events[PERCEPTION_EVENT_ID]).toBeUndefined()

    session = applyChoice(session, model, 'ask_mira_reframe')
    expect(session.nodeId).toBe('memory_reframed')
    expect(session.events.event_mira_reframes_receipt).toBeDefined()
    expect(session.events[PERCEPTION_EVENT_ID]).toBeUndefined()

    const fact = evaluateKnowledgeRule(session, model, RULE_ID)
    expect(fact).toMatchObject({
      ruleId: RULE_ID,
      requestedDomain: 'archive_records',
      matchedDomain: 'archive_records',
      profileMatch: 'exact',
      noticed: true,
    })
    expect(fact.missingReason).toBeUndefined()
    expect(ids(getAvailableChoices(session, model))).toEqual(['follow_semantic_change'])

    session = applyChoice(session, model, 'follow_semantic_change')
    expect(session.nodeId).toBe('semantic_end')
    expect(session.events[PERCEPTION_EVENT_ID]).toBeUndefined()
  })

  it('keeps follow_semantic_change unavailable when the rule is not noticed', () => {
    const model = loadProceduralModel()
    model.knowledgeRules![RULE_ID].expectations.credibility = 72
    const session = reachMemoryReframed(model)

    const fact = evaluateKnowledgeRule(session, model, RULE_ID)
    expect(fact.noticed).toBe(false)
    expect(fact.missingReason).toBeUndefined()
    expect(getAvailableChoices(session, model)).toEqual([])
    expect(session.events[PERCEPTION_EVENT_ID]).toBeUndefined()
  })

  it('uses the existing recursive not condition for not-noticed behavior', () => {
    const model = loadProceduralModel()
    model.knowledgeRules![RULE_ID].expectations.credibility = 72
    model.nodes.memory_reframed.choices![0].conditions = [
      {
        type: 'not',
        condition: { type: 'knowledgeRule', rule: RULE_ID, result: 'noticed' },
      },
    ]
    const session = reachMemoryReframed(model)

    expect(evaluateKnowledgeRule(session, model, RULE_ID).noticed).toBe(false)
    expect(ids(getAvailableChoices(session, model))).toEqual([
      'follow_semantic_change',
    ])
  })

  it('is repeatable and leaves serialized SessionState and events byte-for-byte unchanged', () => {
    const model = loadProceduralModel()
    const session = reachMemoryReframed(model)
    const before = serialize(session)

    const firstFact = evaluateKnowledgeRule(session, model, RULE_ID)
    const firstChoices = ids(getAvailableChoices(session, model))
    const secondFact = evaluateKnowledgeRule(session, model, RULE_ID)
    const secondChoices = ids(getAvailableChoices(session, model))

    expect(secondFact).toEqual(firstFact)
    expect(secondChoices).toEqual(firstChoices)
    expect(secondChoices).toEqual(['follow_semantic_change'])
    expect(serialize(session)).toBe(before)
    expect(Object.keys(session.events)).toEqual(['event_mira_reframes_receipt'])
    expect(session.events[PERCEPTION_EVENT_ID]).toBeUndefined()
  })

  it('invalidates cached choices after in-place rule, character, and entity edits', () => {
    const model = loadProceduralModel()
    const session = reachMemoryReframed(model)
    const choices = (): string[] => ids(getAvailableChoices(session, model))

    expect(choices()).toEqual(['follow_semantic_change'])

    model.knowledgeRules![RULE_ID].expectations.credibility = 72
    expect(choices()).toEqual([])
    model.knowledgeRules![RULE_ID].expectations.credibility = 50
    expect(choices()).toEqual(['follow_semantic_change'])

    model.characters!.mira.knowledgeProfiles[0].tolerance = 1
    expect(choices()).toEqual([])
    model.characters!.mira.knowledgeProfiles[0].tolerance = 0.12
    expect(choices()).toEqual(['follow_semantic_change'])

    model.entities!.receipt_fragment.properties!.credibility.defaultValue = 50
    expect(choices()).toEqual([])
    model.entities!.receipt_fragment.properties!.credibility.defaultValue = 72
    expect(choices()).toEqual(['follow_semantic_change'])
  })

  it('isolates cached availability when switching between model instances', () => {
    const noticedModel = loadProceduralModel()
    const notNoticedModel = loadProceduralModel()
    notNoticedModel.knowledgeRules![RULE_ID].expectations.credibility = 72
    const sharedSession = reachMemoryReframed(noticedModel)

    expect(ids(getAvailableChoices(sharedSession, noticedModel))).toEqual([
      'follow_semantic_change',
    ])
    expect(getAvailableChoices(sharedSession, notNoticedModel)).toEqual([])
    expect(ids(getAvailableChoices(sharedSession, noticedModel))).toEqual([
      'follow_semantic_change',
    ])
  })

  it('preserves the existing originality probe as the persistent-event baseline', () => {
    const model = loadOriginalityModel()
    const session = reachMemoryReframed(model)

    expect(model.knowledgeRules).toBeUndefined()
    expect(model.perceptionPolicies?.[0].id).toBe(
      'mira_receipt_contradiction_policy',
    )
    expect(session.events[PERCEPTION_EVENT_ID]).toBeDefined()
    expect(ids(getAvailableChoices(session, model))).toEqual(['follow_semantic_change'])
  })
})

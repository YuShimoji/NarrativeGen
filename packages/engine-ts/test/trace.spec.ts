import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  applyChoice,
  checkModel,
  loadModel,
  resolveNarrativeDisplayText,
  startSession,
  traceChoiceOrigins,
  traceCondition,
  traceStart,
  traceStep,
} from '../src/index.js'
import type { Model } from '../src/types.js'
import * as browser from '../src/browser.js'
import { propertyEvaluator } from '../src/inference/conditions/property.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const examples = path.resolve(__dirname, '../../../models/examples')
const load = (name: string): Model => loadModel(JSON.parse(fs.readFileSync(path.join(examples, name), 'utf-8')))

describe('the same evidence in prose, choices and the trace', () => {
  const gate = { type: 'property', entity: 'box', key: 'count', op: '>=', value: 2 } as const
  const model: Model = {
    modelType: 'adventure-playthrough', startNode: 'inspect',
    entities: {
      parent: { id: 'parent', name: '箱', properties: { count: { key: 'count', type: 'number', defaultValue: 1 } } },
      box: { id: 'box', name: '返却箱', parentEntity: 'parent' },
    },
    nodes: {
      inspect: { id: 'inspect', text: '{?!証言:不明。}{?証言:聞いたのは[証言.name]。}', choices: [
        { id: 'count', text: '二つ数える', target: 'inspect', conditions: [gate] },
        { id: 'hear', text: '聞く', target: 'walk', effects: [{ type: 'createEvent', id: '証言', name: '灯の数' }] },
        { id: 'ask', text: '証言を聞き直す', target: 'inspect', conditions: [{ type: 'hasEvent', key: '証言', value: true }] },
        { id: 'wait', text: '待つ', target: 'inspect', conditions: [{ type: 'timeWindow', start: 0, end: 1 }] },
      ] },
      walk: { id: 'walk', choices: [{ id: 'back', text: '戻る', target: 'inspect' }] },
    },
  }

  it('closes an unmet or missing property, including through the browser and inference registry', () => {
    const copy = structuredClone(model)
    const session = startSession(copy)
    const context = { ...session, model: copy, session }
    expect(() => applyChoice(session, copy, 'count')).toThrow()
    expect(() => browser.applyChoice(session, copy, 'count')).toThrow()
    expect(propertyEvaluator.evaluate(gate, context)).toBe(false)
    expect(traceCondition(gate, session, copy)).toMatchObject({ actual: 1, passed: false })
    copy.entities!.parent.properties!.count.defaultValue = 2
    expect(traceCondition(gate, session, copy)).toMatchObject({ actual: 2, passed: true })
    expect(propertyEvaluator.evaluate(gate, context)).toBe(true)
    expect(browser.getAvailableChoices(session, copy).map(c => c.id)).toContain('count')
    expect(applyChoice(session, copy, 'count').time).toBe(1)
    const missing = { ...gate, key: 'absent', op: '!=' } as const
    expect(propertyEvaluator.evaluate(missing, context)).toBe(false)
    expect(traceCondition(missing, session, copy)).toMatchObject({ passed: false })
  })

  it('matches the displayed text after hearing, and identifies the earlier action on a later visit', () => {
    const first = traceStart(model)
    const heard = traceStep(first.session, model, 'hear')
    const back = traceStep(heard.session, model, 'back')
    expect(first.scene.text.text).toBe('不明。')
    expect(back.scene.text.text).toBe('聞いたのは灯の数。')
    expect(back.scene.text.exact).toBe(true)
    expect(back.scene.text.segments).toContainEqual(expect.objectContaining({ condition: '証言', observed: true, shown: true }))
    expect(browser.resolveNarrativeDisplayTextTracked(model.nodes.inspect.text!, model, back.session).text).toBe(back.scene.text.text)
    expect(traceChoiceOrigins(model, [first, heard, back])).toEqual(new Map([['ask', 1], ['wait', 2]]))
    expect(traceChoiceOrigins(model, [first])).toEqual(new Map())
    const shadowed = { ...back.session, flags: { 証言: false } }
    expect(resolveNarrativeDisplayText(model.nodes.inspect.text!, model, shadowed)).toBe('不明。')
  })

  it('reports overwritten testimony and checks the next scene with each version of that event', () => {
    const copy = structuredClone(model)
    copy.nodes.inspect.text = '記録。'
    copy.nodes.inspect.choices = [1, 2].map((value) => ({
      id: String(value), text: String(value), target: 'walk', effects: [{
        type: 'createEvent', id: '証言', name: '灯', properties: { count: { defaultValue: value } },
      }],
    }))
    copy.nodes.walk.text = '見直す。'
    copy.conversationTemplates = [{
      id: 'two', trigger: { eventMatch: { propertyChecks: [{ key: 'count', op: '==', value: 2 }] } },
      text: '[missing.property]',
    }]
    const first = traceStep(traceStart(copy).session, copy, '1')
    const again = traceStep(traceStep(first.session, copy, 'back').session, copy, '2')
    expect(again.changes).toContainEqual({
      kind: 'eventUpdate', key: '証言', previousName: '灯', name: '灯',
      properties: [{ key: 'count', before: 1, after: 2 }],
    })
    const same = traceStep(traceStep(again.session, copy, 'back').session, copy, '2')
    expect(same.changes.some((c) => c.kind === 'eventUpdate')).toBe(false)
    expect(checkModel(copy).unresolvedRefs).toContainEqual({ nodeId: 'walk', ref: '[missing.property]' })
  })

  it('distinguishes a missed observation, creation, a later overwrite and a skipped entry policy sharing the same event', () => {
    const copy = structuredClone(model)
    copy.characters = { observer: { id: 'observer', name: '係', knowledgeProfiles: [{ domain: 'count', accuracy: 1, tolerance: 0.1 }] } }
    const look = { type: 'perceiveEntity', character: 'observer', entity: 'box', domain: 'count',
      expectations: { count: 2 }, eventId: '証言', onlyIfNoticed: true } as const
    copy.nodes.inspect.choices = [{ id: 'read', text: '読む', target: 'walk', effects: [
      { ...look, expectations: { count: 1 } }, look, { ...look, expectations: { count: 3 } },
    ] }]
    copy.perceptionPolicies = [{ ...look, trigger: { node: 'walk' }, id: 'onEntry' }]
    const first = traceStart(copy)
    const step = traceStep(first.session, copy, 'read')
    expect(step.perceptions.map((p) => p.outcome)).toEqual(['not_noticed', 'created', 'recorded_again', 'already_exists'])
    expect(step.session).toEqual(browser.applyChoice(first.session, copy, 'read'))
    expect(first.session.events).toEqual({})
  })

  it('replays a nested time gate after waiting without exploring an endless clock', () => {
    const copy = structuredClone(model)
    copy.nodes.walk.choices = [
      { id: 'wait', text: '待つ', target: 'walk' },
      { id: 'leave', text: '出る', target: 'end', conditions: [
        { type: 'and', conditions: [{ type: 'timeWindow', start: 3, end: 3 }] },
      ] },
    ]
    copy.nodes.end = { id: 'end' }
    const check = checkModel(copy)
    expect(check.endings).toContainEqual({ nodeId: 'end', path: ['hear', 'wait', 'wait', 'leave'] })
    expect(check.truncated).toBe(false)
  })

  it('inserts a one-use account even in a textless scene, and restores its allowance on another route', () => {
    const copy = structuredClone(model)
    copy.nodes.walk.text = ''
    copy.conversationTemplates = [{
      id: 'constructor', maxUses: 1, trigger: { sessionConditions: [{ type: 'hasEvent', key: '証言', value: true }] },
      text: '灯の証言を聞いた。',
    }]
    const first = traceStart(copy)
    const heard = traceStep(first.session, copy, 'hear', first.templateUsage)
    const back = traceStep(heard.session, copy, 'back', heard.templateUsage)
    expect(heard.scene.text).toMatchObject({ text: '灯の証言を聞いた。', exact: true })
    expect(back.scene.text.text).toBe('聞いたのは灯の数。')
    expect(back.scene.templates[0]).toMatchObject({ matched: false, usesExhausted: true })
    expect(browser.resolveNarrativeDisplayTextTracked('', copy, heard.session, { templateUsage: {} }).text).toBe(heard.scene.text.text)
    expect(browser.resolveNarrativeDisplayTextTracked('', copy, heard.session, { templateUsage: heard.templateUsage }).text).toBe('')
    expect(traceStep(first.session, copy, 'hear', first.templateUsage)).toEqual(heard)
    expect(checkModel(copy).truncated).toBe(false)
  })
})

describe('engine trace on originality-spine-probe', () => {
  const model = load('originality-spine-probe.json')

  it('opening scene: segments rebuild the runtime text and name their sources', () => {
    const step = traceStart(model)
    expect(step.scene.text.exact).toBe(true)
    expect(step.scene.text.text).toBe(resolveNarrativeDisplayText(model.nodes.desk.text ?? '', model, startSession(model)))
    const credibility = step.scene.text.segments.find((s) => s.kind === 'entity' && s.property === 'credibility')
    expect(credibility).toMatchObject({ text: '72', entityId: 'receipt_fragment', source: 'entity', suppliedBy: 'receipt_fragment' })
    const visibleTo = step.scene.text.segments.find((s) => s.kind === 'conditional')
    expect(visibleTo).toMatchObject({ condition: 'meaning_locked', shown: true, observed: true })
    expect(step.scene.choices.map((c) => [c.choice.id, c.available])).toEqual([
      ['ask_mira_reframe', true],
      ['treat_as_old_clue', true],
    ])
  })

  it('reframe step: records the perception, the created events, the inserted template and why the choice opened', () => {
    const start = traceStart(model)
    const step = traceStep(start.session, model, 'ask_mira_reframe')
    expect(step.session).toEqual(applyChoice(start.session, model, 'ask_mira_reframe'))

    expect(step.perceptions).toHaveLength(1)
    const p = step.perceptions[0]
    expect(p).toMatchObject({ origin: 'policy', policyId: 'mira_receipt_contradiction_policy', noticed: true, outcome: 'created', tolerance: 0.12 })
    expect(p.anomalies[0]).toMatchObject({ propertyKey: 'credibility', expectedValue: 50, actualValue: 72, toleranceRange: [44, 56] })

    const eventKeys = step.changes.filter((c) => c.kind === 'event').map((c) => (c as { key: string }).key)
    expect(eventKeys).toEqual(['event_mira_reframes_receipt', 'event_mira_perceives_receipt_contradiction'])
    expect(step.changes).toContainEqual({ kind: 'flag', key: 'meaning_locked', before: true, after: false })

    expect(step.scene.text.exact).toBe(true)
    expect(step.scene.text.segments.some((s) => s.kind === 'template' && s.templateId === 'mira_archive_reframe')).toBe(true)
    const template = step.scene.templates.find((t) => t.templateId === 'mira_archive_reframe')
    expect(template?.matched).toBe(true)
    expect(template?.matchedEventId).toBe('event_mira_reframes_receipt')

    const follow = step.scene.choices.find((c) => c.choice.id === 'follow_semantic_change')
    expect(follow?.available).toBe(true)
    expect(follow?.conditions[0]).toMatchObject({ passed: true, actual: true })
  })

  it('model check plays every route and finds both endings', () => {
    const check = checkModel(model)
    expect(check.endings.map((e) => e.nodeId).sort()).toEqual(['old_adv_end', 'semantic_end'])
    expect(check.stuck).toEqual([])
    expect(check.neverOpened).toEqual([])
    expect(check.impossibleEvents).toEqual([])
    expect(check.unresolvedRefs).toEqual([])
    expect(check.truncated).toBe(false)
  })
})

describe('engine trace on procedural-choice-spine-probe', () => {
  const model = load('procedural-choice-spine-probe.json')
  it('knowledgeRule conditions carry the knowledge fact behind the open choice', () => {
    const start = traceStart(model)
    const step = traceStep(start.session, model, 'ask_mira_reframe')
    const follow = step.scene.choices.find((c) => c.choice.id === 'follow_semantic_change')
    expect(follow?.available).toBe(true)
    expect(follow?.conditions[0]).toMatchObject({ passed: true })
    expect(follow?.conditions[0].knowledge).toMatchObject({ ruleId: 'mira_receipt_contradiction', noticed: true, characterId: 'mira' })
  })
})

describe('engine trace on every example model', () => {
  const files = fs.readdirSync(examples).filter((f) => f.endsWith('.json'))
  for (const file of files) {
    it(`${file}: start trace is exact and the model check completes`, () => {
      let model: Model
      try {
        model = load(file)
      } catch {
        return // invalid example models are covered by validation tests
      }
      const step = traceStart(model)
      expect(step.scene.text.exact).toBe(true)
      const check = checkModel(model, { maxStates: 300 })
      expect(check.errors).toEqual([])
      expect(check.playedNodes).toContain(model.startNode)
    })
  }
})

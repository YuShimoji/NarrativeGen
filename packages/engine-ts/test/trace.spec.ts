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
  traceStart,
  traceStep,
} from '../src/index.js'
import type { Model } from '../src/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const examples = path.resolve(__dirname, '../../../models/examples')
const load = (name: string): Model => loadModel(JSON.parse(fs.readFileSync(path.join(examples, name), 'utf-8')))

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

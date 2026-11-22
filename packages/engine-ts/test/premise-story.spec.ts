import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  applyChoice,
  checkModel,
  clearSessionCaches,
  generateStory,
  getAvailableChoices,
  loadModel,
  resolveNarrativeDisplayText,
  startSession,
} from '../src/index.js'
import type { StoryPremise } from '../src/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
const premisePath = path.join(repoRoot, 'models/premises/cheeseburger-weight.json')
const generatedPath = path.join(repoRoot, 'models/generated/cheeseburger-weight.json')

function readPremise(): StoryPremise {
  return JSON.parse(fs.readFileSync(premisePath, 'utf-8')) as StoryPremise
}

describe('premise-story (SP-PREMISE-001 prototype)', () => {
  it('reads perception from the engine: who notices follows tolerance, not authoring', () => {
    const { derivation } = generateStory(readPremise())
    const byId = Object.fromEntries(derivation.perceptions.map((p) => [p.character, p]))
    expect(byId.detective_a).toMatchObject({ noticed: true, severity: 80, rangeMin: 0.095, rangeMax: 0.105 })
    expect(byId.witness_b).toMatchObject({ noticed: true, severity: 27 })
    expect(byId.drunk_person).toMatchObject({ noticed: false, actual: 0.12 })
  })

  it('is deterministic, with or without a seed', () => {
    expect(generateStory(readPremise())).toEqual(generateStory(readPremise()))
    expect(generateStory(readPremise(), { seed: 3 })).toEqual(generateStory(readPremise(), { seed: 3 }))
  })

  it('gives every state probabilities that sum to one', () => {
    const { derivation } = generateStory(readPremise())
    for (const step of derivation.mainLine) {
      const total = step.options.reduce((sum, o) => sum + o.probability, 0)
      expect(total).toBeCloseTo(1, 2)
    }
    const endings = derivation.endings.reduce((sum, e) => sum + e.probability, 0)
    expect(endings).toBeCloseTo(1, 2)
  })

  it('picks the most probable unfolding that contains what the author asked for', () => {
    const { derivation } = generateStory(readPremise())
    const results = derivation.mainLine.map((s) => s.action.result)
    expect(results).toContain('shared')
    expect(results).toContain('disagreement')
    expect(derivation.intentShare).toBeGreaterThan(0)
    expect(derivation.intentShare).toBeLessThan(1)
    expect(derivation.ending).toBe('verified')
    expect(derivation.warnings).toEqual([])

    const seeded = generateStory(readPremise(), { seed: 3 }).derivation.mainLine.map((s) => s.action.result)
    expect(seeded).toContain('shared')
    expect(seeded).toContain('disagreement')
  })

  it('produces a model that passes the engine checks and has no dead ends', () => {
    const { model } = generateStory(readPremise())
    clearSessionCaches()
    loadModel(structuredClone(model))
    const check = checkModel(model)
    expect(check.missingTargets).toEqual([])
    expect(check.unlinkedNodes).toEqual([])
    expect(check.stuck).toEqual([])
    expect(check.neverOpened).toEqual([])
    expect(check.impossibleEvents).toEqual([])
    expect(check.unresolvedRefs).toEqual([])
    expect(check.errors).toEqual([])
    expect(check.truncated).toBe(false)
    expect(check.endings.length).toBeGreaterThan(1)
  })

  it('replays in the runtime exactly as predicted: the engine re-derives each gap', () => {
    const { model, derivation } = generateStory(readPremise())
    clearSessionCaches()
    let session = startSession(model)
    for (const step of derivation.mainLine) {
      expect(session.nodeId).toBe(step.from)
      const choiceId = step.action.key.replace(/[:>]/g, '_')
      expect(getAvailableChoices(session, model).map((c) => c.id)).toContain(choiceId)
      session = applyChoice(session, model, choiceId)
      expect(session.nodeId).toBe(step.to)
      if (step.action.kind === 'look') {
        const noticed = Boolean(session.events[`notice_${step.action.actor}`])
        expect(noticed).toBe(step.action.result === 'noticed')
      }
    }
    expect(getAvailableChoices(session, model)).toEqual([])
    expect(session.events.notice_drunk_person).toBeUndefined()
    expect(session.events.notice_detective_a.properties?.severity.defaultValue).toBe(80)

    const last = model.nodes[session.nodeId].text ?? ''
    const shown = resolveNarrativeDisplayText(last, model, session)
    expect(shown).toContain('0.12')
    expect(shown).not.toMatch(/[[\]{}]/)
  })

  it('reports that nothing happens when no one can notice', () => {
    const premise = readPremise()
    premise.entities.someones_cheeseburger.properties!.weight.defaultValue = 0.1
    delete premise.intent
    const { derivation, model } = generateStory(premise)
    expect(derivation.ending).toBe('nothing')
    expect(derivation.endings).toEqual([{ ending: 'nothing', probability: 1 }])
    expect(derivation.mainLine.every((s) => s.action.result === 'missed')).toBe(true)
    clearSessionCaches()
    loadModel(structuredClone(model))
  })

  it('says so when the premise cannot give what the author asked for', () => {
    const premise = readPremise()
    premise.scene.present = ['detective_a']
    const { derivation } = generateStory(premise)
    expect(derivation.intentShare).toBe(0)
    expect(derivation.warnings.join(' ')).toContain('意図を満たす展開がこの前提にはありません')
    expect(derivation.mainLine.map((s) => s.action.kind)).toEqual(['look', 'verify'])
  })

  it('names the premises it could not use instead of guessing', () => {
    const premise = readPremise()
    premise.beliefs = premise.beliefs.filter((b) => b.character !== 'drunk_person')
    premise.scene.present.push('nobody')
    delete premise.intent
    const { derivation } = generateStory(premise)
    expect(derivation.perceptions.map((p) => p.character)).toEqual(['detective_a', 'witness_b'])
    expect(derivation.warnings).toHaveLength(2)
  })

  it('keeps the committed generated story in step with its premise', () => {
    const committed = JSON.parse(fs.readFileSync(generatedPath, 'utf-8'))
    expect(generateStory(readPremise()).model).toEqual(committed)
  })
})

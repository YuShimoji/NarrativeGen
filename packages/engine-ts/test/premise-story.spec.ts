import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  applyChoice,
  checkModel,
  clearSessionCaches,
  explainAction,
  generateStory,
  getAvailableChoices,
  loadModel,
  resolveNarrativeDisplayText,
  startSession,
} from '../src/index.js'
import type { StoryPremise } from '../src/index.js'
import { comparePremiseReactions } from '../src/premise-story.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')
const premisePath = path.join(repoRoot, 'models/premises/cheeseburger-weight.json')
const BURGER_SAMPLES = ['cheeseburger-weight', 'cheeseburger-weight-hearsay']
const SAMPLES = [
  ...BURGER_SAMPLES, 'print-shop-paper-guide', 'closing-bell-echo', 'alley-lantern-shadow', 'closing-time-key-box',
]

function readPremise(name = 'cheeseburger-weight'): StoryPremise {
  const file = name === 'cheeseburger-weight' ? premisePath : path.join(repoRoot, `models/premises/${name}.json`)
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as StoryPremise
}

// the generator walks every unfolding of the sample (about 44,000 states), and several tests build it more than once
describe('premise-story (SP-PREMISE-001)', { timeout: 30_000 }, () => {
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

  it.each(SAMPLES)('produces a model that passes the engine checks and has no dead ends: %s', (sample) => {
    const { model } = generateStory(readPremise(sample))
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

  it.each(SAMPLES)('replays in the runtime exactly as predicted, the engine re-deriving each gap: %s', (sample) => {
    const { model, derivation } = generateStory(readPremise(sample))
    clearSessionCaches()
    let session = startSession(model)
    for (const step of derivation.mainLine) {
      expect(session.nodeId).toBe(step.from)
      const choiceId = step.action.key.replace(/[:>]/g, '_')
      expect(getAvailableChoices(session, model).map((c) => c.id)).toContain(choiceId)
      session = applyChoice(session, model, choiceId)
      expect(session.nodeId).toBe(step.to)
      if (step.action.kind === 'look' || step.action.kind === 'relook') {
        // the runtime judges with the expectation the person holds at that moment
        const event = session.events[step.action.eventId!]
        expect(Boolean(event)).toBe(step.action.perception!.noticed)
        if (event) expect(event.properties?.severity.defaultValue).toBe(step.action.perception!.severity)
      }
      const shown = resolveNarrativeDisplayText(model.nodes[session.nodeId].text ?? '', model, session)
      expect(shown).not.toMatch(/[[\]{}]/)
    }
    expect(getAvailableChoices(session, model)).toEqual([])
    if (BURGER_SAMPLES.includes(sample)) {
      expect(session.events.notice_detective_a.properties?.severity.defaultValue).toBe(80)
      const last = model.nodes[session.nodeId].text ?? ''
      expect(resolveNarrativeDisplayText(last, model, session)).toContain('0.12')
    }
  })

  it('lets what a person heard change what they expect: the listener notices, the speaker is talked out of it', () => {
    const premise = readPremise('cheeseburger-weight-hearsay')
    const { model, derivation } = generateStory(premise)
    const beats = derivation.mainLine.map((s) => s.action.result ?? s.action.kind)
    expect(beats).toEqual(expect.arrayContaining(['disagreement', 'dissolved', 'ask', 'realized']))

    // 目撃者B noticed alone, then heard 酔った人 and looked again with the blended tolerance
    const dissolved = derivation.mainLine.find((s) => s.action.result === 'dissolved')!.action
    expect(dissolved.actor).toBe('witness_b')
    expect(dissolved.perception).toMatchObject({ heardFrom: ['drunk_person'], ownTolerance: 0.15, tolerance: 0.255, noticed: false })
    expect(explainAction(premise, dissolved).judgment).toContain('許容幅を 0.15→0.255 に改めた')

    // 酔った人 missed alone, and notices only after asking 探偵A
    const realized = derivation.mainLine.find((s) => s.action.result === 'realized')!.action
    expect(realized.actor).toBe('drunk_person')
    expect(realized.perception).toMatchObject({ ownTolerance: 0.5, noticed: true })
    expect(realized.perception!.heardFrom).toContain('detective_a')

    // the runtime reads the changed expectation as knowledge written into the model, not as a new rule
    expect(model.characters!.witness_b.knowledgeProfiles).toContainEqual({ domain: 'food_items+drunk_person', accuracy: 0.7, tolerance: 0.255 })
    expect(premise.characters.witness_b.knowledgeProfiles).toHaveLength(1)
  })

  it('gives two people who exchanged accounts the same expectation, whoever they are', () => {
    const { derivation } = generateStory(readPremise())
    const views = Object.values(derivation.scenes).flatMap((scene) => scene.options).filter((o) => o.kind === 'relook')
    const pick = (actor: string, from: string) => views.find((o) => o.actor === actor && o.perception!.heardFrom!.join() === from)!.perception!
    const a = pick('detective_a', 'witness_b')
    const b = pick('witness_b', 'detective_a')
    expect(a.tolerance).toBe(b.tolerance)
    expect(a.severity).toBe(b.severity)
    expect(a.severity).toBeLessThan(80)
    expect(b.severity).toBeGreaterThan(27)
  })

  it('opens actions by what has been seen and heard, not by who the person is', () => {
    const { derivation } = generateStory(readPremise())
    const actions = Object.values(derivation.scenes).flatMap((scene) => scene.options)
    const kindsOf = (actor: string) => new Set(actions.filter((o) => o.actor === actor).map((o) => o.kind))
    // 酔った人 misses when looking alone, and still reaches every kind of action in some unfolding
    expect(derivation.perceptions.find((p) => p.character === 'drunk_person')!.noticed).toBe(false)
    expect([...kindsOf('drunk_person')].sort()).toEqual(['ask', 'letGo', 'look', 'relook', 'tell', 'verify'])
    expect(kindsOf('detective_a').has('ask')).toBe(true)
  })

  it('compares both witnesses using their accuracy, independent of the order heard', () => {
    const premise = readPremise('cheeseburger-weight-hearsay')
    const witnesses = ['detective_a', 'drunk_person']
    const initial = comparePremiseReactions(premise, witnesses)
    expect(initial).toEqual(comparePremiseReactions(premise, [...witnesses].reverse()))
    expect(initial).toHaveLength(1)
    expect(initial[0]).toMatchObject({
      character: 'witness_b',
      before: { noticed: true },
      after: { heardFrom: witnesses, tolerance: expect.closeTo(0.157895, 5), noticed: true },
    })

    premise.characters.drunk_person.knowledgeProfiles[0].accuracy = 0.9
    const [adjusted] = comparePremiseReactions(premise, witnesses)
    expect(adjusted.before).toEqual(initial[0].before)
    expect(adjusted.after).toMatchObject({ heardFrom: witnesses, tolerance: 0.24, noticed: false })
  })

  it('lets a person with no expectation of their own pick one up by asking', () => {
    const premise = readPremise()
    premise.beliefs = premise.beliefs.filter((b) => b.character !== 'drunk_person')
    premise.intent = { include: ['asked'] }
    const { derivation } = generateStory(premise)
    expect(derivation.warnings.join(' ')).toContain('誰かの話を聞くまで')
    const looks = Object.values(derivation.scenes).flatMap((scene) => scene.options).filter((o) => o.actor === 'drunk_person' && o.kind === 'look')
    expect(looks.length).toBeGreaterThan(0)
    for (const look of looks) {
      expect(look.perception!.heardFrom!.length).toBeGreaterThan(0)
      expect(look.perception!.ownExpected).toBeUndefined()
    }
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

  it('gives the key box two playable endings only when the count is outside the expected range', () => {
    const premise = readPremise('closing-time-key-box')
    const { model, derivation } = generateStory(premise)
    const start = startSession(model)
    const noticed = applyChoice(start, model, 'look_attendant')
    const choices = getAvailableChoices(noticed, model)
    expect(choices.map((choice) => choice.id)).toEqual(['verify_attendant', 'letGo_attendant'])
    const endings = choices.map((choice) => {
      const end = applyChoice(noticed, model, choice.id)
      return derivation.scenes[end.nodeId].ending
    })
    expect(endings).toEqual(['verified', 'faded'])

    premise.entities.key_box.properties!.key_count.defaultValue = 20
    const matching = generateStory(premise)
    const looked = applyChoice(startSession(matching.model), matching.model, 'look_attendant')
    expect(getAvailableChoices(looked, matching.model)).toEqual([])
    expect(matching.derivation.scenes[looked.nodeId].ending).toBe('nothing')
    expect(checkModel(matching.model).unresolvedRefs).toEqual([])
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

  it('explains every scene of the model: what was possible, what stayed playable, and why', () => {
    const premise = readPremise()
    const { model, derivation } = generateStory(premise)
    expect(Object.keys(derivation.scenes).sort()).toEqual(Object.keys(model.nodes).sort())
    for (const [nodeId, scene] of Object.entries(derivation.scenes)) {
      const choiceIds = (model.nodes[nodeId].choices ?? []).map((c) => c.id).sort()
      expect(Object.values(scene.choices).sort()).toEqual(choiceIds)
      if (scene.options.length === 0) expect(scene.ending).toBeDefined()
      else expect(scene.options.reduce((sum, o) => sum + o.probability, 0)).toBeCloseTo(1, 3)
    }
    const start = derivation.scenes[model.startNode]
    expect(start.main).toBe(derivation.mainLine[0].action.key)
    const first = explainAction(premise, start.options[0])
    expect(first.label).toBe('探偵Aが見る → 違和感を覚える')
    expect(first.formula).toBe('知識の正確さ')
    expect(first.factors).toEqual(['探偵Aの知識の正確さ 0.9'])
  })

  it.each(SAMPLES)('keeps the committed generated story in step with its premise: %s', (sample) => {
    const committed = JSON.parse(fs.readFileSync(path.join(repoRoot, `models/generated/${sample}.json`), 'utf-8'))
    expect(generateStory(readPremise(sample)).model).toEqual(committed)
  })
})

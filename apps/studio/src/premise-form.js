export const customFocus = 'thing'
export const customProperty = 'value'

export const intentBeats = [
  'noticed', 'missed', 'heard', 'shared', 'disagreement', 'letGo',
  'verified', 'asked', 'realized', 'dissolved', 'confirmed', 'unmoved',
]
export const intentEndings = ['verified', 'faded', 'nothing']

export function makePremise({ title, thing, property, actual, people, include = [], ending }) {
  const premise = {
    title: title || `${thing}の${property}`,
    entities: { [customFocus]: {
      id: customFocus,
      name: thing,
      properties: { [customProperty]: { key: customProperty, type: 'number', defaultValue: actual } },
    } },
    characters: {},
    beliefs: [],
    scene: { focus: customFocus, present: [] },
    wording: { propertyNames: { [customProperty]: property } },
  }
  for (const { id, name, domain, accuracy, tolerance, expected } of people) {
    premise.characters[id] = { id, name, knowledgeProfiles: [{ domain, accuracy, tolerance }] }
    premise.beliefs.push({ character: id, entity: customFocus, domain, expectations: { [customProperty]: expected } })
    premise.scene.present.push(id)
  }
  if (include.length || ending) {
    premise.intent = { ...(include.length ? { include } : {}), ...(ending ? { ending } : {}) }
  }
  return premise
}

function orderedJson(value) {
  return JSON.stringify(value, (_, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
      : item)
}

/** Load only premises that this form can represent completely. */
export function readPremiseFile(premise) {
  const isText = (value) => typeof value === 'string' && value.length > 0 && value === value.trim()
  const invalid = () => new Error('この画面で保存した、物と数値の性質が1つの前提ファイルを選んでください。')
  const ids = premise?.scene?.present
  const entity = premise?.entities?.[customFocus]
  const { title } = premise ?? {}
  const thing = entity?.name
  const property = premise?.wording?.propertyNames?.[customProperty]
  const actual = entity?.properties?.[customProperty]?.defaultValue
  const include = premise?.intent?.include ?? []
  const ending = premise?.intent?.ending
  if (![title, thing, property].every(isText) || !Number.isFinite(actual)
    || !Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length
    || !Array.isArray(premise.beliefs) || !Array.isArray(include)
    || include.some((beat) => !intentBeats.includes(beat)) || new Set(include).size !== include.length
    || (ending !== undefined && !intentEndings.includes(ending))) throw invalid()

  const people = ids.map((id) => {
    if (typeof id !== 'string' || !/^person_[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id.slice(7)))) throw invalid()
    const character = premise.characters?.[id]
    const name = character?.name
    const { domain, accuracy, tolerance } = character?.knowledgeProfiles?.[0] ?? {}
    const expected = premise.beliefs.find((belief) => belief?.character === id)?.expectations?.[customProperty]
    if (![name, domain].every(isText) || ![accuracy, tolerance, expected].every(Number.isFinite)
      || accuracy < 0 || accuracy > 1 || tolerance < 0) throw invalid()
    return { id, name, domain, accuracy, tolerance, expected }
  })
  const fields = { title, thing, property, actual, people, include, ending }
  if (orderedJson(premise) !== orderedJson(makePremise(fields))) throw invalid()
  return fields
}

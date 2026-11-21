// Model edits used by the Studio editor. Every function changes the given model
// in place (the Studio owns its own copy) and keeps key order of untouched parts,
// so a saved file differs from the original only where the author edited.

function node(model, nodeId) {
  const n = model.nodes?.[nodeId]
  if (!n) throw new Error(`場面 ${nodeId} がありません`)
  return n
}

function choice(model, nodeId, choiceId) {
  const c = node(model, nodeId).choices?.find((x) => x.id === choiceId)
  if (!c) throw new Error(`場面 ${nodeId} に選択肢 ${choiceId} がありません`)
  return c
}

function uniqueId(prefix, taken) {
  for (let i = 1; ; i++) {
    const id = `${prefix}_${i}`
    if (!taken.has(id)) return id
  }
}

function allChoiceIds(model) {
  const ids = new Set()
  for (const n of Object.values(model.nodes ?? {})) for (const c of n.choices ?? []) ids.add(c.id)
  return ids
}

export function setNodeText(model, nodeId, text) {
  node(model, nodeId).text = text
}

export function setNodeSpeaker(model, nodeId, speaker) {
  const n = node(model, nodeId)
  if (speaker) n.speaker = speaker
  else delete n.speaker
}

/** Adds an empty scene and returns its id. */
export function addNode(model, preferredId) {
  const taken = new Set(Object.keys(model.nodes))
  const id = preferredId && !taken.has(preferredId) ? preferredId : uniqueId('scene', taken)
  model.nodes[id] = { id, text: '', choices: [] }
  return id
}

/** Adds a choice to a scene and returns its id. */
export function addChoice(model, nodeId, { text = '新しい選択肢', target } = {}) {
  const n = node(model, nodeId)
  const id = uniqueId('choice', allChoiceIds(model))
  if (!n.choices) n.choices = []
  n.choices.push({ id, text, target: target ?? nodeId })
  return id
}

export function removeChoice(model, nodeId, choiceId) {
  const n = node(model, nodeId)
  n.choices = (n.choices ?? []).filter((c) => c.id !== choiceId)
}

export function setChoiceText(model, nodeId, choiceId, text) {
  choice(model, nodeId, choiceId).text = text
}

export function setChoiceTarget(model, nodeId, choiceId, target) {
  if (!model.nodes[target]) throw new Error(`行き先 ${target} がありません`)
  choice(model, nodeId, choiceId).target = target
}

// conditions and effects share one shape of edit: a list on the choice

function list(model, nodeId, choiceId, field) {
  const c = choice(model, nodeId, choiceId)
  if (!c[field]) c[field] = []
  return c
}

function tidy(c, field) {
  if (Array.isArray(c[field]) && c[field].length === 0) delete c[field]
}

export function addRule(model, nodeId, choiceId, field, rule) {
  list(model, nodeId, choiceId, field)[field].push(rule)
}

export function setRule(model, nodeId, choiceId, field, index, rule) {
  const c = list(model, nodeId, choiceId, field)
  if (index < 0 || index >= c[field].length) throw new Error(`${field}[${index}] がありません`)
  c[field][index] = rule
}

export function removeRule(model, nodeId, choiceId, field, index) {
  const c = list(model, nodeId, choiceId, field)
  c[field].splice(index, 1)
  tidy(c, field)
}

// ---------------------------------------------------------------------------
// the simple condition and effect kinds the editor can build from dropdowns

export const CONDITION_KINDS = {
  flag: { label: 'フラグ', make: (key) => ({ type: 'flag', key, value: true }) },
  hasEvent: { label: '出来事', make: (key) => ({ type: 'hasEvent', key, value: true }) },
  resource: { label: '数値', make: (key) => ({ type: 'resource', key, op: '>=', value: 1 }) },
  variable: { label: '変数', make: (key) => ({ type: 'variable', key, op: '==', value: '' }) },
  hasItem: { label: '持ち物', make: (key) => ({ type: 'hasItem', key, value: true }) },
}

export const EFFECT_KINDS = {
  setFlag: { label: 'フラグを変える', make: (key) => ({ type: 'setFlag', key, value: true }) },
  addResource: { label: '数値を足す', make: (key) => ({ type: 'addResource', key, delta: 1 }) },
  setVariable: { label: '変数を決める', make: (key) => ({ type: 'setVariable', key, value: '' }) },
  createEvent: { label: '出来事を起こす', make: (key) => ({ type: 'createEvent', id: key, name: key }) },
  addItem: { label: '持ち物を得る', make: (key) => ({ type: 'addItem', key }) },
  removeItem: { label: '持ち物を失う', make: (key) => ({ type: 'removeItem', key }) },
}

/** Keys the model already uses, so dropdowns offer them before free typing. */
export function knownKeys(model) {
  const flags = new Set(Object.keys(model.flags ?? {}))
  const resources = new Set(Object.keys(model.resources ?? {}))
  const variables = new Set(Object.keys(model.variables ?? {}))
  const items = new Set(Object.keys(model.items ?? {}))
  const events = new Set()
  const visit = (c) => {
    if (!c) return
    if (c.type === 'flag') flags.add(c.key)
    if (c.type === 'resource') resources.add(c.key)
    if (c.type === 'variable') variables.add(c.key)
    if (c.type === 'hasItem') items.add(c.key)
    if (c.type === 'hasEvent') events.add(c.key)
    for (const x of c.conditions ?? []) visit(x)
    if (c.condition) visit(c.condition)
  }
  for (const n of Object.values(model.nodes ?? {})) {
    for (const c of n.choices ?? []) {
      for (const cond of c.conditions ?? []) visit(cond)
      for (const e of c.effects ?? []) {
        if (e.type === 'setFlag') flags.add(e.key)
        if (e.type === 'addResource') resources.add(e.key)
        if (e.type === 'setVariable' || e.type === 'modifyVariable') variables.add(e.key)
        if (e.type === 'addItem' || e.type === 'removeItem') items.add(e.key)
        if (e.type === 'createEvent') events.add(e.id)
        if (e.type === 'perceiveEntity' && e.eventId) events.add(e.eventId)
      }
    }
  }
  for (const p of model.perceptionPolicies ?? []) events.add(p.eventId ?? `event_${p.character}_perceives_${p.entity}`)
  const sort = (s) => [...s].filter(Boolean).sort()
  return {
    flag: sort(flags),
    resource: sort(resources),
    variable: sort(variables),
    item: sort(items),
    event: sort(events),
  }
}

/** Which key list a rule draws from (for the key dropdown), or null when not editable. */
export function keyKind(rule) {
  switch (rule.type) {
    case 'flag':
    case 'setFlag':
      return 'flag'
    case 'resource':
    case 'addResource':
      return 'resource'
    case 'variable':
    case 'setVariable':
      return 'variable'
    case 'hasItem':
    case 'addItem':
    case 'removeItem':
      return 'item'
    case 'hasEvent':
    case 'createEvent':
      return 'event'
    default:
      return null
  }
}

/** Snippets the text helper inserts into the story text. */
export function textSnippets(model) {
  const entityProps = []
  for (const [id, e] of Object.entries(model.entities ?? {})) {
    entityProps.push({ label: `${e.name ?? id} の名前`, text: `[${id}]` })
    for (const key of Object.keys(e.properties ?? {})) {
      entityProps.push({ label: `${e.name ?? id} の ${key}`, text: `[${id}.${key}]` })
    }
  }
  const keys = knownKeys(model)
  const values = [...keys.variable, ...keys.resource, ...keys.flag].map((k) => ({ label: k, text: `{${k}}` }))
  const conditional = keys.flag.map((k) => ({ label: `${k} がオンの時だけ`, text: `{?${k}:ここに文}` }))
  return { entityProps, values, conditional }
}

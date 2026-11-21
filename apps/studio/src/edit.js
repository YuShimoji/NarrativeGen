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
// editing by position: a path is the list of keys from the model to a value,
// e.g. ['nodes', 'desk', 'choices', 0, 'conditions', 1, 'key']

export function getAt(model, path) {
  let v = model
  for (const k of path) {
    if (v == null) return undefined
    v = v[k]
  }
  return v
}

/** Sets a value; undefined deletes the key. Missing parents are created. */
export function setAt(model, path, value) {
  let parent = model
  for (let i = 0; i < path.length - 1; i++) {
    if (parent[path[i]] == null) parent[path[i]] = typeof path[i + 1] === 'number' ? [] : {}
    parent = parent[path[i]]
  }
  const last = path[path.length - 1]
  if (value === undefined) {
    if (Array.isArray(parent)) parent.splice(last, 1)
    else delete parent[last]
  } else {
    parent[last] = value
  }
}

/** Appends to the list at path (creating it). Returns the new index. */
export function pushAt(model, path, value) {
  let list = getAt(model, path)
  if (!Array.isArray(list)) {
    list = []
    setAt(model, path, list)
  }
  list.push(value)
  return list.length - 1
}

/**
 * Removes the value at path. A "not" left without its condition goes with it,
 * and a choice's conditions/effects list that becomes empty is dropped.
 */
export function removeAt(model, path) {
  const last = path[path.length - 1]
  const parentPath = path.slice(0, -1)
  if (last === 'condition' && getAt(model, parentPath)?.type === 'not') return removeAt(model, parentPath)
  setAt(model, path, undefined)
  const list = getAt(model, parentPath)
  const owner = parentPath[parentPath.length - 1]
  const isChoiceList = parentPath.length === 5 && parentPath[0] === 'nodes' && parentPath[2] === 'choices'
  if (Array.isArray(list) && list.length === 0 && isChoiceList && (owner === 'conditions' || owner === 'effects')) {
    setAt(model, parentPath, undefined)
  }
}

// ---------------------------------------------------------------------------
// the condition and effect kinds the editor can build from dropdowns

export const CONDITION_KINDS = {
  flag: { label: 'フラグ', make: (key) => ({ type: 'flag', key, value: true }) },
  hasEvent: { label: '出来事', make: (key) => ({ type: 'hasEvent', key, value: true }) },
  resource: { label: '数値', make: (key) => ({ type: 'resource', key, op: '>=', value: 1 }) },
  variable: { label: '変数', make: (key) => ({ type: 'variable', key, op: '==', value: '' }) },
  hasItem: { label: '持ち物', make: (key) => ({ type: 'hasItem', key, value: true }) },
  knowledgeRule: { label: '知識ルールで気づく', make: (rule) => ({ type: 'knowledgeRule', rule, result: 'noticed' }) },
  property: { label: '物の性質', make: (entity, key) => ({ type: 'property', entity, key, op: '==', value: '' }) },
  and: { label: 'すべてを満たす', make: (inner) => ({ type: 'and', conditions: [inner] }) },
  or: { label: 'どれかを満たす', make: (inner) => ({ type: 'or', conditions: [inner] }) },
  not: { label: '満たさない', make: (inner) => ({ type: 'not', condition: inner }) },
}

export const EFFECT_KINDS = {
  setFlag: { label: 'フラグを変える', make: (key) => ({ type: 'setFlag', key, value: true }) },
  addResource: { label: '数値を足す', make: (key) => ({ type: 'addResource', key, delta: 1 }) },
  setVariable: { label: '変数を決める', make: (key) => ({ type: 'setVariable', key, value: '' }) },
  createEvent: { label: '出来事を起こす', make: (key) => ({ type: 'createEvent', id: key, name: key }) },
  addItem: { label: '持ち物を得る', make: (key) => ({ type: 'addItem', key }) },
  removeItem: { label: '持ち物を失う', make: (key) => ({ type: 'removeItem', key }) },
  perceiveEntity: { label: '知覚する', make: (p) => ({ type: 'perceiveEntity', ...p, onlyIfNoticed: true }) },
}

/** A new condition or effect of the given kind, filled with keys the model already uses. */
export function newRule(model, field, kind) {
  const keys = knownKeys(model)
  if (field === 'effects') {
    if (kind === 'perceiveEntity') {
      const p = perceptionDefaults(model)
      return EFFECT_KINDS.perceiveEntity.make({ ...p, eventId: `event_${p.character}_perceives_${p.entity}`, eventName: '' })
    }
    return EFFECT_KINDS[kind].make(keys[keyKind({ type: kind })]?.[0] ?? `new_${kind.toLowerCase()}`)
  }
  if (kind === 'and' || kind === 'or' || kind === 'not') return CONDITION_KINDS[kind].make(newRule(model, field, 'flag'))
  if (kind === 'knowledgeRule') return CONDITION_KINDS.knowledgeRule.make(keys.rule[0] ?? addKnowledgeRule(model))
  if (kind === 'property') {
    const entity = keys.entity[0] ?? ''
    const key = Object.keys(entityProperties(model, entity))[0] ?? ''
    const rule = CONDITION_KINDS.property.make(entity, key)
    rule.value = entityProperties(model, entity)[key]?.defaultValue ?? ''
    return rule
  }
  return CONDITION_KINDS[kind].make(keys[keyKind({ type: kind })]?.[0] ?? `new_${kind.toLowerCase()}`)
}

// ---------------------------------------------------------------------------
// characters, entities and what they know

/** Properties of an entity including those inherited from parentEntity (own ones win). */
export function entityProperties(model, entityId) {
  const chain = []
  const seen = new Set()
  for (let id = entityId; id && model.entities?.[id] && !seen.has(id); id = model.entities[id].parentEntity) {
    seen.add(id)
    chain.unshift(model.entities[id])
  }
  return Object.assign({}, ...chain.map((e) => e.properties ?? {}))
}

export function numericProperties(model, entityId) {
  return Object.entries(entityProperties(model, entityId))
    .filter(([, p]) => p.type === 'number')
    .map(([k]) => k)
}

export function domainsOf(model, characterId) {
  return (model.characters?.[characterId]?.knowledgeProfiles ?? []).map((p) => p.domain)
}

/** The first character, entity, domain and numeric expectation the model offers. */
export function perceptionDefaults(model) {
  const character = Object.keys(model.characters ?? {})[0] ?? addCharacter(model)
  const ids = Object.keys(model.entities ?? {})
  const entity = ids.find((id) => numericProperties(model, id).length) ?? ids[0] ?? addEntity(model)
  const domain = domainsOf(model, character)[0] ?? 'general'
  const key = numericProperties(model, entity)[0]
  const expectations = key ? { [key]: Number(entityProperties(model, entity)[key].defaultValue ?? 0) } : {}
  return { character, entity, domain, expectations }
}

export function addKnowledgeRule(model, rule) {
  if (!model.knowledgeRules) model.knowledgeRules = {}
  const id = uniqueId('rule', new Set(Object.keys(model.knowledgeRules)))
  model.knowledgeRules[id] = rule ?? perceptionDefaults(model)
  return id
}

export function addPerceptionPolicy(model, nodeId) {
  if (!model.perceptionPolicies) model.perceptionPolicies = []
  const id = uniqueId('policy', new Set(model.perceptionPolicies.map((p) => p.id)))
  const p = perceptionDefaults(model)
  model.perceptionPolicies.push({ id, trigger: { node: nodeId }, ...p, eventId: `event_${p.character}_perceives_${p.entity}`, eventName: '', onlyIfNoticed: true })
  return model.perceptionPolicies.length - 1
}

export function addCharacter(model) {
  if (!model.characters) model.characters = {}
  const id = uniqueId('character', new Set(Object.keys(model.characters)))
  model.characters[id] = { id, name: id, knowledgeProfiles: [{ domain: 'general', accuracy: 0.5, tolerance: 0.25 }] }
  return id
}

export function addEntity(model) {
  if (!model.entities) model.entities = {}
  const id = uniqueId('entity', new Set(Object.keys(model.entities)))
  model.entities[id] = { id, name: id, properties: {} }
  return id
}

const DEFAULT_BY_TYPE = { number: 0, string: '', boolean: false }

export function addEntityProperty(model, entityId, key, type = 'number') {
  const e = model.entities?.[entityId]
  if (!e) throw new Error(`物 ${entityId} がありません`)
  if (!key || /\s|\./.test(key)) throw new Error('性質の名前は空白と「.」を含まない文字にしてください')
  if (!e.properties) e.properties = {}
  if (e.properties[key]) throw new Error(`性質 ${key} は既にあります`)
  e.properties[key] = { key, type, defaultValue: DEFAULT_BY_TYPE[type] }
}

/** Where a character or entity is referred to (so the editor only deletes unused ones). */
export function usesOf(model, kind, id) {
  const field = kind === 'character' ? 'character' : 'entity'
  let n = 0
  const visit = (v) => {
    if (Array.isArray(v)) v.forEach(visit)
    else if (v && typeof v === 'object') {
      if (v[field] === id && (v.type || v.domain || v.trigger || v.expectations)) n++
      if (kind === 'entity' && v.parentEntity === id) n++
      for (const x of Object.values(v)) visit(x)
    }
  }
  visit({ nodes: model.nodes, knowledgeRules: model.knowledgeRules, perceptionPolicies: model.perceptionPolicies, entities: model.entities })
  if (kind === 'entity') {
    for (const node of Object.values(model.nodes ?? {})) if ((node.text ?? '').includes(`[${id}`)) n++
  }
  return n
}

export function ruleUses(model, ruleId) {
  let n = 0
  const visit = (v) => {
    if (Array.isArray(v)) v.forEach(visit)
    else if (v && typeof v === 'object') {
      if (v.type === 'knowledgeRule' && v.rule === ruleId) n++
      for (const x of Object.values(v)) visit(x)
    }
  }
  visit(model.nodes)
  visit(model.conversationTemplates)
  return n
}

// ---------------------------------------------------------------------------
// scenes: rename and delete keep every reference consistent

const sameOrder = (obj, oldKey, newKey, value) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => (k === oldKey ? [newKey, value] : [k, v])))

export function renameNode(model, oldId, newId) {
  if (!model.nodes[oldId]) throw new Error(`場面 ${oldId} がありません`)
  if (!newId || /\s/.test(newId)) throw new Error('場面のIDは空白を含まない文字にしてください')
  if (newId === oldId) return
  if (model.nodes[newId]) throw new Error(`場面 ${newId} は既にあります`)
  const node = model.nodes[oldId]
  node.id = newId
  model.nodes = sameOrder(model.nodes, oldId, newId, node)
  if (model.startNode === oldId) model.startNode = newId
  for (const n of Object.values(model.nodes)) {
    for (const c of n.choices ?? []) {
      if (c.target === oldId) c.target = newId
      for (const e of c.effects ?? []) if (e.type === 'goto' && e.target === oldId) e.target = newId
    }
  }
  for (const p of model.perceptionPolicies ?? []) if (p.trigger?.node === oldId) p.trigger.node = newId
}

/** What deleting a scene also removes: the choices and goto effects that lead to it, and its policies. */
export function nodeReferences(model, id) {
  const choices = []
  const gotos = []
  for (const [nodeId, n] of Object.entries(model.nodes)) {
    for (const c of n.choices ?? []) {
      if (c.target === id && nodeId !== id) choices.push({ nodeId, choiceId: c.id, text: c.text })
      else if (nodeId !== id && (c.effects ?? []).some((e) => e.type === 'goto' && e.target === id)) gotos.push({ nodeId, choiceId: c.id, text: c.text })
    }
  }
  const policies = (model.perceptionPolicies ?? []).filter((p) => p.trigger?.node === id).map((p) => p.id)
  return { choices, gotos, policies }
}

export function deleteNode(model, id) {
  if (!model.nodes[id]) throw new Error(`場面 ${id} がありません`)
  if (model.startNode === id) throw new Error('開始の場面は消せません')
  const refs = nodeReferences(model, id)
  delete model.nodes[id]
  for (const n of Object.values(model.nodes)) {
    if (!n.choices) continue
    n.choices = n.choices.filter((c) => c.target !== id)
    for (const c of n.choices) {
      if (!c.effects) continue
      c.effects = c.effects.filter((e) => !(e.type === 'goto' && e.target === id))
      if (!c.effects.length) delete c.effects
    }
  }
  if (model.perceptionPolicies) {
    model.perceptionPolicies = model.perceptionPolicies.filter((p) => p.trigger?.node !== id)
    if (!model.perceptionPolicies.length) delete model.perceptionPolicies
  }
  return refs
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
    rule: Object.keys(model.knowledgeRules ?? {}),
    character: Object.keys(model.characters ?? {}),
    entity: Object.keys(model.entities ?? {}),
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

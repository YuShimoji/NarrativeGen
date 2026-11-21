import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as edit from '../src/edit.js'

const base = () => ({
  modelType: 'adventure-playthrough',
  startNode: 'a',
  flags: { lit: false },
  nodes: {
    a: { id: 'a', text: 'start', choices: [{ id: 'go', text: 'Go', target: 'b', conditions: [{ type: 'flag', key: 'lit', value: true }] }] },
    b: { id: 'b', text: 'end' },
  },
})

test('text, speaker and choice fields change only what was edited', () => {
  const m = base()
  edit.setNodeText(m, 'a', 'new text')
  edit.setNodeSpeaker(m, 'a', 'Mira')
  edit.setChoiceText(m, 'a', 'go', 'Walk')
  assert.equal(m.nodes.a.text, 'new text')
  assert.equal(m.nodes.a.speaker, 'Mira')
  assert.equal(m.nodes.a.choices[0].text, 'Walk')
  edit.setNodeSpeaker(m, 'a', '')
  assert.equal('speaker' in m.nodes.a, false)
  assert.deepEqual(Object.keys(m.nodes.a), ['id', 'text', 'choices'])
})

test('new scenes and choices get unused ids, targets must exist', () => {
  const m = base()
  const scene = edit.addNode(m)
  assert.equal(scene, 'scene_1')
  assert.deepEqual(m.nodes.scene_1, { id: 'scene_1', text: '', choices: [] })
  const c = edit.addChoice(m, 'b', { target: scene })
  assert.equal(c, 'choice_1')
  assert.equal(m.nodes.b.choices[0].target, 'scene_1')
  assert.throws(() => edit.setChoiceTarget(m, 'a', 'go', 'nowhere'))
  edit.removeChoice(m, 'b', c)
  assert.deepEqual(m.nodes.b.choices, [])
})

test('conditions and effects are added, replaced and removed; empty lists disappear', () => {
  const m = base()
  edit.setRule(m, 'a', 'go', 'conditions', 0, { type: 'flag', key: 'lit', value: false })
  assert.equal(m.nodes.a.choices[0].conditions[0].value, false)
  edit.removeRule(m, 'a', 'go', 'conditions', 0)
  assert.equal('conditions' in m.nodes.a.choices[0], false)
  edit.addRule(m, 'a', 'go', 'effects', edit.EFFECT_KINDS.setFlag.make('lit'))
  assert.deepEqual(m.nodes.a.choices[0].effects, [{ type: 'setFlag', key: 'lit', value: true }])
})

test('known keys collect what the model already uses', () => {
  const m = base()
  m.nodes.b.choices = [{ id: 'x', text: 'x', target: 'a', effects: [{ type: 'createEvent', id: 'event_door', name: 'Door' }] }]
  const keys = edit.knownKeys(m)
  assert.deepEqual(keys.flag, ['lit'])
  assert.deepEqual(keys.event, ['event_door'])
  assert.equal(edit.keyKind({ type: 'knowledgeRule' }), null)
})

const knowing = () => ({
  ...base(),
  entities: {
    thing: { id: 'thing', name: 'Thing', properties: { weight: { key: 'weight', type: 'number', defaultValue: 10 } } },
    child: { id: 'child', name: 'Child', parentEntity: 'thing', properties: { color: { key: 'color', type: 'string', defaultValue: 'red' } } },
  },
  characters: { mira: { id: 'mira', name: 'Mira', knowledgeProfiles: [{ domain: 'craft', accuracy: 0.8, tolerance: 0.1 }] } },
})

test('paths set, push and remove; a lone not and an empty choice list disappear', () => {
  const m = base()
  edit.setAt(m, ['nodes', 'a', 'choices', 0, 'conditions', 0, 'key'], 'dark')
  assert.equal(m.nodes.a.choices[0].conditions[0].key, 'dark')
  const i = edit.pushAt(m, ['nodes', 'a', 'choices', 0, 'conditions'], edit.newRule(m, 'conditions', 'not'))
  assert.equal(m.nodes.a.choices[0].conditions[i].type, 'not')
  edit.removeAt(m, ['nodes', 'a', 'choices', 0, 'conditions', i, 'condition'])
  assert.equal(m.nodes.a.choices[0].conditions.length, 1)
  edit.removeAt(m, ['nodes', 'a', 'choices', 0, 'conditions', 0])
  assert.equal('conditions' in m.nodes.a.choices[0], false)
})

test('knowledge rules and perception start from the model own characters and numeric properties', () => {
  const m = knowing()
  assert.deepEqual(edit.numericProperties(m, 'child'), ['weight'])
  const cond = edit.newRule(m, 'conditions', 'knowledgeRule')
  assert.equal(cond.rule, 'rule_1')
  assert.deepEqual(m.knowledgeRules.rule_1, { character: 'mira', entity: 'thing', domain: 'craft', expectations: { weight: 10 } })
  const fx = edit.newRule(m, 'effects', 'perceiveEntity')
  assert.equal(fx.eventId, 'event_mira_perceives_thing')
  const pi = edit.addPerceptionPolicy(m, 'b')
  assert.equal(m.perceptionPolicies[pi].trigger.node, 'b')
  assert.equal(edit.usesOf(m, 'character', 'mira'), 2)
  assert.equal(edit.usesOf(m, 'entity', 'thing'), 3) // rule, policy, and child's parentEntity
  assert.throws(() => edit.addEntityProperty(m, 'thing', 'weight'))
  edit.addEntityProperty(m, 'thing', 'age', 'number')
  assert.equal(m.entities.thing.properties.age.defaultValue, 0)
})

test('renaming a scene follows every reference; deleting removes what led to it', () => {
  const m = base()
  m.perceptionPolicies = [{ id: 'p', trigger: { node: 'b' }, character: 'c', entity: 'e', domain: 'd', expectations: {} }]
  edit.renameNode(m, 'b', 'finale')
  assert.deepEqual(Object.keys(m.nodes), ['a', 'finale'])
  assert.equal(m.nodes.a.choices[0].target, 'finale')
  assert.equal(m.perceptionPolicies[0].trigger.node, 'finale')
  assert.throws(() => edit.renameNode(m, 'a', 'finale'))
  const refs = edit.nodeReferences(m, 'finale')
  assert.equal(refs.choices.length, 1)
  edit.deleteNode(m, 'finale')
  assert.deepEqual(m.nodes.a.choices, [])
  assert.equal('perceptionPolicies' in m, false)
  assert.throws(() => edit.deleteNode(m, 'a'))
})

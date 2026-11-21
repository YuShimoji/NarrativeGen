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

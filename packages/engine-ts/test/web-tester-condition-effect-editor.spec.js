import { describe, expect, it } from 'vitest'

import { ConditionEffectEditor } from '../../../apps/web-tester/src/ui/condition-effect-editor.js'

describe('web-tester ConditionEffectEditor (parse/build contract)', () => {
  const editor = new ConditionEffectEditor()

  describe('parseConditionInput', () => {
    it('returns null for empty input', () => {
      expect(editor.parseConditionInput('')).toBeNull()
      expect(editor.parseConditionInput('   ')).toBeNull()
      expect(editor.parseConditionInput(null)).toBeNull()
    })

    it('passes through objects', () => {
      const obj = { type: 'flag', key: 'hasKey', value: true }
      expect(editor.parseConditionInput(obj)).toBe(obj)
    })

    it('parses JSON raw condition into object (and/or/not)', () => {
      const raw = '{"type":"and","conditions":[{"type":"flag","key":"a","value":true}]}'
      expect(editor.parseConditionInput(raw)).toEqual({
        type: 'and',
        conditions: [{ type: 'flag', key: 'a', value: true }],
      })
    })

    it('parses time/timeWindow into engine-compatible object', () => {
      expect(editor.parseConditionInput('time:1-10')).toEqual({ type: 'timeWindow', start: 1, end: 10 })
      expect(editor.parseConditionInput('timeWindow:0-0')).toEqual({ type: 'timeWindow', start: 0, end: 0 })
    })

    it('parses flag into boolean value', () => {
      expect(editor.parseConditionInput('flag:hasKey=true')).toEqual({ type: 'flag', key: 'hasKey', value: true })
      expect(editor.parseConditionInput('flag:hasKey=0')).toEqual({ type: 'flag', key: 'hasKey', value: false })
    })

    it('parses resource with operator mapping (= -> ==)', () => {
      expect(editor.parseConditionInput('resource:gold>=10')).toEqual({ type: 'resource', key: 'gold', op: '>=', value: 10 })
      expect(editor.parseConditionInput('resource:gold=10')).toEqual({ type: 'resource', key: 'gold', op: '==', value: 10 })
      expect(editor.parseConditionInput('resource:gold==10')).toEqual({ type: 'resource', key: 'gold', op: '==', value: 10 })
    })

    it('keeps resource condition as text if value is not numeric', () => {
      expect(editor.parseConditionInput('resource:gold>=abc')).toBe('resource:gold>=abc')
    })

    it('parses variable and normalizes operator (= -> ==)', () => {
      expect(editor.parseConditionInput('variable:name=alice')).toEqual({ type: 'variable', key: 'name', op: '==', value: 'alice' })
      expect(editor.parseConditionInput('variable:name!=alice')).toEqual({ type: 'variable', key: 'name', op: '!=', value: 'alice' })
      expect(editor.parseConditionInput('variable:tagscontainsfoo')).toEqual({ type: 'variable', key: 'tags', op: 'contains', value: 'foo' })
      expect(editor.parseConditionInput('variable:tags!containsfoo')).toEqual({ type: 'variable', key: 'tags', op: '!contains', value: 'foo' })
    })

    it('returns unsupported formats as-is (backward compatible)', () => {
      expect(editor.parseConditionInput('visited:start')).toBe('visited:start')
      expect(editor.parseConditionInput('flag:bad format')).toBe('flag:bad format')
    })
  })

  describe('parseEffectInput', () => {
    it('returns null for empty input', () => {
      expect(editor.parseEffectInput('')).toBeNull()
      expect(editor.parseEffectInput('   ')).toBeNull()
      expect(editor.parseEffectInput(null)).toBeNull()
    })

    it('passes through objects', () => {
      const obj = { type: 'goto', target: 'end' }
      expect(editor.parseEffectInput(obj)).toBe(obj)
    })

    it('parses JSON raw effect into object', () => {
      const raw = '{"type":"setFlag","key":"a","value":true}'
      expect(editor.parseEffectInput(raw)).toEqual({ type: 'setFlag', key: 'a', value: true })
    })

    it('parses setFlag/addResource/setVariable/goto into engine-compatible objects', () => {
      expect(editor.parseEffectInput('setFlag:hasKey=true')).toEqual({ type: 'setFlag', key: 'hasKey', value: true })
      expect(editor.parseEffectInput('addResource:gold=-1')).toEqual({ type: 'addResource', key: 'gold', delta: -1 })
      expect(editor.parseEffectInput('setVariable:name=alice')).toEqual({ type: 'setVariable', key: 'name', value: 'alice' })
      expect(editor.parseEffectInput('goto:end')).toEqual({ type: 'goto', target: 'end' })
    })

    it('returns unsupported formats as-is (backward compatible)', () => {
      expect(editor.parseEffectInput('setResource:hp=10')).toBe('setResource:hp=10')
    })
  })

  describe('buildConditionObject/buildEffectObject', () => {
    it('builds engine-compatible condition objects', () => {
      expect(editor.buildConditionObject('flag', 'hasKey', '=', 'true')).toEqual({ type: 'flag', key: 'hasKey', value: true })
      expect(editor.buildConditionObject('resource', 'gold', '>=', '10')).toEqual({ type: 'resource', key: 'gold', op: '>=', value: 10 })
      expect(editor.buildConditionObject('resource', 'gold', '=', '10')).toEqual({ type: 'resource', key: 'gold', op: '==', value: 10 })
      expect(editor.buildConditionObject('variable', 'name', '=', 'alice')).toEqual({ type: 'variable', key: 'name', op: '==', value: 'alice' })
      expect(editor.buildConditionObject('timeWindow', '1', '-', '10')).toEqual({ type: 'timeWindow', start: 1, end: 10 })
    })

    it('falls back for invalid numeric conversions', () => {
      expect(editor.buildConditionObject('resource', 'gold', '>=', 'abc')).toBeNull()
      expect(editor.buildConditionObject('timeWindow', 'a', '-', 'b')).toBe('time:a-b')
    })

    it('builds engine-compatible effect objects', () => {
      expect(editor.buildEffectObject('setFlag', 'hasKey', 'true')).toEqual({ type: 'setFlag', key: 'hasKey', value: true })
      expect(editor.buildEffectObject('addResource', 'gold', '10')).toEqual({ type: 'addResource', key: 'gold', delta: 10 })
      expect(editor.buildEffectObject('setVariable', 'name', 'alice')).toEqual({ type: 'setVariable', key: 'name', value: 'alice' })
      expect(editor.buildEffectObject('goto', 'end', '')).toEqual({ type: 'goto', target: 'end' })
    })

    it('returns null if required fields are missing', () => {
      expect(editor.buildConditionObject('flag', '', '=', 'true')).toBeNull()
      expect(editor.buildEffectObject('setFlag', '', 'true')).toBeNull()
    })
  })
})

import { describe, it, expect } from 'vitest'
import {
  markDescribed, isDescribed, getUndescribedKeys,
  getDescriptionCount, resetDescriptions
} from '../src/description-tracker'
import type { DescriptionState } from '../src/description-tracker'

describe('Description Tracker', () => {
  const empty: DescriptionState = {}

  describe('markDescribed', () => {
    it('should add new entity and property', () => {
      const state = markDescribed(empty, 'window', 'material')
      expect(state.window.describedKeys).toEqual(['material'])
      expect(state.window.descriptionCount).toBe(1)
    })

    it('should accumulate properties', () => {
      let state = markDescribed(empty, 'window', 'material')
      state = markDescribed(state, 'window', 'color')
      expect(state.window.describedKeys).toEqual(['material', 'color'])
      expect(state.window.descriptionCount).toBe(2)
    })

    it('should not duplicate property keys', () => {
      let state = markDescribed(empty, 'window', 'material')
      state = markDescribed(state, 'window', 'material')
      expect(state.window.describedKeys).toEqual(['material'])
      expect(state.window.descriptionCount).toBe(2) // count still increments
    })

    it('should track multiple entities independently', () => {
      let state = markDescribed(empty, 'window', 'material')
      state = markDescribed(state, 'door', 'color')
      expect(state.window.describedKeys).toEqual(['material'])
      expect(state.door.describedKeys).toEqual(['color'])
    })

    it('should be immutable', () => {
      const state1 = markDescribed(empty, 'window', 'material')
      const state2 = markDescribed(state1, 'window', 'color')
      expect(state1.window.describedKeys).toEqual(['material']) // unchanged
      expect(state2.window.describedKeys).toEqual(['material', 'color'])
    })
  })

  describe('isDescribed', () => {
    it('should return true for described property', () => {
      const state = markDescribed(empty, 'window', 'material')
      expect(isDescribed(state, 'window', 'material')).toBe(true)
    })

    it('should return false for undescribed property', () => {
      const state = markDescribed(empty, 'window', 'material')
      expect(isDescribed(state, 'window', 'color')).toBe(false)
    })

    it('should return false for unknown entity', () => {
      expect(isDescribed(empty, 'window', 'material')).toBe(false)
    })
  })

  describe('getUndescribedKeys', () => {
    it('should return keys not yet described', () => {
      const state = markDescribed(empty, 'window', 'material')
      const undescribed = getUndescribedKeys(state, 'window', ['material', 'color', 'size'])
      expect(undescribed).toEqual(['color', 'size'])
    })

    it('should return all keys if nothing described', () => {
      const keys = getUndescribedKeys(empty, 'window', ['material', 'color'])
      expect(keys).toEqual(['material', 'color'])
    })
  })

  describe('getDescriptionCount', () => {
    it('should return 0 for unknown entity', () => {
      expect(getDescriptionCount(empty, 'window')).toBe(0)
    })

    it('should count descriptions', () => {
      let state = markDescribed(empty, 'window', 'material')
      state = markDescribed(state, 'window', 'color')
      expect(getDescriptionCount(state, 'window')).toBe(2)
    })
  })

  describe('resetDescriptions', () => {
    it('should reset specific entity', () => {
      let state = markDescribed(empty, 'window', 'material')
      state = markDescribed(state, 'door', 'color')
      state = resetDescriptions(state, 'window')
      expect(state.window).toBeUndefined()
      expect(state.door).toBeDefined()
    })

    it('should reset all entities', () => {
      let state = markDescribed(empty, 'window', 'material')
      state = markDescribed(state, 'door', 'color')
      state = resetDescriptions(state)
      expect(Object.keys(state)).toEqual([])
    })
  })
})

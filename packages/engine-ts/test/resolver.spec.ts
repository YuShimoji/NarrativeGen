import { describe, it, expect } from 'vitest'
import { resolveNodeId, splitCanonicalId } from '../src/resolver'

describe('resolveNodeId', () => {
    it('resolves absolute IDs correctly', () => {
        expect(resolveNodeId('/chapters/intro/start', 'any/where')).toBe('chapters/intro/start')
        expect(resolveNodeId('/start', 'any/where')).toBe('start')
    })

    it('resolves local IDs (no slash) correctly', () => {
        expect(resolveNodeId('tutorial', 'chapters/intro')).toBe('chapters/intro/tutorial')
        expect(resolveNodeId('start', '')).toBe('start')
    })

    it('resolves relative-to-current (./) correctly', () => {
        expect(resolveNodeId('./tutorial', 'chapters/intro')).toBe('chapters/intro/tutorial')
        expect(resolveNodeId('./', 'chapters/intro')).toBe('chapters/intro')
        expect(resolveNodeId('.', 'chapters/intro')).toBe('chapters/intro')
    })

    it('resolves relative-up (../) correctly', () => {
        expect(resolveNodeId('../main/battle', 'chapters/intro')).toBe('chapters/main/battle')
        expect(resolveNodeId('../../start', 'chapters/intro/sub')).toBe('chapters/start')
        expect(resolveNodeId('../start', '')).toBe('start') // Should handle root parent gracefully
    })

    it('resolves group-relative (slash but no prefix) correctly', () => {
        expect(resolveNodeId('sub/node', 'ch2')).toBe('ch2/sub/node')
        expect(resolveNodeId('inner/path', 'chapters/intro')).toBe('chapters/intro/inner/path')
        expect(resolveNodeId('top/path', '')).toBe('top/path')
    })

    it('keeps root slash as empty and lets caller normalize root target', () => {
        expect(resolveNodeId('/', 'ch2')).toBe('')
    })

    it('handles empty target', () => {
        expect(resolveNodeId('', 'group')).toBe('')
    })
})

describe('splitCanonicalId', () => {
    it('splits correctly', () => {
        expect(splitCanonicalId('chapters/intro/start')).toEqual({ group: 'chapters/intro', localId: 'start' })
        expect(splitCanonicalId('start')).toEqual({ group: '', localId: 'start' })
    })
})

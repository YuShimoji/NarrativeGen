import { describe, it, expect } from 'vitest'
import { paraphraseJa, chooseParaphrase } from '../src/paraphrase'

describe('paraphraseJa', () => {
    it('generates multiple variants', () => {
        const text = 'これは見るテストです。'
        const variants = paraphraseJa(text, { variantCount: 3 })
        expect(variants.length).toBeGreaterThan(0)
        expect(variants.length).toBeLessThanOrEqual(3)
    })

    it('applies synonyms', () => {
        const text = '静かに歩く'
        const variants = paraphraseJa(text, { variantCount: 3, seed: 12345 })
        // Should contain synonyms from DEFAULT_SYNONYMS
        const hasVariation = variants.some(v => v !== text)
        expect(hasVariation).toBe(true)
    })

    it('converts to da-dearu style', () => {
        const text = 'これはテストです。'
        const variants = paraphraseJa(text, { style: 'da-dearu', variantCount: 1 })
        expect(variants[0]).toContain('だ。')
        expect(variants[0]).not.toContain('です。')
    })

    it('converts to desu-masu style', () => {
        const text = 'これはテストだ。'
        const variants = paraphraseJa(text, { style: 'desu-masu', variantCount: 1 })
        expect(variants[0]).toContain('です。')
        expect(variants[0]).not.toContain('だ。')
    })

    it('returns unique variants', () => {
        const text = 'テスト'
        const variants = paraphraseJa(text, { variantCount: 3 })
        const uniqueVariants = new Set(variants)
        expect(uniqueVariants.size).toBe(variants.length)
    })

    it('uses seed for deterministic results', () => {
        const text = '静かに歩く'
        const variants1 = paraphraseJa(text, { variantCount: 3, seed: 42 })
        const variants2 = paraphraseJa(text, { variantCount: 3, seed: 42 })
        expect(variants1).toEqual(variants2)
    })
})

describe('chooseParaphrase', () => {
    it('returns a single paraphrase', () => {
        const text = 'テスト'
        const result = chooseParaphrase(text)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })

    it('respects style option', () => {
        const text = 'これはテストです。'
        const result = chooseParaphrase(text, { style: 'da-dearu' })
        expect(result).toContain('だ。')
    })
})

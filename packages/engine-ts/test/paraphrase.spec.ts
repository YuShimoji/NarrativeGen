import { describe, it, expect } from 'vitest'
import {
    paraphraseJa,
    chooseParaphrase,
    createUsageHistory,
    recordUsage,
    buildParaphraseContext,
    type PropertyAwareLexicon,
    type ParaphraseContext,
    type UsageHistory,
    type ConditionalVariant,
} from '../src/paraphrase'

// ============================================================
// Existing tests (SP-PARA-001 backward compatibility)
// ============================================================

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

// ============================================================
// SP-PARA-002: Property Matching Extension
// ============================================================

describe('property matching', () => {
    const gentleVariant: ConditionalVariant = {
        text: 'そっと見つめる',
        match: { personality: 'gentle' },
    }
    const roughVariant: ConditionalVariant = {
        text: 'にらみつける',
        match: { personality: 'rough' },
    }
    const defaultVariant = '見渡す'

    const lexicon: PropertyAwareLexicon = {
        '見る': [defaultVariant, gentleVariant, roughVariant],
    }

    it('selects conditional variant when context matches', () => {
        const context: ParaphraseContext = {
            entityId: 'char_a',
            properties: {
                personality: { defaultValue: 'gentle' },
            },
        }
        const result = chooseParaphrase('見る', {
            lexicon,
            context,
            seed: 1,
        })
        expect(result).toBe('そっと見つめる')
    })

    it('selects different variant for different property value', () => {
        const context: ParaphraseContext = {
            entityId: 'char_b',
            properties: {
                personality: { defaultValue: 'rough' },
            },
        }
        const result = chooseParaphrase('見る', {
            lexicon,
            context,
            seed: 1,
        })
        expect(result).toBe('にらみつける')
    })

    it('falls back to unconditional variant when no match', () => {
        const context: ParaphraseContext = {
            entityId: 'char_c',
            properties: {
                personality: { defaultValue: 'calm' },
            },
        }
        const result = chooseParaphrase('見る', {
            lexicon,
            context,
            seed: 1,
        })
        // Only unconditional variant available
        expect(result).toBe('見渡す')
    })

    it('falls back to unconditional when no context provided', () => {
        const result = chooseParaphrase('見る', {
            lexicon,
            seed: 1,
        })
        expect(result).toBe('見渡す')
    })

    it('handles mixed string and ConditionalVariant entries', () => {
        const mixed: PropertyAwareLexicon = {
            '歩く': [
                '進む',
                { text: 'そろそろと歩く', match: { cautious: true } },
                '歩みを進める',
            ],
        }
        const ctx: ParaphraseContext = {
            properties: { cautious: { defaultValue: true } },
        }
        const result = chooseParaphrase('歩く', { lexicon: mixed, context: ctx, seed: 42 })
        expect(result).toBe('そろそろと歩く')
    })

    it('supports multi-condition match', () => {
        const lex: PropertyAwareLexicon = {
            '話す': [
                { text: '丁寧に話しかける', match: { polite: true, mood: 'happy' } },
                { text: '話しかける' },
            ],
        }
        // Both conditions met
        const ctx1: ParaphraseContext = {
            properties: {
                polite: { defaultValue: true },
                mood: { defaultValue: 'happy' },
            },
        }
        expect(chooseParaphrase('話す', { lexicon: lex, context: ctx1, seed: 1 }))
            .toBe('丁寧に話しかける')

        // Only one condition met → falls back to unconditional
        const ctx2: ParaphraseContext = {
            properties: {
                polite: { defaultValue: true },
                mood: { defaultValue: 'angry' },
            },
        }
        expect(chooseParaphrase('話す', { lexicon: lex, context: ctx2, seed: 1 }))
            .toBe('話しかける')
    })
})

describe('usage history', () => {
    it('creates empty history', () => {
        const history = createUsageHistory()
        expect(history).toEqual({})
    })

    it('records usage', () => {
        const history = createUsageHistory()
        recordUsage(history, 'foo')
        recordUsage(history, 'foo')
        recordUsage(history, 'bar')
        expect(history).toEqual({ foo: 2, bar: 1 })
    })

    it('prefers unused variants over used ones', () => {
        const lex: PropertyAwareLexicon = {
            '見る': ['A', 'B', 'C'],
        }
        const history: UsageHistory = { 'A': 3, 'B': 3 }

        // With high usage on A and B, C should be preferred
        const result = chooseParaphrase('見る', {
            lexicon: lex,
            usageHistory: history,
            seed: 1,
        })
        expect(result).toBe('C')
    })

    it('records usage automatically during paraphrase', () => {
        const lex: PropertyAwareLexicon = {
            '見る': ['X'],
        }
        const history = createUsageHistory()

        chooseParaphrase('見る', { lexicon: lex, usageHistory: history, seed: 1 })
        expect(history['X']).toBe(1)

        chooseParaphrase('見る', { lexicon: lex, usageHistory: history, seed: 2 })
        expect(history['X']).toBe(2)
    })
})

describe('weight', () => {
    it('prefers higher-weight variants', () => {
        const lex: PropertyAwareLexicon = {
            '見る': [
                { text: 'low', weight: 0.1 },
                { text: 'high', weight: 10 },
            ],
        }
        // Run multiple seeds; high-weight should dominate
        const results: string[] = []
        for (let seed = 0; seed < 20; seed++) {
            results.push(chooseParaphrase('見る', { lexicon: lex, seed }))
        }
        const highCount = results.filter(r => r === 'high').length
        expect(highCount).toBeGreaterThan(results.length / 2)
    })
})

describe('buildParaphraseContext', () => {
    it('builds context from entity definitions', () => {
        const entities = {
            parent: {
                id: 'parent',
                name: 'Parent',
                properties: {
                    color: { key: 'color', type: 'string' as const, defaultValue: 'red' },
                },
            },
            child: {
                id: 'child',
                name: 'Child',
                parentEntity: 'parent',
                properties: {
                    size: { key: 'size', type: 'number' as const, defaultValue: 5 },
                },
            },
        }
        const ctx = buildParaphraseContext('child', entities)
        expect(ctx.entityId).toBe('child')
        expect(ctx.properties?.color?.defaultValue).toBe('red') // inherited
        expect(ctx.properties?.size?.defaultValue).toBe(5) // own
    })

    it('returns empty properties for unknown entity', () => {
        const ctx = buildParaphraseContext('unknown', {})
        expect(ctx.entityId).toBe('unknown')
        expect(ctx.properties).toEqual({})
    })
})

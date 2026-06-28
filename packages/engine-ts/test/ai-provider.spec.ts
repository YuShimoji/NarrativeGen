import { describe, it, expect } from 'vitest'
import { MockAIProvider, createAIProvider, type StoryContext } from '../src/ai-provider'

describe('MockAIProvider', () => {
    it('generates a next node text', async () => {
        const provider = new MockAIProvider()
        const context: StoryContext = {
            previousNodes: [],
            currentNodeText: 'テストノード',
            choiceText: '選択肢A'
        }
        const result = await provider.generateNextNode(context)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })

    it('generates a deterministic reviewable continuation from context', async () => {
        const provider = new MockAIProvider()
        const context: StoryContext = {
            previousNodes: [{ id: 'desk', text: 'Lead: the clocktower bell' }],
            currentNodeText: 'The scene is still thin.',
            choiceText: 'Adopt continuation'
        }
        const result = await provider.generateNextNode(context)
        expect(result).toContain('Mock continuation')
        expect(result).toContain('the clocktower bell')
        expect(result).toContain('archive stairs')
    })

    it('generates paraphrase variants', async () => {
        const provider = new MockAIProvider()
        const text = 'これはテストです。'
        const variants = await provider.paraphrase(text, { variantCount: 3 })
        expect(variants).toHaveLength(3)
        variants.forEach(variant => {
            expect(variant).toContain(text)
        })
    })

    it('respects variantCount option', async () => {
        const provider = new MockAIProvider()
        const text = 'テスト'
        const variants = await provider.paraphrase(text, { variantCount: 5 })
        expect(variants).toHaveLength(5)
    })
})

describe('createAIProvider', () => {
    it('creates MockAIProvider by default', () => {
        const provider = createAIProvider({ provider: 'mock' })
        expect(provider).toBeInstanceOf(MockAIProvider)
    })

    it('creates MockAIProvider for unknown provider', () => {
        const provider = createAIProvider({ provider: 'unknown' as any })
        expect(provider).toBeInstanceOf(MockAIProvider)
    })

    it('throws error when OpenAI API key is missing', () => {
        expect(() => {
            createAIProvider({ provider: 'openai', openai: { apiKey: '' } })
        }).toThrow('OpenAI API key required')
    })
})

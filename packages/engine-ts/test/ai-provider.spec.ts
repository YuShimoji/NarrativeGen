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

    it('generates a structured continuation proposal', async () => {
        const provider = new MockAIProvider()
        const context: StoryContext = {
            previousNodes: [{ id: 'desk', text: 'Lead: the clocktower bell' }],
            currentNodeText: 'The scene is still thin.',
            choiceText: 'Adopt continuation'
        }
        const proposal = await provider.generateContinuationProposal(context)

        expect(proposal.nodeIdHint).toBe('generated_specimen_continuation')
        expect(proposal.text).toContain('the clocktower bell')
        expect(proposal.followUpChoice).toEqual({
            idHint: 'connect_generated_specimen_archive',
            text: 'Test the clocktower bell against the archive ledger',
            targetId: 'archive',
            effects: [{ type: 'addResource', key: 'evidence', delta: 2 }]
        })
        expect(proposal.ownership.generatorProvided).toContain('followUpChoice.effects')
        expect(proposal.ownership.builderAdded).toEqual([])
        expect(proposal.ownership.validationAdjusted).toEqual([])
    })

    it('uses a story packet when generating a structured continuation proposal', async () => {
        const provider = new MockAIProvider()
        const context: StoryContext = {
            previousNodes: [{ id: 'desk', text: 'Lead: the clocktower bell' }],
            currentNodeText: 'The scene is still thin.',
            choiceText: 'Adopt continuation',
            storyPacket: {
                currentNode: {
                    id: 'drafting',
                    text: 'The scene is still thin.'
                },
                route: {
                    nodeIds: ['desk', 'notebook', 'drafting'],
                    selectedChoiceIds: ['open_notebook', 'draft_scene']
                },
                visibleChoices: [
                    { id: 'revise_draft', text: 'Revise the draft', target: 'drafting' }
                ],
                gatedChoices: [
                    { id: 'publish_with_proof', text: 'Publish with proof', target: 'truth_end' }
                ],
                state: {
                    flags: { notebook_open: true },
                    resources: { evidence: 0, focus: 1 },
                    variables: { lead_name: 'the clocktower bell' }
                },
                storyPressure: 'make the draft produce proof before publication',
                constraints: {
                    preferredReturnTargetId: 'archive',
                    nonGoals: ['do not claim final prose quality'],
                    validationRequirements: ['keep route playable']
                }
            }
        }
        const proposal = await provider.generateContinuationProposal(context)

        expect(proposal.text).toContain('open_notebook -> draft_scene')
        expect(proposal.text).toContain('drafting')
        expect(proposal.text).toContain('evidence=0')
        expect(proposal.text).toContain('publish_with_proof')
        expect(proposal.text).toContain('make the draft produce proof before publication')
        expect(proposal.followUpChoice.text).toBe('Test the clocktower bell against the archive ledger')
        expect(proposal.ownership.generatorProvided).toContain('storyPacket.storyPressure')
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

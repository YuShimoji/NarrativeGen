import { describe, expect, it } from 'vitest'
import { DeterministicSpdtyarnBridgeAdapter, type StoryContextPacket } from '../src'

describe('DeterministicSpdtyarnBridgeAdapter', () => {
    it('turns story packet facts into a structured continuation proposal', () => {
        const adapter = new DeterministicSpdtyarnBridgeAdapter({
            nodeIdHint: 'generated_specimen_continuation',
            followUpChoiceIdHint: 'connect_generated_specimen_archive',
        })
        const packet: StoryContextPacket = {
            currentNode: {
                id: 'drafting',
                text: 'Mira drafts a thin scene about the clocktower bell.'
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

        const proposal = adapter.generateContinuationProposal(packet)

        expect(proposal.nodeIdHint).toBe('generated_specimen_continuation')
        expect(proposal.text).toContain('the clocktower bell')
        expect(proposal.text).toContain('drafting')
        expect(proposal.text).toContain('open_notebook -> draft_scene')
        expect(proposal.text).toContain('Mira drafts a thin scene')
        expect(proposal.text).toContain('evidence=0')
        expect(proposal.text).toContain('focus=1')
        expect(proposal.text).toContain('make the draft produce proof before publication')
        expect(proposal.followUpChoice).toEqual({
            idHint: 'connect_generated_specimen_archive',
            text: 'Route the clocktower bell through the archive proof check',
            targetId: 'archive',
            effects: [{ type: 'addResource', key: 'evidence', delta: 2 }]
        })
        expect(proposal.ownership.generatorProvided).toEqual(expect.arrayContaining([
            'storyPacket.currentNode.id',
            'storyPacket.currentNode.text',
            'storyPacket.route.selectedChoiceIds',
            'storyPacket.state.resources.evidence',
            'storyPacket.state.resources.focus',
            'storyPacket.state.variables.lead_name',
            'storyPacket.storyPressure',
            'followUpChoice.effects',
        ]))
        expect(proposal.ownership.builderAdded).toEqual([])
        expect(proposal.ownership.validationAdjusted).toEqual([])
    })
})

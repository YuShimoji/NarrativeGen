import { describe, expect, it } from 'vitest'
import {
  DeterministicSpdtyarnBridgeAdapter,
  validateContinuationProposalAdoption,
  type Effect,
  type Model,
  type StoryContextPacket,
  type StructuredContinuationProposal,
} from '../src'

describe('validateContinuationProposalAdoption', () => {
  it('accepts a valid deterministic adapter proposal', () => {
    const proposal = validProposal()

    const result = validateContinuationProposalAdoption(baseModel(), proposal, specimenOptions())

    expect(result.status).toBe('accepted')
    expect(result.proposal?.nodeIdHint).toBe('generated_specimen_continuation')
    expect(result.proposal?.followUpChoice).toEqual({
      idHint: 'connect_generated_specimen_archive',
      text: 'Route the clocktower bell through the archive proof check',
      targetId: 'archive',
      effects: [{ type: 'addResource', key: 'evidence', delta: 2 }],
    })
    expect(result.reasons).toEqual(expect.arrayContaining([
      'proposal passed bounded adoption validation',
      "followUpChoice.effects[0].key 'evidence' is declared in model.resources",
    ]))
  })

  it('rejects an unknown follow-up target before adoption', () => {
    const proposal = proposalWith({}, { targetId: 'missing_archive' })

    const result = validateContinuationProposalAdoption(baseModel(), proposal, specimenOptions())

    expect(result.status).toBe('rejected')
    expect(result.proposal).toBeNull()
    expect(result.reasons).toEqual(expect.arrayContaining([
      "followUpChoice.targetId 'missing_archive' does not exist in the model or builder-created nodes",
    ]))
  })

  it('rejects a generated node id that collides with an existing model node', () => {
    const model = baseModel()
    model.nodes.generated_specimen_continuation = {
      id: 'generated_specimen_continuation',
      text: 'Already present',
      choices: [],
    }

    const result = validateContinuationProposalAdoption(model, validProposal(), specimenOptions())

    expect(result.status).toBe('rejected')
    expect(result.reasons).toEqual(expect.arrayContaining([
      "nodeIdHint 'generated_specimen_continuation' collides with an existing model node",
    ]))
  })

  it('rejects unsupported follow-up effect types', () => {
    const effects = [{ type: 'teleport', target: 'archive' } as unknown as Effect]
    const proposal = proposalWith({}, { effects })

    const result = validateContinuationProposalAdoption(baseModel(), proposal, specimenOptions())

    expect(result.status).toBe('rejected')
    expect(result.reasons).toEqual(expect.arrayContaining([
      "followUpChoice.effects[0].type 'teleport' is not a supported effect type",
    ]))
  })

  it('rejects empty generated text', () => {
    const proposal = proposalWith({ text: '   ' })

    const result = validateContinuationProposalAdoption(baseModel(), proposal, specimenOptions())

    expect(result.status).toBe('rejected')
    expect(result.reasons).toEqual(expect.arrayContaining([
      'text must be a non-empty generated node body',
    ]))
  })

  it('records explicit validation adjustments for safe specimen id normalization', () => {
    const proposal = proposalWith(
      { nodeIdHint: 'provider_generated_node' },
      { idHint: 'provider_followup_choice' },
    )

    const result = validateContinuationProposalAdoption(baseModel(), proposal, specimenOptions())

    expect(result.status).toBe('validation_adjusted')
    expect(result.proposal?.nodeIdHint).toBe('generated_specimen_continuation')
    expect(result.proposal?.followUpChoice.idHint).toBe('connect_generated_specimen_archive')
    expect(result.proposal?.ownership.validationAdjusted).toEqual(expect.arrayContaining([
      "nodeIdHint adjusted from 'provider_generated_node' to 'generated_specimen_continuation'",
      "followUpChoice.idHint adjusted from 'provider_followup_choice' to 'connect_generated_specimen_archive'",
    ]))
    expect(result.reasons).toEqual(expect.arrayContaining([
      'proposal passed bounded adoption validation with explicit adjustments',
      "nodeIdHint adjusted from 'provider_generated_node' to 'generated_specimen_continuation'",
      "followUpChoice.idHint adjusted from 'provider_followup_choice' to 'connect_generated_specimen_archive'",
    ]))
  })

  it('rejects proposals that try to carry direct model mutations', () => {
    const proposal = {
      ...validProposal(),
      nodes: {
        archive: { text: 'mutated elsewhere' },
      },
    } as unknown as StructuredContinuationProposal

    const result = validateContinuationProposalAdoption(baseModel(), proposal, specimenOptions())

    expect(result.status).toBe('rejected')
    expect(result.reasons).toEqual(expect.arrayContaining([
      "proposal must not carry direct model mutation key 'nodes'",
    ]))
  })
})

function specimenOptions() {
  return {
    expectedGeneratedNodeId: 'generated_specimen_continuation',
    expectedFollowUpChoiceId: 'connect_generated_specimen_archive',
    builderCreatedNodeIds: ['generated_specimen_continuation'],
  }
}

function validProposal(): StructuredContinuationProposal {
  const adapter = new DeterministicSpdtyarnBridgeAdapter({
    nodeIdHint: 'generated_specimen_continuation',
    followUpChoiceIdHint: 'connect_generated_specimen_archive',
  })
  return adapter.generateContinuationProposal(specimenPacket())
}

function proposalWith(
  proposalOverrides: Partial<StructuredContinuationProposal>,
  followUpOverrides: Partial<StructuredContinuationProposal['followUpChoice']> = {},
): StructuredContinuationProposal {
  const proposal = validProposal()
  return {
    ...proposal,
    ...proposalOverrides,
    followUpChoice: {
      ...proposal.followUpChoice,
      ...followUpOverrides,
    },
  }
}

function baseModel(): Model {
  return {
    modelType: 'adventure-playthrough',
    startNode: 'start',
    flags: { ai_draft_adopted: false },
    resources: { evidence: 0, focus: 1 },
    variables: { draft_status: 'unwritten', lead_name: 'the clocktower bell' },
    nodes: {
      start: {
        id: 'start',
        text: 'Start',
        choices: [{ id: 'to_archive', text: 'To archive', target: 'archive' }],
      },
      archive: { id: 'archive', text: 'Archive', choices: [] },
    },
  }
}

function specimenPacket(): StoryContextPacket {
  return {
    currentNode: {
      id: 'drafting',
      text: 'Mira drafts a thin scene about the clocktower bell.',
    },
    route: {
      nodeIds: ['start', 'drafting'],
      selectedChoiceIds: ['draft_scene'],
    },
    visibleChoices: [
      { id: 'revise_draft', text: 'Revise the draft', target: 'drafting' },
    ],
    gatedChoices: [
      { id: 'publish_with_proof', text: 'Publish with proof', target: 'archive' },
    ],
    state: {
      flags: { ai_draft_adopted: false },
      resources: { evidence: 0, focus: 1 },
      variables: { lead_name: 'the clocktower bell', draft_status: 'unwritten' },
    },
    storyPressure: 'make the draft produce proof before publication',
    constraints: {
      preferredReturnTargetId: 'archive',
      nonGoals: ['do not claim final prose quality'],
      validationRequirements: ['keep route playable'],
    },
  }
}

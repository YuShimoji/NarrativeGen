import { describe, expect, it } from 'vitest'
import {
  validateContinuationProposalAdoption,
  type Effect,
  type Model,
  type StructuredContinuationProposal,
} from '../src'

type FixtureExpectation = 'accepted' | 'validation_adjusted' | 'rejected'

interface ProviderProposalFixture {
  name: string
  family: string
  proposal: StructuredContinuationProposal
  expected: FixtureExpectation
  reasonIncludes: string[]
  model?: Model
}

describe('provider-like continuation proposal fixtures', () => {
  const fixtures: ProviderProposalFixture[] = [
    {
      name: 'strict valid proposal',
      family: 'well_formed_provider_output',
      proposal: providerProposal(),
      expected: 'accepted',
      reasonIncludes: [
        'proposal passed bounded adoption validation',
        "followUpChoice.effects[0].key 'evidence' is declared in model.resources",
      ],
    },
    {
      name: 'safe id normalization proposal',
      family: 'provider_ids_need_builder_normalization',
      proposal: providerProposal({
        nodeIdHint: 'provider_node_742',
        followUpChoice: {
          idHint: 'provider_choice_742',
        },
      }),
      expected: 'validation_adjusted',
      reasonIncludes: [
        'proposal passed bounded adoption validation with explicit adjustments',
        "nodeIdHint adjusted from 'provider_node_742' to 'generated_specimen_continuation'",
        "followUpChoice.idHint adjusted from 'provider_choice_742' to 'connect_generated_specimen_archive'",
      ],
    },
    {
      name: 'unknown follow-up target',
      family: 'hallucinated_target',
      proposal: providerProposal({
        followUpChoice: {
          targetId: 'unseen_archive_annex',
        },
      }),
      expected: 'rejected',
      reasonIncludes: [
        "followUpChoice.targetId 'unseen_archive_annex' does not exist in the model or builder-created nodes",
      ],
    },
    {
      name: 'generated node id collision',
      family: 'colliding_generated_node',
      proposal: providerProposal(),
      model: modelWithGeneratedNodeCollision(),
      expected: 'rejected',
      reasonIncludes: [
        "nodeIdHint 'generated_specimen_continuation' collides with an existing model node",
      ],
    },
    {
      name: 'unsupported effect',
      family: 'unsupported_effect_semantics',
      proposal: providerProposal({
        followUpChoice: {
          effects: [{ type: 'teleport', target: 'archive' } as unknown as Effect],
        },
      }),
      expected: 'rejected',
      reasonIncludes: [
        "followUpChoice.effects[0].type 'teleport' is not a supported effect type",
      ],
    },
    {
      name: 'empty generated text',
      family: 'empty_generation_body',
      proposal: providerProposal({ text: '   ' }),
      expected: 'rejected',
      reasonIncludes: ['text must be a non-empty generated node body'],
    },
    {
      name: 'missing follow-up choice text',
      family: 'missing_player_choice_copy',
      proposal: providerProposal({
        followUpChoice: {
          text: '',
        },
      }),
      expected: 'rejected',
      reasonIncludes: ['followUpChoice.text must be non-empty'],
    },
    {
      name: 'direct mutation request',
      family: 'provider_attempts_graph_patch',
      proposal: {
        ...providerProposal(),
        mutations: [{ op: 'replace', path: '/nodes/archive/text', value: 'changed by provider' }],
      } as unknown as StructuredContinuationProposal,
      expected: 'rejected',
      reasonIncludes: ["proposal must not carry direct model mutation key 'mutations'"],
    },
    {
      name: 'missing resource effect key',
      family: 'malformed_resource_effect',
      proposal: providerProposal({
        followUpChoice: {
          effects: [{ type: 'addResource', key: '', delta: 2 }],
        },
      }),
      expected: 'rejected',
      reasonIncludes: ['followUpChoice.effects[0].key must be a non-empty key'],
    },
    {
      name: 'malformed goto effect target',
      family: 'malformed_effect_target',
      proposal: providerProposal({
        followUpChoice: {
          effects: [{ type: 'goto', target: '' }],
        },
      }),
      expected: 'rejected',
      reasonIncludes: ['followUpChoice.effects[0].target must be a non-empty safe id'],
    },
  ]

  it.each(fixtures)('$family: $name -> $expected', (fixture) => {
    const result = validateContinuationProposalAdoption(
      fixture.model ?? baseModel(),
      fixture.proposal,
      specimenOptions(),
    )

    expect(result.status).toBe(fixture.expected)
    expect(result.reasons.length).toBeGreaterThan(0)
    for (const reason of fixture.reasonIncludes) {
      expect(result.reasons).toEqual(expect.arrayContaining([reason]))
    }

    if (fixture.expected === 'rejected') {
      expect(result.proposal).toBeNull()
      return
    }

    expect(result.proposal).not.toBeNull()
    expect(result.proposal?.nodeIdHint).toBe('generated_specimen_continuation')
    expect(result.proposal?.followUpChoice.idHint).toBe('connect_generated_specimen_archive')
  })

  it('does not silently accept any invalid provider-like fixture', () => {
    const invalidFixtures = fixtures.filter((fixture) => fixture.expected === 'rejected')

    const results = invalidFixtures.map((fixture) => ({
      name: fixture.name,
      result: validateContinuationProposalAdoption(
        fixture.model ?? baseModel(),
        fixture.proposal,
        specimenOptions(),
      ),
    }))

    expect(results).toHaveLength(8)
    for (const { name, result } of results) {
      expect(result.status, name).toBe('rejected')
      expect(result.proposal, name).toBeNull()
      expect(result.reasons.length, name).toBeGreaterThan(0)
    }
  })
})

function specimenOptions() {
  return {
    expectedGeneratedNodeId: 'generated_specimen_continuation',
    expectedFollowUpChoiceId: 'connect_generated_specimen_archive',
    builderCreatedNodeIds: ['generated_specimen_continuation'],
  }
}

function providerProposal(
  overrides: Partial<StructuredContinuationProposal> & {
    followUpChoice?: Partial<StructuredContinuationProposal['followUpChoice']>
  } = {},
): StructuredContinuationProposal {
  const base: StructuredContinuationProposal = {
    nodeIdHint: 'generated_specimen_continuation',
    text: [
      'Provider-like continuation: the archive receipt is reframed as a playable clue.',
      'It remains fixture text, not real provider quality evidence.',
    ].join(' '),
    followUpChoice: {
      idHint: 'connect_generated_specimen_archive',
      text: 'Test the provider clue against the archive ledger',
      targetId: 'archive',
      effects: [{ type: 'addResource', key: 'evidence', delta: 2 }],
    },
    ownership: {
      generatorProvided: [
        'nodeIdHint',
        'text',
        'followUpChoice.idHint',
        'followUpChoice.text',
        'followUpChoice.targetId',
        'followUpChoice.effects',
      ],
      builderAdded: [],
      validationAdjusted: [],
    },
  }

  return {
    ...base,
    ...overrides,
    followUpChoice: {
      ...base.followUpChoice,
      ...overrides.followUpChoice,
    },
    ownership: {
      ...base.ownership,
      ...overrides.ownership,
    },
  }
}

function baseModel(): Model {
  return {
    modelType: 'adventure-playthrough',
    startNode: 'drafting',
    flags: { ai_draft_adopted: false },
    resources: { evidence: 1, focus: 1 },
    variables: { draft_status: 'unwritten', lead_name: 'the clocktower bell' },
    nodes: {
      drafting: {
        id: 'drafting',
        text: 'The scene is still thin.',
        choices: [{ id: 'cut_short', text: 'Cut short', target: 'rushed_end' }],
      },
      archive: {
        id: 'archive',
        text: 'Archive',
        choices: [{ id: 'decode_ledger', text: 'Decode ledger', target: 'truth_end' }],
      },
      rushed_end: { id: 'rushed_end', text: 'Rushed ending', choices: [] },
      truth_end: { id: 'truth_end', text: 'Truth ending', choices: [] },
    },
  }
}

function modelWithGeneratedNodeCollision(): Model {
  const model = baseModel()
  model.nodes.generated_specimen_continuation = {
    id: 'generated_specimen_continuation',
    text: 'Already adopted',
    choices: [],
  }
  return model
}

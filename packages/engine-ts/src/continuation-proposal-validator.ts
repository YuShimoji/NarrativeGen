import type { StructuredContinuationProposal } from './ai-provider'
import type { Effect, Model } from './types'

export type ContinuationProposalValidationStatus =
  | 'accepted'
  | 'validation_adjusted'
  | 'rejected'

export interface ContinuationProposalValidationOptions {
  expectedGeneratedNodeId?: string
  expectedFollowUpChoiceId?: string
  builderCreatedNodeIds?: string[]
}

export interface ContinuationProposalValidationResult {
  status: ContinuationProposalValidationStatus
  reasons: string[]
  proposal: StructuredContinuationProposal | null
}

const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/u
const SAFE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/u
const DIRECT_MUTATION_KEYS = [
  'model',
  'nodes',
  'node',
  'choices',
  'patches',
  'mutations',
  'existingNodeMutations',
]

export function validateContinuationProposalAdoption(
  model: Model,
  proposal: StructuredContinuationProposal,
  options: ContinuationProposalValidationOptions = {},
): ContinuationProposalValidationResult {
  const rejections: string[] = []
  const reasons: string[] = []
  const adjusted: string[] = []
  const builderCreatedNodeIds = new Set(options.builderCreatedNodeIds ?? [])

  const proposalRecord = proposal as unknown
  if (!isRecord(proposalRecord)) {
    return rejected(['proposal must be an object'])
  }

  for (const key of DIRECT_MUTATION_KEYS) {
    if (Object.prototype.hasOwnProperty.call(proposalRecord, key)) {
      rejections.push(`proposal must not carry direct model mutation key '${key}'`)
    }
  }

  let nodeId = readSafeId(proposal.nodeIdHint, 'nodeIdHint', rejections)
  if (nodeId && model.nodes[nodeId]) {
    rejections.push(`nodeIdHint '${nodeId}' collides with an existing model node`)
  }

  if (nodeId && options.expectedGeneratedNodeId) {
    const expectedNodeId = readSafeId(
      options.expectedGeneratedNodeId,
      'expectedGeneratedNodeId',
      rejections,
    )
    if (expectedNodeId) {
      if (model.nodes[expectedNodeId]) {
        rejections.push(`expectedGeneratedNodeId '${expectedNodeId}' collides with an existing model node`)
      } else if (nodeId !== expectedNodeId) {
        adjusted.push(`nodeIdHint adjusted from '${nodeId}' to '${expectedNodeId}'`)
        nodeId = expectedNodeId
      }
    }
  }

  const text = typeof proposal.text === 'string' ? proposal.text : ''
  if (!text.trim()) {
    rejections.push('text must be a non-empty generated node body')
  }

  const followUpChoice = proposal.followUpChoice as unknown
  if (!isRecord(followUpChoice)) {
    rejections.push('followUpChoice must be an object')
  }

  let choiceId: string | null = null
  let targetId: string | null = null
  let choiceText = ''
  let effects: Effect[] = []

  if (isRecord(followUpChoice)) {
    choiceId = readSafeId(followUpChoice.idHint, 'followUpChoice.idHint', rejections)
    if (choiceId && options.expectedFollowUpChoiceId) {
      const expectedChoiceId = readSafeId(
        options.expectedFollowUpChoiceId,
        'expectedFollowUpChoiceId',
        rejections,
      )
      if (expectedChoiceId && choiceId !== expectedChoiceId) {
        adjusted.push(`followUpChoice.idHint adjusted from '${choiceId}' to '${expectedChoiceId}'`)
        choiceId = expectedChoiceId
      }
    }

    targetId = readSafeId(followUpChoice.targetId, 'followUpChoice.targetId', rejections)
    if (targetId && !model.nodes[targetId] && !builderCreatedNodeIds.has(targetId)) {
      rejections.push(
        `followUpChoice.targetId '${targetId}' does not exist in the model or builder-created nodes`,
      )
    }

    choiceText = typeof followUpChoice.text === 'string' ? followUpChoice.text : ''
    if (!choiceText.trim()) {
      rejections.push('followUpChoice.text must be non-empty')
    }

    if (!Array.isArray(followUpChoice.effects) || followUpChoice.effects.length === 0) {
      rejections.push('followUpChoice.effects must contain at least one supported effect')
    } else {
      effects = followUpChoice.effects as Effect[]
      validateEffects(model, effects, builderCreatedNodeIds, reasons, rejections)
    }
  }

  if (rejections.length) {
    return rejected(rejections)
  }

  const validationAdjusted = [
    ...(proposal.ownership?.validationAdjusted ?? []),
    ...adjusted,
  ]

  const validatedProposal: StructuredContinuationProposal = {
    nodeIdHint: nodeId!,
    text,
    followUpChoice: {
      idHint: choiceId!,
      text: choiceText,
      targetId: targetId!,
      effects,
    },
    ownership: {
      generatorProvided: [...(proposal.ownership?.generatorProvided ?? [])],
      builderAdded: [...(proposal.ownership?.builderAdded ?? [])],
      validationAdjusted,
    },
  }

  const status: ContinuationProposalValidationStatus = adjusted.length
    ? 'validation_adjusted'
    : 'accepted'
  return {
    status,
    reasons: [
      status === 'accepted'
        ? 'proposal passed bounded adoption validation'
        : 'proposal passed bounded adoption validation with explicit adjustments',
      ...adjusted,
      ...reasons,
    ],
    proposal: validatedProposal,
  }
}

function validateEffects(
  model: Model,
  effects: Effect[],
  builderCreatedNodeIds: Set<string>,
  reasons: string[],
  rejections: string[],
): void {
  effects.forEach((effect, index) => {
    const label = `followUpChoice.effects[${index}]`
    if (!isRecord(effect)) {
      rejections.push(`${label} must be an object`)
      return
    }

    switch (effect.type) {
      case 'setFlag':
        validateKey(effect.key, `${label}.key`, rejections)
        if (typeof effect.value !== 'boolean') {
          rejections.push(`${label}.value must be boolean for setFlag`)
        }
        classifyStateKey(model.flags, 'flags', effect.key, label, reasons)
        break
      case 'addResource':
        validateKey(effect.key, `${label}.key`, rejections)
        if (!isFiniteNumber(effect.delta)) {
          rejections.push(`${label}.delta must be a finite number for addResource`)
        }
        classifyStateKey(model.resources, 'resources', effect.key, label, reasons)
        break
      case 'setVariable':
        validateKey(effect.key, `${label}.key`, rejections)
        if (typeof effect.value !== 'string' && typeof effect.value !== 'number') {
          rejections.push(`${label}.value must be string or number for setVariable`)
        }
        classifyStateKey(model.variables, 'variables', effect.key, label, reasons)
        break
      case 'modifyVariable':
        validateKey(effect.key, `${label}.key`, rejections)
        if (!['+', '-', '*', '/'].includes(effect.op)) {
          rejections.push(`${label}.op must be one of +, -, *, / for modifyVariable`)
        }
        if (!isFiniteNumber(effect.value)) {
          rejections.push(`${label}.value must be a finite number for modifyVariable`)
        }
        classifyStateKey(model.variables, 'variables', effect.key, label, reasons)
        break
      case 'addItem':
      case 'removeItem':
        validateKey(effect.key, `${label}.key`, rejections)
        break
      case 'goto':
        validateTarget(model, builderCreatedNodeIds, effect.target, `${label}.target`, rejections)
        break
      case 'createEvent':
        validateKey(effect.id, `${label}.id`, rejections)
        if (typeof effect.name !== 'string' || !effect.name.trim()) {
          rejections.push(`${label}.name must be non-empty for createEvent`)
        }
        validateEventProperties(effect.properties, label, rejections)
        break
      default:
        rejections.push(
          `${label}.type '${String((effect as { type?: unknown }).type)}' is not a supported effect type`,
        )
    }
  })
}

function classifyStateKey(
  stateRecord: Record<string, unknown> | undefined,
  stateName: string,
  key: string,
  label: string,
  reasons: string[],
): void {
  if (!key) return
  if (!stateRecord || !Object.prototype.hasOwnProperty.call(stateRecord, key)) {
    reasons.push(`${label}.key '${key}' is not declared in model.${stateName}; classified as a new state key`)
  } else {
    reasons.push(`${label}.key '${key}' is declared in model.${stateName}`)
  }
}

function validateEventProperties(
  properties: Record<string, { defaultValue: string | number | boolean }> | undefined,
  label: string,
  rejections: string[],
): void {
  if (properties === undefined) return
  if (!isRecord(properties)) {
    rejections.push(`${label}.properties must be an object when present`)
    return
  }
  for (const [key, value] of Object.entries(properties)) {
    validateKey(key, `${label}.properties.${key}`, rejections)
    if (!isRecord(value)) {
      rejections.push(`${label}.properties.${key} must be an object`)
      continue
    }
    const defaultValue = value.defaultValue
    if (
      typeof defaultValue !== 'string'
      && typeof defaultValue !== 'number'
      && typeof defaultValue !== 'boolean'
    ) {
      rejections.push(`${label}.properties.${key}.defaultValue must be string, number, or boolean`)
    }
  }
}

function validateTarget(
  model: Model,
  builderCreatedNodeIds: Set<string>,
  value: unknown,
  field: string,
  rejections: string[],
): void {
  const targetId = readSafeId(value, field, rejections)
  if (targetId && !model.nodes[targetId] && !builderCreatedNodeIds.has(targetId)) {
    rejections.push(`${field} '${targetId}' does not exist in the model or builder-created nodes`)
  }
}

function readSafeId(value: unknown, field: string, rejections: string[]): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    rejections.push(`${field} must be a non-empty safe id`)
    return null
  }
  const trimmed = value.trim()
  if (!SAFE_ID_PATTERN.test(trimmed)) {
    rejections.push(`${field} '${trimmed}' must match ${SAFE_ID_PATTERN.source}`)
    return null
  }
  return trimmed
}

function validateKey(value: unknown, field: string, rejections: string[]): void {
  if (typeof value !== 'string' || !value.trim()) {
    rejections.push(`${field} must be a non-empty key`)
    return
  }
  const trimmed = value.trim()
  if (!SAFE_KEY_PATTERN.test(trimmed)) {
    rejections.push(`${field} '${trimmed}' must match ${SAFE_KEY_PATTERN.source}`)
  }
}

function rejected(reasons: string[]): ContinuationProposalValidationResult {
  return {
    status: 'rejected',
    reasons,
    proposal: null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

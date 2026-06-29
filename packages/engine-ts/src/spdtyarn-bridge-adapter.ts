import type { Effect } from './types'
import type { StoryContextPacket, StructuredContinuationProposal } from './ai-provider'

export interface DeterministicSpdtyarnBridgeAdapterOptions {
  nodeIdHint?: string
  followUpChoiceIdHint?: string
}

export class DeterministicSpdtyarnBridgeAdapter {
  private readonly nodeIdHint: string
  private readonly followUpChoiceIdHint: string

  constructor(options: DeterministicSpdtyarnBridgeAdapterOptions = {}) {
    this.nodeIdHint = options.nodeIdHint ?? 'generated_specimen_continuation'
    this.followUpChoiceIdHint = options.followUpChoiceIdHint ?? 'connect_generated_specimen_archive'
  }

  generateContinuationProposal(packet: StoryContextPacket): StructuredContinuationProposal {
    const route = summarizeRoute(packet)
    const lead = summarizeLead(packet)
    const evidence = readResource(packet, 'evidence')
    const focus = readResource(packet, 'focus')
    const currentText = summarizeText(packet.currentNode.text)
    const storyPressure = trimSentenceEnd(packet.storyPressure)
    const targetId = packet.constraints.preferredReturnTargetId ?? inferReturnTarget(packet)
    const effectDelta = focus > 0 ? 2 : 1
    const effects: Effect[] = [{ type: 'addResource', key: 'evidence', delta: effectDelta }]

    const text = [
      `Deterministic SP-DTYARN bridge: ${lead} is extended from ${packet.currentNode.id} after ${route}.`,
      `The adapter reads the current scene "${currentText}", evidence=${evidence}, focus=${focus}, and pressure "${storyPressure}".`,
      `It proposes a proof-bearing clue that returns to ${targetId}; this is rule-based adapter output, not AI prose quality.`,
    ].join(' ')

    return {
      nodeIdHint: this.nodeIdHint,
      text,
      followUpChoice: {
        idHint: this.followUpChoiceIdHint,
        text: `Route ${lead} through the ${targetId} proof check`,
        targetId,
        effects,
      },
      ownership: {
        generatorProvided: [
          'storyPacket.currentNode.id',
          'storyPacket.currentNode.text',
          'storyPacket.route.nodeIds',
          'storyPacket.route.selectedChoiceIds',
          'storyPacket.visibleChoices',
          'storyPacket.gatedChoices',
          'storyPacket.state.resources.evidence',
          'storyPacket.state.resources.focus',
          'storyPacket.state.variables.lead_name',
          'storyPacket.storyPressure',
          'storyPacket.constraints.preferredReturnTargetId',
          'storyPacket.constraints.nonGoals',
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
  }
}

export function createDeterministicSpdtyarnBridgeAdapter(
  options: DeterministicSpdtyarnBridgeAdapterOptions = {},
): DeterministicSpdtyarnBridgeAdapter {
  return new DeterministicSpdtyarnBridgeAdapter(options)
}

function readResource(packet: StoryContextPacket, key: string): number {
  return packet.state.resources[key] ?? 0
}

function summarizeRoute(packet: StoryContextPacket): string {
  if (packet.route.selectedChoiceIds.length) {
    return packet.route.selectedChoiceIds.join(' -> ')
  }
  if (packet.route.nodeIds.length) {
    return packet.route.nodeIds.join(' -> ')
  }
  return 'unrecorded route'
}

function summarizeLead(packet: StoryContextPacket): string {
  const leadName = packet.state.variables.lead_name
  if (typeof leadName === 'string' && leadName.trim()) {
    return leadName.trim()
  }
  if (typeof leadName === 'number') {
    return String(leadName)
  }
  return 'the current clue'
}

function summarizeText(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  const firstSentence = compact.match(/^[^.!?]+[.!?]/)?.[0] ?? compact
  const summary = firstSentence.length >= 24 ? firstSentence : compact
  if (summary.length <= 96) return summary
  return `${summary.slice(0, 93)}...`
}

function inferReturnTarget(packet: StoryContextPacket): string {
  return packet.gatedChoices[0]?.target ?? packet.visibleChoices[0]?.target ?? 'archive'
}

function trimSentenceEnd(text: string): string {
  return text.trim().replace(/[.!?]+$/u, '')
}

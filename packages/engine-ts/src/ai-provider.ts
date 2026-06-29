// AI Provider interfaces for narrative assistance
// Optional layer on top of core engine

import type { Condition, Effect } from './types'

export interface StoryPacketChoiceSummary {
  id: string
  text: string
  target: string
  conditions?: Condition[]
  effects?: Effect[]
}

export interface StoryContextPacket {
  currentNode: {
    id: string
    text: string
  }
  route: {
    nodeIds: string[]
    selectedChoiceIds: string[]
  }
  visibleChoices: StoryPacketChoiceSummary[]
  gatedChoices: StoryPacketChoiceSummary[]
  state: {
    flags: Record<string, boolean>
    resources: Record<string, number>
    variables: Record<string, string | number>
  }
  storyPressure: string
  constraints: {
    preferredReturnTargetId?: string
    nonGoals: string[]
    validationRequirements: string[]
  }
}

export interface StoryContext {
  previousNodes: { id: string; text: string }[]
  currentNodeText: string
  choiceText?: string
  storyPacket?: StoryContextPacket
}

export interface ParaphraseOptions {
  variantCount?: number
  style?: 'desu-masu' | 'da-dearu' | 'plain'
  tone?: 'formal' | 'casual' | 'neutral'
  emotion?: 'angry' | 'happy' | 'sad' | 'anxious' | 'neutral'
}

export interface StructuredContinuationChoiceProposal {
  idHint: string
  text: string
  targetId: string
  effects: Effect[]
}

export interface StructuredContinuationProposal {
  nodeIdHint: string
  text: string
  followUpChoice: StructuredContinuationChoiceProposal
  ownership: {
    generatorProvided: string[]
    builderAdded: string[]
    validationAdjusted: string[]
  }
}

export interface AIProvider {
  generateNextNode(context: StoryContext): Promise<string>
  generateContinuationProposal?(context: StoryContext): Promise<StructuredContinuationProposal>
  paraphrase(text: string, options?: ParaphraseOptions): Promise<string[]>
}

export interface AIConfig {
  provider: 'openai' | 'mock'
  openai?: {
    apiKey: string
    model?: string
  }
}

export class MockAIProvider implements AIProvider {
  async generateNextNode(context: StoryContext): Promise<string> {
    const proposal = await this.generateContinuationProposal(context)
    return proposal.text
  }

  async generateContinuationProposal(context: StoryContext): Promise<StructuredContinuationProposal> {
    const contextText = [
      ...context.previousNodes.map((node) => node.text),
      context.currentNodeText,
      context.choiceText ?? '',
    ].join('\n')
    const lead = extractLead(contextText)
    const packet = context.storyPacket
    const currentNodeId = packet?.currentNode.id ?? 'current scene'
    const selectedRoute = packet?.route.selectedChoiceIds.length
      ? packet.route.selectedChoiceIds.join(' -> ')
      : 'unrecorded route'
    const evidence = packet?.state.resources.evidence ?? 0
    const gatedChoiceIds = packet?.gatedChoices.map((choice) => choice.id).join(', ') || 'none'
    const pressure = packet?.storyPressure ?? 'turn the clue into a testable route'
    const targetId = packet?.constraints.preferredReturnTargetId ?? 'archive'

    const text = [
      `Mock continuation: after ${selectedRoute}, ${lead} stops being a loose note in ${currentNodeId} and becomes a reachable clue.`,
      `The packet shows evidence=${evidence} and gated choices ${gatedChoiceIds}, so a lantern under the ${targetId} stairs turns the pressure "${pressure}" into a ledger test.`,
      'It is still marked as mock prose so the generated node can be reviewed before a writer polishes it.',
    ].join(' ')

    return {
      nodeIdHint: 'generated_specimen_continuation',
      text,
      followUpChoice: {
        idHint: 'connect_generated_specimen_archive',
        text: `Test ${lead} against the ${targetId} ledger`,
        targetId,
        effects: [{ type: 'addResource', key: 'evidence', delta: 2 }],
      },
      ownership: {
        generatorProvided: [
          'storyPacket.currentNode',
          'storyPacket.route',
          'storyPacket.state.resources.evidence',
          'storyPacket.gatedChoices',
          'storyPacket.storyPressure',
          'storyPacket.constraints',
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

  async paraphrase(text: string, _options?: ParaphraseOptions): Promise<string[]> {
    // Simple mock paraphrases
    const count = _options?.variantCount ?? 3
    const variants: string[] = []
    for (let i = 0; i < count; i++) {
      variants.push(`${text} (バリエーション ${i + 1})`)
    }
    return variants
  }
}

function extractLead(text: string): string {
  const leadMatches = [...text.matchAll(/Lead:\s*([^\n]+)/gi)]
  const leadLine = leadMatches.at(-1)?.[1]?.trim()
  if (leadLine) return leadLine

  const quoted = text.match(/["“]([^"”]{4,80})["”]/)?.[1]?.trim()
  if (quoted) return quoted

  return 'the clue'
}

export function createAIProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case 'openai':
      if (!config.openai?.apiKey) {
        throw new Error('OpenAI API key required')
      }
      return new OpenAIProvider(config.openai)
    case 'mock':
    default:
      return new MockAIProvider()
  }
}

// Stub implementations - to be implemented in next phase
class OpenAIProvider implements AIProvider {
  constructor(private config: NonNullable<AIConfig['openai']>) {}

  async generateNextNode(context: StoryContext): Promise<string> {
    const prompt = this.buildGenerationPrompt(context)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json() as { choices: { message: { content: string } }[] }
      return data.choices[0]?.message?.content?.trim() || '次のシーンへ進みます。'
    } catch (error) {
      console.error('OpenAI generation error:', error)
      throw new Error('Failed to generate next node')
    }
  }

  async paraphrase(text: string, options?: ParaphraseOptions): Promise<string[]> {
    const variantCount = options?.variantCount ?? 3
    const prompt = this.buildParaphrasePrompt(text, options)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.8,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json() as { choices: { message: { content: string } }[] }
      const content = data.choices[0]?.message?.content?.trim() || ''

      // Parse response into variants
      const variants = content.split('\n').filter((line: string) => line.trim()).slice(0, variantCount)

      // Ensure we have the requested number of variants
      while (variants.length < variantCount) {
        variants.push(`${text} (${variants.length + 1})`)
      }

      return variants
    } catch (error) {
      console.error('OpenAI paraphrase error:', error)
      // Fallback to simple variants
      return Array.from({ length: variantCount }, (_, i) => `${text} (${i + 1})`)
    }
  }

  private buildGenerationPrompt(context: StoryContext): string {
    const previousText = context.previousNodes.map(n => n.text).join('\n')
    const currentText = context.currentNodeText
    const choiceText = context.choiceText || '続き'

    return `あなたはインタラクティブな物語の執筆者です。以下の文脈を基に、次のノードのテキストを生成してください。

【これまでの物語】
${previousText}

【現在の状況】
${currentText}

【プレイヤーの選択】
${choiceText}

【指示】
- 日本語で、自然な物語調で書いてください
- 長さは2-4文程度に収めてください
- 選択肢を導くような終わり方にしてください
- 物語の雰囲気を保ちつつ、新しい展開を加えてください

次のノードのテキスト：`
  }

  private buildParaphrasePrompt(text: string, options?: ParaphraseOptions): string {
    const style = options?.style || 'plain'
    const tone = options?.tone || 'neutral'
    const emotion = options?.emotion || 'neutral'
    const variantCount = options?.variantCount ?? 3

    let styleInstruction = ''
    if (style === 'desu-masu') styleInstruction = 'です・ます調で'
    else if (style === 'da-dearu') styleInstruction = 'だ・である調で'
    else styleInstruction = '自然な形で'

    let toneInstruction = ''
    if (tone === 'formal') toneInstruction = '改まった'
    else if (tone === 'casual') toneInstruction = 'カジュアルな'
    else toneInstruction = '標準的な'

    let emotionInstruction = ''
    if (emotion === 'angry') emotionInstruction = '怒りを帯びた'
    else if (emotion === 'happy') emotionInstruction = '喜びを込めた'
    else if (emotion === 'sad') emotionInstruction = '悲しみを帯びた'
    else if (emotion === 'anxious') emotionInstruction = '不安を帯びた'
    else emotionInstruction = 'ニュートラルな'

    return `以下の日本語テキストを言い換えてください。

【元のテキスト】
${text}

【指示】
- ${styleInstruction}言い換えを作成してください
- ${toneInstruction}トーンを保ってください
- ${emotionInstruction}感情表現を加えてください
- ${variantCount}つの異なるバリエーションを作成してください
- 各行に1つのバリエーションを書いてください
- 意味は変えずに表現だけを変化させてください

言い換えバリエーション：`
  }
}

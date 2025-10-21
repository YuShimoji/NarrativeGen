// AI Provider interfaces for narrative assistance
// Optional layer on top of core engine

export interface StoryContext {
  previousNodes: { id: string; text: string }[]
  currentNodeText: string
  choiceText?: string
}

export interface ParaphraseOptions {
  variantCount?: number
  style?: 'desu-masu' | 'da-dearu' | 'plain'
  tone?: 'formal' | 'casual' | 'neutral'
  emotion?: 'angry' | 'happy' | 'sad' | 'anxious' | 'neutral'
}

export interface AIProvider {
  generateNextNode(context: StoryContext): Promise<string>
  paraphrase(text: string, options?: ParaphraseOptions): Promise<string[]>
}

export interface AIConfig {
  provider: 'openai' | 'ollama' | 'mock'
  openai?: {
    apiKey: string
    model?: string
  }
  ollama?: {
    baseUrl?: string
    model?: string
  }
}

export class MockAIProvider implements AIProvider {
  async generateNextNode(_context: StoryContext): Promise<string> {
    // Return a simple continuation
    const samples = [
      '次のシーンへ進みます。',
      '物語が続きます。',
      '新しい展開が始まります。'
    ]
    return samples[Math.floor(Math.random() * samples.length)]
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

export function createAIProvider(config: AIConfig): AIProvider {
  switch (config.provider) {
    case 'openai':
      if (!config.openai?.apiKey) {
        throw new Error('OpenAI API key required')
      }
      return new OpenAIProvider(config.openai)
    case 'ollama':
      return new OllamaProvider(config.ollama)
    case 'mock':
    default:
      return new MockAIProvider()
  }
}

// Stub implementations - to be implemented in next phase
class OpenAIProvider implements AIProvider {
  constructor(private config: NonNullable<AIConfig['openai']>) {}

  async generateNextNode(_context: StoryContext): Promise<string> {
    throw new Error('OpenAI integration not implemented yet')
  }

  async paraphrase(_text: string, _options?: ParaphraseOptions): Promise<string[]> {
    throw new Error('OpenAI integration not implemented yet')
  }
}

class OllamaProvider implements AIProvider {
  constructor(private _config?: AIConfig['ollama']) {}

  async generateNextNode(_context: StoryContext): Promise<string> {
    throw new Error('Ollama integration not implemented yet')
  }

  async paraphrase(_text: string, _options?: ParaphraseOptions): Promise<string[]> {
    throw new Error('Ollama integration not implemented yet')
  }
}

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

class OllamaProvider implements AIProvider {
  constructor(private config?: AIConfig['ollama']) {}

  async generateNextNode(context: StoryContext): Promise<string> {
    const prompt = this.buildGenerationPrompt(context)
    const baseUrl = this.config?.baseUrl || 'http://localhost:11434'
    const model = this.config?.model || 'llama2'

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 200,
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json() as { response: string }
      return data.response?.trim() || '次のシーンへ進みます。'
    } catch (error) {
      console.error('Ollama generation error:', error)
      throw new Error(`Ollamaとの通信に失敗しました: ${error.message}`)
    }
  }

  async paraphrase(text: string, options?: ParaphraseOptions): Promise<string[]> {
    const variantCount = options?.variantCount ?? 3
    const baseUrl = this.config?.baseUrl || 'http://localhost:11434'
    const model = this.config?.model || 'llama2'

    const prompt = this.buildParaphrasePrompt(text, options)

    try {
      const variants: string[] = []

      // Generate multiple variants by calling Ollama multiple times with slight variations
      for (let i = 0; i < variantCount; i++) {
        const response = await fetch(`${baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            prompt: prompt + `\n\nバリエーション ${i + 1}:`,
            stream: false,
            options: {
              temperature: 0.8,
              num_predict: 100,
            }
          }),
        })

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.status}`)
        }

        const data = await response.json() as { response: string }
        const variant = data.response?.trim() || `${text} (バリエーション ${i + 1})`
        variants.push(variant)
      }

      return variants
    } catch (error) {
      console.error('Ollama paraphrase error:', error)
      // Fallback to simple variants
      return Array.from({ length: variantCount }, (_, i) => `${text} (${i + 1})`)
    }
  }

  private buildGenerationPrompt(context: StoryContext): string {
    const previousText = context.previousNodes.map(n => n.text).join('\n')
    const currentText = context.currentNodeText
    const choiceText = context.choiceText || '続き'

    return `あなたはインタラクティブな物語の執筆者です。以下の文脈を基に、次のノードのテキストを生成してください。

これまでの物語:
${previousText}

現在の状況:
${currentText}

プレイヤーの選択:
${choiceText}

指示:
- 日本語で、自然な物語調で書いてください
- 長さは2-4文程度に収めてください
- 選択肢を導くような終わり方にしてください
- 物語の雰囲気を保ちつつ、新しい展開を加えてください

次のノードのテキスト:`
  }

  private buildParaphrasePrompt(text: string, options?: ParaphraseOptions): string {
    const style = options?.style || 'plain'
    const tone = options?.tone || 'neutral'
    const emotion = options?.emotion || 'neutral'

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

元のテキスト:
${text}

指示:
- ${styleInstruction}言い換えを作成してください
- ${toneInstruction}トーンを保ってください
- ${emotionInstruction}感情表現を加えてください
- 意味は変えずに表現だけを変化させてください`
  }
}

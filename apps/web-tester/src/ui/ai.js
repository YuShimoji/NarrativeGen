/**
 * AI Manager Module
 * Handles AI integration features including node generation and text paraphrasing
 */

export class AiManager {
  constructor(appState) {
    this.appState = appState
    this.aiProvider = null
    this.aiOutputElement = null
    this.generateNextNodeBtn = null
    this.paraphraseCurrentBtn = null
    this.aiConfig = {
      provider: 'mock',
      openai: {
        apiKey: '',
        model: 'gpt-3.5-turbo'
      },
      ollama: {
        url: 'http://localhost:11434',
        model: 'llama2'
      }
    }
  }

  initialize(aiOutputElement, generateNextNodeBtn, paraphraseCurrentBtn) {
    this.aiOutputElement = aiOutputElement
    this.generateNextNodeBtn = this.generateNextNodeBtn
    this.paraphraseCurrentBtn = paraphraseCurrentBtn
    this.loadConfigFromStorage()
    this.initProvider()
  }

  loadConfigFromStorage() {
    try {
      const savedConfig = localStorage.getItem('narrativeGenAiConfig')
      if (savedConfig) {
        this.aiConfig = { ...this.aiConfig, ...JSON.parse(savedConfig) }
      }
    } catch (error) {
      console.warn('Failed to load AI config from storage:', error)
    }
  }

  saveConfigToStorage() {
    try {
      localStorage.setItem('narrativeGenAiConfig', JSON.stringify(this.aiConfig))
    } catch (error) {
      console.error('Failed to save AI config:', error)
    }
  }

  initProvider() {
    if (!this.aiProvider || this.aiConfig.provider !== this.getCurrentProviderType()) {
      try {
        this.aiProvider = this.createAIProvider(this.aiConfig)
      } catch (error) {
        console.error('AI provider initialization error:', error)
        this.setOutput(`AIプロバイダーの初期化に失敗しました: ${error.message}`)
      }
    }
  }

  createAIProvider(config) {
    // This would normally import and create the actual AI provider
    // For now, we'll create a mock implementation
    return {
      generateNextNode: async (context) => {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 1000))
        return `これは${context.choiceText || '続き'}のモック生成されたテキストです。`
      },
      paraphrase: async (text, options = {}) => {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 500))
        const variants = []
        for (let i = 0; i < (options.variantCount || 3); i++) {
          variants.push(`${text}（言い換え${i + 1}）`)
        }
        return variants
      }
    }
  }

  getCurrentProviderType() {
    return this.aiProvider ? this.aiProvider.type : null
  }

  updateConfig(newConfig) {
    this.aiConfig = { ...this.aiConfig, ...newConfig }
    this.saveConfigToStorage()
    this.initProvider() // Reinitialize with new config
  }

  async generateNextNode(context) {
    if (!this.aiProvider) {
      throw new Error('AIプロバイダーが初期化されていません')
    }

    if (!this.appState.session || !this.appState.model) {
      throw new Error('セッションが開始されていません')
    }

    const currentNode = this.appState.model.nodes[this.appState.session.nodeId]
    if (!currentNode) {
      throw new Error('現在のノードが見つかりません')
    }

    // Prepare context for AI generation
    const aiContext = {
      previousNodes: this.appState.storyLog.slice(-3).map(text => ({ id: 'previous', text })),
      currentNodeText: currentNode.text,
      choiceText: context.choiceText || '続き'
    }

    const generatedText = await this.aiProvider.generateNextNode(aiContext)

    // Create new node with AI-generated content
    const newNodeId = `ai_generated_${Date.now()}`
    const newChoiceId = `c_ai_${Date.now()}`

    // Add AI-generated node to model
    this.appState.model.nodes[newNodeId] = {
      id: newNodeId,
      text: generatedText,
      choices: [
        {
          id: newChoiceId,
          text: '続ける',
          target: newNodeId // Loop back to self for now (can be edited later)
        }
      ]
    }

    // Update current node's choice to point to new node
    const currentChoices = currentNode.choices || []
    if (currentChoices.length > 0) {
      // Update the first choice to point to AI-generated node
      currentChoices[0].target = newNodeId
    } else {
      // Add new choice if none exist
      currentNode.choices = [{
        id: newChoiceId,
        text: 'AI生成シーンへ',
        target: newNodeId
      }]
    }

    return {
      newNodeId,
      generatedText,
      choiceUpdated: true
    }
  }

  async paraphraseText(text, options = {}) {
    if (!this.aiProvider) {
      throw new Error('AIプロバイダーが初期化されていません')
    }

    const variants = await this.aiProvider.paraphrase(text, {
      variantCount: options.variantCount || 3,
      style: options.style || 'plain',
      tone: options.tone || 'neutral'
    })

    return variants
  }

  setOutput(message) {
    if (this.aiOutputElement) {
      this.aiOutputElement.textContent = message
    }
  }

  async generateNodeUI() {
    if (!this.aiProvider) {
      this.setOutput('❌ AIプロバイダーが初期化されていません')
      return
    }

    if (!this.appState.session || !this.appState.model) {
      this.setOutput('❌ モデルを読み込んでセッションを開始してください')
      return
    }

    const currentNode = this.appState.model.nodes[this.appState.session.nodeId]
    if (!currentNode?.text) {
      this.setOutput('❌ 現在のノードにテキストがありません')
      return
    }

    // Disable button during generation
    if (this.generateNextNodeBtn) {
      this.generateNextNodeBtn.disabled = true
      this.generateNextNodeBtn.textContent = '生成中...'
    }

    try {
      this.setOutput('⏳ AIで次のノードを生成中...')

      const result = await this.generateNextNode({
        choiceText: '次のシーンへ進む'
      })

      this.setOutput(`✅ AIで新しいノードを生成しました: ${result.newNodeId}\n\n生成されたテキスト:\n${result.generatedText}`)

      // Trigger UI updates
      if (window.graphManager && window.graphPanel?.classList.contains('active')) {
        window.graphManager.render()
      }

    } catch (error) {
      console.error('AI generation error:', error)
      const errorMsg = error.message.includes('API error')
        ? `APIエラー: ${error.message}\nAPIキーを確認してください。`
        : `生成に失敗しました: ${error.message}`
      this.setOutput(`❌ ${errorMsg}`)
    } finally {
      // Re-enable button
      if (this.generateNextNodeBtn) {
        this.generateNextNodeBtn.disabled = false
        this.generateNextNodeBtn.textContent = '次のノードを生成'
      }
    }
  }

  async paraphraseCurrentTextUI() {
    if (!this.aiProvider) {
      this.setOutput('❌ AIプロバイダーが初期化されていません')
      return
    }

    if (!this.appState.session || !this.appState.model) {
      this.setOutput('❌ モデルを読み込んでセッションを開始してください')
      return
    }

    const currentNode = this.appState.model.nodes[this.appState.session.nodeId]
    if (!currentNode?.text) {
      this.setOutput('❌ 現在のノードにテキストがありません')
      return
    }

    // Disable buttons during generation
    if (this.generateNextNodeBtn) this.generateNextNodeBtn.disabled = true
    if (this.paraphraseCurrentBtn) this.paraphraseCurrentBtn.disabled = true

    try {
      this.setOutput('⏳ テキストを言い換え中...')

      const paraphrases = await this.paraphraseText(currentNode.text, {
        variantCount: 3,
        style: 'plain',
        tone: 'neutral'
      })

      this.setOutput(`✅ 言い換え結果:\n${paraphrases.map((p, i) => `${i + 1}. ${p}`).join('\n')}`)

    } catch (error) {
      console.error('AI paraphrase error:', error)
      const errorMsg = error.message.includes('API error')
        ? `APIエラー: ${error.message}\nAPIキーを確認してください。`
        : `言い換えに失敗しました: ${error.message}`
      this.setOutput(`❌ ${errorMsg}`)
    } finally {
      // Re-enable buttons
      if (this.generateNextNodeBtn) this.generateNextNodeBtn.disabled = false
      if (this.paraphraseCurrentBtn) this.paraphraseCurrentBtn.disabled = false
    }
  }

  getConfig() {
    return { ...this.aiConfig }
  }

  isProviderReady() {
    return this.aiProvider !== null
  }

  // Validation methods
  validateOpenAIConfig() {
    if (this.aiConfig.provider === 'openai') {
      if (!this.aiConfig.openai.apiKey) {
        return { valid: false, error: 'OpenAI APIキーが設定されていません' }
      }
      if (!this.aiConfig.openai.model) {
        return { valid: false, error: 'OpenAIモデルが設定されていません' }
      }
    }
    return { valid: true }
  }

  validateOllamaConfig() {
    if (this.aiConfig.provider === 'ollama') {
      if (!this.aiConfig.ollama.url) {
        return { valid: false, error: 'Ollama URLが設定されていません' }
      }
      if (!this.aiConfig.ollama.model) {
        return { valid: false, error: 'Ollamaモデルが設定されていません' }
      }
    }
    return { valid: true }
  }

  validateConfig() {
    const openaiValidation = this.validateOpenAIConfig()
    if (!openaiValidation.valid) {
      return openaiValidation
    }

    const ollamaValidation = this.validateOllamaConfig()
    if (!ollamaValidation.valid) {
      return ollamaValidation
    }

    return { valid: true }
  }
}

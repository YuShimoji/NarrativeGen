// AI Config Handler - manages AI provider configuration, settings UI, and AI operations
// Extracted from main.js for better maintainability

import { createAIProvider } from '@narrativegen/engine-ts/dist/browser.js'

export function initAiConfig(deps) {
  const {
    getModel,
    getSession,
    setStatus,
    // DOM references
    aiProvider,
    openaiSettings,
    openaiApiKey,
    openaiModel,
    saveAiSettings,
    generateNextNodeBtn,
    paraphraseCurrentBtn,
    aiOutput,
    Logger,
  } = deps;

  let aiConfig = {
    provider: 'mock',
    openai: {
      apiKey: '',
      model: 'gpt-3.5-turbo'
    }
  };
  let aiProviderInstance = null;

  // Load AI config from localStorage on startup
  function loadSavedConfig() {
    const savedAiConfig = localStorage.getItem('narrativeGenAiConfig');
    if (savedAiConfig) {
      try {
        aiConfig = { ...aiConfig, ...JSON.parse(savedAiConfig) };
        aiProvider.value = aiConfig.provider;
        if (aiConfig.provider === 'openai') {
          openaiSettings.style.display = 'block';
          openaiApiKey.value = aiConfig.openai.apiKey || '';
          openaiModel.value = aiConfig.openai.model || 'gpt-3.5-turbo';
        }
      } catch (error) {
        console.warn('Failed to load AI config from localStorage:', error);
      }
    }
  }

  async function initAiProviderFn() {
    if (!aiProviderInstance || aiConfig.provider !== aiProvider.value) {
      try {
        if (aiProvider.value === 'openai') {
          if (!aiConfig.openai.apiKey) {
            aiOutput.textContent = 'OpenAI APIキーを設定してください';
            return;
          }
          aiProviderInstance = createAIProvider({
            provider: 'openai',
            openai: aiConfig.openai
          });
        } else {
          aiProviderInstance = createAIProvider({ provider: 'mock' });
        }
        aiOutput.textContent = `${aiProvider.value}プロバイダーが初期化されました`;
      } catch (error) {
        console.error('AIプロバイダー初期化エラー:', error);
        aiOutput.textContent = `AIプロバイダーの初期化に失敗しました: ${error.message}`;
      }
    }
  }

  async function generateNextNode() {
    const session = getSession();
    const _model = getModel();
    if (!aiProviderInstance || !session || !_model) {
      aiOutput.textContent = '❌ モデルを読み込んでから実行してください';
      return;
    }

    // Disable buttons during generation
    generateNextNodeBtn.disabled = true;
    paraphraseCurrentBtn.disabled = true;
    aiOutput.textContent = '⏳ 生成中...';

    try {
      const context = {
        previousNodes: [], // 現在の実装では履歴を保持していない
        currentNodeText: _model.nodes[session.state.nodeId]?.text || '',
        choiceText: '続き'
      };

      const startTime = Date.now();
      const generatedText = await aiProviderInstance.generateNextNode(context);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      aiOutput.textContent = `✅ 生成されたテキスト (${duration}秒):\n${generatedText}`;
      Logger.info('AI node generated', { duration, provider: aiConfig.provider });
    } catch (error) {
      console.error('ノード生成エラー:', error);
      const errorMsg = error.message.includes('API error') 
        ? `APIエラー: ${error.message}\nAPIキーを確認してください。`
        : `生成に失敗しました: ${error.message}`;
      aiOutput.textContent = `❌ ${errorMsg}`;
      Logger.error('AI generation failed', { error: error.message, provider: aiConfig.provider });
    } finally {
      // Re-enable buttons
      generateNextNodeBtn.disabled = false;
      paraphraseCurrentBtn.disabled = false;
    }
  }

  async function paraphraseCurrentText() {
    const session = getSession();
    const _model = getModel();
    if (!aiProviderInstance || !session || !_model) {
      aiOutput.textContent = '❌ モデルを読み込んでから実行してください';
      return;
    }

    const currentNode = _model.nodes[session.state.nodeId];
    if (!currentNode?.text) {
      aiOutput.textContent = '❌ 現在のノードにテキストがありません';
      return;
    }

    // Disable buttons during generation
    generateNextNodeBtn.disabled = true;
    paraphraseCurrentBtn.disabled = true;
    aiOutput.textContent = '⏳ 言い換え中...';

    try {
      const startTime = Date.now();
      const paraphrases = await aiProviderInstance.paraphrase(currentNode.text, {
        variantCount: 3,
        style: 'desu-masu',
        tone: 'neutral'
      });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      aiOutput.textContent = `✅ 言い換え結果 (${duration}秒):\n${paraphrases.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
      Logger.info('AI paraphrase completed', { duration, provider: aiConfig.provider, variantCount: paraphrases.length });
    } catch (error) {
      console.error('言い換えエラー:', error);
      const errorMsg = error.message.includes('API error') 
        ? `APIエラー: ${error.message}\nAPIキーを確認してください。`
        : `言い換えに失敗しました: ${error.message}`;
      aiOutput.textContent = `❌ ${errorMsg}`;
      Logger.error('AI paraphrase failed', { error: error.message, provider: aiConfig.provider });
    } finally {
      // Re-enable buttons
      generateNextNodeBtn.disabled = false;
      paraphraseCurrentBtn.disabled = false;
    }
  }

  function setupListeners() {
    // AI settings event handlers
    aiProvider.addEventListener('change', () => {
      if (aiProvider.value === 'openai') {
        openaiSettings.style.display = 'block';
      } else {
        openaiSettings.style.display = 'none';
      }
      aiProviderInstance = null; // Reset provider when changed
    });

    saveAiSettings.addEventListener('click', () => {
      aiConfig.provider = aiProvider.value;
      if (aiProvider.value === 'openai') {
        aiConfig.openai.apiKey = openaiApiKey.value;
        aiConfig.openai.model = openaiModel.value;
        if (!aiConfig.openai.apiKey) {
          aiOutput.textContent = 'OpenAI APIキーを入力してください';
          return;
        }
      }
      // Save to localStorage
      localStorage.setItem('narrativeGenAiConfig', JSON.stringify(aiConfig));
      aiOutput.textContent = 'AI設定を保存しました';
      aiProviderInstance = null; // Reset to use new config
    });

    generateNextNodeBtn.addEventListener('click', generateNextNode);
    paraphraseCurrentBtn.addEventListener('click', paraphraseCurrentText);
  }

  // Public API
  return {
    loadSavedConfig,
    initAiProvider: initAiProviderFn,
    generateNextNode,
    paraphraseCurrentText,
    setupListeners,
  };
}

// AI Config Handler - manages AI provider configuration, settings UI, and AI operations
// Extracted from main.js for better maintainability

import { createAIProvider } from '@narrativegen/engine-ts/dist/browser.js'

// Externalized constants (no hardcoded magic values)
const AI_CONFIG_DEFAULTS = {
  provider: 'mock',
  openai: { apiKey: '', model: 'gpt-3.5-turbo' },
};
const HISTORY_MAX_SIZE = 5;
const PARAPHRASE_VARIANT_COUNT = 3;
const PARAPHRASE_STYLE = 'desu-masu';
const PARAPHRASE_TONE = 'neutral';
const STORAGE_KEY_AI_CONFIG = 'narrativeGenAiConfig';

export function initAiConfig(deps) {
  const {
    getModel,
    getSession,
    setStatus,
    onAdopt,
    // DOM references
    aiProvider,
    openaiSettings,
    openaiApiKey,
    openaiModel,
    saveAiSettings,
    generateNextNodeBtn,
    paraphraseCurrentBtn,
    aiOutput,
    aiHistoryList,
    Logger,
  } = deps;

  let aiConfig = { ...AI_CONFIG_DEFAULTS, openai: { ...AI_CONFIG_DEFAULTS.openai } };
  let aiProviderInstance = null;
  /** @type {Array<{id:string, type:string, text:string, nodeId:string, timestamp:number}>} */
  let generationHistory = [];

  // Load AI config from localStorage on startup
  function loadSavedConfig() {
    const savedAiConfig = localStorage.getItem(STORAGE_KEY_AI_CONFIG);
    if (savedAiConfig) {
      try {
        aiConfig = { ...aiConfig, ...JSON.parse(savedAiConfig) };
        aiProvider.value = aiConfig.provider;
        if (aiConfig.provider === 'openai') {
          openaiSettings.style.display = 'block';
          openaiApiKey.value = aiConfig.openai.apiKey || '';
          openaiModel.value = aiConfig.openai.model || AI_CONFIG_DEFAULTS.openai.model;
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
      
      const nodeId = session.state.nodeId;
      renderGenerationResult('generate', generatedText, duration, nodeId);
      addToHistory('generate', generatedText, nodeId);
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
        variantCount: PARAPHRASE_VARIANT_COUNT,
        style: PARAPHRASE_STYLE,
        tone: PARAPHRASE_TONE,
      });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      const nodeId = session.state.nodeId;
      renderParaphraseResult(paraphrases, duration, nodeId);
      paraphrases.forEach(p => addToHistory('paraphrase', p, nodeId));
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
      localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(aiConfig));
      aiOutput.textContent = 'AI設定を保存しました';
      aiProviderInstance = null; // Reset to use new config
    });

    generateNextNodeBtn.addEventListener('click', generateNextNode);
    paraphraseCurrentBtn.addEventListener('click', paraphraseCurrentText);
  }

  // --- Result rendering with adopt buttons ---

  function renderGenerationResult(type, text, duration, nodeId) {
    aiOutput.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'ai-result-header';
    header.textContent = `\u2705 生成されたテキスト (${duration}秒)`;
    aiOutput.appendChild(header);

    const resultItem = createResultItem(text, nodeId);
    aiOutput.appendChild(resultItem);
  }

  function renderParaphraseResult(paraphrases, duration, nodeId) {
    aiOutput.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'ai-result-header';
    header.textContent = `\u2705 言い換え結果 (${duration}秒)`;
    aiOutput.appendChild(header);

    paraphrases.forEach((p, i) => {
      const resultItem = createResultItem(p, nodeId, i + 1);
      aiOutput.appendChild(resultItem);
    });
  }

  function createResultItem(text, nodeId, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-result-item';

    const textEl = document.createElement('div');
    textEl.className = 'ai-result-text';
    textEl.textContent = index ? `${index}. ${text}` : text;
    wrapper.appendChild(textEl);

    const adoptBtn = document.createElement('button');
    adoptBtn.className = 'ai-adopt-btn';
    adoptBtn.textContent = '\u63A1\u7528';
    adoptBtn.addEventListener('click', () => {
      if (typeof onAdopt === 'function') {
        onAdopt(nodeId, text);
        adoptBtn.textContent = '\u63A1\u7528\u6E08\u307F';
        adoptBtn.disabled = true;
        Logger.info('AI result adopted', { nodeId, textLength: text.length });
      }
    });
    wrapper.appendChild(adoptBtn);

    return wrapper;
  }

  // --- History management ---

  function addToHistory(type, text, nodeId) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      text,
      nodeId,
      timestamp: Date.now(),
    };
    generationHistory.unshift(entry);
    if (generationHistory.length > HISTORY_MAX_SIZE) {
      generationHistory = generationHistory.slice(0, HISTORY_MAX_SIZE);
    }
    renderHistory();
  }

  function renderHistory() {
    if (!aiHistoryList) return;
    aiHistoryList.innerHTML = '';
    if (generationHistory.length === 0) {
      aiHistoryList.textContent = '\u5C65\u6B74\u306A\u3057';
      return;
    }
    generationHistory.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'ai-history-item';

      const label = document.createElement('span');
      label.className = 'ai-history-label';
      label.textContent = entry.type === 'generate' ? '\u751F\u6210' : '\u8A00\u3044\u63DB\u3048';

      const textEl = document.createElement('span');
      textEl.className = 'ai-history-text';
      const maxLen = 60;
      textEl.textContent = entry.text.length > maxLen ? entry.text.slice(0, maxLen) + '...' : entry.text;
      textEl.title = entry.text;

      const adoptBtn = document.createElement('button');
      adoptBtn.className = 'ai-adopt-btn ai-adopt-btn-sm';
      adoptBtn.textContent = '\u63A1\u7528';
      adoptBtn.addEventListener('click', () => {
        if (typeof onAdopt === 'function') {
          onAdopt(entry.nodeId, entry.text);
          adoptBtn.textContent = '\u63A1\u7528\u6E08\u307F';
          adoptBtn.disabled = true;
        }
      });

      item.appendChild(label);
      item.appendChild(textEl);
      item.appendChild(adoptBtn);
      aiHistoryList.appendChild(item);
    });
  }

  function getHistory() {
    return [...generationHistory];
  }

  // Public API
  return {
    loadSavedConfig,
    initAiProvider: initAiProviderFn,
    generateNextNode,
    paraphraseCurrentText,
    setupListeners,
    getHistory,
  };
}

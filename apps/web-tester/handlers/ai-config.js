/**
 * AI Config Handler - Manages AI provider configuration, settings, and AI-assisted content generation
 *
 * Provides AI-powered node generation and text paraphrasing with multiple provider support
 * (OpenAI, mock). Maintains generation history, persists settings to localStorage, and
 * integrates with the narrative model for AI-assisted storytelling.
 *
 * @module handlers/ai-config
 */

import { createAIProvider } from '@narrativegen/engine-ts/dist/browser.js'
import { escapeHtml, clearContent } from '../src/utils/html-utils.js'

/**
 * Initialize AI Config handler with dependency injection
 *
 * Sets up AI provider configuration, event listeners for settings changes,
 * and AI operation handlers (node generation, paraphrasing). Restores saved
 * configuration from localStorage on startup.
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getModel - Get current narrative model
 * @param {Function} deps.getSession - Get current game session
 * @param {Function} deps.setStatus - Display status message
 * @param {HTMLSelectElement} deps.aiProvider - AI provider selector
 * @param {HTMLElement} deps.openaiSettings - OpenAI settings container
 * @param {HTMLInputElement} deps.openaiApiKey - OpenAI API key input
 * @param {HTMLSelectElement} deps.openaiModel - OpenAI model selector
 * @param {HTMLButtonElement} deps.saveAiSettings - Save settings button
 * @param {HTMLButtonElement} deps.generateNextNodeBtn - Generate node button
 * @param {HTMLButtonElement} deps.paraphraseCurrentBtn - Paraphrase button
 * @param {HTMLElement} deps.aiOutput - AI output display area
 * @param {Object} deps.Logger - Logger instance
 * @returns {Object} Handler public API
 * @returns {Function} returns.loadSavedConfig - Load AI config from localStorage
 * @returns {Function} returns.initAiProvider - Initialize the AI provider instance
 * @returns {Function} returns.generateNextNode - Generate next narrative node
 * @returns {Function} returns.paraphraseCurrentText - Paraphrase current node text
 * @returns {Function} returns.setupListeners - Setup event listeners for AI operations
 *
 * @example
 * const handler = initAiConfig({
 *   getModel: () => model,
 *   getSession: () => session,
 *   setStatus: (msg, type) => showStatus(msg, type),
 *   aiProvider: document.getElementById('ai-provider'),
 *   // ... other dependencies
 * });
 * handler.loadSavedConfig();
 * handler.setupListeners();
 */
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
  let generationHistory = []; // Store last 5 generations

  /**
   * Load AI configuration from localStorage
   *
   * Retrieves saved AI provider settings and credentials from localStorage,
   * applying them to the UI. Handles JSON parsing and shows warnings if
   * stored config is malformed.
   *
   * @returns {void}
   * @private
   */
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

  /**
   * Initialize or reinitialize the AI provider instance
   *
   * Creates an AI provider instance based on current configuration.
   * Supports mock and OpenAI providers. Validates API key for OpenAI
   * and provides user feedback if initialization fails.
   *
   * @async
   * @returns {void}
   * @private
   */
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

  /**
   * Generate the next narrative node using AI
   *
   * Uses the configured AI provider to generate continuation text based on
   * current game context. Displays loading indicator, handles errors with
   * user-friendly messages, and adds successful generations to history.
   * Temporarily disables buttons during generation.
   *
   * @async
   * @returns {void}
   * @private
   */
  async function generateNextNode() {
    const session = getSession();
    const _model = getModel();
    if (!aiProviderInstance || !session || !_model) {
      clearContent(aiOutput);
      const div = document.createElement('div');
      div.style.color = '#dc2626';
      div.textContent = '❌ モデルを読み込んでから実行してください';
      aiOutput.appendChild(div);
      return;
    }

    // Disable buttons during generation
    generateNextNodeBtn.disabled = true;
    paraphraseCurrentBtn.disabled = true;
    clearContent(aiOutput);
    const loadingDiv = document.createElement('div');
    loadingDiv.style.color = '#6366f1';
    loadingDiv.textContent = '⏳ 生成中...';
    aiOutput.appendChild(loadingDiv);

    try {
      const context = {
        previousNodes: [], // 現在の実装では履歴を保持していない
        currentNodeText: _model.nodes[session.state.nodeId]?.text || '',
        choiceText: '続き'
      };

      const startTime = Date.now();
      const generatedText = await aiProviderInstance.generateNextNode(context);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Add to history
      const historyItem = {
        type: 'generate',
        text: generatedText,
        timestamp: new Date().toISOString(),
        duration,
        provider: aiConfig.provider
      };
      generationHistory.unshift(historyItem);
      if (generationHistory.length > 5) generationHistory.pop();

      renderHistory();
      Logger.info('AI node generated', { duration, provider: aiConfig.provider });
    } catch (error) {
      console.error('ノード生成エラー:', error);
      const errorMsg = error.message.includes('API error')
        ? `APIエラー: ${error.message}\nAPIキーを確認してください。`
        : `生成に失敗しました: ${error.message}`;
      clearContent(aiOutput);
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'color: #dc2626; padding: 1rem; background: #fee2e2; border-radius: 4px;';
      errorDiv.textContent = `❌ ${escapeHtml(errorMsg)}`;
      aiOutput.appendChild(errorDiv);
      Logger.error('AI generation failed', { error: error.message, provider: aiConfig.provider });
    } finally {
      // Re-enable buttons
      generateNextNodeBtn.disabled = false;
      paraphraseCurrentBtn.disabled = false;
    }
  }

  /**
   * Generate paraphrases of the current node's text
   *
   * Uses the configured AI provider to generate multiple paraphrase variants
   * of the current node text. Supports style and tone customization. Adds all
   * variants to generation history for user selection.
   *
   * @async
   * @returns {void}
   * @private
   */
  async function paraphraseCurrentText() {
    const session = getSession();
    const _model = getModel();
    if (!aiProviderInstance || !session || !_model) {
      clearContent(aiOutput);
      const div = document.createElement('div');
      div.style.color = '#dc2626';
      div.textContent = '❌ モデルを読み込んでから実行してください';
      aiOutput.appendChild(div);
      return;
    }

    const currentNode = _model.nodes[session.state.nodeId];
    if (!currentNode?.text) {
      clearContent(aiOutput);
      const div = document.createElement('div');
      div.style.color = '#dc2626';
      div.textContent = '❌ 現在のノードにテキストがありません';
      aiOutput.appendChild(div);
      return;
    }

    // Disable buttons during generation
    generateNextNodeBtn.disabled = true;
    paraphraseCurrentBtn.disabled = true;
    clearContent(aiOutput);
    const loadingDiv = document.createElement('div');
    loadingDiv.style.color = '#6366f1';
    loadingDiv.textContent = '⏳ 言い換え中...';
    aiOutput.appendChild(loadingDiv);

    try {
      const startTime = Date.now();
      const paraphrases = await aiProviderInstance.paraphrase(currentNode.text, {
        variantCount: 3,
        style: 'desu-masu',
        tone: 'neutral'
      });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Add each variant to history
      paraphrases.forEach((text, i) => {
        const historyItem = {
          type: 'paraphrase',
          text,
          originalText: currentNode.text,
          timestamp: new Date().toISOString(),
          duration,
          provider: aiConfig.provider,
          variantIndex: i + 1
        };
        generationHistory.unshift(historyItem);
      });
      if (generationHistory.length > 5) generationHistory.splice(5);

      renderHistory();
      Logger.info('AI paraphrase completed', { duration, provider: aiConfig.provider, variantCount: paraphrases.length });
    } catch (error) {
      console.error('言い換えエラー:', error);
      const errorMsg = error.message.includes('API error')
        ? `APIエラー: ${error.message}\nAPIキーを確認してください。`
        : `言い換えに失敗しました: ${error.message}`;
      clearContent(aiOutput);
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'color: #dc2626; padding: 1rem; background: #fee2e2; border-radius: 4px;';
      errorDiv.textContent = `❌ ${escapeHtml(errorMsg)}`;
      aiOutput.appendChild(errorDiv);
      Logger.error('AI paraphrase failed', { error: error.message, provider: aiConfig.provider });
    } finally {
      // Re-enable buttons
      generateNextNodeBtn.disabled = false;
      paraphraseCurrentBtn.disabled = false;
    }
  }

  /**
   * Render the AI generation history UI
   *
   * Displays the most recent AI generations and paraphrases with
   * adoption buttons and timing information. Shows empty state if
   * no generations have been made.
   *
   * @returns {void}
   * @private
   */
  function renderHistory() {
    clearContent(aiOutput);

    if (generationHistory.length === 0) {
      const p = document.createElement('p');
      p.style.color = '#9ca3af';
      p.textContent = '生成履歴なし';
      aiOutput.appendChild(p);
      return;
    }

    const h4 = document.createElement('h4');
    h4.style.marginTop = '0';
    h4.textContent = '生成履歴（直近5件）';
    aiOutput.appendChild(h4);

    generationHistory.forEach((item, index) => {
      const card = document.createElement('div');
      card.style.cssText = 'background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem;';

      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;';

      const typeLabel = document.createElement('span');
      typeLabel.style.cssText = 'font-size: 0.875rem; color: #6366f1; font-weight: 600;';
      typeLabel.textContent = item.type === 'generate' ? '🤖 生成' : '🔄 言い換え';
      if (item.variantIndex) typeLabel.textContent += ` (${item.variantIndex})`;

      const timestamp = document.createElement('span');
      timestamp.style.cssText = 'font-size: 0.75rem; color: #9ca3af;';
      const date = new Date(item.timestamp);
      timestamp.textContent = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} (${item.duration}s)`;

      header.appendChild(typeLabel);
      header.appendChild(timestamp);

      const textContent = document.createElement('div');
      textContent.style.cssText = 'color: #1f2937; margin-bottom: 0.75rem; line-height: 1.5;';
      textContent.textContent = escapeHtml(item.text);

      const adoptBtn = document.createElement('button');
      adoptBtn.textContent = '✓ 採用';
      adoptBtn.style.cssText = 'padding: 0.5rem 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.875rem;';
      adoptBtn.onclick = () => adoptText(item.text, index);

      card.appendChild(header);
      card.appendChild(textContent);
      card.appendChild(adoptBtn);
      aiOutput.appendChild(card);
    });
  }

  /**
   * Adopt AI-generated text into the current node
   *
   * Updates the current node's text with the selected AI-generated content.
   * Re-renders the story view and provides visual feedback on the adopted item.
   *
   * @param {string} text - The AI-generated text to adopt
   * @param {number} historyIndex - Index in the generation history
   * @returns {void}
   * @private
   */
  function adoptText(text, historyIndex) {
    const session = getSession();
    const _model = getModel();

    if (!session || !_model) {
      setStatus('モデルを読み込んでから実行してください', 'warn');
      return;
    }

    const currentNodeId = session.state.nodeId;
    const currentNode = _model.nodes[currentNodeId];

    if (!currentNode) {
      setStatus('現在のノードが見つかりません', 'error');
      return;
    }

    // Update node text
    currentNode.text = text;

    // Re-render the story view
    const storyView = document.getElementById('storyView');
    if (storyView) {
      storyView.textContent = text;
    }

    setStatus(`ノード「${currentNodeId}」のテキストを更新しました`, 'success');
    Logger.info('AI text adopted', { nodeId: currentNodeId, historyIndex, textLength: text.length });

    // Visual feedback on the adopted item
    const cards = aiOutput.querySelectorAll('div[style*="background: white"]');
    if (cards[historyIndex]) {
      cards[historyIndex].style.borderColor = '#10b981';
      cards[historyIndex].style.background = '#ecfdf5';
      const btn = cards[historyIndex].querySelector('button');
      if (btn) {
        btn.textContent = '✓ 採用済み';
        btn.disabled = true;
        btn.style.background = '#9ca3af';
      }
    }
  }

  /**
   * Setup event listeners for AI configuration and operations
   *
   * Attaches handlers for provider selection, settings save, and
   * AI operation buttons (generate and paraphrase).
   *
   * @returns {void}
   * @private
   */
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

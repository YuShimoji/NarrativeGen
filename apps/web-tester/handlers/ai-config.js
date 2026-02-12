// AI Config Handler - manages AI provider configuration, settings UI, and AI operations
// Extracted from main.js for better maintainability

import { AI_UX_CONFIG } from '../utils/ai-ux-config.js'
import {
  aiGenerateNextNode,
  aiParaphrase,
  ensureAiProvider,
  resetAIProvider,
} from './ai-handler.js'

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

  const aiHistoryContainer = document.getElementById('aiHistory')

  let aiConfig = {
    provider: AI_UX_CONFIG.defaults.provider,
    openai: {
      apiKey: '',
      model: AI_UX_CONFIG.defaults.openaiModel
    }
  };

  function loadHistory() {
    try {
      const raw = localStorage.getItem(AI_UX_CONFIG.storageKeys.aiHistory)
      const parsed = raw ? JSON.parse(raw) : []
      if (!Array.isArray(parsed)) return []
      return parsed
        .filter((item) => item && typeof item === 'object')
        .slice(0, AI_UX_CONFIG.historyLimit)
    } catch (_) {
      return []
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(
        AI_UX_CONFIG.storageKeys.aiHistory,
        JSON.stringify((history || []).slice(0, AI_UX_CONFIG.historyLimit)),
      )
    } catch (_) {}
  }

  function pushHistory(entry) {
    const history = loadHistory()
    history.unshift(entry)
    saveHistory(history)
    renderHistory()
  }

  function getCurrentNodeId() {
    const session = getSession()
    const nodeId = session?.state?.nodeId
    return typeof nodeId === 'string' ? nodeId : null
  }

  function getGuiNodeTextArea(nodeId) {
    const guiEditMode = document.getElementById('guiEditMode')
    if (!guiEditMode || guiEditMode.style.display === 'none') return null
    const nodeList = document.getElementById('nodeList')
    if (!nodeList) return null
    return nodeList.querySelector(`textarea[data-node-id="${nodeId}"][data-field="text"]`)
  }

  function applyTextToCurrentNode(nextText) {
    const nodeId = getCurrentNodeId()
    const model = getModel()
    if (!nodeId || !model?.nodes?.[nodeId]) {
      setStatus(`${AI_UX_CONFIG.ui.marks.error} ${AI_UX_CONFIG.labels.missingModel}`, 'warn')
      return false
    }
    model.nodes[nodeId].text = String(nextText ?? '')

    const textarea = getGuiNodeTextArea(nodeId)
    if (textarea) {
      textarea.value = model.nodes[nodeId].text
    }
    return true
  }

  function clearAiOutput() {
    aiOutput.textContent = ''
    aiOutput.innerHTML = ''
  }

  function renderResultAsSingleText({ title, text, durationSec, type }) {
    clearAiOutput()
    const header = document.createElement('div')
    const suffix = durationSec ? ` (${durationSec}${AI_UX_CONFIG.ui.units.seconds})` : ''
    header.textContent = `${AI_UX_CONFIG.ui.marks.success} ${title}${suffix}:`
    const pre = document.createElement('pre')
    pre.textContent = text

    const actions = document.createElement('div')
    actions.className = 'ai-result-actions'
    const adoptBtn = document.createElement('button')
    adoptBtn.type = 'button'
    adoptBtn.textContent = AI_UX_CONFIG.labels.adopt
    adoptBtn.addEventListener('click', () => {
      const applied = applyTextToCurrentNode(text)
      if (applied) {
        setStatus(`${AI_UX_CONFIG.ui.marks.success} ${AI_UX_CONFIG.labels.applied}`, 'success')
        pushHistory({
          id: crypto?.randomUUID?.() ?? String(Date.now()),
          type,
          nodeId: getCurrentNodeId(),
          text,
          durationSec,
          provider: aiConfig.provider,
          createdAt: new Date().toISOString(),
        })
      }
    })
    actions.appendChild(adoptBtn)

    aiOutput.appendChild(header)
    aiOutput.appendChild(pre)
    aiOutput.appendChild(actions)
  }

  function renderResultAsVariants({ title, variants, durationSec, type }) {
    clearAiOutput()
    const header = document.createElement('div')
    const suffix = durationSec ? ` (${durationSec}${AI_UX_CONFIG.ui.units.seconds})` : ''
    header.textContent = `${AI_UX_CONFIG.ui.marks.success} ${title}${suffix}:`
    aiOutput.appendChild(header)

    variants.forEach((text, i) => {
      const wrapper = document.createElement('div')
      wrapper.className = 'ai-variant'
      const pre = document.createElement('pre')
      pre.textContent = `${i + 1}. ${text}`

      const actions = document.createElement('div')
      actions.className = 'ai-result-actions'
      const adoptBtn = document.createElement('button')
      adoptBtn.type = 'button'
      adoptBtn.textContent = AI_UX_CONFIG.labels.adopt
      adoptBtn.addEventListener('click', () => {
        const applied = applyTextToCurrentNode(text)
        if (applied) {
          setStatus(`${AI_UX_CONFIG.ui.marks.success} ${AI_UX_CONFIG.labels.applied}`, 'success')
          pushHistory({
            id: crypto?.randomUUID?.() ?? String(Date.now()),
            type,
            nodeId: getCurrentNodeId(),
            text,
            durationSec,
            provider: aiConfig.provider,
            createdAt: new Date().toISOString(),
          })
        }
      })
      actions.appendChild(adoptBtn)

      wrapper.appendChild(pre)
      wrapper.appendChild(actions)
      aiOutput.appendChild(wrapper)
    })
  }

  function renderHistory() {
    if (!aiHistoryContainer) return
    const history = loadHistory()
    aiHistoryContainer.innerHTML = ''

    const title = document.createElement('h4')
    title.textContent = `${AI_UX_CONFIG.labels.historyTitle} (${history.length}/${AI_UX_CONFIG.historyLimit})`
    aiHistoryContainer.appendChild(title)

    if (history.length === 0) {
      const empty = document.createElement('div')
      empty.textContent = AI_UX_CONFIG.labels.emptyHistory
      aiHistoryContainer.appendChild(empty)
      return
    }

    history.forEach((item) => {
      const nodeId = typeof item.nodeId === 'string' ? item.nodeId : ''
      const type = typeof item.type === 'string' ? item.type : ''
      const createdAt = typeof item.createdAt === 'string' ? item.createdAt : ''
      const provider = typeof item.provider === 'string' ? item.provider : ''
      const text = typeof item.text === 'string' ? item.text : ''

      const box = document.createElement('div')
      box.className = 'ai-history-item'

      const meta = document.createElement('div')
      meta.className = 'ai-history-meta'
      meta.textContent = `${type} / node=${nodeId} / ${provider} / ${createdAt}`

      const pre = document.createElement('pre')
      pre.textContent = text

      const actions = document.createElement('div')
      actions.className = 'ai-result-actions'
      const adoptBtn = document.createElement('button')
      adoptBtn.type = 'button'
      adoptBtn.textContent = AI_UX_CONFIG.labels.adopt
      adoptBtn.addEventListener('click', () => {
        const applied = applyTextToCurrentNode(text)
        if (applied) {
          setStatus(`${AI_UX_CONFIG.ui.marks.success} ${AI_UX_CONFIG.labels.applied}`, 'success')
        }
      })

      actions.appendChild(adoptBtn)
      box.appendChild(meta)
      box.appendChild(pre)
      box.appendChild(actions)
      aiHistoryContainer.appendChild(box)
    })
  }

  // Load AI config from localStorage on startup
  function loadSavedConfig() {
    const savedAiConfig = localStorage.getItem(AI_UX_CONFIG.storageKeys.aiConfig);
    if (savedAiConfig) {
      try {
        aiConfig = { ...aiConfig, ...JSON.parse(savedAiConfig) };
        aiProvider.value = aiConfig.provider;
        if (aiConfig.provider === 'openai') {
          openaiSettings.style.display = 'block';
          openaiApiKey.value = aiConfig.openai.apiKey || '';
          openaiModel.value = aiConfig.openai.model || AI_UX_CONFIG.defaults.openaiModel;
        }
      } catch (error) {
        console.warn('Failed to load AI config from localStorage:', error);
      }
    }
    renderHistory()
  }

  async function initAiProviderFn() {
    try {
      if (aiProvider.value === 'openai' && !aiConfig.openai.apiKey) {
        aiOutput.textContent = AI_UX_CONFIG.labels.missingApiKey
        return
      }
      await ensureAiProvider({ aiConfig, providerValue: aiProvider.value })
      aiOutput.textContent = `${aiProvider.value}${AI_UX_CONFIG.labels.providerInitializedSuffix}`
    } catch (error) {
      console.error('AIプロバイダー初期化エラー:', error)
      aiOutput.textContent = `${AI_UX_CONFIG.labels.providerInitFailedPrefix}${error.message}`
    }
  }

  async function generateNextNode() {
    const session = getSession();
    const _model = getModel();
    if (!session || !_model) {
      aiOutput.textContent = `${AI_UX_CONFIG.ui.marks.error} ${AI_UX_CONFIG.labels.missingModel}`;
      return;
    }

    // Disable buttons during generation
    generateNextNodeBtn.disabled = true;
    paraphraseCurrentBtn.disabled = true;
    aiOutput.textContent = AI_UX_CONFIG.labels.generating;

    try {
      const context = {
        previousNodes: [], // 現在の実装では履歴を保持していない
        currentNodeText: _model.nodes[session.state.nodeId]?.text || '',
        choiceText: AI_UX_CONFIG.generate.choiceText
      };

      const { generatedText, durationSec } = await aiGenerateNextNode({
        context,
        aiConfig,
        providerValue: aiProvider.value,
      })

      renderResultAsSingleText({
        title: AI_UX_CONFIG.labels.generateTitle,
        text: generatedText,
        durationSec,
        type: 'generate',
      })
      Logger.info('AI node generated', { duration: durationSec, provider: aiConfig.provider });
    } catch (error) {
      console.error('ノード生成エラー:', error);
      const errorMsg = error.message.includes('API error') 
        ? `${AI_UX_CONFIG.labels.apiErrorPrefix}${error.message}\n${AI_UX_CONFIG.labels.apiKeyCheckHint}`
        : `${AI_UX_CONFIG.labels.generateFailedPrefix}${error.message}`;
      aiOutput.textContent = `${AI_UX_CONFIG.ui.marks.error} ${errorMsg}`;
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
    if (!session || !_model) {
      aiOutput.textContent = `${AI_UX_CONFIG.ui.marks.error} ${AI_UX_CONFIG.labels.missingModel}`;
      return;
    }

    const currentNode = _model.nodes[session.state.nodeId];
    if (!currentNode?.text) {
      aiOutput.textContent = `${AI_UX_CONFIG.ui.marks.error} ${AI_UX_CONFIG.labels.missingText}`;
      return;
    }

    // Disable buttons during generation
    generateNextNodeBtn.disabled = true;
    paraphraseCurrentBtn.disabled = true;
    aiOutput.textContent = AI_UX_CONFIG.labels.paraphrasing;

    try {
      const { paraphrases, durationSec } = await aiParaphrase({
        text: currentNode.text,
        options: {
          variantCount: AI_UX_CONFIG.paraphrase.variantCount,
          style: AI_UX_CONFIG.paraphrase.style,
          tone: AI_UX_CONFIG.paraphrase.tone,
        },
        aiConfig,
        providerValue: aiProvider.value,
      })

      renderResultAsVariants({
        title: AI_UX_CONFIG.labels.paraphraseTitle,
        variants: paraphrases,
        durationSec,
        type: 'paraphrase',
      })
      Logger.info('AI paraphrase completed', { duration: durationSec, provider: aiConfig.provider, variantCount: paraphrases.length });
    } catch (error) {
      console.error('言い換えエラー:', error);
      const errorMsg = error.message.includes('API error') 
        ? `${AI_UX_CONFIG.labels.apiErrorPrefix}${error.message}\n${AI_UX_CONFIG.labels.apiKeyCheckHint}`
        : `${AI_UX_CONFIG.labels.paraphraseFailedPrefix}${error.message}`;
      aiOutput.textContent = `${AI_UX_CONFIG.ui.marks.error} ${errorMsg}`;
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
      resetAIProvider();
    });

    saveAiSettings.addEventListener('click', () => {
      aiConfig.provider = aiProvider.value;
      if (aiProvider.value === 'openai') {
        aiConfig.openai.apiKey = openaiApiKey.value;
        aiConfig.openai.model = openaiModel.value;
        if (!aiConfig.openai.apiKey) {
          aiOutput.textContent = AI_UX_CONFIG.labels.missingApiKeyInput;
          return;
        }
      }
      // Save to localStorage
      localStorage.setItem(AI_UX_CONFIG.storageKeys.aiConfig, JSON.stringify(aiConfig));
      aiOutput.textContent = AI_UX_CONFIG.labels.settingsSaved;
      resetAIProvider();
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

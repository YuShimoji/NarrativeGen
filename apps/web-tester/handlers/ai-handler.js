// AI provider and generation handlers

import { createAIProvider } from '@narrativegen/engine-ts/dist/browser.js'
import { AI_UX_CONFIG } from '../utils/ai-ux-config.js'

let aiProviderInstance = null

function getErrorMessage(error) {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function ensureAiProvider({ aiConfig, providerValue }) {
  if (!providerValue) {
    throw new Error(AI_UX_CONFIG.labels.missingProviderValue)
  }

  if (!aiProviderInstance || aiConfig?.provider !== providerValue) {
    if (providerValue === 'openai') {
      if (!aiConfig?.openai?.apiKey) {
        throw new Error(AI_UX_CONFIG.labels.missingApiKey)
      }
      aiProviderInstance = createAIProvider({
        provider: 'openai',
        openai: aiConfig.openai,
      })
    } else {
      aiProviderInstance = createAIProvider({ provider: 'mock' })
    }
  }
}

export async function aiGenerateNextNode({
  context,
  aiConfig,
  providerValue,
}) {
  await ensureAiProvider({ aiConfig, providerValue })
  const startTime = Date.now()
  try {
    const generatedText = await aiProviderInstance.generateNextNode(context)
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2)
    return { generatedText, durationSec }
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

export async function aiParaphrase({
  text,
  options,
  aiConfig,
  providerValue,
}) {
  await ensureAiProvider({ aiConfig, providerValue })
  const startTime = Date.now()
  try {
    const paraphrases = await aiProviderInstance.paraphrase(text, options)
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2)
    return { paraphrases, durationSec }
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

export function resetAIProvider() {
  aiProviderInstance = null
}

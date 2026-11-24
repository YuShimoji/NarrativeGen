import { generateStory } from '@narrativegen/engine-ts/browser'

self.addEventListener('message', ({ data: premise }) => {
  try {
    self.postMessage({ story: generateStory(premise) })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) })
  }
})

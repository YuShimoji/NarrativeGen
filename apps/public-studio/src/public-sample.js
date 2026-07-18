import canonicalSample from '../../../models/examples/procedural-choice-spine-probe.json'

const publicChoiceCopy = {
  ask_mira_reframe: 'ミラに書庫の記憶と照合してもらう',
  treat_as_old_clue: '古い手掛かりとして扱い、調査を終える',
  follow_semantic_change: '記録の矛盾を追って台帳へ進む',
}

export function cloneValue(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value))
}

export function createPublicSample() {
  const model = cloneValue(canonicalSample)

  for (const node of Object.values(model.nodes)) {
    for (const choice of node.choices ?? []) {
      if (publicChoiceCopy[choice.id]) {
        choice.text = publicChoiceCopy[choice.id]
      }
    }
  }

  return model
}

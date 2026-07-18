function issue(severity, message, nodeId = null) {
  return { severity, message, nodeId }
}

export function hasModelShape(model) {
  return Boolean(
    model &&
      typeof model === 'object' &&
      typeof model.startNode === 'string' &&
      model.nodes &&
      typeof model.nodes === 'object' &&
      !Array.isArray(model.nodes),
  )
}

export function validateDraft(model) {
  const issues = []

  if (!hasModelShape(model)) {
    return [issue('error', 'モデルにstartNodeまたはnodesがありません。')]
  }

  const nodeIds = Object.keys(model.nodes)
  if (nodeIds.length === 0) {
    issues.push(issue('error', 'ノードが1件もありません。'))
    return issues
  }

  if (!model.nodes[model.startNode]) {
    issues.push(issue('error', `開始ノード「${model.startNode}」が見つかりません。`))
  }

  const incoming = new Set([model.startNode])

  for (const [nodeId, node] of Object.entries(model.nodes)) {
    if (!node || typeof node !== 'object') {
      issues.push(issue('error', `ノード「${nodeId}」の内容が不正です。`, nodeId))
      continue
    }

    if (node.id !== nodeId) {
      issues.push(issue('warning', `ノードキーとidが一致していません: ${nodeId}`, nodeId))
    }

    if (typeof node.text !== 'string' || node.text.trim() === '') {
      issues.push(issue('warning', `ノード「${nodeId}」の本文が空です。`, nodeId))
    }

    if (node.choices != null && !Array.isArray(node.choices)) {
      issues.push(issue('error', `ノード「${nodeId}」のchoicesは配列ではありません。`, nodeId))
      continue
    }

    for (const [index, choice] of (node.choices ?? []).entries()) {
      if (!choice || typeof choice !== 'object') {
        issues.push(issue('error', `ノード「${nodeId}」の選択肢${index + 1}が不正です。`, nodeId))
        continue
      }
      if (typeof choice.text !== 'string' || choice.text.trim() === '') {
        issues.push(issue('error', `ノード「${nodeId}」の選択肢${index + 1}の表示文が空です。`, nodeId))
      }
      if (typeof choice.target !== 'string' || choice.target.trim() === '') {
        issues.push(issue('error', `ノード「${nodeId}」の選択肢${index + 1}に遷移先がありません。`, nodeId))
      } else if (!model.nodes[choice.target]) {
        issues.push(issue('error', `遷移先「${choice.target}」が見つかりません。`, nodeId))
      } else {
        incoming.add(choice.target)
      }
    }
  }

  for (const nodeId of nodeIds) {
    if (!incoming.has(nodeId)) {
      issues.push(issue('info', `ノード「${nodeId}」には他のノードからの入口がありません。`, nodeId))
    }
  }

  return issues
}

export function validationCounts(issues) {
  return issues.reduce(
    (counts, item) => {
      counts[item.severity] += 1
      return counts
    },
    { error: 0, warning: 0, info: 0 },
  )
}

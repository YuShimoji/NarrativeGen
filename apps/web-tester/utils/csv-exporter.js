// CSV Exporter for NarrativeGen web-tester
// Export-only utilities to avoid coupling with UI internals

export function exportModelToCsv(model, currentModelName = 'model') {
  if (!model || !model.nodes) {
    throw new Error('有効なモデルが必要です')
  }

  const header = [
    'node_id', 'node_text', 'node_type', 'node_tags', 'node_assets', 'node_group',
    'choice_id', 'choice_text', 'choice_target',
    'choice_conditions', 'choice_effects', 'choice_outcome_type', 'choice_outcome_value',
    'choice_metadata', 'choice_variables',
    'initial_flags', 'initial_resources', 'global_metadata'
  ]
  const rows = [header.join(',')]

  let firstRow = true
  for (const [nid, node] of Object.entries(model.nodes)) {
    const initialFlags = firstRow && model.flags ? serializeKeyValuePairs(model.flags) : ''
    const initialResources = firstRow && model.resources ? serializeKeyValuePairs(model.resources) : ''
    const globalMetadata = firstRow && model.metadata ? serializeKeyValuePairs(model.metadata) : ''
    firstRow = false

    const nodeType = node.type || 'normal'
    const nodeTags = node.tags ? node.tags.join(';') : ''
    const nodeAssets = node.assets ? serializeKeyValuePairs(node.assets) : ''
    const nodeGroup = node.group || ''

    if (!node.choices || node.choices.length === 0) {
      rows.push([
        nid, escapeCsv(node.text ?? ''), nodeType, escapeCsv(nodeTags), escapeCsv(nodeAssets), escapeCsv(nodeGroup),
        '', '', '',
        '', '', '', '',
        '', '',
        initialFlags, initialResources, globalMetadata
      ].join(','))
      continue
    }

    for (const ch of node.choices) {
      const conditions = ch.conditions ? serializeConditions(ch.conditions) : ''
      const effects = ch.effects ? serializeEffects(ch.effects) : ''
      const outcomeType = ch.outcome?.type || ''
      const outcomeValue = ch.outcome?.value || ''
      const choiceMetadata = ch.metadata ? serializeKeyValuePairs(ch.metadata) : ''
      const choiceVariables = ch.variables ? serializeKeyValuePairs(ch.variables) : ''

      rows.push([
        nid, escapeCsv(node.text ?? ''), nodeType, escapeCsv(nodeTags), escapeCsv(nodeAssets), escapeCsv(nodeGroup),
        ch.id ?? '', escapeCsv(ch.text ?? ''), ch.target ?? '',
        escapeCsv(conditions), escapeCsv(effects), outcomeType, outcomeValue,
        escapeCsv(choiceMetadata), escapeCsv(choiceVariables),
        initialFlags, initialResources, globalMetadata
      ].join(','))
    }
  }

  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (currentModelName ? String(currentModelName).replace(/\.[^.]+$/, '') : 'model') + '.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function serializeKeyValuePairs(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join(';')
}

function serializeConditions(conditions) {
  return conditions.map((cond) => {
    if (cond.type === 'flag') return `flag:${cond.key}=${cond.value}`
    if (cond.type === 'resource') return `resource:${cond.key}${cond.op}${cond.value}`
    if (cond.type === 'timeWindow') return `timeWindow:${cond.start}-${cond.end}`
    return ''
  }).filter(Boolean).join(';')
}

function serializeEffects(effects) {
  return effects.map((eff) => {
    if (eff.type === 'setFlag') return `setFlag:${eff.key}=${eff.value}`
    if (eff.type === 'addResource') return `addResource:${eff.key}=${eff.delta}`
    if (eff.type === 'multiplyResource') return `multiplyResource:${eff.key}=${eff.factor}`
    if (eff.type === 'setResource') return `setResource:${eff.key}=${eff.value}`
    if (eff.type === 'randomEffect') {
      const effectStrings = eff.effects.map(e => serializeEffects([e])[0])
      return `randomEffect:${effectStrings.join('|')}`
    }
    if (eff.type === 'conditionalEffect') {
      const conditionStr = serializeConditions([eff.condition])[0]
      const effectStr = serializeEffects([eff.effect])[0]
      return `conditionalEffect:${conditionStr}?${effectStr}`
    }
    if (eff.type === 'goto') return `goto:${eff.target}`
    return ''
  }).filter(Boolean).join(';')
}

function escapeCsv(s) {
  if (s == null) return ''
  const needsQuote = /[",\n]/.test(s)
  const t = String(s).replace(/"/g, '""')
  return needsQuote ? '"' + t + '"' : t
}

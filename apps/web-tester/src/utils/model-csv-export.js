const CSV_HEADERS = [
  'id',
  'speaker',
  'text',
  'choices',
  'model_type',
  'start_node',
  'initial_flags',
  'initial_resources',
  'initial_variables',
  'settings_presentation',
]

function csvCell(value) {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function flattenText(value) {
  return String(value ?? '').replace(/\s*\r?\n\s*/g, ' ').trim()
}

function encodeKeyValuePairs(values) {
  if (!values || typeof values !== 'object') return ''
  return Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join(';')
}

function sortNodeIds(model) {
  return Object.keys(model.nodes || {}).sort((a, b) => {
    if (a === model.startNode) return -1
    if (b === model.startNode) return 1
    return a.localeCompare(b)
  })
}

export function formatCsvModel(model) {
  if (!model || !model.nodes) {
    return `${CSV_HEADERS.join(',')}\n`
  }

  const rows = [CSV_HEADERS.join(',')]
  const nodeIds = sortNodeIds(model)

  nodeIds.forEach((nodeId, index) => {
    const node = model.nodes[nodeId] || {}
    const isFirstRow = index === 0
    const settingsPresentation = isFirstRow && model.settings?.presentation
      ? JSON.stringify(model.settings.presentation)
      : ''

    const row = [
      node.id || nodeId,
      node.speaker || '',
      // The current CSV parser is line-oriented, so exported prose uses spaces
      // instead of embedded newlines until multiline CSV parsing is added.
      flattenText(node.text),
      JSON.stringify(node.choices || []),
      isFirstRow ? (model.modelType || 'adventure-playthrough') : '',
      isFirstRow ? (model.startNode || nodeId) : '',
      isFirstRow ? encodeKeyValuePairs(model.flags) : '',
      isFirstRow ? encodeKeyValuePairs(model.resources) : '',
      isFirstRow ? encodeKeyValuePairs(model.variables) : '',
      settingsPresentation,
    ]

    rows.push(row.map(csvCell).join(','))
  })

  return `${rows.join('\n')}\n`
}


// Model loading and utility functions

// Utility function for resolving variables in text (browser-compatible)
export function resolveVariables(text, sessionState, model) {
  if (!text || !sessionState) return text
  
  let resolved = text
  
  // Replace flag variables: {flag:key}
  Object.entries(sessionState.flags || {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{flag:${key}\\}`, 'g'), value ? 'true' : 'false')
  })
  
  // Replace resource variables: {resource:key}
  Object.entries(sessionState.resources || {}).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{resource:${key}\\}`, 'g'), String(value))
  })
  
  // Replace node ID variable: {nodeId}
  resolved = resolved.replace(/\{nodeId\}/g, sessionState.nodeId)
  
  // Replace time variable: {time}
  resolved = resolved.replace(/\{time\}/g, String(sessionState.time))
  
  return resolved
}

// Browser-compatible model loading (no fs module)
export async function loadModel(modelName) {
  const url = `./models/examples/${modelName}.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load model: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export async function loadCustomModel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result)
        resolve(json)
      } catch (err) {
        reject(new Error('JSON の解析に失敗しました'))
      }
    }
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}

export async function loadSampleModel(sampleId) {
  // Use fetch with relative path for local models directory
  const url = `./models/examples/${sampleId}.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`モデルの読み込みに失敗しました (${response.status})`)
  }
  return response.json()
}

export async function loadEntitiesCatalog() {
  // Use fetch with relative path for local models directory
  const url = './models/entities/Entities.csv'
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Entities.csv の読み込みに失敗しました (${response.status})`)
  }
  const text = await response.text()
  return parseEntitiesCsv(text)
}

function parseEntitiesCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length <= 1) {
    return []
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const idx = {
    id: headers.indexOf('id'),
    brand: headers.indexOf('brand'),
    description: headers.indexOf('description'),
    cost: headers.indexOf('cost'),
  }

  return lines.slice(1)
    .map((line) => line.split(',').map((cell) => cell.trim()))
    .filter((cells) => cells[idx.id])
    .map((cells) => ({
      id: cells[idx.id] ?? '',
      brand: cells[idx.brand] ?? '',
      description: cells[idx.description] ?? '',
      cost: Number.parseFloat(cells[idx.cost] ?? '0') || 0,
    }))
}

// モデル検証
export function validateModel(nodes) {
  const errors = []
  const nodeIds = Object.keys(nodes)

  for (const [nid, node] of Object.entries(nodes)) {
    // ノードIDの妥当性チェック
    if (!nid || nid.trim() === '') {
      errors.push(`ノードIDが空です`)
      continue
    }

    // ノードテキストの存在チェック
    if (!node.text || node.text.trim() === '') {
      errors.push(`ノード'${nid}'のテキストが空です`)
    }

    // 選択肢のチェック
    for (const choice of node.choices || []) {
      // 選択肢IDのチェック
      if (!choice.id || choice.id.trim() === '') {
        errors.push(`ノード'${nid}'の選択肢にIDがありません`)
      }

      // 選択肢テキストのチェック
      if (!choice.text || choice.text.trim() === '') {
        errors.push(`ノード'${nid}'の選択肢'${choice.id}'のテキストが空です`)
      }

      // ターゲットノードの存在チェック
      if (!choice.target || !nodeIds.includes(choice.target)) {
        errors.push(`ノード'${nid}'の選択肢'${choice.id}': 存在しないターゲット'${choice.target}'`)
      }

      // outcomeの妥当性チェック
      if (choice.outcome) {
        if (!choice.outcome.type) {
          errors.push(`ノード'${nid}'の選択肢'${choice.id}': outcomeタイプが指定されていません`)
        } else if (['ADD_ITEM', 'REMOVE_ITEM'].includes(choice.outcome.type)) {
          if (!choice.outcome.value || choice.outcome.value.trim() === '') {
            errors.push(`ノード'${nid}'の選択肢'${choice.id}': ${choice.outcome.type}の値が空です`)
          }
        }
      }
    }
  }

  return errors
}

export function formatChoiceLabel(choice) {
  if (choice?.outcome) {
    return `${choice.text} (${choice.outcome.type}: ${choice.outcome.value})`
  }
  return choice?.text ?? '(不明な選択肢)'
}


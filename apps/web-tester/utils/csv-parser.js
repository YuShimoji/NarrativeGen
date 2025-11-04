// CSV parsing utilities

export function parseCsvLine(line, delim) {
  const cells = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delim && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

// キー=値ペアのパース（セミコロン区切り）
export function parseKeyValuePairs(text, type = 'string') {
  const result = {}
  text.split(';').forEach((pair) => {
    const [key, val] = pair.split('=').map((s) => s.trim())
    if (!key || val === undefined) return
    if (type === 'boolean') {
      result[key] = val.toLowerCase() === 'true'
    } else if (type === 'number') {
      result[key] = parseFloat(val)
    } else {
      result[key] = val
    }
  })
  return result
}

// 条件のパース
export function parseConditions(text) {
  const conditions = []
  text.split(';').forEach((cond) => {
    cond = cond.trim()
    if (!cond) return
    
    if (cond.startsWith('flag:')) {
      const [key, val] = cond.slice(5).split('=')
      conditions.push({ type: 'flag', key: key.trim(), value: val.trim().toLowerCase() === 'true' })
    } else if (cond.startsWith('resource:')) {
      const match = cond.slice(9).match(/^(\w+)(>=|<=|>|<|==)(.+)$/)
      if (!match) throw new Error(`不正なリソース条件: ${cond}`)
      conditions.push({ type: 'resource', key: match[1].trim(), op: match[2], value: parseFloat(match[3]) })
    } else if (cond.startsWith('timeWindow:')) {
      const [start, end] = cond.slice(11).split('-').map((s) => parseInt(s.trim()))
      conditions.push({ type: 'timeWindow', start, end })
    } else {
      throw new Error(`不明な条件タイプ: ${cond}`)
    }
  })
  return conditions
}

// 効果のパース
export function parseEffects(text) {
  const effects = []
  text.split(';').forEach((eff) => {
    eff = eff.trim()
    if (!eff) return
    
    if (eff.startsWith('setFlag:')) {
      const [key, val] = eff.slice(8).split('=')
      effects.push({ type: 'setFlag', key: key.trim(), value: val.trim().toLowerCase() === 'true' })
    } else if (eff.startsWith('addResource:')) {
      const [key, val] = eff.slice(12).split('=')
      effects.push({ type: 'addResource', key: key.trim(), delta: parseFloat(val) })
    } else if (eff.startsWith('multiplyResource:')) {
      const [key, val] = eff.slice(16).split('=')
      effects.push({ type: 'multiplyResource', key: key.trim(), factor: parseFloat(val) })
    } else if (eff.startsWith('setResource:')) {
      const [key, val] = eff.slice(12).split('=')
      effects.push({ type: 'setResource', key: key.trim(), value: parseFloat(val) })
    } else if (eff.startsWith('randomEffect:')) {
      const effectList = eff.slice(12).split('|').map(e => e.trim())
      const parsedEffects = effectList.map(e => parseEffects(e)[0]).filter(Boolean)
      effects.push({ type: 'randomEffect', effects: parsedEffects })
    } else if (eff.startsWith('conditionalEffect:')) {
      const parts = eff.slice(17).split('?')
      if (parts.length === 2) {
        const condition = parseConditions(parts[0])[0]
        const effectText = parts[1]
        const effect = parseEffects(effectText)[0]
        if (condition && effect) {
          effects.push({ type: 'conditionalEffect', condition, effect })
        }
      }
    } else if (eff.startsWith('goto:')) {
      effects.push({ type: 'goto', target: eff.slice(5).trim() })
    } else {
      throw new Error(`不明な効果タイプ: ${eff}`)
    }
  })
  return effects
}

export function serializeConditions(conditions) {
  if (!conditions || conditions.length === 0) return ''
  return conditions.map(cond => {
    if (cond.type === 'flag') {
      return `flag:${cond.key}=${cond.value}`
    } else if (cond.type === 'resource') {
      return `resource:${cond.key}${cond.op}${cond.value}`
    } else if (cond.type === 'timeWindow') {
      return `timeWindow:${cond.start}-${cond.end}`
    }
    return ''
  }).filter(Boolean).join('; ')
}

export function serializeEffects(effects) {
  if (!effects || effects.length === 0) return ''
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
  }).filter(Boolean).join('; ')
}

export function serializeKeyValuePairs(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join(';')
}

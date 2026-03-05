/**
 * ConditionEffectEditor - 条件/効果の構造化エディタ
 * 
 * 選択肢の条件(conditions)と効果(effects)を構造化されたUIで編集できるようにします。
 */

import Logger from '../core/logger.js'

/**
 * 条件の種類
 */
export const ConditionTypes = {
  FLAG: 'flag',           // フラグ条件: flag:name=value
  RESOURCE: 'resource',   // リソース条件: resource:name>=value
  VARIABLE: 'variable',   // 変数条件: variable:name=value
  TIME_WINDOW: 'timeWindow', // 時間窓条件: time:start-end
  VISITED: 'visited',     // 訪問条件: visited:nodeId
  NOT_VISITED: 'notVisited' // 未訪問条件: notVisited:nodeId
}

/**
 * 効果の種類
 */
export const EffectTypes = {
  SET_FLAG: 'setFlag',        // フラグ設定: setFlag:name=value
  ADD_RESOURCE: 'addResource', // リソース加算: addResource:name=value
  SET_VARIABLE: 'setVariable',  // 変数設定: setVariable:name=value
  GOTO: 'goto' // 遷移: goto:target
}

/**
 * 比較演算子
 */
export const Operators = {
  EQUALS: '=',
  NOT_EQUALS: '!=',
  GREATER_THAN: '>',
  GREATER_EQUALS: '>=',
  LESS_THAN: '<',
  LESS_EQUALS: '<='
}

/**
 * 条件/効果エディタクラス
 */
export class ConditionEffectEditor {
  constructor() {
    this.onChangeCallback = null
  }

  _escapeAttr(value) {
    if (value === null || value === undefined) return ''
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  /**
   * 変更時のコールバックを設定
   */
  setOnChange(callback) {
    this.onChangeCallback = callback
  }

  /**
   * 条件エディタのHTMLを生成
   */
  renderConditionsEditor(conditions = [], nodeId, choiceIndex) {
    const conditionsArray = Array.isArray(conditions) ? conditions : []
    
    return `
      <div class="conditions-editor" data-node-id="${nodeId}" data-choice-index="${choiceIndex}">
        <div class="editor-header">
          <span class="editor-label">条件</span>
          <button type="button" class="add-condition-btn btn-small" data-node-id="${nodeId}" data-choice-index="${choiceIndex}">+ 追加</button>
        </div>
        <div class="conditions-list">
          ${conditionsArray.length === 0 
            ? '<span class="empty-hint">条件なし</span>' 
            : conditionsArray.map((cond, i) => this._renderConditionItem(cond, nodeId, choiceIndex, i)).join('')
          }
        </div>
      </div>
    `
  }

  /**
   * 効果エディタのHTMLを生成
   */
  renderEffectsEditor(effects = [], nodeId, choiceIndex) {
    const effectsArray = Array.isArray(effects) ? effects : []
    
    return `
      <div class="effects-editor" data-node-id="${nodeId}" data-choice-index="${choiceIndex}">
        <div class="editor-header">
          <span class="editor-label">効果</span>
          <button type="button" class="add-effect-btn btn-small" data-node-id="${nodeId}" data-choice-index="${choiceIndex}">+ 追加</button>
        </div>
        <div class="effects-list">
          ${effectsArray.length === 0 
            ? '<span class="empty-hint">効果なし</span>' 
            : effectsArray.map((eff, i) => this._renderEffectItem(eff, nodeId, choiceIndex, i)).join('')
          }
        </div>
      </div>
    `
  }

  /**
   * 条件アイテムのHTMLを生成
   */
  _renderConditionItem(condition, nodeId, choiceIndex, condIndex) {
    const parsed = this._parseCondition(condition)
    const isRaw = parsed.type === 'raw'
    const isFlag = parsed.type === 'flag'
    const isTimeWindow = parsed.type === 'timeWindow'
    const operatorHidden = isRaw || isFlag || isTimeWindow

    const operatorOptions = (() => {
      if (parsed.type === 'resource') {
        return `
          <option value="=" ${parsed.operator === '=' ? 'selected' : ''}>=</option>
          <option value=">" ${parsed.operator === '>' ? 'selected' : ''}>&gt;</option>
          <option value=">=" ${parsed.operator === '>=' ? 'selected' : ''}>&gt;=</option>
          <option value="<" ${parsed.operator === '<' ? 'selected' : ''}>&lt;</option>
          <option value="<=" ${parsed.operator === '<=' ? 'selected' : ''}>&lt;=</option>
        `
      }

      if (parsed.type === 'variable') {
        return `
          <option value="=" ${parsed.operator === '=' ? 'selected' : ''}>=</option>
          <option value="!=" ${parsed.operator === '!=' ? 'selected' : ''}>!=</option>
          <option value="contains" ${parsed.operator === 'contains' ? 'selected' : ''}>contains</option>
          <option value="!contains" ${parsed.operator === '!contains' ? 'selected' : ''}>!contains</option>
        `
      }

      return `
        <option value="=" ${parsed.operator === '=' ? 'selected' : ''}>=</option>
      `
    })()
    
    return `
      <div class="condition-item" data-condition-index="${condIndex}">
        <select class="condition-type" data-field="type">
          <option value="flag" ${parsed.type === 'flag' ? 'selected' : ''}>フラグ</option>
          <option value="resource" ${parsed.type === 'resource' ? 'selected' : ''}>リソース</option>
          <option value="variable" ${parsed.type === 'variable' ? 'selected' : ''}>変数</option>
          <option value="timeWindow" ${parsed.type === 'timeWindow' ? 'selected' : ''}>時間窓</option>
          <option value="raw" ${parsed.type === 'raw' ? 'selected' : ''}>カスタム</option>
        </select>
        <input type="text" class="condition-raw" placeholder="条件(生)" value="${this._escapeAttr(parsed.rawText)}" data-field="raw" ${isRaw ? '' : 'style="display:none"'}>
        <input type="text" class="condition-name" placeholder="名前" value="${this._escapeAttr(parsed.name)}" data-field="name" ${isRaw ? 'style="display:none"' : ''}>
        <select class="condition-operator" data-field="operator" ${operatorHidden ? 'style="display:none"' : ''}>
          ${operatorOptions}
        </select>
        <input type="text" class="condition-value" placeholder="値" value="${this._escapeAttr(parsed.value)}" data-field="value" ${isRaw ? 'style="display:none"' : ''}>
        <button type="button" class="delete-condition-btn btn-icon" data-node-id="${nodeId}" data-choice-index="${choiceIndex}" data-condition-index="${condIndex}">×</button>
      </div>
    `
  }

  /**
   * 効果アイテムのHTMLを生成
   */
  _renderEffectItem(effect, nodeId, choiceIndex, effectIndex) {
    const parsed = this._parseEffect(effect)
    const isGoto = parsed.type === 'goto'
    const isRaw = parsed.type === 'raw'
    
    return `
      <div class="effect-item" data-effect-index="${effectIndex}">
        <select class="effect-type" data-field="type">
          <option value="setFlag" ${parsed.type === 'setFlag' ? 'selected' : ''}>フラグ設定</option>
          <option value="addResource" ${parsed.type === 'addResource' ? 'selected' : ''}>リソース加算</option>
          <option value="setVariable" ${parsed.type === 'setVariable' ? 'selected' : ''}>変数設定</option>
          <option value="goto" ${parsed.type === 'goto' ? 'selected' : ''}>遷移</option>
          <option value="raw" ${parsed.type === 'raw' ? 'selected' : ''}>カスタム</option>
        </select>
        <input type="text" class="effect-raw" placeholder="効果(生)" value="${this._escapeAttr(parsed.rawText)}" data-field="raw" ${isRaw ? '' : 'style="display:none"'}>
        <input type="text" class="effect-name" placeholder="名前" value="${this._escapeAttr(parsed.name)}" data-field="name" ${isRaw ? 'style="display:none"' : ''}>
        <span class="effect-equals" ${(isGoto || isRaw) ? 'style="display:none"' : ''}>=</span>
        <input type="text" class="effect-value" placeholder="値" value="${this._escapeAttr(parsed.value)}" data-field="value" ${(isGoto || isRaw) ? 'style="display:none"' : ''}>
        <button type="button" class="delete-effect-btn btn-icon" data-node-id="${nodeId}" data-choice-index="${choiceIndex}" data-effect-index="${effectIndex}">×</button>
      </div>
    `
  }

  /**
   * 条件文字列をパース
   */
  _parseCondition(conditionStr) {
    if (!conditionStr) {
      return { type: 'flag', name: '', operator: '=', value: '', rawText: '' }
    }

    // Structured object support (engine-compatible)
    if (typeof conditionStr === 'object') {
      const type = conditionStr.type
      if (type === 'flag') {
        return { type: 'flag', name: conditionStr.key ?? conditionStr.flag ?? '', operator: '=', value: String(conditionStr.value ?? true), rawText: '' }
      }
      if (type === 'resource') {
        const op = conditionStr.op === '==' ? '=' : (conditionStr.op ?? '>=')
        return { type: 'resource', name: conditionStr.key ?? '', operator: op, value: String(conditionStr.value ?? 0), rawText: '' }
      }
      if (type === 'variable') {
        const op = conditionStr.op === '==' ? '=' : (conditionStr.op ?? '==')
        return { type: 'variable', name: conditionStr.key ?? '', operator: op, value: String(conditionStr.value ?? ''), rawText: '' }
      }
      if (type === 'timeWindow') {
        return { type: 'timeWindow', name: String(conditionStr.start ?? 0), operator: '-', value: String(conditionStr.end ?? 0), rawText: '' }
      }

      if (type === 'and' || type === 'or' || type === 'not') {
        return { type: 'raw', name: '', operator: '=', value: '', rawText: JSON.stringify(conditionStr) }
      }

      // Unknown object type
      return { type: 'raw', name: '', operator: '=', value: '', rawText: JSON.stringify(conditionStr) }
    }

    if (typeof conditionStr !== 'string') {
      return { type: 'raw', name: '', operator: '=', value: '', rawText: String(conditionStr) }
    }

    if (/^(visited|notVisited):/.test(conditionStr)) {
      return { type: 'raw', name: '', operator: '=', value: '', rawText: conditionStr }
    }

    // Pattern: type:name[operator]value
    const patterns = [
      { regex: /^(flag|variable):(\w+)(=|!=|>=|<=|>|<)(.+)$/, type: null },
      { regex: /^(resource):(\w+)(=|!=|>=|<=|>|<)(.+)$/, type: null },
      { regex: /^(time|timeWindow):(\d+)-(\d+)$/, type: 'timeWindow', timeWindow: true },
      { regex: /^(visited|notVisited):(.+)$/, type: null, noValue: true }
    ]

    for (const pattern of patterns) {
      const match = conditionStr.match(pattern.regex)
      if (match) {
        if (pattern.timeWindow) {
          return { type: 'timeWindow', name: match[2], operator: '-', value: match[3], rawText: '' }
        }
        if (pattern.noValue) {
          return { type: 'raw', name: '', operator: '=', value: '', rawText: conditionStr }
        }
        return { type: match[1], name: match[2], operator: match[3], value: match[4], rawText: '' }
      }
    }

    return { type: 'raw', name: '', operator: '=', value: '', rawText: conditionStr }
  }

  /**
   * 効果文字列をパース
   */
  _parseEffect(effectStr) {
    if (!effectStr) {
      return { type: 'setFlag', name: '', value: '', rawText: '' }
    }

    // Structured object support (engine-compatible)
    if (typeof effectStr === 'object') {
      const type = effectStr.type
      if (type === 'setFlag') {
        return { type: 'setFlag', name: effectStr.key ?? effectStr.flag ?? '', value: String(effectStr.value ?? true), rawText: '' }
      }
      if (type === 'addResource') {
        return { type: 'addResource', name: effectStr.key ?? '', value: String(effectStr.delta ?? 0), rawText: '' }
      }
      if (type === 'setVariable') {
        return { type: 'setVariable', name: effectStr.key ?? '', value: String(effectStr.value ?? ''), rawText: '' }
      }
      if (type === 'goto') {
        return { type: 'goto', name: effectStr.target ?? '', value: '', rawText: '' }
      }

      // Unknown object type
      return { type: 'raw', name: '', value: '', rawText: JSON.stringify(effectStr) }
    }

    if (typeof effectStr !== 'string') {
      return { type: 'raw', name: '', value: '', rawText: String(effectStr) }
    }

    if (/^setResource:/.test(effectStr)) {
      return { type: 'raw', name: '', value: '', rawText: effectStr }
    }

    // Pattern: type:name=value
    const match = effectStr.match(/^(setFlag|addResource|setVariable):(\w+)=(.+)$/)
    if (match) {
      return { type: match[1], name: match[2], value: match[3], rawText: '' }
    }

    const gotoMatch = effectStr.match(/^(goto):(.+)$/)
    if (gotoMatch) {
      return { type: 'goto', name: gotoMatch[2], value: '', rawText: '' }
    }

    return { type: 'raw', name: '', value: '', rawText: effectStr }
  }

  /**
   * 条件を文字列に変換
   */
  buildConditionString(type, name, operator, value) {
    if (!name) return null
    
    if (type === 'visited' || type === 'notVisited') {
      return `${type}:${name}`
    }

    if (type === 'timeWindow') {
      return `time:${name}-${value}`
    }
    
    return `${type}:${name}${operator}${value}`
  }

  /**
   * 効果を文字列に変換
   */
  buildEffectString(type, name, value) {
    if (!name) return null
    if (type === 'goto') {
      return `${type}:${name}`
    }
    return `${type}:${name}=${value}`
  }

  _parseBoolean(value) {
    if (typeof value === 'boolean') return value
    if (value === null || value === undefined) return false
    const v = String(value).trim().toLowerCase()
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true
    if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false
    return Boolean(v)
  }

  buildConditionObject(type, name, operator, value) {
    if (!name) return null

    if (type === 'visited' || type === 'notVisited') {
      return this.buildConditionString(type, name, operator, value)
    }

    if (type === 'timeWindow') {
      const start = Number(name)
      const end = Number(value)
      if (Number.isFinite(start) && Number.isFinite(end)) {
        return { type: 'timeWindow', start, end }
      }
      return this.buildConditionString(type, name, operator, value)
    }

    if (type === 'flag') {
      return { type: 'flag', key: name, value: this._parseBoolean(value) }
    }

    if (type === 'resource') {
      const n = Number(value)
      const op = operator === '=' ? '==' : operator
      if (!Number.isFinite(n)) return null
      return { type: 'resource', key: name, op, value: n }
    }

    if (type === 'variable') {
      const op = operator === '=' ? '==' : operator
      return { type: 'variable', key: name, op, value: String(value ?? '') }
    }

    return this.buildConditionString(type, name, operator, value)
  }

  buildEffectObject(type, name, value) {
    if (!name) return null

    if (type === 'setFlag') {
      return { type: 'setFlag', key: name, value: this._parseBoolean(value) }
    }

    if (type === 'addResource') {
      const delta = Number(value)
      if (!Number.isFinite(delta)) return null
      return { type: 'addResource', key: name, delta }
    }

    if (type === 'setVariable') {
      return { type: 'setVariable', key: name, value: String(value ?? '') }
    }

    if (type === 'goto') {
      return { type: 'goto', target: String(name ?? '') }
    }

    return this.buildEffectString(type, name, value)
  }

  parseConditionInput(input) {
    if (!input) return null
    if (typeof input === 'object') return input
    if (typeof input !== 'string') return null

    const text = input.trim()
    if (!text) return null

    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text)
        if (parsed && typeof parsed === 'object') return parsed
      } catch {
        // ignore
      }
    }

    const timeMatch = text.match(/^(time|timeWindow):(\d+)-(\d+)$/)
    if (timeMatch) {
      return { type: 'timeWindow', start: Number(timeMatch[2]), end: Number(timeMatch[3]) }
    }

    const flagMatch = text.match(/^flag:([^=]+)=(.+)$/)
    if (flagMatch) {
      return { type: 'flag', key: flagMatch[1].trim(), value: this._parseBoolean(flagMatch[2]) }
    }

    const resourceMatch = text.match(/^resource:([^=<>!]+)(>=|<=|==|=|>|<)(.+)$/)
    if (resourceMatch) {
      const op = resourceMatch[2] === '=' ? '==' : resourceMatch[2]
      const n = Number(resourceMatch[3])
      if (!Number.isFinite(n)) return text
      return { type: 'resource', key: resourceMatch[1].trim(), op, value: n }
    }

    const varMatch = text.match(/^variable:([^=<>!]+)(==|=|!=|contains|!contains)(.+)$/)
    if (varMatch) {
      const op = varMatch[2] === '=' ? '==' : varMatch[2]
      return { type: 'variable', key: varMatch[1].trim(), op, value: varMatch[3].trim() }
    }

    // keep unsupported formats as-is (backward compatible)
    return text
  }

  parseEffectInput(input) {
    if (!input) return null
    if (typeof input === 'object') return input
    if (typeof input !== 'string') return null

    const text = input.trim()
    if (!text) return null

    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text)
        if (parsed && typeof parsed === 'object') return parsed
      } catch {
        // ignore
      }
    }

    const setFlagMatch = text.match(/^setFlag:([^=]+)=(.+)$/)
    if (setFlagMatch) {
      return { type: 'setFlag', key: setFlagMatch[1].trim(), value: this._parseBoolean(setFlagMatch[2]) }
    }

    const addResMatch = text.match(/^addResource:([^=]+)=(-?\d+(?:\.\d+)?)$/)
    if (addResMatch) {
      return { type: 'addResource', key: addResMatch[1].trim(), delta: Number(addResMatch[2]) }
    }

    const setVarMatch = text.match(/^setVariable:([^=]+)=(.+)$/)
    if (setVarMatch) {
      return { type: 'setVariable', key: setVarMatch[1].trim(), value: setVarMatch[2] }
    }

    const gotoMatch = text.match(/^goto:(.+)$/)
    if (gotoMatch) {
      return { type: 'goto', target: gotoMatch[1].trim() }
    }

    return text
  }

  /**
   * 新しい条件を作成
   */
  createNewCondition() {
    return { type: 'flag', key: 'newFlag', value: true }
  }

  /**
   * 新しい効果を作成
   */
  createNewEffect() {
    return { type: 'setFlag', key: 'newFlag', value: true }
  }

  /**
   * DOM要素から条件を読み取る
   */
  readConditionFromElement(itemElement) {
    const type = itemElement.querySelector('.condition-type')?.value || 'flag'
    if (type === 'raw') {
      const raw = itemElement.querySelector('.condition-raw')?.value || ''
      return this.parseConditionInput(raw)
    }
    const name = itemElement.querySelector('.condition-name')?.value || ''
    const operator = itemElement.querySelector('.condition-operator')?.value || '='
    const value = itemElement.querySelector('.condition-value')?.value || ''
    
    return this.buildConditionObject(type, name, operator, value)
  }

  /**
   * DOM要素から効果を読み取る
   */
  readEffectFromElement(itemElement) {
    const type = itemElement.querySelector('.effect-type')?.value || 'setFlag'
    if (type === 'raw') {
      const raw = itemElement.querySelector('.effect-raw')?.value || ''
      return this.parseEffectInput(raw)
    }
    const name = itemElement.querySelector('.effect-name')?.value || ''
    const value = itemElement.querySelector('.effect-value')?.value || ''
    
    return this.buildEffectObject(type, name, value)
  }

  /**
   * 条件/効果エディタのイベントリスナーを設定
   */
  setupEventListeners(container, callbacks) {
    if (!container) return

    // 条件タイプ変更時の表示切替
    container.addEventListener('change', (e) => {
      if (e.target.classList.contains('condition-type')) {
        const item = e.target.closest('.condition-item')
        const operatorEl = item.querySelector('.condition-operator')
        const valueEl = item.querySelector('.condition-value')
        const nameEl = item.querySelector('.condition-name')
        const rawEl = item.querySelector('.condition-raw')
        const isRaw = e.target.value === 'raw'
        const isFlag = e.target.value === 'flag'
        const isTimeWindow = e.target.value === 'timeWindow'

        if (rawEl) rawEl.style.display = isRaw ? '' : 'none'
        if (nameEl) nameEl.style.display = isRaw ? 'none' : ''
        if (operatorEl) {
          const currentOp = operatorEl.value || '='
          if (e.target.value === 'resource') {
            operatorEl.innerHTML = `
              <option value="=">=</option>
              <option value=">">&gt;</option>
              <option value=">=">&gt;=</option>
              <option value="<">&lt;</option>
              <option value="<=">&lt;=</option>
            `
          } else if (e.target.value === 'variable') {
            operatorEl.innerHTML = `
              <option value="=">=</option>
              <option value="!=">!=</option>
              <option value="contains">contains</option>
              <option value="!contains">!contains</option>
            `
          } else {
            operatorEl.innerHTML = `<option value="=">=</option>`
          }

          // restore if still valid
          const validOps = Array.from(operatorEl.querySelectorAll('option')).map((o) => o.value)
          operatorEl.value = validOps.includes(currentOp) ? currentOp : '='

          operatorEl.style.display = (isRaw || isFlag || isTimeWindow) ? 'none' : ''
        }
        if (valueEl) valueEl.style.display = isRaw ? 'none' : ''
      }

      if (e.target.classList.contains('effect-type')) {
        const item = e.target.closest('.effect-item')
        const equalsEl = item.querySelector('.effect-equals')
        const valueEl = item.querySelector('.effect-value')
        const isGoto = e.target.value === 'goto'
        const nameEl = item.querySelector('.effect-name')
        const rawEl = item.querySelector('.effect-raw')
        const isRaw = e.target.value === 'raw'

        if (rawEl) rawEl.style.display = isRaw ? '' : 'none'
        if (nameEl) nameEl.style.display = isRaw ? 'none' : ''
        if (equalsEl) equalsEl.style.display = (isGoto || isRaw) ? 'none' : ''
        if (valueEl) valueEl.style.display = (isGoto || isRaw) ? 'none' : ''
      }
    })

    // 追加ボタン
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-condition-btn')) {
        const nodeId = e.target.dataset.nodeId
        const choiceIndex = parseInt(e.target.dataset.choiceIndex)
        if (callbacks.onAddCondition) {
          callbacks.onAddCondition(nodeId, choiceIndex, this.createNewCondition())
        }
      }
      
      if (e.target.classList.contains('add-effect-btn')) {
        const nodeId = e.target.dataset.nodeId
        const choiceIndex = parseInt(e.target.dataset.choiceIndex)
        if (callbacks.onAddEffect) {
          callbacks.onAddEffect(nodeId, choiceIndex, this.createNewEffect())
        }
      }

      if (e.target.classList.contains('delete-condition-btn')) {
        const nodeId = e.target.dataset.nodeId
        const choiceIndex = parseInt(e.target.dataset.choiceIndex)
        const conditionIndex = parseInt(e.target.dataset.conditionIndex)
        if (callbacks.onDeleteCondition) {
          callbacks.onDeleteCondition(nodeId, choiceIndex, conditionIndex)
        }
      }

      if (e.target.classList.contains('delete-effect-btn')) {
        const nodeId = e.target.dataset.nodeId
        const choiceIndex = parseInt(e.target.dataset.choiceIndex)
        const effectIndex = parseInt(e.target.dataset.effectIndex)
        if (callbacks.onDeleteEffect) {
          callbacks.onDeleteEffect(nodeId, choiceIndex, effectIndex)
        }
      }
    })

    // 入力変更時の更新
    container.addEventListener('input', (e) => {
      if (e.target.closest('.condition-item') || e.target.closest('.effect-item')) {
        // Debounce実装は呼び出し側で行う
        if (callbacks.onValueChange) {
          callbacks.onValueChange(e)
        }
      }
    })

    Logger.info('Condition/Effect editor event listeners set up')
  }
}

export default ConditionEffectEditor

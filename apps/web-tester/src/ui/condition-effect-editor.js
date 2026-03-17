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
  HAS_ITEM: 'hasItem',   // アイテム所持条件
  HAS_EVENT: 'hasEvent', // イベント存在条件
  PROPERTY: 'property',  // プロパティ比較条件: entity.key op value
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
  MODIFY_VARIABLE: 'modifyVariable', // 変数演算: modifyVariable:name+value
  ADD_ITEM: 'addItem',       // アイテム追加
  REMOVE_ITEM: 'removeItem', // アイテム削除
  CREATE_EVENT: 'createEvent', // イベント生成
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
    const isHasItem = parsed.type === 'hasItem'
    const isHasEvent = parsed.type === 'hasEvent'
    const isProperty = parsed.type === 'property'
    const operatorHidden = isRaw || isFlag || isTimeWindow || isHasItem || isHasEvent

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

      if (parsed.type === 'variable' || parsed.type === 'property') {
        return `
          <option value="=" ${parsed.operator === '=' ? 'selected' : ''}>=</option>
          <option value="!=" ${parsed.operator === '!=' ? 'selected' : ''}>!=</option>
          <option value="contains" ${parsed.operator === 'contains' ? 'selected' : ''}>contains</option>
          <option value="!contains" ${parsed.operator === '!contains' ? 'selected' : ''}>!contains</option>
          <option value=">" ${parsed.operator === '>' ? 'selected' : ''}>&gt;</option>
          <option value=">=" ${parsed.operator === '>=' ? 'selected' : ''}>&gt;=</option>
          <option value="<" ${parsed.operator === '<' ? 'selected' : ''}>&lt;</option>
          <option value="<=" ${parsed.operator === '<=' ? 'selected' : ''}>&lt;=</option>
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
          <option value="hasItem" ${parsed.type === 'hasItem' ? 'selected' : ''}>アイテム所持</option>
          <option value="hasEvent" ${parsed.type === 'hasEvent' ? 'selected' : ''}>イベント存在</option>
          <option value="property" ${parsed.type === 'property' ? 'selected' : ''}>プロパティ比較</option>
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
    const isModifyVar = parsed.type === 'modifyVariable'
    const isItemEffect = parsed.type === 'addItem' || parsed.type === 'removeItem'
    const isCreateEvent = parsed.type === 'createEvent'

    const propsHtml = isCreateEvent ? this._renderEventProperties(parsed.properties ?? {}, nodeId, choiceIndex, effectIndex) : ''

    return `
      <div class="effect-item" data-effect-index="${effectIndex}">
        <div class="effect-main-row">
          <select class="effect-type" data-field="type">
            <option value="setFlag" ${parsed.type === 'setFlag' ? 'selected' : ''}>フラグ設定</option>
            <option value="addResource" ${parsed.type === 'addResource' ? 'selected' : ''}>リソース加算</option>
            <option value="setVariable" ${parsed.type === 'setVariable' ? 'selected' : ''}>変数設定</option>
            <option value="modifyVariable" ${parsed.type === 'modifyVariable' ? 'selected' : ''}>変数演算</option>
            <option value="addItem" ${parsed.type === 'addItem' ? 'selected' : ''}>アイテム追加</option>
            <option value="removeItem" ${parsed.type === 'removeItem' ? 'selected' : ''}>アイテム削除</option>
            <option value="createEvent" ${parsed.type === 'createEvent' ? 'selected' : ''}>イベント生成</option>
            <option value="goto" ${parsed.type === 'goto' ? 'selected' : ''}>遷移</option>
            <option value="raw" ${parsed.type === 'raw' ? 'selected' : ''}>カスタム</option>
          </select>
          <input type="text" class="effect-raw" placeholder="効果(生)" value="${this._escapeAttr(parsed.rawText)}" data-field="raw" ${isRaw ? '' : 'style="display:none"'}>
          <input type="text" class="effect-name" placeholder="名前" value="${this._escapeAttr(parsed.name)}" data-field="name" ${isRaw ? 'style="display:none"' : ''}>
          <select class="effect-operator" data-field="operator" ${isModifyVar ? '' : 'style="display:none"'}>
            <option value="+" ${parsed.operator === '+' ? 'selected' : ''}>+</option>
            <option value="-" ${parsed.operator === '-' ? 'selected' : ''}>-</option>
            <option value="*" ${parsed.operator === '*' ? 'selected' : ''}>*</option>
            <option value="/" ${parsed.operator === '/' ? 'selected' : ''}>/</option>
          </select>
          <span class="effect-equals" ${(isGoto || isRaw || isModifyVar || isItemEffect || isCreateEvent) ? 'style="display:none"' : ''}>=</span>
          <input type="text" class="effect-value" placeholder="${isCreateEvent ? 'イベント名' : '値'}" value="${this._escapeAttr(parsed.value)}" data-field="value" ${(isGoto || isRaw || isItemEffect) ? 'style="display:none"' : ''}>
          <button type="button" class="delete-effect-btn btn-icon" data-node-id="${nodeId}" data-choice-index="${choiceIndex}" data-effect-index="${effectIndex}">×</button>
        </div>
        ${propsHtml}
      </div>
    `
  }

  /**
   * イベントプロパティエディタのHTMLを生成
   */
  _renderEventProperties(properties, nodeId, choiceIndex, effectIndex) {
    const entries = Object.entries(properties || {})
    const propItems = entries.map(([key, def], i) => {
      const val = def && typeof def === 'object' ? (def.defaultValue ?? '') : def
      return `
        <div class="event-property-item" data-prop-index="${i}">
          <input type="text" class="prop-key" placeholder="キー" value="${this._escapeAttr(key)}">
          <span class="prop-eq">=</span>
          <input type="text" class="prop-value" placeholder="値" value="${this._escapeAttr(val)}">
          <button type="button" class="delete-prop-btn btn-icon">×</button>
        </div>`
    }).join('')

    return `
      <div class="event-properties" data-node-id="${nodeId}" data-choice-index="${choiceIndex}" data-effect-index="${effectIndex}">
        <div class="event-properties-header">
          <span class="props-label">プロパティ</span>
          <button type="button" class="add-event-property-btn btn-small">+ 追加</button>
        </div>
        <div class="event-properties-list">
          ${propItems || '<span class="empty-hint">プロパティなし</span>'}
        </div>
      </div>`
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
      if (type === 'hasItem') {
        return { type: 'hasItem', name: conditionStr.key ?? '', operator: '=', value: String(conditionStr.value ?? true), rawText: '' }
      }
      if (type === 'hasEvent') {
        return { type: 'hasEvent', name: conditionStr.key ?? '', operator: '=', value: String(conditionStr.value ?? true), rawText: '' }
      }
      if (type === 'property') {
        const op = conditionStr.op === '==' ? '=' : (conditionStr.op ?? '==')
        return { type: 'property', name: `${conditionStr.entity ?? ''}.${conditionStr.key ?? ''}`, operator: op, value: String(conditionStr.value ?? ''), rawText: '' }
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
      if (type === 'modifyVariable') {
        return { type: 'modifyVariable', name: effectStr.key ?? '', operator: effectStr.op ?? '+', value: String(effectStr.value ?? 0), rawText: '' }
      }
      if (type === 'addItem' || type === 'removeItem') {
        return { type, name: effectStr.key ?? '', value: '', rawText: '' }
      }
      if (type === 'createEvent') {
        return { type: 'createEvent', name: effectStr.id ?? '', value: effectStr.name ?? '', rawText: '', properties: effectStr.properties ?? {} }
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

    const modifyMatch = effectStr.match(/^modifyVariable:(\w+)([+\-*/])(.+)$/)
    if (modifyMatch) {
      return { type: 'modifyVariable', name: modifyMatch[1], operator: modifyMatch[2], value: modifyMatch[3], rawText: '' }
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
      const numVal = Number(value)
      if (['>=', '<=', '>', '<'].includes(op) && value !== '' && Number.isFinite(numVal)) {
        return { type: 'variable', key: name, op, value: numVal }
      }
      return { type: 'variable', key: name, op, value: String(value ?? '') }
    }

    if (type === 'hasItem') {
      return { type: 'hasItem', key: name, value: this._parseBoolean(value) }
    }

    if (type === 'hasEvent') {
      return { type: 'hasEvent', key: name, value: this._parseBoolean(value) }
    }

    if (type === 'property') {
      const parts = (name || '').split('.')
      const entity = parts[0] || ''
      const key = parts.slice(1).join('.') || ''
      const op = operator === '=' ? '==' : operator
      const numVal = Number(value)
      const parsedValue = value !== '' && Number.isFinite(numVal) ? numVal : String(value ?? '')
      return { type: 'property', entity, key, op, value: parsedValue }
    }

    return this.buildConditionString(type, name, operator, value)
  }

  buildEffectObject(type, name, value, operator) {
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
      const numVal = Number(value)
      if (value !== '' && Number.isFinite(numVal)) {
        return { type: 'setVariable', key: name, value: numVal }
      }
      return { type: 'setVariable', key: name, value: String(value ?? '') }
    }

    if (type === 'modifyVariable') {
      const delta = Number(value)
      if (!Number.isFinite(delta)) return null
      return { type: 'modifyVariable', key: name, op: operator || '+', value: delta }
    }

    if (type === 'addItem' || type === 'removeItem') {
      return { type, key: String(name ?? '') }
    }

    if (type === 'createEvent') {
      const result = { type: 'createEvent', id: String(name ?? ''), name: String(value ?? '') }
      if (this._pendingProperties && Object.keys(this._pendingProperties).length > 0) {
        result.properties = this._pendingProperties
      }
      return result
    }

    if (type === 'goto') {
      return { type: 'goto', target: String(name ?? '') }
    }

    return this.buildEffectString(type, name, value)
  }

  /**
   * DOM要素からイベントプロパティを読み取る
   */
  _readPropertiesFromElement(itemElement) {
    const propsContainer = itemElement.querySelector('.event-properties-list')
    if (!propsContainer) return {}
    const props = {}
    const propItems = propsContainer.querySelectorAll('.event-property-item')
    for (const propItem of propItems) {
      const key = propItem.querySelector('.prop-key')?.value?.trim()
      const val = propItem.querySelector('.prop-value')?.value ?? ''
      if (key) {
        const numVal = Number(val)
        const boolVal = val === 'true' ? true : val === 'false' ? false : null
        const defaultValue = boolVal !== null ? boolVal : (val !== '' && Number.isFinite(numVal) ? numVal : val)
        props[key] = { defaultValue }
      }
    }
    return props
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

    const varMatch = text.match(/^variable:([^=<>!]+)(==|=|!=|>=|<=|>|<|contains|!contains)(.+)$/)
    if (varMatch) {
      const op = varMatch[2] === '=' ? '==' : varMatch[2]
      const numVal = Number(varMatch[3].trim())
      if (['>=', '<=', '>', '<'].includes(op) && Number.isFinite(numVal)) {
        return { type: 'variable', key: varMatch[1].trim(), op, value: numVal }
      }
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
      const val = setVarMatch[2]
      const numVal = Number(val)
      if (val !== '' && Number.isFinite(numVal)) {
        return { type: 'setVariable', key: setVarMatch[1].trim(), value: numVal }
      }
      return { type: 'setVariable', key: setVarMatch[1].trim(), value: val }
    }

    const modifyVarMatch = text.match(/^modifyVariable:([^+\-*/]+)([+\-*/])(.+)$/)
    if (modifyVarMatch) {
      const delta = Number(modifyVarMatch[3])
      if (Number.isFinite(delta)) {
        return { type: 'modifyVariable', key: modifyVarMatch[1].trim(), op: modifyVarMatch[2], value: delta }
      }
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
    const operator = itemElement.querySelector('.effect-operator')?.value || '+'

    // Read event properties from DOM if present
    if (type === 'createEvent') {
      this._pendingProperties = this._readPropertiesFromElement(itemElement)
    } else {
      this._pendingProperties = null
    }

    return this.buildEffectObject(type, name, value, operator)
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
        const isHasEvent = e.target.value === 'hasEvent'

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
          } else if (e.target.value === 'variable' || e.target.value === 'property') {
            operatorEl.innerHTML = `
              <option value="=">=</option>
              <option value="!=">!=</option>
              <option value="contains">contains</option>
              <option value="!contains">!contains</option>
              <option value=">">&gt;</option>
              <option value=">=">&gt;=</option>
              <option value="<">&lt;</option>
              <option value="<=">&lt;=</option>
            `
          } else {
            operatorEl.innerHTML = `<option value="=">=</option>`
          }

          // restore if still valid
          const validOps = Array.from(operatorEl.querySelectorAll('option')).map((o) => o.value)
          operatorEl.value = validOps.includes(currentOp) ? currentOp : '='

          operatorEl.style.display = (isRaw || isFlag || isTimeWindow || isHasEvent) ? 'none' : ''
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
        const operatorEl = item.querySelector('.effect-operator')
        const isModifyVar = e.target.value === 'modifyVariable'
        const isCreateEvent = e.target.value === 'createEvent'
        const isItemEff = e.target.value === 'addItem' || e.target.value === 'removeItem'

        if (rawEl) rawEl.style.display = isRaw ? '' : 'none'
        if (nameEl) {
          nameEl.style.display = isRaw ? 'none' : ''
          nameEl.placeholder = isCreateEvent ? 'イベントID' : '名前'
        }
        if (operatorEl) operatorEl.style.display = isModifyVar ? '' : 'none'
        if (equalsEl) equalsEl.style.display = (isGoto || isRaw || isModifyVar || isItemEff || isCreateEvent) ? 'none' : ''
        if (valueEl) {
          valueEl.style.display = (isGoto || isRaw || isItemEff) ? 'none' : ''
          valueEl.placeholder = isCreateEvent ? 'イベント名' : '値'
        }

        // Show/hide event properties section
        let propsSection = item.querySelector('.event-properties')
        if (isCreateEvent && !propsSection) {
          // Create empty properties section
          const propsDiv = document.createElement('div')
          propsDiv.innerHTML = this._renderEventProperties({}, '', '', '')
          const newSection = propsDiv.firstElementChild
          item.appendChild(newSection)
        } else if (propsSection) {
          propsSection.style.display = isCreateEvent ? '' : 'none'
        }
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

      // Event property: add
      if (e.target.classList.contains('add-event-property-btn')) {
        const propsList = e.target.closest('.event-properties')?.querySelector('.event-properties-list')
        if (propsList) {
          const hint = propsList.querySelector('.empty-hint')
          if (hint) hint.remove()
          const idx = propsList.querySelectorAll('.event-property-item').length
          const newProp = document.createElement('div')
          newProp.className = 'event-property-item'
          newProp.dataset.propIndex = idx
          newProp.innerHTML = `
            <input type="text" class="prop-key" placeholder="キー" value="">
            <span class="prop-eq">=</span>
            <input type="text" class="prop-value" placeholder="値" value="">
            <button type="button" class="delete-prop-btn btn-icon">×</button>`
          propsList.appendChild(newProp)
          newProp.querySelector('.prop-key').focus()
          if (callbacks.onValueChange) callbacks.onValueChange(e)
        }
      }

      // Event property: delete
      if (e.target.classList.contains('delete-prop-btn')) {
        const propItem = e.target.closest('.event-property-item')
        if (propItem) {
          propItem.remove()
          if (callbacks.onValueChange) callbacks.onValueChange(e)
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

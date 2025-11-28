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
  VISITED: 'visited',     // 訪問条件: visited:nodeId
  NOT_VISITED: 'notVisited' // 未訪問条件: notVisited:nodeId
}

/**
 * 効果の種類
 */
export const EffectTypes = {
  SET_FLAG: 'setFlag',        // フラグ設定: setFlag:name=value
  ADD_RESOURCE: 'addResource', // リソース加算: addResource:name=value
  SET_RESOURCE: 'setResource', // リソース設定: setResource:name=value
  SET_VARIABLE: 'setVariable'  // 変数設定: setVariable:name=value
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
    
    return `
      <div class="condition-item" data-condition-index="${condIndex}">
        <select class="condition-type" data-field="type">
          <option value="flag" ${parsed.type === 'flag' ? 'selected' : ''}>フラグ</option>
          <option value="resource" ${parsed.type === 'resource' ? 'selected' : ''}>リソース</option>
          <option value="variable" ${parsed.type === 'variable' ? 'selected' : ''}>変数</option>
          <option value="visited" ${parsed.type === 'visited' ? 'selected' : ''}>訪問済み</option>
          <option value="notVisited" ${parsed.type === 'notVisited' ? 'selected' : ''}>未訪問</option>
        </select>
        <input type="text" class="condition-name" placeholder="名前" value="${parsed.name}" data-field="name">
        <select class="condition-operator" data-field="operator" ${['visited', 'notVisited'].includes(parsed.type) ? 'style="display:none"' : ''}>
          <option value="=" ${parsed.operator === '=' ? 'selected' : ''}>=</option>
          <option value="!=" ${parsed.operator === '!=' ? 'selected' : ''}>!=</option>
          <option value=">" ${parsed.operator === '>' ? 'selected' : ''}>&gt;</option>
          <option value=">=" ${parsed.operator === '>=' ? 'selected' : ''}>&gt;=</option>
          <option value="<" ${parsed.operator === '<' ? 'selected' : ''}>&lt;</option>
          <option value="<=" ${parsed.operator === '<=' ? 'selected' : ''}>&lt;=</option>
        </select>
        <input type="text" class="condition-value" placeholder="値" value="${parsed.value}" data-field="value" ${['visited', 'notVisited'].includes(parsed.type) ? 'style="display:none"' : ''}>
        <button type="button" class="delete-condition-btn btn-icon" data-node-id="${nodeId}" data-choice-index="${choiceIndex}" data-condition-index="${condIndex}">×</button>
      </div>
    `
  }

  /**
   * 効果アイテムのHTMLを生成
   */
  _renderEffectItem(effect, nodeId, choiceIndex, effectIndex) {
    const parsed = this._parseEffect(effect)
    
    return `
      <div class="effect-item" data-effect-index="${effectIndex}">
        <select class="effect-type" data-field="type">
          <option value="setFlag" ${parsed.type === 'setFlag' ? 'selected' : ''}>フラグ設定</option>
          <option value="addResource" ${parsed.type === 'addResource' ? 'selected' : ''}>リソース加算</option>
          <option value="setResource" ${parsed.type === 'setResource' ? 'selected' : ''}>リソース設定</option>
          <option value="setVariable" ${parsed.type === 'setVariable' ? 'selected' : ''}>変数設定</option>
        </select>
        <input type="text" class="effect-name" placeholder="名前" value="${parsed.name}" data-field="name">
        <span class="effect-equals">=</span>
        <input type="text" class="effect-value" placeholder="値" value="${parsed.value}" data-field="value">
        <button type="button" class="delete-effect-btn btn-icon" data-node-id="${nodeId}" data-choice-index="${choiceIndex}" data-effect-index="${effectIndex}">×</button>
      </div>
    `
  }

  /**
   * 条件文字列をパース
   */
  _parseCondition(conditionStr) {
    if (!conditionStr || typeof conditionStr !== 'string') {
      return { type: 'flag', name: '', operator: '=', value: '' }
    }

    // Pattern: type:name[operator]value
    const patterns = [
      { regex: /^(flag|variable):(\w+)(=|!=|>=|<=|>|<)(.+)$/, type: null },
      { regex: /^(resource):(\w+)(=|!=|>=|<=|>|<)(.+)$/, type: null },
      { regex: /^(visited|notVisited):(.+)$/, type: null, noValue: true }
    ]

    for (const pattern of patterns) {
      const match = conditionStr.match(pattern.regex)
      if (match) {
        if (pattern.noValue) {
          return { type: match[1], name: match[2], operator: '=', value: '' }
        }
        return { type: match[1], name: match[2], operator: match[3], value: match[4] }
      }
    }

    // Fallback: treat as raw text
    return { type: 'flag', name: conditionStr, operator: '=', value: 'true' }
  }

  /**
   * 効果文字列をパース
   */
  _parseEffect(effectStr) {
    if (!effectStr || typeof effectStr !== 'string') {
      return { type: 'setFlag', name: '', value: '' }
    }

    // Pattern: type:name=value
    const match = effectStr.match(/^(setFlag|addResource|setResource|setVariable):(\w+)=(.+)$/)
    if (match) {
      return { type: match[1], name: match[2], value: match[3] }
    }

    // Fallback
    return { type: 'setFlag', name: effectStr, value: 'true' }
  }

  /**
   * 条件を文字列に変換
   */
  buildConditionString(type, name, operator, value) {
    if (!name) return null
    
    if (type === 'visited' || type === 'notVisited') {
      return `${type}:${name}`
    }
    
    return `${type}:${name}${operator}${value}`
  }

  /**
   * 効果を文字列に変換
   */
  buildEffectString(type, name, value) {
    if (!name) return null
    return `${type}:${name}=${value}`
  }

  /**
   * 新しい条件を作成
   */
  createNewCondition() {
    return 'flag:newFlag=true'
  }

  /**
   * 新しい効果を作成
   */
  createNewEffect() {
    return 'setFlag:newFlag=true'
  }

  /**
   * DOM要素から条件を読み取る
   */
  readConditionFromElement(itemElement) {
    const type = itemElement.querySelector('.condition-type')?.value || 'flag'
    const name = itemElement.querySelector('.condition-name')?.value || ''
    const operator = itemElement.querySelector('.condition-operator')?.value || '='
    const value = itemElement.querySelector('.condition-value')?.value || ''
    
    return this.buildConditionString(type, name, operator, value)
  }

  /**
   * DOM要素から効果を読み取る
   */
  readEffectFromElement(itemElement) {
    const type = itemElement.querySelector('.effect-type')?.value || 'setFlag'
    const name = itemElement.querySelector('.effect-name')?.value || ''
    const value = itemElement.querySelector('.effect-value')?.value || ''
    
    return this.buildEffectString(type, name, value)
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
        const isVisitType = ['visited', 'notVisited'].includes(e.target.value)
        
        if (operatorEl) operatorEl.style.display = isVisitType ? 'none' : ''
        if (valueEl) valueEl.style.display = isVisitType ? 'none' : ''
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

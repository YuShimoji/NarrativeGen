import { getAvailableChoices } from '../../../../packages/engine-ts/dist/browser.js'
import { getCurrentModelName, getCurrentSession } from '../core/session.js'
import {
  ModelValidator,
  ValidationCategory,
} from '../features/model-validator.js'

const UNKNOWN = 'Unknown'
const NOT_AVAILABLE = 'Not available yet'

export class DesignerDashboardManager {
  constructor(appState) {
    this.appState = appState
    this.container = null
    this.validator = new ModelValidator()
    this.render = this.render.bind(this)
  }

  initialize(container) {
    this.container = container
    if (this.appState?.on) {
      this.appState.on('model:changed', this.render)
      this.appState.on('storyLog:changed', this.render)
    }
    this.render()
  }

  render() {
    if (!this.container) return

    const snapshot = this.buildSnapshot()
    const dashboard = document.createElement('div')
    dashboard.className = 'designer-dashboard'
    dashboard.appendChild(this.renderHeader(snapshot))

    const grid = document.createElement('div')
    grid.className = 'designer-dashboard-grid'
    grid.appendChild(this.renderModelOverview(snapshot))
    grid.appendChild(this.renderRouteState(snapshot))
    grid.appendChild(this.renderStructureHealth(snapshot))
    grid.appendChild(this.renderStateKeys(snapshot))
    grid.appendChild(this.renderBoundary(snapshot))
    grid.appendChild(this.renderReviewHints(snapshot))
    dashboard.appendChild(grid)

    this.container.replaceChildren(dashboard)
  }

  buildSnapshot() {
    const model = this.appState?.model ?? null
    const session = getCurrentSession()
    const nodes = getModelNodes(model)
    const nodeCount = nodes.length
    const choiceCount = nodes.reduce((sum, [, node]) => sum + getChoices(node).length, 0)
    const endingCount = nodes.filter(([, node]) => isEndNode(node)).length
    const availableChoices = getAvailableChoiceCount(session, model)
    const validation = this.getValidationSnapshot(model, nodeCount)
    const stateKeys = collectStateKeys(model, session)
    const auxiliaryCounts = getAuxiliaryCounts(model)

    return {
      model,
      session,
      modelName: getCurrentModelName() || model?.name || model?.id || UNKNOWN,
      startNode: model?.startNode || UNKNOWN,
      nodeCount: model ? nodeCount : null,
      choiceCount: model ? choiceCount : null,
      endingCount: model ? endingCount : null,
      currentNodeId: session?.nodeId || NOT_AVAILABLE,
      availableChoices,
      routeLength: Array.isArray(this.appState?.storyLog) ? this.appState.storyLog.length : null,
      sessionTime: session?.time ?? null,
      validation,
      stateKeys,
      auxiliaryCounts,
    }
  }

  getValidationSnapshot(model, nodeCount) {
    if (!model) {
      return {
        errors: null,
        warnings: null,
        info: null,
        reachable: null,
        unreachable: null,
        orphan: null,
        brokenReferences: null,
      }
    }

    const issues = this.validator.validate(model)
    const summary = this.validator.getSummary()
    const unreachable = countCategory(issues, ValidationCategory.UNREACHABLE_NODE)
    const orphan = countCategory(issues, ValidationCategory.ORPHAN_NODE)
    const brokenReferences = countCategory(issues, ValidationCategory.BROKEN_REFERENCE)

    return {
      errors: summary.errors,
      warnings: summary.warnings,
      info: summary.info,
      reachable: typeof nodeCount === 'number' ? Math.max(0, nodeCount - unreachable) : null,
      unreachable,
      orphan,
      brokenReferences,
    }
  }

  renderHeader(snapshot) {
    const header = document.createElement('div')
    header.className = 'designer-dashboard-header'

    const title = document.createElement('h2')
    title.textContent = 'デザイナーダッシュボード v0'

    const subtitle = document.createElement('p')
    subtitle.textContent = snapshot.model
      ? 'モデル構造、現在ルート、状態キー、検証結果、非AI境界を同じ画面で確認できます。'
      : 'モデル未読込です。'

    header.append(title, subtitle)
    return header
  }

  renderModelOverview(snapshot) {
    return this.renderPanel('モデル概要', [
      row('モデル', snapshot.modelName, 'model-name'),
      row('開始ノード', snapshot.startNode, 'start-node'),
      row('ノード数', formatNullableNumber(snapshot.nodeCount), 'node-count'),
      row('選択肢数', formatNullableNumber(snapshot.choiceCount), 'choice-count'),
      row('終端ノード数', formatNullableNumber(snapshot.endingCount), 'ending-count'),
    ])
  }

  renderRouteState(snapshot) {
    return this.renderPanel('ルート / プレイ状態', [
      row('現在ノード', snapshot.currentNodeId, 'current-node'),
      row('現在選択肢', formatAvailableChoiceCount(snapshot.availableChoices), 'available-choice-count'),
      row('ストーリーログ長', formatNullableNumber(snapshot.routeLength), 'story-log-length'),
      row('セッション時刻', formatNullableNumber(snapshot.sessionTime), 'session-time'),
    ])
  }

  renderStructureHealth(snapshot) {
    const validation = snapshot.validation
    return this.renderPanel('構造ヘルス', [
      row('検証エラー', formatNullableNumber(validation.errors), 'validation-errors'),
      row('検証警告', formatNullableNumber(validation.warnings), 'validation-warnings'),
      row('到達可能 / 不可能', formatReachability(validation), 'reachability-summary'),
      row('孤立ノード', formatNullableNumber(validation.orphan), 'orphan-count'),
      row('壊れた参照', formatNullableNumber(validation.brokenReferences), 'broken-reference-count'),
    ])
  }

  renderStateKeys(snapshot) {
    const keys = snapshot.stateKeys
    const aux = snapshot.auxiliaryCounts
    return this.renderPanel('状態設計キー', [
      row('Flags', formatKeySet(keys.flags), 'flag-keys'),
      row('Resources', formatKeySet(keys.resources), 'resource-keys'),
      row('Variables', formatKeySet(keys.variables), 'variable-keys'),
      row('Entities', formatNullableNumber(aux.entities), 'entity-count'),
      row('Templates / Lexicon', `${formatNullableNumber(aux.templates)} / ${formatNullableNumber(aux.lexicon)}`, 'template-lexicon-count'),
    ])
  }

  renderBoundary() {
    const panel = document.createElement('section')
    panel.className = 'designer-dashboard-panel designer-dashboard-panel--boundary'

    const title = document.createElement('h3')
    title.textContent = '非AI生成境界'

    const body = document.createElement('p')
    body.textContent = 'このダッシュボードはローカルの model/session/validation だけを読みます。OpenAI、local LLM、外部 API、認証、課金、公開処理は実行しません。表示される生成証跡は deterministic / procedural / rule-based evidence であり、AI品質や本番承認ではありません。'

    const advancedNote = document.createElement('p')
    advancedNote.className = 'designer-dashboard-note'
    advancedNote.textContent = '既存の Advanced / provider 表示が別タブに残っていても、この画面は read-only checkpoint です。'

    panel.append(title, body, advancedNote)
    return panel
  }

  renderReviewHints(snapshot) {
    const hints = [
      `ルート明瞭性: 現在ノード「${snapshot.currentNodeId}」から次の選択理由が読めるか。`,
      `状態キー意味: ${formatKeySet(snapshot.stateKeys.flags)} / ${formatKeySet(snapshot.stateKeys.resources)} / ${formatKeySet(snapshot.stateKeys.variables)} が設計意図を表しているか。`,
      `構造確認: 到達不能 ${formatNullableNumber(snapshot.validation.unreachable)}、孤立 ${formatNullableNumber(snapshot.validation.orphan)} を次の観察対象にするか。`,
      '生成シーム: deterministic/procedural 証跡と builder-added glue を混同していないか。',
      `次の手動観察: ${snapshot.currentNodeId !== NOT_AVAILABLE ? snapshot.currentNodeId : snapshot.startNode} の表示文、選択肢、状態変化。`,
    ]

    const panel = document.createElement('section')
    panel.className = 'designer-dashboard-panel'

    const title = document.createElement('h3')
    title.textContent = 'レビュー観点'

    const list = document.createElement('ul')
    list.className = 'designer-dashboard-hints'
    for (const hint of hints) {
      const item = document.createElement('li')
      item.textContent = hint
      list.appendChild(item)
    }

    panel.append(title, list)
    return panel
  }

  renderPanel(titleText, rows) {
    const panel = document.createElement('section')
    panel.className = 'designer-dashboard-panel'

    const title = document.createElement('h3')
    title.textContent = titleText
    panel.appendChild(title)

    const list = document.createElement('dl')
    list.className = 'designer-dashboard-metrics'
    for (const item of rows) {
      const term = document.createElement('dt')
      term.textContent = item.label
      const value = document.createElement('dd')
      value.dataset.dashboardField = item.key
      value.textContent = item.value
      list.append(term, value)
    }
    panel.appendChild(list)

    return panel
  }
}

function row(label, value, key) {
  return { label, value: normalizeDisplayValue(value), key }
}

function getModelNodes(model) {
  if (!model?.nodes || typeof model.nodes !== 'object') return []
  return Object.entries(model.nodes)
}

function getChoices(node) {
  return Array.isArray(node?.choices) ? node.choices : []
}

function isEndNode(node) {
  return Boolean(
    node?.isEnding ||
    node?.type === 'ending' ||
    getChoices(node).length === 0,
  )
}

function getAvailableChoiceCount(session, model) {
  if (!session || !model) return null
  try {
    return getAvailableChoices(session, model).length
  } catch {
    return UNKNOWN
  }
}

function countCategory(issues, category) {
  return issues.filter((issue) => issue.category === category).length
}

function formatNullableNumber(value) {
  return typeof value === 'number' ? String(value) : NOT_AVAILABLE
}

function formatAvailableChoiceCount(value) {
  if (typeof value === 'number') return String(value)
  if (value === UNKNOWN) return UNKNOWN
  return NOT_AVAILABLE
}

function formatReachability(validation) {
  if (typeof validation.reachable !== 'number' || typeof validation.unreachable !== 'number') {
    return NOT_AVAILABLE
  }
  return `${validation.reachable} / ${validation.unreachable}`
}

function normalizeDisplayValue(value) {
  if (value === null || value === undefined || value === '') return NOT_AVAILABLE
  return String(value)
}

function formatKeySet(keys) {
  if (!(keys instanceof Set)) return NOT_AVAILABLE
  const values = [...keys].sort()
  if (values.length === 0) return '0'
  const preview = values.slice(0, 5).join(', ')
  const suffix = values.length > 5 ? `, +${values.length - 5}` : ''
  return `${values.length}: ${preview}${suffix}`
}

function getAuxiliaryCounts(model) {
  if (!model) {
    return { entities: null, templates: null, lexicon: null }
  }

  return {
    entities: countObject(model.entities),
    templates: Array.isArray(model.conversationTemplates)
      ? model.conversationTemplates.length
      : countObject(model.conversationTemplates),
    lexicon: countObject(model.paraphraseLexicon),
  }
}

function countObject(value) {
  if (!value || typeof value !== 'object') return 0
  return Object.keys(value).length
}

function collectStateKeys(model, session) {
  const keys = {
    flags: new Set(),
    resources: new Set(),
    variables: new Set(),
  }

  addObjectKeys(keys.flags, model?.flags)
  addObjectKeys(keys.resources, model?.resources)
  addObjectKeys(keys.variables, model?.variables)
  addObjectKeys(keys.flags, session?.flags)
  addObjectKeys(keys.resources, session?.resources)
  addObjectKeys(keys.variables, session?.variables)

  for (const [, node] of getModelNodes(model)) {
    for (const choice of getChoices(node)) {
      collectConditions(choice.conditions, keys)
      collectEffects(choice.effects, keys)
    }
  }

  return keys
}

function addObjectKeys(target, source) {
  if (!source || typeof source !== 'object') return
  for (const key of Object.keys(source)) {
    target.add(key)
  }
}

function collectConditions(conditions, keys) {
  if (!Array.isArray(conditions)) return
  for (const condition of conditions) {
    collectCondition(condition, keys)
  }
}

function collectCondition(condition, keys) {
  if (!condition || typeof condition !== 'object') return

  if (condition.type === 'flag' && condition.key) keys.flags.add(condition.key)
  if (condition.type === 'resource' && condition.key) keys.resources.add(condition.key)
  if (condition.type === 'variable' && condition.key) keys.variables.add(condition.key)

  if (Array.isArray(condition.conditions)) {
    collectConditions(condition.conditions, keys)
  }
  if (condition.condition) {
    collectCondition(condition.condition, keys)
  }
}

function collectEffects(effects, keys) {
  if (!Array.isArray(effects)) return
  for (const effect of effects) {
    if (!effect || typeof effect !== 'object') continue
    if (effect.type === 'setFlag' && effect.key) keys.flags.add(effect.key)
    if ((effect.type === 'addResource' || effect.type === 'setResource') && effect.key) {
      keys.resources.add(effect.key)
    }
    if (effect.type === 'setVariable' && effect.key) keys.variables.add(effect.key)
  }
}

export default DesignerDashboardManager

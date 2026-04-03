/**
 * ZWP Import Handler - Re-imports edited .zwp.json text back into NarrativeGen model.
 * Only updates node.text fields. Never touches choices, conditions, effects, or presentation.
 *
 * @module handlers/zwp-import-handler
 */
import { readFileAsText } from '../src/utils/file-utils.js'

/**
 * Initialize ZWP Import handler with dependency injection.
 *
 * @param {Object} deps
 * @param {Function} deps.getModel - Get current narrative model
 * @param {Function} deps.setModel - Update narrative model
 * @param {Function} deps.setStatus - Display status message (text, level)
 * @param {Function} deps.showErrors - Display validation errors
 * @param {Function} deps.hideErrors - Clear error display
 * @returns {Object} { openFilePicker, importZwpFromFile }
 */
export function initZwpImportHandler(deps) {
  const {
    getModel,
    setModel,
    setStatus,
    showErrors,
    hideErrors,
  } = deps

  /**
   * Open a file picker for .zwp.json files, then import.
   */
  function openFilePicker() {
    const model = getModel()
    if (!model || !model.nodes) {
      setStatus('モデルを先に読み込んでください', 'warn')
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zwp.json,.json'
    input.style.display = 'none'

    input.addEventListener('change', async () => {
      const file = input.files[0]
      if (!file) return
      await importZwpFromFile(file)
      input.remove()
    })

    document.body.appendChild(input)
    input.click()
  }

  /**
   * Parse and import a .zwp.json file, updating node texts in the current model.
   * @param {File} file
   */
  async function importZwpFromFile(file) {
    hideErrors()

    let text
    try {
      text = await readFileAsText(file)
    } catch (e) {
      setStatus(`ファイル読み込み失敗: ${e.message}`, 'error')
      return
    }

    let project
    try {
      project = JSON.parse(text)
    } catch (e) {
      setStatus('JSON パース失敗: ファイル形式が不正です', 'error')
      return
    }

    // Validate format
    if (!project.format || !project.format.startsWith('zenwriter-')) {
      setStatus('WritingPage (.zwp.json) 形式ではありません', 'error')
      return
    }

    const model = getModel()
    if (!model || !model.nodes) {
      setStatus('モデルが読み込まれていません', 'error')
      return
    }

    const pages = project.pages || []
    const report = {
      updated: 0,
      skipped: 0,
      unmatched: [],   // pages with no nodeId
      missing: [],     // pages whose nodeId doesn't exist in model
      unchanged: 0,    // pages where text was identical
    }

    const matchedNodeIds = new Set()

    for (const page of pages) {
      const meta = page.metadata && page.metadata.narrativegen

      // Skip group headings
      if (meta && meta.type === 'group-heading') {
        report.skipped++
        continue
      }

      // No NarrativeGen metadata
      if (!meta || !meta.nodeId) {
        report.unmatched.push({ title: page.title, order: page.order })
        continue
      }

      const nodeId = meta.nodeId
      const node = model.nodes[nodeId]

      if (!node) {
        report.missing.push({ nodeId, title: page.title })
        continue
      }

      matchedNodeIds.add(nodeId)

      // Update text only
      const newText = page.content || ''
      if (node.text === newText) {
        report.unchanged++
      } else {
        node.text = newText
        report.updated++
      }
    }

    // Find model nodes with no corresponding page
    const orphanNodes = []
    for (const nodeId of Object.keys(model.nodes)) {
      if (!matchedNodeIds.has(nodeId)) {
        orphanNodes.push(nodeId)
      }
    }

    // Apply update
    setModel({ ...model })

    // Build status message
    const parts = [`ZWPインポート完了: ${report.updated}ノード更新`]
    if (report.unchanged > 0) {
      parts.push(`${report.unchanged}件変更なし`)
    }

    const warnings = []
    if (report.unmatched.length > 0) {
      warnings.push(`${report.unmatched.length}件のページにノードIDなし`)
    }
    if (report.missing.length > 0) {
      warnings.push(`${report.missing.length}件のページのノードがモデルに存在しない`)
    }
    if (orphanNodes.length > 0) {
      warnings.push(`${orphanNodes.length}件のノードに対応ページなし`)
    }

    if (warnings.length > 0) {
      setStatus(`${parts.join(' / ')} (${warnings.join(', ')})`, 'warn')
      const errorLines = []
      for (const item of report.unmatched) {
        errorLines.push(`ノードIDなし: "${item.title}" (order: ${item.order})`)
      }
      for (const item of report.missing) {
        errorLines.push(`ノード消失: ${item.nodeId} ("${item.title}")`)
      }
      for (const nodeId of orphanNodes) {
        errorLines.push(`対応ページなし: ${nodeId}`)
      }
      showErrors(errorLines)
    } else {
      setStatus(parts.join(' / '), 'success')
    }
  }

  return {
    openFilePicker,
    importZwpFromFile,
  }
}

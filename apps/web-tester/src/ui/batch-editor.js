/**
 * Batch Editor Module
 * Handles batch editing operations for nodes and choices
 */

export class BatchEditor {
  constructor(appState) {
    this.appState = appState
    this.batchEditModal = null
  }

  initialize(batchEditModalElement) {
    this.batchEditModal = batchEditModalElement
  }

  openModal() {
    if (this.appState.guiEditMode && this.appState.guiEditMode.style.display === 'none') {
      setStatus('GUI編集モードでのみ使用可能です', 'warn')
      return
    }

    if (!this.batchEditModal) return

    this.batchEditModal.style.display = 'flex'
    this.batchEditModal.classList.add('show')
  }

  closeModal() {
    if (!this.batchEditModal) return

    this.batchEditModal.style.display = 'none'
    this.batchEditModal.classList.remove('show')
  }

  applyTextReplace() {
    const searchText = document.getElementById('searchText')
    const replaceText = document.getElementById('replaceText')

    if (!searchText || !searchText.value.trim()) {
      setStatus('検索テキストを入力してください', 'warn')
      return
    }

    let replacedCount = 0
    for (const nodeId in this.appState.model.nodes) {
      const node = this.appState.model.nodes[nodeId]
      if (node.text && node.text.includes(searchText.value)) {
        node.text = node.text.replaceAll(searchText.value, replaceText?.value ?? '')
        replacedCount++
      }
    }

    if (replacedCount > 0) {
      setStatus(`${replacedCount}個のノードテキストを置換しました`, 'success')
    } else {
      setStatus('該当するテキストが見つかりませんでした', 'info')
    }
  }

  applyChoiceTextReplace() {
    const choiceSearchText = document.getElementById('choiceSearchText')
    const choiceReplaceText = document.getElementById('choiceReplaceText')

    if (!choiceSearchText || !choiceSearchText.value.trim()) {
      setStatus('検索テキストを入力してください', 'warn')
      return
    }

    let replacedCount = 0
    for (const nodeId in this.appState.model.nodes) {
      const node = this.appState.model.nodes[nodeId]
      if (!node.choices) continue

      for (const choice of node.choices) {
        if (choice.text && choice.text.includes(choiceSearchText.value)) {
          choice.text = choice.text.replaceAll(choiceSearchText.value, choiceReplaceText?.value ?? '')
          replacedCount++
        }
      }
    }

    if (replacedCount > 0) {
      setStatus(`${replacedCount}個の選択肢テキストを置換しました`, 'success')
    } else {
      setStatus('該当するテキストが見つかりませんでした', 'info')
    }
  }

  applyTargetReplace() {
    const oldTargetText = document.getElementById('oldTargetText')
    const newTargetText = document.getElementById('newTargetText')

    if (!oldTargetText || !oldTargetText.value.trim() || !newTargetText || !newTargetText.value.trim()) {
      setStatus('変更元と変更先のノードIDを入力してください', 'warn')
      return
    }

    if (!this.appState.model?.nodes?.[newTargetText.value]) {
      setStatus('変更先のノードが存在しません', 'warn')
      return
    }

    let replacedCount = 0
    for (const nodeId in this.appState.model.nodes) {
      const node = this.appState.model.nodes[nodeId]
      if (!node.choices) continue

      for (const choice of node.choices) {
        if (choice.target === oldTargetText.value) {
          choice.target = newTargetText.value
          replacedCount++
        }
      }
    }

    if (replacedCount > 0) {
      setStatus(`${replacedCount}個のターゲットを変更しました`, 'success')
    } else {
      setStatus('該当するターゲットが見つかりませんでした', 'info')
    }
  }
}

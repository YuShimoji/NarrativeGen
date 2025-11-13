/**
 * Reference Manager Module
 * Handles documentation and API reference display
 */

export class ReferenceManager {
  constructor() {
    this.referenceDocs = []
    this.currentFilter = { category: 'all', search: '' }
    this.referenceToc = null
    this.referenceContent = null
  }

  initialize(tocElement, contentElement) {
    this.referenceToc = tocElement
    this.referenceContent = contentElement
    this.loadReferenceDocs()
  }

  loadReferenceDocs() {
    // This would normally load from an external source
    // For now, we'll include the docs inline
    this.referenceDocs = [
      {
        id: 'model-structure',
        category: 'basic',
        title: 'モデルの基本構造',
        tags: ['モデル', '構造', 'JSON', 'ノード'],
        content: `
## モデルの基本構造

NarrativeGenのストーリーモデルは以下の構造を持ちます：

\`\`\`json
{
  "metadata": {
    "title": "ストーリータイトル",
    "author": "作者名",
    "version": "1.0.0"
  },
  "startNode": "start",
  "nodes": {
    "start": {
      "id": "start",
      "text": "物語の始まり",
      "choices": []
    }
  }
}
\`\`\`

### 必須フィールド

- **startNode**: 開始ノードのID
- **nodes**: ノードの辞書（キー: ノードID, 値: ノードオブジェクト）

### オプションフィールド

- **metadata**: メタデータ（タイトル、作者、バージョン等）
`
      },
      {
        id: 'node-structure',
        category: 'basic',
        title: 'ノードの構造',
        tags: ['ノード', 'テキスト', '選択肢'],
        content: `
## ノードの構造

各ノードは以下の構造を持ちます：

\`\`\`json
{
  "id": "node1",
  "text": "ノードのテキスト",
  "choices": [
    {
      "id": "choice1",
      "text": "選択肢のテキスト",
      "target": "next_node"
    }
  ]
}
\`\`\`

### フィールド説明

- **id** (必須): ノードの一意なID
- **text** (必須): ノードに表示されるテキスト
- **choices** (オプション): 選択肢の配列（空の場合はエンディング）
`
      },
      // Add more docs as needed...
    ]
  }

  renderToc() {
    if (!this.referenceToc) return

    let filteredDocs = this.referenceDocs

    // Category filter
    if (this.currentFilter.category !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.category === this.currentFilter.category)
    }

    // Search filter
    if (this.currentFilter.search.trim()) {
      const query = this.currentFilter.search.toLowerCase()
      filteredDocs = filteredDocs.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query)) ||
        doc.content.toLowerCase().includes(query)
      )
    }

    // Render TOC
    if (filteredDocs.length === 0) {
      this.referenceToc.innerHTML = `<p style="text-align: center; color: var(--color-text-muted); padding: 1rem; font-size: 0.9rem;">該当する項目がありません</p>`
      return
    }

    this.referenceToc.innerHTML = filteredDocs.map(doc => `
      <div class="ref-toc-item" data-doc-id="${doc.id}" style="padding: 0.5rem; margin-bottom: 0.25rem; cursor: pointer; border-radius: 4px; transition: all 0.2s ease; font-size: 0.9rem;">
        ${doc.title}
      </div>
    `).join('')

    // Add click handlers
    document.querySelectorAll('.ref-toc-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(59, 130, 246, 0.1)'
        item.style.color = 'var(--color-secondary)'
      })
      item.addEventListener('mouseleave', () => {
        if (!item.classList.contains('active')) {
          item.style.background = 'transparent'
          item.style.color = 'inherit'
        }
      })
      item.addEventListener('click', () => {
        document.querySelectorAll('.ref-toc-item').forEach(i => {
          i.classList.remove('active')
          i.style.background = 'transparent'
          i.style.color = 'inherit'
        })
        item.classList.add('active')
        item.style.background = 'rgba(59, 130, 246, 0.15)'
        item.style.color = 'var(--color-secondary)'
        item.style.fontWeight = '600'

        const docId = item.dataset.docId
        this.renderSingleDoc(docId)
      })
    })
  }

  renderSingleDoc(docId) {
    if (!this.referenceContent) return

    const doc = this.referenceDocs.find(d => d.id === docId)
    if (!doc) return

    this.referenceContent.innerHTML = `
      <div>
        <h2 style="margin-top: 0; color: var(--color-secondary);">${doc.title}</h2>
        <div style="margin-bottom: 1.5rem;">
          ${doc.tags.map(tag => `<span style="display: inline-block; background: rgba(59, 130, 246, 0.1); color: var(--color-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85em; margin-right: 0.5rem;">${tag}</span>`).join('')}
        </div>
        <div class="ref-content" style="line-height: 1.8; font-size: 1rem;">
          ${this.parseMarkdown(doc.content)}
        </div>
      </div>
    `

    // Scroll to top
    this.referenceContent.scrollTop = 0
  }

  parseMarkdown(markdown) {
    let html = markdown

    // 1. Code blocks (protect them first)
    const codeBlocks = []
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const index = codeBlocks.length
      const trimmedCode = code.trim()
      const isJson = lang === 'json' || (trimmedCode.startsWith('{') || trimmedCode.startsWith('['))
      const codeId = `code-${Date.now()}-${index}`

      let buttons = `
        <div style="position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.5rem; opacity: 0.8;">
          <button onclick="copyCodeToClipboard('${codeId}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: rgba(59, 130, 246, 0.8); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;" title="コピー">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            コピー
          </button>`

      if (isJson) {
        buttons += `
          <button onclick="loadJsonSample('${codeId}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: rgba(16, 185, 129, 0.8); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;" title="このサンプルを読み込む">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
            読み込む
          </button>`
      }

      buttons += `</div>`

      codeBlocks.push(`<pre id="${codeId}" style="position: relative; background: #1e1e2f; color: #e0e7ff; padding: 1rem; padding-top: 2.5rem; border-radius: 4px; overflow-x: auto; margin: 1rem 0;">${buttons}<code>${trimmedCode}</code></pre>`)
      return `__CODE_BLOCK_${index}__`
    })

    // 2. Headers
    html = html.replace(/^#### (.+)$/gm, '<h4 style="color: var(--color-text); margin-top: 1.5rem; margin-bottom: 0.75rem;">$1</h4>')
    html = html.replace(/^### (.+)$/gm, '<h3 style="color: var(--color-text); margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 style="color: var(--color-secondary); margin-top: 2.5rem; margin-bottom: 1.25rem; border-bottom: 3px solid var(--color-secondary); padding-bottom: 0.75rem;">$1</h2>')

    // 3. Lists
    html = html.replace(/^- (.+)$/gm, '<li style="margin-left: 1.5rem;">$1</li>')
    html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin: 1rem 0; padding-left: 0;">$&</ul>')

    // 4. Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.05); padding: 0.2rem 0.4rem; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>')

    // 5. Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    // 6. Paragraphs
    html = html.split('\n\n').map(para => {
      para = para.trim()
      if (para && !para.startsWith('<')) {
        return `<p style="margin: 1rem 0;">${para}</p>`
      }
      return para
    }).join('\n')

    // 7. Restore code blocks
    codeBlocks.forEach((code, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, code)
    })

    return html
  }

  setFilter(filter) {
    this.currentFilter = { ...this.currentFilter, ...filter }
    this.renderToc()
  }

  render() {
    this.renderToc()
    // Clear content area
    if (this.referenceContent) {
      this.referenceContent.innerHTML = '<p style="text-align: center; color: var(--color-text-muted); padding: 2rem; font-size: 1.1rem;">目次から項目を選択してください</p>'
    }
  }
}

// Global functions for code interaction (these would normally be handled differently)
window.copyCodeToClipboard = function(codeId) {
  const codeBlock = document.getElementById(codeId)
  if (!codeBlock) return

  const codeElement = codeBlock.querySelector('code')
  const code = codeElement.textContent

  navigator.clipboard.writeText(code).then(() => {
    // Show success feedback
    const button = codeBlock.querySelector('button[onclick*="copyCodeToClipboard"]')
    const originalText = button.innerHTML
    button.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> コピー完了！`
    button.style.background = 'rgba(16, 185, 129, 0.8)'

    setTimeout(() => {
      button.innerHTML = originalText
      button.style.background = 'rgba(59, 130, 246, 0.8)'
    }, 2000)
  }).catch(err => {
    console.error('コピーに失敗しました:', err)
    alert('クリップボードへのコピーに失敗しました')
  })
}

window.loadJsonSample = function(codeId) {
  const codeBlock = document.getElementById(codeId)
  if (!codeBlock) return

  const codeElement = codeBlock.querySelector('code')
  const jsonText = codeElement.textContent

  try {
    const jsonData = JSON.parse(jsonText)
    // This would normally integrate with the main app
    console.log('JSON sample loaded:', jsonData)
    alert('サンプルJSONをコンソールに出力しました')
  } catch (error) {
    console.error('JSON parse error:', error)
    alert('JSONの解析に失敗しました')
  }
}

import mermaid from 'mermaid'

// Mermaidプレビューモジュール
export class MermaidPreviewManager {
  constructor() {
    this.container = null
    this.mermaidContainer = null
    this.isVisible = false
    this.currentDiagramId = null

    // Zoom / pan / resize state
    this.zoomLevel = 1
    this.minZoom = 0.3
    this.maxZoom = 2
    this.zoomStep = 0.2
    this.zoomLabel = null
    this.rightPane = null
    this.isPanning = false
    this.panStartX = 0
    this.panStartY = 0
    this.panScrollLeft = 0
    this.panScrollTop = 0
  }

  // 初期化
  initialize(container) {
    this.container = container
    this.setupUI()
    this.initializeMermaid()
  }

  // UIセットアップ
  setupUI() {
    // 右側ペインの作成
    const rightPane = document.createElement('div')
    rightPane.id = 'rightPane'
    rightPane.className = 'right-pane'
    rightPane.style.cssText = `
      display: none;
      width: clamp(320px, 32%, 520px);
      background: var(--color-surface);
      border-left: 1px solid var(--color-border);
      padding: 16px;
      overflow-y: auto;
      flex-direction: column;
    `
    this.rightPane = rightPane

    // ヘッダー
    const header = document.createElement('div')
    header.className = 'right-pane-header'
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border);
    `

    const title = document.createElement('h3')
    title.textContent = 'Mermaid Preview'
    title.style.cssText = `
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text);
    `

    // ズームコントロール
    const controls = document.createElement('div')
    controls.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
    `

    const zoomOutBtn = document.createElement('button')
    zoomOutBtn.textContent = '−'
    zoomOutBtn.title = 'ズームアウト'
    zoomOutBtn.style.fontSize = '12px'
    zoomOutBtn.addEventListener('click', () => {
      this.changeZoom(-this.zoomStep)
    })

    const zoomInBtn = document.createElement('button')
    zoomInBtn.textContent = '+'
    zoomInBtn.title = 'ズームイン'
    zoomInBtn.style.fontSize = '12px'
    zoomInBtn.addEventListener('click', () => {
      this.changeZoom(this.zoomStep)
    })

    const resetBtn = document.createElement('button')
    resetBtn.textContent = '1x'
    resetBtn.title = 'ズームをリセット'
    resetBtn.style.fontSize = '12px'
    resetBtn.addEventListener('click', () => {
      this.zoomLevel = 1
      this.applyZoom()
    })

    const zoomLabel = document.createElement('span')
    zoomLabel.style.cssText = 'font-size: 11px; color: var(--color-text-muted); min-width: 3rem; text-align: right;'
    this.zoomLabel = zoomLabel
    this.updateZoomLabel()

    controls.appendChild(zoomOutBtn)
    controls.appendChild(zoomInBtn)
    controls.appendChild(resetBtn)
    controls.appendChild(zoomLabel)

    const closeBtn = document.createElement('button')
    closeBtn.innerHTML = '✕'
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
      border-radius: 4px;
    `
    closeBtn.onclick = () => this.hide()

    header.appendChild(title)
    header.appendChild(controls)
    header.appendChild(closeBtn)

    // Mermaidコンテナ
    this.mermaidContainer = document.createElement('div')
    this.mermaidContainer.id = 'mermaidContainer'
    this.mermaidContainer.style.cssText = `
      flex: 1;
      min-height: 300px;
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 16px;
      overflow: auto;
      cursor: default;
    `

    rightPane.appendChild(header)
    rightPane.appendChild(this.mermaidContainer)

    // パン操作（中クリック / Shift+左ドラッグでスクロール）
    const container = this.mermaidContainer
    container.addEventListener('mousedown', (e) => {
      if (e.button !== 1 && !(e.button === 0 && e.shiftKey)) return
      this.isPanning = true
      this.panStartX = e.clientX
      this.panStartY = e.clientY
      this.panScrollLeft = container.scrollLeft
      this.panScrollTop = container.scrollTop
      container.style.cursor = 'grabbing'
      e.preventDefault()
    })

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return
      const dx = e.clientX - this.panStartX
      const dy = e.clientY - this.panStartY
      container.scrollLeft = this.panScrollLeft - dx
      container.scrollTop = this.panScrollTop - dy
    })

    window.addEventListener('mouseup', () => {
      if (!this.isPanning) return
      this.isPanning = false
      container.style.cursor = 'default'
    })

    // マウスホイールでズーム（上で拡大・下で縮小）
    container.addEventListener(
      'wheel',
      (e) => {
        // コンテナ内のスクロールではなくズームとして扱う
        e.preventDefault()
        const delta = e.deltaY < 0 ? this.zoomStep : -this.zoomStep
        this.changeZoom(delta)
      },
      { passive: false }
    )

    // #storyContent 内にリサイズハンドル付きで追加（.app-container のレイアウトを壊さない）
    const storyContent = document.getElementById('storyContent')
    if (storyContent) {
      let resizeHandle = document.getElementById('mermaidResizeHandle')
      if (!resizeHandle) {
        resizeHandle = document.createElement('div')
        resizeHandle.id = 'mermaidResizeHandle'
        resizeHandle.style.cssText = `
          width: 4px;
          cursor: col-resize;
          align-self: stretch;
          background: transparent;
        `

        let isResizing = false
        let startX = 0
        let startWidth = 0

        resizeHandle.addEventListener('mousedown', (e) => {
          isResizing = true
          startX = e.clientX
          startWidth = rightPane.getBoundingClientRect().width
          document.body.style.cursor = 'col-resize'
          e.preventDefault()
        })

        window.addEventListener('mousemove', (e) => {
          if (!isResizing) return
          const dx = startX - e.clientX
          const minWidth = 260
          const maxWidth = Math.min(600, window.innerWidth - 320)
          let newWidth = startWidth + dx
          newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
          rightPane.style.width = `${newWidth}px`
        })

        window.addEventListener('mouseup', () => {
          if (!isResizing) return
          isResizing = false
          document.body.style.cursor = ''
        })
      }

      // storyContent の子として: サイドバー, ストーリービュー, リサイズハンドル, 右ペイン
      if (!resizeHandle.isConnected) {
        storyContent.appendChild(resizeHandle)
      }
      storyContent.appendChild(rightPane)
    } else {
      // フォールバック: .panel 内に追加
      const panel = document.querySelector('.panel')
      if (panel) {
        const contentArea = panel.querySelector('.content-area') || panel.querySelector('.tab-content.active')
        if (contentArea) {
          contentArea.style.display = 'flex'
          contentArea.style.flexDirection = 'row'
          contentArea.appendChild(rightPane)
        }
      }
    }
  }

  // Mermaid初期化
  initializeMermaid() {
    const getColor = (varName, fallback) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      return value || fallback
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        background: getColor('--color-background', '#1a1a1a'),
        primaryColor: getColor('--color-primary', '#3b82f6'),
        primaryTextColor: getColor('--color-text', '#e5e5e5'),
        primaryBorderColor: getColor('--color-border', '#404040'),
        lineColor: getColor('--color-text-muted', '#a3a3a3'),
        secondaryColor: getColor('--color-surface', '#262626'),
        tertiaryColor: getColor('--color-surface-light', '#404040'),
        mainBkg: getColor('--color-background', '#1a1a1a'),
        nodeBorder: getColor('--color-border', '#404040'),
        clusterBkg: getColor('--color-surface', '#262626'),
        clusterBorder: getColor('--color-border', '#404040'),
        defaultLinkColor: getColor('--color-text-muted', '#a3a3a3'),
        fontFamily: 'Inter, sans-serif'
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    })
  }

  // 表示
  show() {
    const rightPane = document.getElementById('rightPane')
    if (rightPane) {
      rightPane.style.display = 'flex'
      this.isVisible = true
    }
  }

  // 非表示
  hide() {
    const rightPane = document.getElementById('rightPane')
    if (rightPane) {
      rightPane.style.display = 'none'
      this.isVisible = false
    }
  }

  // モデルからMermaidダイアグラム生成
  generateDiagram(model) {
    if (!model || !model.nodes) {
      return 'graph TD\n    A[モデルがありません]'
    }

    let diagram = 'graph TD\n'

    // ノード定義
    Object.entries(model.nodes).forEach(([nodeId, node]) => {
      const label = this.escapeMermaidLabel(node.text?.substring(0, 30) || '空')
      const nodeType = this.getNodeType(node)
      const safeNodeId = this.escapeMermaidNodeId(nodeId)

      if (nodeType === 'choice') {
        diagram += `    ${safeNodeId}{${label}}\n`
      } else {
        diagram += `    ${safeNodeId}[${label}]\n`
      }
    })

    diagram += '\n'

    // エッジ定義
    Object.entries(model.nodes).forEach(([nodeId, node]) => {
      if (node.choices) {
        const safeNodeId = this.escapeMermaidNodeId(nodeId)
        node.choices.forEach((choice, index) => {
          if (choice.target && model.nodes[choice.target]) {
            const choiceLabel = choice.text?.substring(0, 20) || `選択${index + 1}`
            const escapedLabel = this.escapeMermaidLabel(choiceLabel)
            const safeTargetId = this.escapeMermaidNodeId(choice.target)
            diagram += `    ${safeNodeId} -->|${escapedLabel}| ${safeTargetId}\n`
          }
        })
      }
    })

    return diagram
  }

  // Mermaid ノード ID エスケープ（予約語を回避）
  escapeMermaidNodeId(nodeId) {
    const reservedWords = ['end', 'start', 'graph', 'subgraph', 'direction', 'click', 'style', 'class', 'classDef', 'linkStyle']
    const lowerNodeId = nodeId.toLowerCase()
    
    if (reservedWords.includes(lowerNodeId)) {
      return `node_${nodeId}`
    }
    
    if (/[^a-zA-Z0-9_]/.test(nodeId)) {
      return `node_${nodeId.replace(/[^a-zA-Z0-9_]/g, '_')}`
    }
    
    return nodeId
  }

  // Mermaidラベルエスケープ
  escapeMermaidLabel(label) {
    return label
      .replace(/"/g, "'")
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/\{/g, '(')
      .replace(/\}/g, ')')
      .replace(/\|/g, '/')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .trim()
  }

  // ノードタイプ判定
  getNodeType(node) {
    if (node.choices && node.choices.length > 0) {
      return 'choice'
    }
    return 'passage'
  }

  // ダイアグラム更新
  async updateDiagram(model) {
    if (!this.mermaidContainer || !this.isVisible) return

    try {
      const diagramCode = this.generateDiagram(model)
      this.mermaidContainer.innerHTML = ''

      // Mermaidでレンダリング
      const { svg } = await mermaid.render(`mermaid-${Date.now()}`, diagramCode)
      this.mermaidContainer.innerHTML = svg

      // SVGにスタイル適用
      const svgElement = this.mermaidContainer.querySelector('svg')
      if (svgElement) {
        svgElement.style.width = '100%'
        svgElement.style.height = 'auto'
        svgElement.style.maxWidth = '100%'
        svgElement.style.transformOrigin = '0 0'
        this.applyZoom()
      }

    } catch (error) {
      console.error('Mermaid rendering error:', error)
      this.mermaidContainer.innerHTML = `
        <div style="color: var(--color-error); padding: 16px; text-align: center;">
          ダイアグラムの生成に失敗しました<br>
          <small>${error.message}</small>
        </div>
      `
    }
  }

  // トグル表示
  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  updateZoomLabel() {
    if (this.zoomLabel) {
      this.zoomLabel.textContent = `${Math.round(this.zoomLevel * 100)}%`
    }
  }

  changeZoom(delta) {
    const next = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta))
    this.zoomLevel = next
    this.applyZoom()
  }

  applyZoom() {
    if (!this.mermaidContainer) return
    const svgElement = this.mermaidContainer.querySelector('svg')
    if (!svgElement) return
    svgElement.style.transformOrigin = '0 0'
    svgElement.style.transform = `scale(${this.zoomLevel})`
    this.updateZoomLabel()
  }
}

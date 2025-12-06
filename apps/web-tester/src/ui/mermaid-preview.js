import mermaid from 'mermaid'

// Mermaidプレビューモジュール
export class MermaidPreviewManager {
  constructor() {
    this.container = null
    this.mermaidContainer = null
    this.isVisible = false
    this.currentDiagramId = null
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
      width: 400px;
      background: var(--color-surface);
      border-left: 1px solid var(--color-border);
      padding: 16px;
      overflow-y: auto;
      flex-direction: column;
    `

    // ヘッダー
    const header = document.createElement('div')
    header.className = 'right-pane-header'
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    `

    rightPane.appendChild(header)
    rightPane.appendChild(this.mermaidContainer)

    // メインコンテナに追加
    const mainContainer = document.querySelector('.app-container')
    if (mainContainer) {
      mainContainer.style.flexDirection = 'row'
      mainContainer.appendChild(rightPane)
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
}

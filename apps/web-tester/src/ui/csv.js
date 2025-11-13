/**
 * CSV Manager Module
 * Handles CSV import/export functionality for narrative models
 */

export class CsvManager {
  constructor(appState) {
    this.appState = appState
    this.csvImportModal = null
    this.csvExportModal = null
  }

  initialize(csvImportModal, csvExportModal) {
    this.csvImportModal = csvImportModal
    this.csvExportModal = csvExportModal
  }

  // CSVインポート機能
  showCsvImportModal() {
    if (!this.csvImportModal) return

    const csvText = document.getElementById('csvImportText')
    const csvPreview = document.getElementById('csvPreview')
    const importBtn = document.getElementById('importCsvBtn')

    // モーダルを表示
    this.csvImportModal.style.display = 'block'

    // テキストエリアの変更を監視
    if (csvText) {
      csvText.addEventListener('input', (e) => {
        const csv = e.target.value
        this.previewCsvImport(csv, csvPreview)
      })
    }

    // インポートボタンのイベント
    if (importBtn) {
      importBtn.onclick = () => {
        const csv = csvText?.value || ''
        if (this.importCsv(csv)) {
          this.csvImportModal.style.display = 'none'
        }
      }
    }

    // 初期プレビュー
    this.previewCsvImport('', csvPreview)
  }

  previewCsvImport(csvText, previewElement) {
    if (!previewElement) return

    if (!csvText.trim()) {
      previewElement.innerHTML = '<p style="color: var(--color-text-muted); font-style: italic;">CSVテキストを入力してください...</p>'
      return
    }

    try {
      const parsed = this.parseCsv(csvText)
      if (parsed.length === 0) {
        previewElement.innerHTML = '<p style="color: var(--color-text-muted); font-style: italic;">有効なデータが見つかりません</p>'
        return
      }

      // プレビュー表示（最初の5行）
      const previewRows = parsed.slice(0, 5)
      const hasMore = parsed.length > 5

      let html = '<table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">'

      // ヘッダー
      html += '<thead><tr>'
      parsed[0].forEach(header => {
        html += `<th style="border: 1px solid var(--color-border); padding: 0.5rem; background: var(--color-background-secondary); font-weight: 600;">${header}</th>`
      })
      html += '</tr></thead>'

      // データ行
      html += '<tbody>'
      previewRows.forEach((row, index) => {
        html += '<tr>'
        row.forEach(cell => {
          html += `<td style="border: 1px solid var(--color-border); padding: 0.5rem;">${cell}</td>`
        })
        html += '</tr>'
      })
      html += '</tbody></table>'

      if (hasMore) {
        html += `<p style="margin-top: 1rem; color: var(--color-text-muted); font-size: 0.9rem;">... および ${parsed.length - 5} 行のデータがあります</p>`
      }

      previewElement.innerHTML = html
    } catch (error) {
      previewElement.innerHTML = `<p style="color: var(--color-error); font-weight: 600;">CSV解析エラー: ${error.message}</p>`
    }
  }

  parseCsv(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    return lines.map(line => {
      // 簡易CSVパーサー（引用符対応）
      const result = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // エスケープされた引用符
            current += '"'
            i++ // 次の文字をスキップ
          } else {
            // 引用符の開始/終了
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          // フィールドの区切り
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }

      // 最後のフィールドを追加
      result.push(current.trim())
      return result
    })
  }

  importCsv(csvText) {
    try {
      const data = this.parseCsv(csvText)
      if (data.length < 2) {
        alert('CSVデータが不足しています。最低2行以上必要です。')
        return false
      }

      // ヘッダーを確認
      const headers = data[0].map(h => h.toLowerCase())

      // 必須カラムの確認
      const requiredColumns = ['id', 'text']
      const missingColumns = requiredColumns.filter(col => !headers.includes(col))

      if (missingColumns.length > 0) {
        alert(`必須カラムが不足しています: ${missingColumns.join(', ')}`)
        return false
      }

      // データをモデルに変換
      const nodes = {}
      const startNode = data[1][headers.indexOf('id')] // 最初のノードを開始ノードとする

      for (let i = 1; i < data.length; i++) {
        const row = data[i]
        const nodeId = row[headers.indexOf('id')]
        const text = row[headers.indexOf('text')]

        if (!nodeId || !text) continue

        const node = {
          id: nodeId,
          text: text,
          choices: []
        }

        // オプションのカラム
        const choiceIndex = headers.indexOf('choices')
        if (choiceIndex >= 0 && row[choiceIndex]) {
          // choicesはJSON形式またはカンマ区切りで指定
          try {
            const choicesData = JSON.parse(row[choiceIndex])
            node.choices = choicesData
          } catch {
            // カンマ区切りとして処理
            const choiceTexts = row[choiceIndex].split(',').map(c => c.trim())
            node.choices = choiceTexts.map((choiceText, idx) => ({
              id: `choice_${idx + 1}`,
              text: choiceText,
              target: null // ターゲットは手動設定が必要
            }))
          }
        }

        nodes[nodeId] = node
      }

      // モデルを更新
      this.appState.model = {
        metadata: {
          title: 'Imported from CSV',
          author: 'CSV Import',
          version: '1.0.0'
        },
        startNode: startNode,
        nodes: nodes
      }

      alert(`CSVから${Object.keys(nodes).length}個のノードをインポートしました。`)
      return true
    } catch (error) {
      alert(`CSVインポートエラー: ${error.message}`)
      return false
    }
  }

  // CSVエクスポート機能
  showCsvExportModal() {
    if (!this.csvExportModal) return

    const csvExportText = document.getElementById('csvExportText')
    const exportBtn = document.getElementById('exportCsvBtn')

    // モーダルを表示
    this.csvExportModal.style.display = 'block'

    // CSVデータを生成して表示
    const csvData = this.generateCsv()
    if (csvExportText) {
      csvExportText.value = csvData
    }

    // エクスポートボタンのイベント
    if (exportBtn) {
      exportBtn.onclick = () => {
        this.downloadCsv(csvData)
      }
    }
  }

  generateCsv() {
    const model = this.appState.model
    if (!model || !model.nodes) {
      return 'id,text,choices\n'
    }

    const headers = ['id', 'text', 'choices']
    let csv = headers.join(',') + '\n'

    // ノードをソート（startNodeを最初に）
    const sortedNodeIds = Object.keys(model.nodes).sort((a, b) => {
      if (a === model.startNode) return -1
      if (b === model.startNode) return 1
      return a.localeCompare(b)
    })

    sortedNodeIds.forEach(nodeId => {
      const node = model.nodes[nodeId]

      // テキスト内の特殊文字をエスケープ
      const escapedText = node.text.replace(/"/g, '""').replace(/\n/g, ' ')

      // choicesをJSON形式で出力
      const choicesJson = JSON.stringify(node.choices).replace(/"/g, '""')

      const row = [
        `"${nodeId}"`,
        `"${escapedText}"`,
        `"${choicesJson}"`
      ]

      csv += row.join(',') + '\n'
    })

    return csv
  }

  downloadCsv(csvData) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'narrative_model.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // バリデーション
  validateCsv(csvText) {
    const errors = []

    try {
      const data = this.parseCsv(csvText)

      if (data.length < 2) {
        errors.push('最低2行のデータが必要です（ヘッダー + 1行以上のデータ）')
        return errors
      }

      const headers = data[0].map(h => h.toLowerCase())

      // 必須カラムのチェック
      if (!headers.includes('id')) {
        errors.push('必須カラム "id" がありません')
      }

      if (!headers.includes('text')) {
        errors.push('必須カラム "text" がありません')
      }

      // 重複IDのチェック
      const ids = []
      for (let i = 1; i < data.length; i++) {
        const row = data[i]
        const idIndex = headers.indexOf('id')

        if (idIndex >= 0) {
          const id = row[idIndex]?.trim()
          if (!id) {
            errors.push(`行${i + 1}: IDが空です`)
          } else if (ids.includes(id)) {
            errors.push(`行${i + 1}: ID "${id}" が重複しています`)
          } else {
            ids.push(id)
          }
        }
      }

    } catch (error) {
      errors.push(`CSV解析エラー: ${error.message}`)
    }

    return errors
  }
}

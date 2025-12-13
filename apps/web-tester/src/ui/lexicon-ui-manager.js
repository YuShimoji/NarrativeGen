/**
 * LexiconUIManager - 辞書UI管理クラス
 *
 * 辞書の読み込み・保存・インポート・エクスポートのUI処理を担当します。
 */

import Ajv from 'ajv'
import lexiconSchema from '../../../../Packages/engine-ts/schemas/lexicon.schema.json'
import Logger from '../core/logger.js'

export class LexiconUIManager {
  constructor() {
    this.lexiconManager = null
    this.setStatus = null
    this.applyToRuntimeLexicon = null
    this._validateLexiconSchema = null
  }

  /**
   * 初期化
   */
  initialize(lexiconManager, setStatusCallback, applyToRuntimeLexicon) {
    this.lexiconManager = lexiconManager
    this.setStatus = setStatusCallback
    this.applyToRuntimeLexicon = applyToRuntimeLexicon ?? null

    try {
      const ajv = new Ajv({ allErrors: true })
      this._validateLexiconSchema = ajv.compile(lexiconSchema)
    } catch (e) {
      Logger.warn('Failed to initialize lexicon schema validator, falling back to basic validation', e)
      this._validateLexiconSchema = null
    }
  }

  _validateLexiconOrThrow(lexicon) {
    if (this._validateLexiconSchema) {
      const ok = this._validateLexiconSchema(lexicon)
      if (!ok) {
        const errors = this._validateLexiconSchema.errors || []
        const details = errors.map(err => `${err.instancePath || '(root)'} ${err.message}`).join('\n')
        throw new Error(`無効な辞書形式です\n${details}`)
      }
      return
    }

    if (!this.lexiconManager.validateLexicon(lexicon)) {
      throw new Error('無効な辞書形式です')
    }
    for (const value of Object.values(lexicon)) {
      if (!Array.isArray(value) || value.length < 1) {
        throw new Error('無効な辞書形式です')
      }
    }
  }

  _parseAndValidateLexiconJson(jsonText) {
    const parsed = JSON.parse(jsonText || '{}')
    this._validateLexiconOrThrow(parsed)
    return parsed
  }

  /**
   * UI要素の初期化
   */
  initUI() {
    Logger.info('Initializing Lexicon UI Manager')

    // DOM要素の取得
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn')
    const lexiconTextarea = document.getElementById('lexiconTextarea')
    const lexiconLoadBtn = document.getElementById('lexiconLoadBtn')
    const lexiconMergeBtn = document.getElementById('lexiconMergeBtn')
    const lexiconReplaceBtn = document.getElementById('lexiconReplaceBtn')
    const lexiconExportBtn = document.getElementById('lexiconExportBtn')
    const lexiconImportBtn = document.getElementById('lexiconImportBtn')
    const lexiconFileInput = document.getElementById('lexiconFileInput')

    const lexiconQuickOriginal = document.getElementById('lexiconQuickOriginal')
    const lexiconQuickVariants = document.getElementById('lexiconQuickVariants')
    const lexiconQuickAddBtn = document.getElementById('lexiconQuickAddBtn')
    const lexiconQuickClearBtn = document.getElementById('lexiconQuickClearBtn')

    // Tooltip設定
    if (toggleSidebarBtn) {
      toggleSidebarBtn.title = '選択肢と状態パネルの表示/非表示を切り替えます'
    }

    // テキストエリア初期化
    if (lexiconTextarea) {
      try {
        lexiconTextarea.value = this.lexiconManager.exportAsJson()
      } catch (e) {
        Logger.warn('Failed to initialize lexicon textarea:', e)
      }
    }

    // ボタンイベントリスナー設定
    this._setupButtonListeners({
      lexiconLoadBtn,
      lexiconMergeBtn,
      lexiconReplaceBtn,
      lexiconExportBtn,
      lexiconImportBtn,
      lexiconFileInput,
      lexiconTextarea,
      lexiconQuickOriginal,
      lexiconQuickVariants,
      lexiconQuickAddBtn,
      lexiconQuickClearBtn
    })
  }

  /**
   * ボタンイベントリスナーの設定
   */
  _setupButtonListeners(elements) {
    const {
      lexiconLoadBtn,
      lexiconMergeBtn,
      lexiconReplaceBtn,
      lexiconExportBtn,
      lexiconImportBtn,
      lexiconFileInput,
      lexiconTextarea,
      lexiconQuickOriginal,
      lexiconQuickVariants,
      lexiconQuickAddBtn,
      lexiconQuickClearBtn
    } = elements

    // 読み込みボタン
    if (lexiconLoadBtn) {
      lexiconLoadBtn.addEventListener('click', () => {
        try {
          lexiconTextarea.value = this.lexiconManager.exportAsJson()
          this.setStatus('現在の辞書を読み込みました', 'success')
        } catch (e) {
          this.setStatus('辞書の読み込みに失敗しました', 'error')
          Logger.error('Lexicon load failed:', e)
        }
      })
    }

    // マージボタン
    if (lexiconMergeBtn) {
      lexiconMergeBtn.addEventListener('click', () => {
        try {
          const input = this._parseAndValidateLexiconJson(lexiconTextarea.value)
          this.lexiconManager.setLexicon(input, { merge: true })
          try {
            if (this.applyToRuntimeLexicon) {
              this.applyToRuntimeLexicon(input, { merge: true })
            }
          } catch (e) {
            Logger.warn('Failed to apply merged lexicon to runtime', e)
          }
          lexiconTextarea.value = this.lexiconManager.exportAsJson()
          this.setStatus('辞書をマージ適用しました', 'success')
        } catch (e) {
          this.setStatus(`辞書の適用に失敗しました: ${e.message}`, 'error')
          Logger.error('Lexicon merge failed:', e)
        }
      })
    }

    // 置換ボタン
    if (lexiconReplaceBtn) {
      lexiconReplaceBtn.addEventListener('click', () => {
        try {
          const input = this._parseAndValidateLexiconJson(lexiconTextarea.value)
          this.lexiconManager.setLexicon(input, { merge: false })
          try {
            if (this.applyToRuntimeLexicon) {
              this.applyToRuntimeLexicon(input, { merge: false })
            }
          } catch (e) {
            Logger.warn('Failed to apply replaced lexicon to runtime', e)
          }
          if (lexiconTextarea) {
            lexiconTextarea.value = this.lexiconManager.exportAsJson()
          }
          this.setStatus('辞書を置換適用しました', 'success')
        } catch (e) {
          this.setStatus(`辞書の適用に失敗しました: ${e.message}`, 'error')
          Logger.error('Lexicon replace failed:', e)
        }
      })
    }

    // エクスポートボタン
    if (lexiconExportBtn) {
      lexiconExportBtn.addEventListener('click', () => {
        try {
          const blob = new Blob([this.lexiconManager.exportAsJson()], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'synonyms.json'
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
          this.setStatus('辞書をエクスポートしました', 'success')
        } catch (e) {
          this.setStatus('エクスポートに失敗しました', 'error')
          Logger.error('Lexicon export failed:', e)
        }
      })
    }

    // インポートボタン
    if (lexiconImportBtn && lexiconFileInput) {
      lexiconImportBtn.addEventListener('click', () => lexiconFileInput.click())
      lexiconFileInput.addEventListener('change', (ev) => {
        const file = ev.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
          try {
            const parsed = this._parseAndValidateLexiconJson(String(reader.result))
            lexiconTextarea.value = JSON.stringify(parsed, null, 2)
            this.setStatus('辞書ファイルを読み込みました。適用ボタンで反映します', 'info')
          } catch (e) {
            this.setStatus(`辞書ファイルの読み込みに失敗しました: ${e.message}`, 'error')
            Logger.error('Lexicon import failed:', e)
          }
        }
        reader.readAsText(file)
      })
    }

    if (lexiconQuickAddBtn && lexiconQuickOriginal && lexiconQuickVariants) {
      lexiconQuickAddBtn.addEventListener('click', () => {
        try {
          const original = String(lexiconQuickOriginal.value || '').trim()
          const variants = String(lexiconQuickVariants.value || '')
            .split(/\r?\n/)
            .map(v => v.trim())
            .filter(v => v.length > 0)

          if (!original) {
            this.setStatus('原文を入力してください', 'warn')
            return
          }
          if (variants.length < 1) {
            this.setStatus('バリアントを1つ以上入力してください', 'warn')
            return
          }

          this.lexiconManager.addEntry(original, variants)
          if (lexiconTextarea) {
            lexiconTextarea.value = this.lexiconManager.exportAsJson()
          }

          try {
            if (this.applyToRuntimeLexicon) {
              this.applyToRuntimeLexicon({ [original]: variants }, { merge: true })
            }
          } catch (e) {
            Logger.warn('Failed to apply quick-added lexicon to runtime', e)
          }

          this.setStatus('辞書に追加しました', 'success')
        } catch (e) {
          this.setStatus(`辞書の追加に失敗しました: ${e.message}`, 'error')
          Logger.error('Lexicon quick add failed:', e)
        }
      })
    }

    if (lexiconQuickClearBtn && lexiconQuickOriginal && lexiconQuickVariants) {
      lexiconQuickClearBtn.addEventListener('click', () => {
        lexiconQuickOriginal.value = ''
        lexiconQuickVariants.value = ''
        this.setStatus('入力をクリアしました', 'info')
      })
    }
  }

  /**
   * CSVプレビューの表示
   */
  showCsvPreview(file, csvFileNameElement) {
    if (!csvFileNameElement) return

    csvFileNameElement.textContent = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.trim().split(/\r?\n/).slice(0, 11) // First 10 lines + header
      const table = document.createElement('table')
      table.className = 'csv-table'

      lines.forEach((line, index) => {
        const row = document.createElement('tr')
        const cells = this._parseCsvLine(line, line.includes('\t') ? '\t' : ',')
        cells.forEach(cell => {
          const cellEl = document.createElement(index === 0 ? 'th' : 'td')
          cellEl.textContent = cell
          row.appendChild(cellEl)
        })
        table.appendChild(row)
      })

      if (lines.length >= 11) {
        const row = document.createElement('tr')
        const cell = document.createElement('td')
        cell.colSpan = lines[0].split(line.includes('\t') ? '\t' : ',').length
        cell.textContent = '... (以降省略)'
        cell.style.textAlign = 'center'
        cell.style.fontStyle = 'italic'
        row.appendChild(cell)
        table.appendChild(row)
      }

      // 既存のテーブルを置き換え
      const existingTable = csvFileNameElement.parentNode.querySelector('.csv-table')
      if (existingTable) {
        existingTable.replaceWith(table)
      } else {
        csvFileNameElement.parentNode.appendChild(table)
      }
    }
    reader.readAsText(file)
  }

  /**
   * CSV行のパース
   */
  _parseCsvLine(line, delimiter = ',') {
    const cells = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i += 2
        } else {
          inQuotes = !inQuotes
          i++
        }
      } else if (char === delimiter && !inQuotes) {
        cells.push(current)
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }
    cells.push(current)
    return cells
  }
}

export default LexiconUIManager

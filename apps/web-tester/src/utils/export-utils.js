/**
 * ExportUtils - エンディング可視化エクスポート機能
 * 
 * 各種形式でのエクスポート:
 * - エンディング構造のテキストエクスポート
 * - 条件リストのCSVエクスポート
 * - 可視化グラフのPNG/SVGエクスポート
 * - 統計情報のJSONエクスポート
 * - レポート形式のPDFエクスポート（html2canvas + jsPDF使用）
 */

import { downloadFile, exportJson, exportCsv } from './file-utils.js'

/**
 * エンディング分析結果をテキスト形式でエクスポート
 */
export function exportEndingStructureAsText(analysisResult, modelName = 'model') {
  if (!analysisResult) return

  const lines = []
  const timestamp = new Date().toISOString()

  lines.push('='.repeat(60))
  lines.push(`マルチエンディング構造レポート`)
  lines.push(`モデル: ${modelName}`)
  lines.push(`生成日時: ${timestamp}`)
  lines.push('='.repeat(60))
  lines.push('')

  // サマリー
  lines.push('【サマリー】')
  lines.push(`  総エンディング数: ${analysisResult.totalEndings}`)
  lines.push(`  到達可能: ${analysisResult.reachableEndings}`)
  lines.push(`  到達不能: ${analysisResult.unreachableEndings}`)
  lines.push(`  総パス数: ${analysisResult.totalPaths}`)
  lines.push(`  平均複雑度: ${analysisResult.avgComplexity}`)
  lines.push(`  最大複雑度: ${analysisResult.maxComplexity}`)
  lines.push(`  分析時間: ${analysisResult.analysisTime?.toFixed(0) || 0}ms`)
  lines.push('')

  // 各エンディングの詳細
  lines.push('【エンディング詳細】')
  lines.push('-'.repeat(60))

  for (const ending of analysisResult.endings || []) {
    lines.push('')
    lines.push(`■ ${ending.endingId}`)
    lines.push(`  テキスト: ${(ending.endingText || '').substring(0, 50)}...`)
    lines.push(`  パス数: ${ending.pathCount}`)
    lines.push(`  複雑度: ${ending.complexity}`)
    lines.push(`  到達可能: ${ending.isReachable ? 'はい' : 'いいえ'}`)

    if (ending.unreachableReasons && ending.unreachableReasons.length > 0) {
      lines.push(`  到達不能理由:`)
      for (const reason of ending.unreachableReasons) {
        lines.push(`    - ${reason}`)
      }
    }

    // パス情報
    if (ending.paths && ending.paths.length > 0) {
      lines.push(`  パス一覧 (最大5件):`)
      for (let i = 0; i < Math.min(5, ending.paths.length); i++) {
        const path = ending.paths[i]
        lines.push(`    ${i + 1}. ${path.nodes.join(' → ')}`)
        if (path.conditionCount > 0) {
          lines.push(`       条件数: ${path.conditionCount}`)
        }
      }
      if (ending.paths.length > 5) {
        lines.push(`    ... 他 ${ending.paths.length - 5} パス`)
      }
    }

    // 条件情報
    if (ending.allConditions && ending.allConditions.length > 0) {
      lines.push(`  使用条件:`)
      for (const condEntry of ending.allConditions.slice(0, 5)) {
        const cond = condEntry.condition
        lines.push(`    - ${formatConditionForText(cond)} (${condEntry.usageCount}回使用)`)
      }
      if (ending.allConditions.length > 5) {
        lines.push(`    ... 他 ${ending.allConditions.length - 5} 条件`)
      }
    }
  }

  lines.push('')
  lines.push('='.repeat(60))
  lines.push('レポート終了')

  const content = lines.join('\n')
  const filename = `ending-structure-${modelName}-${formatDateForFilename()}.txt`
  downloadFile(content, filename, 'text/plain')
}

/**
 * 条件リストをCSV形式でエクスポート
 */
export function exportConditionsAsCsv(analysisResult, modelName = 'model') {
  if (!analysisResult) return

  const rows = [
    ['エンディングID', '条件タイプ', '条件キー', '条件値', '使用回数', '関連パス数']
  ]

  for (const ending of analysisResult.endings || []) {
    for (const condEntry of ending.allConditions || []) {
      const cond = condEntry.condition
      rows.push([
        ending.endingId,
        cond.type || 'unknown',
        cond.key || cond.flag || cond.name || '',
        String(cond.value ?? ''),
        String(condEntry.usageCount),
        String(condEntry.paths?.length || 0)
      ])
    }
  }

  const filename = `ending-conditions-${modelName}-${formatDateForFilename()}.csv`
  exportCsv(rows, filename)
}

/**
 * 統計情報をJSON形式でエクスポート
 */
export function exportStatsAsJson(statsData, modelName = 'model') {
  if (!statsData) return

  const exportData = {
    exportedAt: new Date().toISOString(),
    modelName,
    ...statsData
  }

  const filename = `ending-stats-${modelName}-${formatDateForFilename()}.json`
  exportJson(exportData, filename)
}

/**
 * 可視化グラフをPNG形式でエクスポート
 * @param {HTMLElement} element - キャプチャする要素
 * @param {string} filename - ファイル名
 */
export async function exportVisualizationAsPng(element, filename = 'ending-visualization.png') {
  if (!element) {
    console.warn('Export element not found')
    return false
  }

  try {
    // html2canvasを動的にロード
    const html2canvas = await loadHtml2Canvas()
    if (!html2canvas) {
      console.warn('html2canvas not available, using fallback')
      return exportVisualizationAsSvgFallback(element, filename.replace('.png', '.svg'))
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true
    })

    canvas.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, filename, 'image/png')
      }
    }, 'image/png')

    return true
  } catch (error) {
    console.error('PNG export failed:', error)
    return false
  }
}

/**
 * 可視化グラフをSVG形式でエクスポート（フォールバック）
 */
export function exportVisualizationAsSvgFallback(element, filename = 'ending-visualization.svg') {
  if (!element) return false

  try {
    // 簡易的なSVG生成（テキストベース）
    const rect = element.getBoundingClientRect()
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml">
      ${element.innerHTML}
    </div>
  </foreignObject>
</svg>`

    downloadFile(svgContent, filename, 'image/svg+xml')
    return true
  } catch (error) {
    console.error('SVG export failed:', error)
    return false
  }
}

/**
 * レポートをPDF形式でエクスポート
 */
export async function exportReportAsPdf(analysisResult, statsData, modelName = 'model') {
  if (!analysisResult) return false

  try {
    const jsPDF = await loadJsPdf()
    if (!jsPDF) {
      console.warn('jsPDF not available, falling back to text export')
      exportEndingStructureAsText(analysisResult, modelName)
      return false
    }

    const doc = new jsPDF()
    let yPos = 20

    // タイトル
    doc.setFontSize(18)
    doc.text('マルチエンディング分析レポート', 20, yPos)
    yPos += 15

    // メタ情報
    doc.setFontSize(10)
    doc.text(`モデル: ${modelName}`, 20, yPos)
    yPos += 7
    doc.text(`生成日時: ${new Date().toISOString()}`, 20, yPos)
    yPos += 15

    // サマリー
    doc.setFontSize(14)
    doc.text('サマリー', 20, yPos)
    yPos += 10

    doc.setFontSize(10)
    const summaryLines = [
      `総エンディング数: ${analysisResult.totalEndings}`,
      `到達可能: ${analysisResult.reachableEndings}`,
      `到達不能: ${analysisResult.unreachableEndings}`,
      `総パス数: ${analysisResult.totalPaths}`,
      `平均複雑度: ${analysisResult.avgComplexity}`,
      `分析時間: ${analysisResult.analysisTime?.toFixed(0) || 0}ms`
    ]

    for (const line of summaryLines) {
      doc.text(line, 25, yPos)
      yPos += 6
    }
    yPos += 10

    // エンディング一覧
    doc.setFontSize(14)
    doc.text('エンディング一覧', 20, yPos)
    yPos += 10

    doc.setFontSize(9)
    for (const ending of (analysisResult.endings || []).slice(0, 10)) {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }

      doc.text(`${ending.endingId}: ${ending.pathCount}パス, 複雑度${ending.complexity}`, 25, yPos)
      yPos += 5
    }

    if ((analysisResult.endings || []).length > 10) {
      doc.text(`... 他 ${analysisResult.endings.length - 10} エンディング`, 25, yPos)
    }

    const filename = `ending-report-${modelName}-${formatDateForFilename()}.pdf`
    doc.save(filename)

    return true
  } catch (error) {
    console.error('PDF export failed:', error)
    return false
  }
}

/**
 * 全形式を一括エクスポート
 */
export async function exportAll(analysisResult, statsData, element, modelName = 'model') {
  const results = {
    text: false,
    csv: false,
    json: false,
    png: false,
    pdf: false
  }

  try {
    exportEndingStructureAsText(analysisResult, modelName)
    results.text = true
  } catch (e) {
    console.error('Text export failed:', e)
  }

  try {
    exportConditionsAsCsv(analysisResult, modelName)
    results.csv = true
  } catch (e) {
    console.error('CSV export failed:', e)
  }

  try {
    exportStatsAsJson(statsData, modelName)
    results.json = true
  } catch (e) {
    console.error('JSON export failed:', e)
  }

  try {
    results.png = await exportVisualizationAsPng(element, `ending-visualization-${modelName}-${formatDateForFilename()}.png`)
  } catch (e) {
    console.error('PNG export failed:', e)
  }

  try {
    results.pdf = await exportReportAsPdf(analysisResult, statsData, modelName)
  } catch (e) {
    console.error('PDF export failed:', e)
  }

  return results
}

// ヘルパー関数

/**
 * 条件をテキスト形式にフォーマット
 */
function formatConditionForText(condition) {
  if (!condition) return ''

  if (condition.type === 'flag') {
    return `flag:${condition.key || condition.flag}=${condition.value}`
  }
  if (condition.type === 'resource') {
    return `resource:${condition.key}${condition.op || '>='}${condition.value}`
  }
  if (condition.type === 'variable') {
    return `variable:${condition.key}${condition.op || '='}${condition.value}`
  }
  if (condition.type === 'timeWindow') {
    return `time:${condition.start}-${condition.end}`
  }

  return JSON.stringify(condition)
}

/**
 * ファイル名用の日時フォーマット
 */
function formatDateForFilename() {
  const now = new Date()
  return now.toISOString().replace(/[:.]/g, '-').substring(0, 19)
}

/**
 * html2canvasを動的ロード
 */
async function loadHtml2Canvas() {
  if (typeof window !== 'undefined' && window.html2canvas) {
    return window.html2canvas
  }

  try {
    // CDNから動的ロード
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      script.onload = () => resolve(window.html2canvas)
      script.onerror = () => resolve(null)
      document.head.appendChild(script)
    })
  } catch (e) {
    console.warn('Failed to load html2canvas:', e)
    return null
  }
}

/**
 * jsPDFを動的ロード
 */
async function loadJsPdf() {
  if (typeof window !== 'undefined' && window.jspdf?.jsPDF) {
    return window.jspdf.jsPDF
  }

  try {
    // CDNから動的ロード
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.onload = () => resolve(window.jspdf?.jsPDF)
      script.onerror = () => resolve(null)
      document.head.appendChild(script)
    })
  } catch (e) {
    console.warn('Failed to load jsPDF:', e)
    return null
  }
}

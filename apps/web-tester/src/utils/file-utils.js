/**
 * ファイル操作ユーティリティモジュール
 * @module utils/file-utils
 */

/**
 * ファイルをダウンロード
 * @param {Blob|string} content - ファイル内容
 * @param {string} filename - ファイル名
 * @param {string} mimeType - MIMEタイプ
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // メモリリーク防止
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * ファイルを読み込みテキストとして取得
 * @param {File} file - Fileオブジェクト
 * @returns {Promise<string>} ファイル内容
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}

/**
 * ファイルをJSONとしてパース
 * @param {File} file - Fileオブジェクト
 * @returns {Promise<Object>} パースされたJSON
 */
export async function readFileAsJson(file) {
  const text = await readFileAsText(file)
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`JSONの解析に失敗しました: ${error.message}`)
  }
}

/**
 * テキストをJSONとしてパース（安全）
 * @param {string} text - JSONテキスト
 * @param {string} filename - ファイル名（エラーメッセージ用）
 * @returns {Object} パースされたJSON
 */
export function parseJsonSafe(text, filename = 'file') {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`${filename}のJSON形式が正しくありません: ${error.message}`)
  }
}

/**
 * CSVファイルをパース
 * @param {string} text - CSVテキスト
 * @param {string} delimiter - 区切り文字
 * @returns {string[][]} パースされたCSVデータ
 */
export function parseCsv(text, delimiter = ',') {
  const lines = text.trim().split(/\r?\n/)
  return lines.map(line => parseCsvLine(line, delimiter))
}

/**
 * CSVの1行をパース
 * @param {string} line - CSVの行
 * @param {string} delimiter - 区切り文字
 * @returns {string[]} パースされたセルデータ
 */
export function parseCsvLine(line, delimiter = ',') {
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
    } else if (char === delimiter && !inQuotes) {
      // 区切り文字（引用符外）
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

/**
 * JSONデータをエクスポート
 * @param {Object} data - エクスポートするデータ
 * @param {string} filename - ファイル名
 */
export function exportJson(data, filename) {
  const json = JSON.stringify(data, null, 2)
  downloadFile(json, filename, 'application/json')
}

/**
 * CSVデータをエクスポート
 * @param {string[][]} data - CSVデータ
 * @param {string} filename - ファイル名
 */
export function exportCsv(data, filename) {
  const csv = data.map(row =>
    row.map(cell => {
      // 引用符や区切り文字を含む場合は引用符で囲む
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`
      }
      return cell
    }).join(',')
  ).join('\n')

  downloadFile(csv, filename, 'text/csv')
}

/**
 * ファイルサイズを人間可読形式に変換
 * @param {number} bytes - バイト数
 * @returns {string} フォーマットされたサイズ
 */
export function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * ファイルタイプを検証
 * @param {File} file - Fileオブジェクト
 * @param {string[]} allowedTypes - 許可されたMIMEタイプ
 * @returns {boolean} 有効な場合true
 */
export function validateFileType(file, allowedTypes) {
  return allowedTypes.includes(file.type) ||
         allowedTypes.some(type => file.name.toLowerCase().endsWith(type.replace('*', '')))
}

/**
 * ファイル名から拡張子を取得
 * @param {string} filename - ファイル名
 * @returns {string} 拡張子（小文字、ドットなし）
 */
export function getFileExtension(filename) {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

/**
 * 一時ファイルURLを作成
 * @param {Blob|File} blob - BlobまたはFileオブジェクト
 * @returns {string} オブジェクトURL
 */
export function createObjectUrl(blob) {
  return URL.createObjectURL(blob)
}

/**
 * 一時ファイルURLを解放
 * @param {string} url - オブジェクトURL
 */
export function revokeObjectUrl(url) {
  URL.revokeObjectURL(url)
}

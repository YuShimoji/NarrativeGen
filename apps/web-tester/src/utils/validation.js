/**
 * バリデーションユーティリティモジュール
 * @module utils/validation
 */

/**
 * 文字列が空でないことを確認
 * @param {string} str - チェックする文字列
 * @param {string} fieldName - フィールド名（エラーメッセージ用）
 * @returns {boolean} 有効な場合true
 * @throws {Error} 無効な場合のエラー
 */
export function validateNotEmpty(str, fieldName = 'value') {
  if (typeof str !== 'string' || str.trim().length === 0) {
    throw new Error(`${fieldName}は必須です`)
  }
  return true
}

/**
 * 文字列の長さを検証
 * @param {string} str - チェックする文字列
 * @param {Object} options - オプション
 * @param {number} [options.min] - 最小長
 * @param {number} [options.max] - 最大長
 * @param {string} fieldName - フィールド名
 * @returns {boolean} 有効な場合true
 * @throws {Error} 無効な場合のエラー
 */
export function validateLength(str, options = {}, fieldName = 'value') {
  const { min, max } = options
  const length = str.length

  if (min !== undefined && length < min) {
    throw new Error(`${fieldName}は${min}文字以上である必要があります`)
  }

  if (max !== undefined && length > max) {
    throw new Error(`${fieldName}は${max}文字以下である必要があります`)
  }

  return true
}

/**
 * JSON文字列の妥当性を検証
 * @param {string} jsonStr - JSON文字列
 * @param {string} fieldName - フィールド名
 * @returns {boolean} 有効な場合true
 * @throws {Error} 無効な場合のエラー
 */
export function validateJson(jsonStr, fieldName = 'JSON') {
  try {
    JSON.parse(jsonStr)
    return true
  } catch (error) {
    throw new Error(`${fieldName}の形式が正しくありません: ${error.message}`)
  }
}

/**
 * ファイル拡張子を検証
 * @param {string} filename - ファイル名
 * @param {string[]} allowedExtensions - 許可された拡張子（ドットなし）
 * @param {string} fieldName - フィールド名
 * @returns {boolean} 有効な場合true
 * @throws {Error} 無効な場合のエラー
 */
export function validateFileExtension(filename, allowedExtensions, fieldName = 'file') {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error(`${fieldName}は${allowedExtensions.join(', ')}ファイルである必要があります`)
  }
  return true
}

/**
 * オブジェクトの構造を検証
 * @param {Object} obj - 検証するオブジェクト
 * @param {Object} schema - 検証スキーマ
 * @param {string} fieldName - フィールド名
 * @returns {boolean} 有効な場合true
 * @throws {Error} 無効な場合のエラー
 */
export function validateObject(obj, schema, fieldName = 'object') {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error(`${fieldName}はオブジェクトである必要があります`)
  }

  for (const [key, validator] of Object.entries(schema)) {
    if (!(key in obj)) {
      throw new Error(`${fieldName}に${key}が含まれていません`)
    }

    try {
      validator(obj[key], `${fieldName}.${key}`)
    } catch (error) {
      throw error
    }
  }

  return true
}

/**
 * URLの妥当性を検証
 * @param {string} url - URL文字列
 * @param {string} fieldName - フィールド名
 * @returns {boolean} 有効な場合true
 * @throws {Error} 無効な場合のエラー
 */
export function validateUrl(url, fieldName = 'URL') {
  try {
    new URL(url)
    return true
  } catch {
    throw new Error(`${fieldName}の形式が正しくありません`)
  }
}

/**
 * 数値の範囲を検証
 * @param {number} value - 数値
 * @param {Object} options - オプション
 * @param {number} [options.min] - 最小値
 * @param {number} [options.max] - 最大値
 * @param {string} fieldName - フィールド名
 * @returns {boolean} 有効な場合true
 * @throws {Error} 無効な場合のエラー
 */
export function validateNumber(value, options = {}, fieldName = 'value') {
  const { min, max } = options

  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${fieldName}は数値である必要があります`)
  }

  if (min !== undefined && value < min) {
    throw new Error(`${fieldName}は${min}以上である必要があります`)
  }

  if (max !== undefined && value > max) {
    throw new Error(`${fieldName}は${max}以下である必要があります`)
  }

  return true
}

/**
 * 配列の検証
 * @param {Array} arr - 配列
 * @param {Object} options - オプション
 * @param {number} [options.minLength] - 最小長
 * @param {number} [options.maxLength] - 最大長
 * @param {Function} [options.itemValidator] - 各要素のバリデータ
 * @param {string} fieldName - フィールド名
 * @returns {boolean} 有効な場合true
 * @throws {Error} 無効な場合のエラー
 */
export function validateArray(arr, options = {}, fieldName = 'array') {
  const { minLength, maxLength, itemValidator } = options

  if (!Array.isArray(arr)) {
    throw new Error(`${fieldName}は配列である必要があります`)
  }

  if (minLength !== undefined && arr.length < minLength) {
    throw new Error(`${fieldName}は${minLength}個以上の要素を含む必要があります`)
  }

  if (maxLength !== undefined && arr.length > maxLength) {
    throw new Error(`${fieldName}は${maxLength}個以下の要素を含む必要があります`)
  }

  if (itemValidator) {
    arr.forEach((item, index) => {
      try {
        itemValidator(item, `${fieldName}[${index}]`)
      } catch (error) {
        throw error
      }
    })
  }

  return true
}

/**
 * バリデーション結果をまとめる
 * @param {Function} validator - バリデータ関数
 * @param {*} value - 検証する値
 * @param {string} fieldName - フィールド名
 * @returns {Object} 結果オブジェクト
 */
export function validateWithResult(validator, value, fieldName) {
  try {
    validator(value, fieldName)
    return { valid: true, error: null }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

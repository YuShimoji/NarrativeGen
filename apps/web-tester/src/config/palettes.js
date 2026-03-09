/**
 * カラーパレット定義
 * @module config/palettes
 */

export const COLOR_PALETTES = {
  default: {
    name: 'モダンクラシカル',
    colors: {
      '--color-primary': '#8b9daf',
      '--color-primary-dark': '#6e8295',
      '--color-secondary': '#9b8b7a',
      '--color-secondary-dark': '#7d6e5e',
      '--color-text': '#e8e6e3',
      '--color-text-muted': '#98989d',
      '--color-background': '#1c1c1e',
      '--color-surface': '#2c2c2e',
      '--color-surface-light': '#3a3a3c',
      '--color-border': '#48484a',
      '--color-hover': '#3a3a3e',
      '--color-success': '#6b9b7e',
      '--color-warning': '#c4a35a',
      '--color-error': '#b87070',
    }
  },
  classic: {
    name: 'クラシック',
    colors: {
      '--color-primary': '#5a67d8',
      '--color-primary-dark': '#6b46c1',
      '--color-secondary': '#2563eb',
      '--color-secondary-dark': '#1e40af',
      '--color-text': '#ffffff',
      '--color-text-muted': '#cbd5e1',
      '--color-background': '#1a1a2e',
      '--color-surface': '#16213e',
      '--color-border': '#334155',
    }
  },
  gray: {
    name: 'ミニマルグレー',
    colors: {
      '--color-primary': '#4B5563',
      '--color-primary-dark': '#374151',
      '--color-secondary': '#6B7280',
      '--color-secondary-dark': '#4B5563',
      '--color-text': '#ffffff',
      '--color-text-muted': '#cbd5e1',
      '--color-background': '#0f172a',
      '--color-surface': '#1e293b',
      '--color-border': '#334155',
    }
  },
  green: {
    name: 'フォレストグリーン',
    colors: {
      '--color-primary': '#059669',
      '--color-primary-dark': '#047857',
      '--color-secondary': '#10B981',
      '--color-secondary-dark': '#059669',
      '--color-text': '#ffffff',
      '--color-text-muted': '#cbd5e1',
      '--color-background': '#0f172a',
      '--color-surface': '#1e293b',
      '--color-border': '#334155',
    }
  },
  blue: {
    name: 'オーシャンブルー',
    colors: {
      '--color-primary': '#0284C7',
      '--color-primary-dark': '#0369A1',
      '--color-secondary': '#0EA5E9',
      '--color-secondary-dark': '#0284C7',
      '--color-text': '#ffffff',
      '--color-text-muted': '#cbd5e1',
      '--color-background': '#1e293b',
      '--color-surface': '#334155',
      '--color-border': '#475569',
    }
  },
  orange: {
    name: 'サンセットオレンジ',
    colors: {
      '--color-primary': '#EA580C',
      '--color-primary-dark': '#C2410C',
      '--color-secondary': '#F97316',
      '--color-secondary-dark': '#EA580C',
      '--color-text': '#ffffff',
      '--color-text-muted': '#cbd5e1',
      '--color-background': '#1a1a2e',
      '--color-surface': '#16213e',
      '--color-border': '#334155',
    }
  },
  purple: {
    name: 'ラベンダーパープル',
    colors: {
      '--color-primary': '#8B5CF6',
      '--color-primary-dark': '#7C3AED',
      '--color-secondary': '#A78BFA',
      '--color-secondary-dark': '#8B5CF6',
      '--color-text': '#ffffff',
      '--color-text-muted': '#cbd5e1',
      '--color-background': '#1e293b',
      '--color-surface': '#334155',
      '--color-border': '#475569',
    }
  }
}

/**
 * パレットキーのリストを取得
 * @returns {string[]} パレットキーの配列
 */
export function getPaletteKeys() {
  return Object.keys(COLOR_PALETTES)
}

/**
 * パレット定義を取得
 * @param {string} key - パレットキー
 * @returns {Object|null} パレット定義、存在しない場合はnull
 */
export function getPalette(key) {
  return COLOR_PALETTES[key] || null
}

/**
 * すべてのパレットを取得
 * @returns {Object} すべてのパレット定義
 */
export function getAllPalettes() {
  return { ...COLOR_PALETTES }
}

/**
 * NarrativeGen Web Tester - Constants Configuration
 * 
 * アプリケーション全体で使用される定数を集約管理
 * 
 * @module constants
 */

// ============================================================================
// Save/Load System Constants
// ============================================================================

/**
 * セーブスロットの数
 * @constant {number}
 */
export const SAVE_SLOTS = 5

/**
 * セーブスロットのlocalStorageキープレフィックス
 * @constant {string}
 */
export const SAVE_KEY_PREFIX = 'narrativeGen_save_slot_'

/**
 * オートセーブのlocalStorageキー
 * @constant {string}
 */
export const AUTOSAVE_KEY = 'narrativeGen_autosave'

/**
 * キーバインド設定のlocalStorageキー
 * @constant {string}
 */
export const KEY_BINDINGS_STORAGE_KEY = 'narrativeGenKeyBindings'

/**
 * アドバンス機能有効化フラグのlocalStorageキー
 * @constant {string}
 */
export const ADVANCED_ENABLED_STORAGE_KEY = 'narrativeGenAdvancedEnabled'

/**
 * ドラフトモデルのlocalStorageキー
 * @constant {string}
 */
export const DRAFT_MODEL_STORAGE_KEY = 'draft_model'

// ============================================================================
// Node Templates for Quick Creation
// ============================================================================

/**
 * クイックノード作成用のテンプレート定義
 * @constant {Object.<string, Object>}
 */
export const NODE_TEMPLATES = {
  conversation: { 
    text: '「会話テキストをここに入力」', 
    choices: [] 
  },
  choice: { 
    text: '選択肢の説明をここに入力', 
    choices: [
      { id: 'choice1', text: '選択肢1', target: '' },
      { id: 'choice2', text: '選択肢2', target: '' }
    ] 
  },
  info: { 
    text: '状況説明をここに入力', 
    choices: [] 
  },
  action: { 
    text: 'イベントの説明をここに入力', 
    choices: [] 
  },
  branch: { 
    text: '分岐ポイント', 
    choices: [
      { id: 'path_a', text: 'ルートA', target: '', conditions: [] },
      { id: 'path_b', text: 'ルートB', target: '', conditions: [] }
    ] 
  },
  ending: { 
    text: 'エンディングのテキスト', 
    choices: [] 
  },
  blank: { 
    text: '', 
    choices: [] 
  }
}

// ============================================================================
// UI Constants
// ============================================================================

/**
 * ステータスメッセージの表示時間（ミリ秒）
 * @constant {number}
 */
export const STATUS_MESSAGE_DURATION = 3000

/**
 * オートセーブの間隔（ミリ秒）
 * @constant {number}
 */
export const AUTOSAVE_INTERVAL = 30000  // 30秒

/**
 * ノードID生成時のプレフィックス
 * @constant {string}
 */
export const NODE_ID_PREFIX = 'node_'

/**
 * グラフの最大ノード数（仮想化しきい値）
 * @constant {number}
 */
export const GRAPH_VIRTUALIZATION_THRESHOLD = 100

/**
 * ストーリーログの仮想スクロール開始行数
 * @constant {number}
 */
export const STORY_LOG_VIRTUAL_SCROLL_THRESHOLD = 50

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * ノードIDの最大長
 * @constant {number}
 */
export const MAX_NODE_ID_LENGTH = 100

/**
 * ノードテキストの最大長
 * @constant {number}
 */
export const MAX_NODE_TEXT_LENGTH = 10000

/**
 * 選択肢テキストの最大長
 * @constant {number}
 */
export const MAX_CHOICE_TEXT_LENGTH = 500

// ============================================================================
// CSV Import/Export Constants
// ============================================================================

/**
 * CSVインポートのチャンクサイズ（行数）
 * @constant {number}
 */
export const CSV_IMPORT_CHUNK_SIZE = 100

/**
 * CSVエクスポートのデフォルトファイル名
 * @constant {string}
 */
export const CSV_EXPORT_DEFAULT_FILENAME = 'narrative_model.csv'

// ============================================================================
// AI Provider Constants
// ============================================================================

/**
 * AI リクエストのタイムアウト（ミリ秒）
 * @constant {number}
 */
export const AI_REQUEST_TIMEOUT = 30000  // 30秒

/**
 * AI 生成テキストの最大長
 * @constant {number}
 */
export const AI_MAX_GENERATION_LENGTH = 1000

// ============================================================================
// Default Values
// ============================================================================

/**
 * デフォルトのモデル名
 * @constant {string}
 */
export const DEFAULT_MODEL_NAME = 'untitled'

/**
 * デフォルトの開始ノードID
 * @constant {string}
 */
export const DEFAULT_START_NODE = 'start'

/**
 * デフォルトのグラフノード形状
 * @constant {string}
 */
export const DEFAULT_GRAPH_NODE_SHAPE = 'circle'

/**
 * デフォルトのグラフフォントサイズ
 * @constant {number}
 */
export const DEFAULT_GRAPH_FONT_SIZE = 12

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * 実験的機能の有効化フラグ
 * @constant {boolean}
 */
export const ENABLE_EXPERIMENTAL_FEATURES = false

/**
 * デバッグモードの有効化フラグ（開発環境のみ）
 * @constant {boolean}
 */
export const DEBUG_MODE = import.meta.env.MODE === 'development'

// ============================================================================
// Export all constants as a single object (optional)
// ============================================================================

export default {
  SAVE_SLOTS,
  SAVE_KEY_PREFIX,
  AUTOSAVE_KEY,
  KEY_BINDINGS_STORAGE_KEY,
  ADVANCED_ENABLED_STORAGE_KEY,
  DRAFT_MODEL_STORAGE_KEY,
  NODE_TEMPLATES,
  STATUS_MESSAGE_DURATION,
  AUTOSAVE_INTERVAL,
  GRAPH_VIRTUALIZATION_THRESHOLD,
  STORY_LOG_VIRTUAL_SCROLL_THRESHOLD,
  MAX_NODE_ID_LENGTH,
  MAX_NODE_TEXT_LENGTH,
  MAX_CHOICE_TEXT_LENGTH,
  CSV_IMPORT_CHUNK_SIZE,
  CSV_EXPORT_DEFAULT_FILENAME,
  AI_REQUEST_TIMEOUT,
  AI_MAX_GENERATION_LENGTH,
  DEFAULT_MODEL_NAME,
  DEFAULT_START_NODE,
  DEFAULT_GRAPH_NODE_SHAPE,
  DEFAULT_GRAPH_FONT_SIZE,
  ENABLE_EXPERIMENTAL_FEATURES,
  DEBUG_MODE
}

# Web Tester UI リファクタリング計画

## 📋 現状分析

### 問題点
1. **巨大な単一ファイル**: `main.js`が4369行で保守性が低い
2. **グローバル汚染**: 多数のグローバル変数が散在
3. **責任の分散**: 機能が混在し、変更時の影響範囲が不明確
4. **テストの困難性**: 密結合により単体テストが困難
5. **パレット機能の不具合**: インラインスタイルとCSS変数の混在

### エラー履歴
- `main.js:1893 Uncaught ReferenceError: guiEditBtn is not defined`
  - 原因: 重複宣言削除時に必要な宣言まで削除
  - 修正: ✅ 504行目に宣言を復元
- パレット変更時にテーマボタンの色が更新されない
  - 原因: インラインスタイルでハードコード
  - 修正: ✅ CSS変数ベースのクラススタイルに変更

## 🎯 リファクタリング目標

### 短期目標（Phase 1）
1. モジュール分割による責任の明確化
2. 状態管理の一元化
3. DOM操作の抽象化
4. イベント管理の統一

### 中期目標（Phase 2）
1. TypeScript化による型安全性の向上
2. テストカバレッジの向上
3. パフォーマンス最適化
4. アクセシビリティの改善

### 長期目標（Phase 3）
1. コンポーネントベースアーキテクチャへの移行
2. 状態管理ライブラリの導入検討
3. ビルドプロセスの最適化

## 🏗️ アーキテクチャ設計

### モジュール構成

```
apps/web-tester/
├── main.js                 # エントリーポイント（軽量化）
├── src/
│   ├── config/
│   │   ├── constants.js    # 定数定義
│   │   ├── palettes.js     # カラーパレット定義
│   │   └── keybindings.js  # キーバインド設定
│   ├── core/
│   │   ├── state.js        # 状態管理
│   │   ├── session.js      # セッション管理
│   │   └── logger.js       # ロギング
│   ├── ui/
│   │   ├── dom.js          # DOM操作ヘルパー
│   │   ├── events.js       # イベント管理
│   │   ├── theme.js        # テーマ管理
│   │   └── toast.js        # トースト通知
│   ├── features/
│   │   ├── story/
│   │   │   ├── story-view.js
│   │   │   ├── choices.js
│   │   │   └── preview.js
│   │   ├── graph/
│   │   │   ├── graph-render.js
│   │   │   ├── graph-controls.js
│   │   │   └── graph-settings.js
│   │   ├── debug/
│   │   │   ├── debug-panel.js
│   │   │   └── debug-info.js
│   │   ├── gui-editor/
│   │   │   ├── node-editor.js
│   │   │   ├── choice-editor.js
│   │   │   └── batch-edit.js
│   │   ├── reference/
│   │   │   ├── reference-panel.js
│   │   │   ├── markdown-parser.js
│   │   │   └── code-samples.js
│   │   ├── csv/
│   │   │   ├── csv-import.js
│   │   │   ├── csv-export.js
│   │   │   └── csv-preview.js
│   │   ├── ai/
│   │   │   ├── ai-provider.js
│   │   │   ├── ai-settings.js
│   │   │   └── ai-generation.js
│   │   └── lexicon/
│   │       ├── lexicon-editor.js
│   │       └── paraphrase.js
│   └── utils/
│       ├── validation.js   # バリデーション
│       ├── file-utils.js   # ファイル操作
│       └── storage.js      # localStorage操作
└── index.html
```

### 状態管理設計

```javascript
// src/core/state.js
export class AppState {
  constructor() {
    this._session = null
    this._model = null
    this._storyLog = []
    this._listeners = new Map()
  }

  // ゲッター・セッター + イベント発火
  get session() { return this._session }
  set session(value) {
    this._session = value
    this.emit('session:changed', value)
  }

  // イベントリスナー管理
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, [])
    }
    this._listeners.get(event).push(callback)
  }

  emit(event, data) {
    const callbacks = this._listeners.get(event) || []
    callbacks.forEach(cb => cb(data))
  }
}
```

### DOM操作の抽象化

```javascript
// src/ui/dom.js
export class DOMManager {
  constructor() {
    this._cache = new Map()
  }

  // キャッシュ付きDOM取得
  get(id) {
    if (!this._cache.has(id)) {
      this._cache.set(id, document.getElementById(id))
    }
    return this._cache.get(id)
  }

  // 安全な要素作成
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag)
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value)
      } else {
        element[key] = value
      }
    })
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child))
      } else {
        element.appendChild(child)
      }
    })
    return element
  }

  // イベントリスナー管理
  addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options)
    return () => element.removeEventListener(event, handler, options)
  }
}
```

### イベント管理の統一

```javascript
// src/ui/events.js
export class EventManager {
  constructor() {
    this._handlers = new Map()
  }

  // イベント登録
  on(element, event, handler, options = {}) {
    const key = `${element.id || 'anonymous'}_${event}`
    if (!this._handlers.has(key)) {
      this._handlers.set(key, [])
    }
    
    const wrappedHandler = (e) => {
      try {
        handler(e)
      } catch (error) {
        console.error(`Error in ${event} handler:`, error)
      }
    }
    
    element.addEventListener(event, wrappedHandler, options)
    this._handlers.get(key).push({ handler: wrappedHandler, original: handler })
    
    return () => this.off(element, event, handler)
  }

  // イベント解除
  off(element, event, handler) {
    const key = `${element.id || 'anonymous'}_${event}`
    const handlers = this._handlers.get(key) || []
    const index = handlers.findIndex(h => h.original === handler)
    
    if (index !== -1) {
      element.removeEventListener(event, handlers[index].handler)
      handlers.splice(index, 1)
    }
  }

  // すべてのイベント解除
  clear() {
    this._handlers.clear()
  }
}
```

## 📝 実装計画

### Phase 1: 基盤整備（優先度: 🔴 High）

#### Step 1.1: 設定ファイルの分離
- [ ] `src/config/constants.js` 作成
- [x] `src/config/palettes.js` 作成（カラーパレット定義を移動）
- [ ] `src/config/keybindings.js` 作成

#### Step 1.2: コアモジュールの実装
- [x] `src/core/state.js` 作成（状態管理クラス）
- [x] `src/core/session.js` 作成（セッション管理）
- [x] `src/core/logger.js` 作成（統一ロギング）

#### Step 1.3: UI基盤モジュールの実装
- [x] `src/ui/dom.js` 作成（DOM操作ヘルパー）
- [x] `src/ui/events.js` 作成（イベント管理）
- [x] `src/ui/theme.js` 作成（テーマ管理を移動）
- [x] `src/ui/toast.js` 作成（トースト通知）

#### Step 1.4: ユーティリティモジュールの実装
- [x] `src/utils/validation.js` 作成
- [x] `src/utils/file-utils.js` 作成
- [x] `src/utils/storage.js` 作成

### Phase 2: 機能モジュールの分離（優先度: 🟡 Medium）

#### Step 2.1: ストーリー機能
- [ ] `src/features/story/story-view.js`
- [ ] `src/features/story/choices.js`
- [ ] `src/features/story/preview.js`

#### Step 2.2: グラフ機能
- [ ] `src/features/graph/graph-render.js`
- [ ] `src/features/graph/graph-controls.js`
- [ ] `src/features/graph/graph-settings.js`

#### Step 2.3: デバッグ機能
- [ ] `src/features/debug/debug-panel.js`
- [ ] `src/features/debug/debug-info.js`

#### Step 2.4: GUI エディタ
- [ ] `src/features/gui-editor/node-editor.js`
- [ ] `src/features/gui-editor/choice-editor.js`
- [ ] `src/features/gui-editor/batch-edit.js`

#### Step 2.5: リファレンス機能
- [ ] `src/features/reference/reference-panel.js`
- [ ] `src/features/reference/markdown-parser.js`
- [ ] `src/features/reference/code-samples.js`

#### Step 2.6: CSV機能
- [ ] `src/features/csv/csv-import.js`
- [ ] `src/features/csv/csv-export.js`
- [ ] `src/features/csv/csv-preview.js`

#### Step 2.7: AI機能
- [ ] `src/features/ai/ai-provider.js`
- [ ] `src/features/ai/ai-settings.js`
- [ ] `src/features/ai/ai-generation.js`

#### Step 2.8: 辞書機能
- [ ] `src/features/lexicon/lexicon-editor.js`
- [ ] `src/features/lexicon/paraphrase.js`

### Phase 3: エントリーポイントの最適化（優先度: 🟡 Medium）

- [ ] `main.js`を軽量化（モジュールの初期化のみ）
- [ ] 依存関係の整理
- [ ] ビルドプロセスの最適化

### Phase 4: テストとドキュメント（優先度: 🟢 Low）

- [ ] 単体テストの追加
- [ ] 統合テストの追加
- [ ] API ドキュメントの作成
- [ ] リファクタリングガイドの更新

## 🔧 技術仕様

### モジュール間通信

```javascript
// イベント駆動アーキテクチャ
import { AppState } from './core/state.js'
import { EventManager } from './ui/events.js'

const state = new AppState()
const events = new EventManager()

// モジュールA: イベント発火
state.session = newSession

// モジュールB: イベントリスナー
state.on('session:changed', (session) => {
  // セッション変更時の処理
})
```

### 依存注入パターン

```javascript
// 各モジュールは依存を明示的に受け取る
export class StoryView {
  constructor({ state, dom, events, logger }) {
    this.state = state
    this.dom = dom
    this.events = events
    this.logger = logger
  }

  init() {
    this.state.on('session:changed', this.render.bind(this))
    this.events.on(this.dom.get('startBtn'), 'click', this.handleStart.bind(this))
  }

  render() {
    // レンダリング処理
  }

  handleStart() {
    // 開始処理
  }
}
```

### エラーハンドリング

```javascript
// グローバルエラーハンドラー
export class ErrorHandler {
  constructor(logger) {
    this.logger = logger
    this.setupGlobalHandlers()
  }

  setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.logger.error('Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error('Unhandled promise rejection', {
        reason: event.reason
      })
    })
  }

  handle(error, context = {}) {
    this.logger.error('Application error', { error, context })
    // ユーザーへの通知
  }
}
```

## 📊 マイグレーション戦略

### 段階的移行
1. **新規機能は新アーキテクチャで実装**
2. **既存機能は必要に応じて移行**
3. **レガシーコードは deprecation マーカーを追加**

### 互換性の維持
- 既存のグローバル変数は段階的に廃止
- 移行期間中は新旧両方をサポート
- 警告ログで移行を促進

### テスト戦略
1. リファクタリング前に既存機能のE2Eテストを作成
2. モジュール分離後に単体テストを追加
3. リグレッションテストで動作を保証

## 📈 成功指標

### コード品質
- [ ] main.jsを1000行以下に削減
- [ ] 循環的複雑度を10以下に維持
- [ ] テストカバレッジ70%以上

### パフォーマンス
- [ ] 初期ロード時間を50%削減
- [ ] メモリ使用量を30%削減
- [ ] バンドルサイズを削減

### 保守性
- [ ] 新機能追加時の影響範囲を明確化
- [ ] バグ修正時間を50%削減
- [ ] コードレビュー時間を30%削減

## 🚀 次のアクション

### 即座に実行（今すぐ）
1. ✅ guiEditBtn定義の復元（完了）
2. ✅ themeBtnのパレット連動修正（完了）
3. 🔄 基盤モジュール（config, core, ui）の実装開始

### 短期（今週中）
1. Phase 1の完了
2. ストーリー機能とグラフ機能のモジュール化
3. 基本的な単体テストの追加

### 中期（今月中）
1. Phase 2の完了
2. すべての機能モジュールの分離
3. エントリーポイントの最適化

### 長期（来月以降）
1. TypeScript化の検討
2. パフォーマンス最適化
3. 包括的なテストスイートの構築

## 📝 備考

### 既知の問題
1. パレット機能: ✅ 修正完了
2. guiEditBtn未定義: ✅ 修正完了
3. メンテナンス困難: 🔄 リファクタリング実施中

### 参考リソース
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [JavaScript Patterns](https://www.patterns.dev/)
- [Refactoring.Guru](https://refactoring.guru/)

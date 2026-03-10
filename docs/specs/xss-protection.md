# XSS防御仕様 (XSS Protection)

## 概要

HTMLインジェクション攻撃を防ぐための一元化されたHTML操作ユーティリティ。`innerHTML`の直接使用を禁止し、安全なDOM操作関数を提供。

## 仕様ID

SP-XSS-001

## ステータス

done (Phase 1完了: 15箇所以上のinnerHTML置換済み)

## 基本原則

1. `innerHTML`の直接代入を禁止
2. `textContent`またはDOM APIを使用
3. すべてのユーザー入力・動的コンテンツを`escapeHtml()`でサニタイズ

## API (`html-utils.js`)

### `escapeHtml(str: string): string`

HTMLエンティティエスケープ:

```javascript
& → &amp;
< → &lt;
> → &gt;
" → &quot;
' → &#039;
```

### DOM操作関数

```typescript
// テキスト設定（自動エスケープ）
setTextContent(element: HTMLElement, text: string): void

// 要素作成
createElement(tag: string, options?: {
  className?: string
  textContent?: string
  attributes?: Record<string, string>
}): HTMLElement

// テキストノード作成
createTextNode(text: string): Text

// コンテンツクリア
clearContent(element: HTMLElement): void

// 便利関数（要素作成の短縮形）
createDiv(options?: ElementOptions): HTMLDivElement
createSpan(options?: ElementOptions): HTMLSpanElement
createListItem(options?: ElementOptions): HTMLLIElement
```

### 使用例

```javascript
// 悪い例（脆弱）
element.innerHTML = `<div>${userInput}</div>`

// 良い例（安全）
import { createElement, setTextContent, escapeHtml } from './html-utils.js'

const div = createElement('div')
setTextContent(div, userInput)
element.appendChild(div)

// または、HTML構造が必要な場合
const span = createElement('span', {
  className: 'user-text',
  textContent: userInput
})
div.appendChild(span)
```

## Phase 1実装範囲

以下の箇所でinnerHTML直接代入を置換済み:

- ノードリスト描画
- 検索結果表示
- ツールチップ
- モーダルダイアログ
- エラーメッセージ
- その他動的コンテンツ生成箇所（計15箇所以上）

## 実装ファイル

- `apps/web-tester/src/utils/html-utils.js` -- XSS防御ユーティリティ（8関数）

## 制限事項

- Markdownレンダリング等、信頼できるHTMLコンテンツの描画には`innerHTML`の使用を許容
- ただし、その場合でもユーザー入力を含む部分は事前にエスケープ必須

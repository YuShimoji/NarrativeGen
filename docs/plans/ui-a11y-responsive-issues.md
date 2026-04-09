# レスポンシブ・アクセシビリティ（画面単位 Issue 分割案）

推奨開発プラン Phase E 用。GitHub Issue を切る際の単位の目安。

## Issue 案

| ID案 | 範囲 | 内容 |
|------|------|------|
| UI-A11Y-1 | ストーリービュー / プレイ | `#storyView` のランドマーク、`aria-live`（ノード更新時）、インライン選択肢のフォーカス順・キーボード操作 |
| UI-A11Y-2 | グラフエディタ | ノード・エッジのラベル、ズーム/パンのキーボード代替、コントラスト |
| UI-A11Y-3 | モーダル・トースト | フォーカストラップ、`aria-modal`、スクリーンリーダー向けステータス |
| UI-RESP-1 | レイアウト | サイドバー折りたたみ時のブレークポイント、タブレット幅での2ペイン |
| UI-TEST-1 | 手動回帰 | Undo/Redo（E2E skip の補完）、変数・Yarn エクスポートのチェックリスト化 |

## 既に実施した小変更（2026-04-08）

- プレイモード切替ボタンに `aria-label`（`app-controller.js` の `insertModeToggle`）
- `#storyView` に `role="region"` と `aria-label`（`index.html`）

## 関連

- [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) 優先順位4
- [TECHNICAL_DEBT.md](../TECHNICAL_DEBT.md) 項目5

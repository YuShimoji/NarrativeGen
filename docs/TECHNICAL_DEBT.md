# 技術的負債と改善タスク

**最終更新**: 2026-03-06

---

## 高優先度

### 1. main.js の分割

**状態**: 部分的に進行中

`apps/web-tester/main.js` 約2200行。`handlers/` や `src/ui/` への機能分離は進んだが、main.js 自体はまだ大きい。

**分割済みモジュール**:

- `src/ui/graph-editor/GraphEditorManager.js` + DagreLayoutEngine, ContextMenuManager
- `src/ui/SearchManager.js`, `src/ui/batch-editor.js`, `src/ui/ending-analyzer.js` 等
- `handlers/` 配下に各機能ハンドラー分離済み

**残タスク**:

- [ ] セッション制御ロジックを `src/core/session-controller.js` に分離
- [ ] 初期化処理を `src/bootstrap.js` に分離

### 2. E2Eテストの拡充

**状態**: 部分的（24 passed, 36 skipped）

- theme-toggle 11件: UI未接続のためskip
- undo-redo: 基本テストのみ

**残タスク**:

- [ ] skippedテストの要否判断と修正/削除
- [ ] グラフエディタ操作のE2Eテスト追加
- [ ] CSV import/export のE2Eテスト追加

### 3. index.html のインライン CSS 削除

**状態**: 部分的に完了

外部CSS追加後もインラインCSS約1600行が残存。外部CSSが優先されるため機能上は問題なし。ファイルサイズ削減のため将来的に削除を検討。

---

## 中優先度

### 4. チャンクサイズ警告

ビルド時に 500KB 超過警告: `index-*.js: 641 kB`, `cytoscape.esm.js: 442 kB`

対応案: `build.rollupOptions.output.manualChunks` で分割、または動的importでコード分割。

### 5. レイアウト問題

IDE プレビュー環境での外部スタイル注入によるレイアウト崩れ。CSSの`!important`で対処済み。通常ブラウザでは問題なし。

---

## 低優先度

### 6. アクセシビリティ改善

- [ ] ARIA ラベル追加
- [ ] キーボードナビゲーション改善

### 7. レスポンシブデザイン

- [ ] モバイル/タブレット対応

---

## 完了済み

| タスク | 完了日 | 備考 |
|--------|--------|------|
| 推論レジストリ基盤 | 2026-03-06 | プラグインパターンで拡張可能に |
| グラフエディタモジュール分割 | 2026-03-06 | DagreLayoutEngine, ContextMenuManager分離 |
| 前方/後方連鎖推論 | 2026-03-06 | forward-chaining, backward-chaining 実装 |
| ミニマップDOM修正 | 2026-03-06 | SVG内div → graph-container配下に移動 |
| カラーパレット刷新 | 2026-03-06 | モダンクラシカルに変更 |
| ドキュメント整理 | 2026-03-06 | 108件 → 23件（アクティブ） |
| レキシコン拡張 | 2025-12 | GUI追加、スキーマ検証、自動埋め込み |
| CSS 外部化 | 2025-12-08 | `src/styles/` に分離 |
| Mermaid 特殊文字対応 | 2025-12-06 | エスケープ+予約語回避 |

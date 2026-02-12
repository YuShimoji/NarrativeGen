# REPORT: TASK_104 AI UX 改善（採用ボタン）

- **日時**: 2026-02-06
- **作業者**: Cascade
- **ブランチ**: `feature/ai-ux-improvement`
- **Tier**: 2

## 概要

AI 生成/言い換え結果に「採用」ボタンを実装し、結果をノードテキストに反映できるようにした。
併せて生成履歴（直近5件）の保持・表示機能を追加。

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `apps/web-tester/handlers/ai-config.js` | 採用ロジック、生成履歴管理、結果DOM構造化レンダリング、定数外部化 |
| `apps/web-tester/main.js` | `onAdopt` コールバック配線、`aiHistoryList` DOM参照追加 |
| `apps/web-tester/index.html` | 採用ボタン・履歴パネルCSS、`aiHistoryList` 要素追加 |

## 実装詳細

### 採用ボタン
- 生成結果・言い換え結果の各項目に「採用」ボタンを配置
- クリックでノードの `text` プロパティを更新
- 採用後はボタンが「採用済み」に変わり無効化
- ストーリービュー・状態・グラフを自動再描画

### 生成履歴
- 直近5件を保持（`HISTORY_MAX_SIZE` 定数で管理）
- 各履歴項目にも「採用」ボタンを配置
- タイプラベル（生成/言い換え）付きで表示

### ハードコード禁止対応
以下の定数をファイル先頭に外部化:
- `AI_CONFIG_DEFAULTS` — デフォルトプロバイダー設定
- `HISTORY_MAX_SIZE` — 履歴保持件数
- `PARAPHRASE_VARIANT_COUNT` / `PARAPHRASE_STYLE` / `PARAPHRASE_TONE` — 言い換えパラメータ
- `STORAGE_KEY_AI_CONFIG` — localStorage キー

## DoD チェック

- [x] 生成結果に「採用」ボタンが表示される
- [x] 「採用」ボタン押下でノードテキストが更新される
- [x] 生成履歴の簡易保持（直近5件）
- [x] `npm run build -w @narrativegen/web-tester` が成功する（23 modules, 56.83KB）
- [x] `npm test -w @narrativegen/engine-ts` 全37テストパス
- [x] docs/inbox/ にレポート作成済み

## 手動テスト手順

1. `npm run dev -w @narrativegen/web-tester` → `http://localhost:5173/`
2. サンプルモデルを読み込み → セッション開始
3. 「AI支援」タブを開く
4. 「次のノードを生成」または「現在のテキストを言い換え」ボタンをクリック
5. 結果に「採用」ボタンが表示されることを確認
6. 「採用」ボタンをクリック → ステータスバーに更新メッセージが表示されることを確認
7. ストーリービューにテキストが反映されることを確認
8. 生成履歴セクションに履歴が蓄積されることを確認（最大5件）
9. 履歴からの「採用」ボタンも同様に動作することを確認

## 備考

- `packages/engine-ts/` への変更なし（Forbidden Area 遵守）
- バッチ生成インターフェースは TASK_108 で対応予定

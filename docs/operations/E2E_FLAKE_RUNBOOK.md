# E2E Flake Runbook

最終更新: 2026-04-08

## 目的

E2E の間欠失敗を「再現不能なノイズ」で終わらせず、再発条件を蓄積して恒久対策に繋げる。

## 実行順（再開時）

1. `npm ci`
2. `npm run check:safety`
3. `npm run test:e2e`

## 失敗時の記録テンプレート

以下を `docs/INTERACTION_NOTES.md` または issue に必ず残す。

- 日付:
- ブランチ/コミット:
- 実行環境: OS / Node / ブラウザ
- 失敗 spec:
- 失敗ステップ:
- エラーメッセージ:
- 再現率: `x / y`
- 回避策（暫定）:
- 恒久対策候補:

## 切り分け手順

1. 単体再実行: 失敗 spec のみ再実行し、再現率を確認する。
2. 待機依存確認: `toContainText` / visibility / animation 終了待ちを確認する。
3. 競合確認: 並列実行でのみ落ちるかを確認する。
4. 状態汚染確認: 前ケースのセッション/ストレージ状態を引き継いでいないか確認する。

## 判定基準

- 一時的対処（再試行で通る）だけで閉じない。
- 同系統の失敗が 2 回以上出たら恒久対策を起票する。
- `check:safety` が失敗している状態では E2E 結果を採用しない。

## 自動化/手動の責務境界（正式運用）

- 自動化（E2E）
  - 主要導線（モデル読込、編集導線、プレイ遷移、保存導線）
  - DOM 変化の保証（表示、活性/非活性、遷移）
- 手動確認
  - 聴覚・体感品質（BGM クロスフェード、autoplay 体感）
  - アクセシビリティ実機確認（スクリーンリーダー読み上げ、フォーカス移動品質）
  - モバイル実機の操作感（タップ領域、スクロール、横持ち/縦持ち）

## flaky ケース運用基準

- 1回目: 単体再実行で再現率を記録
- 2回目: 切り分け結果と暫定回避策を runbook 形式で記録
- 3回目: 恒久対策チケットを作成し、該当 spec にリンクを残す

## 追跡台帳

- 候補・issue 化の管理先: `docs/tasks/FLAKY_ISSUES_TRACKER.md`
- 運用:
  - 2回目再発で tracker に追加
  - 3回目再発で issue 化し、tracker の状態を更新
- 起票済み（例・2026-04-09）:
  - [#81](https://github.com/YuShimoji/NarrativeGen/issues/81) FLK-PLAY-AC5
  - [#82](https://github.com/YuShimoji/NarrativeGen/issues/82) FLK-UNDO-GRAPH
  - [#83](https://github.com/YuShimoji/NarrativeGen/issues/83) FLK-MODAL-FOCUS

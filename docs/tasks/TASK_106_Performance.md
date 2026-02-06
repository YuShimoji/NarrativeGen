# Task: パフォーマンス最適化

Status: OPEN
Tier: 2
Branch: feature/performance-optimization
Owner: Worker
Created: 2026-02-06T13:35:00+09:00
Report:

## Objective

- 100ノード以上のモデルで快適に動作するよう、仮想スクロール・グラフ描画・CSV処理を最適化する

## Context

- 現在のノード一覧は50件制限の仮想スクロール
- グラフ描画はSVGネイティブ実装（D3.js不使用）
- CSV処理は同期的

## Focus Area

- apps/web-tester/main.js（描画・スクロール関連）
- apps/web-tester/handlers/（分離済みハンドラ）

## Forbidden Area

- packages/engine-ts/src/（エンジン本体の変更禁止）
- packages/sdk-unity/

## Constraints

- テスト: 100ノードモデルでの動作確認
- データ外部化: パフォーマンス閾値のハードコード禁止

## DoD

- [ ] 100ノードモデルでノード一覧がスムーズにスクロールできる
- [ ] グラフ描画が100ノード以上で実用的な速度で動作する
- [ ] CSV処理のチャンキングが改善されている
- [ ] npm run build -w @narrativegen/web-tester が成功する
- [ ] docs/inbox/ にレポートが作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

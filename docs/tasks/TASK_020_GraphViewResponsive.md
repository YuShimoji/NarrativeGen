# Task: Phase 2グラフビューのレスポンシブ対応

Status: CLOSED
Tier: 3
Branch: main
Owner: Worker
Created: 2026-01-05T01:25:00Z
Report: docs/inbox/REPORT_TASK_020_GraphViewResponsive.md

## Objective

Phase 2グラフビュー（TASK_013で実装済み）にレスポンシブ対応を追加する。ウィンドウサイズ変更時の自動再レイアウトを実装する。

## Context

- TASK_013で読み取り専用のグラフビューが実装完了
- ウィンドウサイズ変更時の自動再レイアウトは未実装
- 現状はタブ切り替え時に再描画
- `docs/reports/REPORT_TASK_013_Phase2ReadOnlyGraphView.md`の161-163行目に記載されている

## Focus Area

- `apps/web-tester/src/ui/graph-editor/GraphEditorManager.js`: ウィンドウサイズ変更時の自動再レイアウト機能の追加
- `ResizeObserver`または`window.resize`イベントの実装
- レイアウト再計算の最適化

## Forbidden Area

- 既存の読み取り専用機能の破壊的変更
- 既存のタブ切り替え時の再描画機能の破壊的変更

## Constraints

- ウィンドウサイズ変更時に自動的にレイアウトを再計算する
- パフォーマンスを維持するため、デバウンス処理を実装する
- 大規模グラフ（500ノード以上）でもパフォーマンスを維持する

## DoD

- [ ] ウィンドウサイズ変更時の自動再レイアウト機能の実装
- [ ] デバウンス処理の実装
- [ ] パフォーマンステストの実施（大規模グラフでの動作確認）
- [ ] サンプルモデルで動作確認
- [ ] docs/inbox/ にレポート（REPORT_TASK_020_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- `ResizeObserver`を使用するか、`window.resize`イベントを使用するか検討する
- デバウンス処理は300ms程度を目安にする
- パフォーマンステストは500ノード以上のモデルで実施する

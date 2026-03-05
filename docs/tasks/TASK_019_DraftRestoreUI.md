# Task: ドラフト復元UIの改善

Status: CLOSED
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-05T01:25:00Z
Report: docs/inbox/REPORT_TASK_019_20260105_0128.md

## Objective

ドラフト自動保存機能（`draft_model`）の復元導線を改善する。現在は簡易ダイアログのみで、専用UIが未整備。

## Context

- ドラフト自動保存機能（`draft_model`）は実装済み
- 復元導線は簡易ダイアログのみで、専用UIは未整備
- `docs/OpenSpec-WebTester.md`の89行目に「復元導線は簡易ダイアログのみで、専用UIは未整備」と記載されている
- ユーザーがドラフトを復元しやすくするため、専用UIが必要

## Focus Area

- `apps/web-tester/src/ui/gui-editor.js`: ドラフト復元UIの追加
- `apps/web-tester/index.html`: ドラフト復元モーダルの追加
- ドラフト情報の表示（保存日時、ノード数等）

## Forbidden Area

- 既存のドラフト自動保存機能の破壊的変更
- 既存の簡易ダイアログの破壊的変更（段階的置換を想定）

## Constraints

- ドラフト情報（保存日時、ノード数等）を表示する
- ドラフト復元時に確認ダイアログを表示する
- 既存の簡易ダイアログとの整合性を維持する

## DoD

- [ ] ドラフト復元モーダルの実装（保存日時、ノード数等の表示）
- [ ] ドラフト復元時の確認ダイアログの実装
- [ ] ドラフト情報の表示機能の実装
- [ ] 既存の簡易ダイアログとの整合性を確認
- [ ] サンプルモデルで動作確認
- [ ] docs/inbox/ にレポート（REPORT_TASK_019_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- ドラフト情報は`draft_model`から取得する
- 保存日時は`localStorage`のタイムスタンプから取得する

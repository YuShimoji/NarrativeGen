# Task: GUIエディタのロールバック機能実装

Status: CLOSED
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-05T01:25:00Z
Report: docs/inbox/REPORT_TASK_018_20260105.md

## Objective

GUIエディタの「キャンセル」ボタンで、元モデルへのロールバック機能を実装する。現在はモード終了のみで、編集内容が破棄されない。

## Context

- 現在の「キャンセル」ボタンはモード終了のみで、編集内容が破棄されない
- ユーザーが編集をキャンセルしたい場合、元のモデルに戻す機能が必要
- `docs/OpenSpec-WebTester.md`の83行目に「元モデルへのロールバックは未実装」と記載されている
- ドラフト自動保存機能（`draft_model`）は実装済み

## Focus Area

- `apps/web-tester/src/ui/gui-editor.js`: ロールバック機能の追加
- `apps/web-tester/main.js`: キャンセルボタンのイベントハンドラー更新
- 元モデルの保存・復元ロジックの実装

## Forbidden Area

- 既存のドラフト自動保存機能の破壊的変更
- 既存の保存機能の破壊的変更

## Constraints

- 元モデルはGUI編集モード開始時に保存する
- キャンセル時は元モデルを復元し、GUI編集モードを終了する
- ドラフト自動保存機能との整合性を維持する

## DoD

- [ ] GUI編集モード開始時に元モデルを保存する機能の実装
- [ ] キャンセルボタンで元モデルを復元する機能の実装
- [ ] 元モデル復元後、GUI編集モードを終了する機能の実装
- [ ] ドラフト自動保存機能との整合性を確認
- [ ] サンプルモデルで動作確認
- [ ] docs/inbox/ にレポート（REPORT_TASK_018_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 元モデルの保存は`draft_model`とは別に管理する
- キャンセル時は`draft_model`もクリアする

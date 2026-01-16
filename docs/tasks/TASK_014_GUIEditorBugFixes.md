# Task: GUIエディタバグ修正

Status: CLOSED
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T22:30:00Z
Report: docs/reports/REPORT_TASK_014_20260104.md

## Objective

GUIエディタ手動テスト（TASK_009）で発見されたバグを修正する。検索UIの虫眼鏡アイコン表示、クイックノードモーダルのキャンセル機能、テーマモーダル閉鎖時のツールバー表示問題を解決する。

## Context

- TASK_009の手動テスト実施中に以下の問題が発見された:
  1. 検索UIの虫眼鏡アイコンが見つからない（`#icon-search`が`icons.svg`に定義されていない）
  2. クイックノードモーダルからキャンセルができず、作成することでしかウィンドウを閉じれない
  3. テーマモーダルを閉じる際に、左側にテーマのツールバーのようなものが一瞬だけ表示される
- これらの問題により、検索・フィルタ機能のテストが実施できない状況
- ユーザビリティの向上とテスト継続のため、早期修正が必要

## Focus Area

- `apps/web-tester/icons.svg`: `icon-search`シンボルの追加
- `apps/web-tester/index.html`: クイックノードモーダルのキャンセルボタン追加
- `apps/web-tester/src/ui/gui-editor.js`: クイックノードモーダルのキャンセル処理実装
- `apps/web-tester/src/ui/theme.js`: テーマモーダル閉鎖時の表示問題修正

## Forbidden Area

- 既存の正常動作している機能の破壊的変更
- テストガイド（`docs/GUI_EDITOR_TEST_GUIDE.md`）の改変

## Constraints

- 修正は最小限とし、既存の動作に影響を与えないこと
- 動作確認（ブラウザでの手動テスト）を伴うこと
- TASK_009のテスト継続を可能にすること

## DoD

- [ ] `icons.svg`に`icon-search`シンボルを追加（検索アイコン用）
- [ ] クイックノードモーダルにキャンセルボタンを追加
- [ ] `gui-editor.js`にキャンセル処理を実装（モーダルを閉じる）
- [ ] テーマモーダル閉鎖時の表示問題を修正（ツールバーが一瞬表示される問題）
- [ ] 各修正について動作確認（ブラウザでの手動テスト）
- [ ] 修正内容を`docs/GUI_EDITOR_TEST_GUIDE.md`のテスト実施記録に追記
- [ ] docs/inbox/ にレポート（REPORT_TASK_014_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 検索アイコンはLucide Iconsの`search`アイコンを使用することを推奨
- クイックノードモーダルのキャンセル処理は、他のモーダル（バッチ編集、スニペット等）と同様の実装パターンを参考にする
- テーマモーダルの表示問題は、CSSトランジションと`display: none`のタイミング調整で解決可能

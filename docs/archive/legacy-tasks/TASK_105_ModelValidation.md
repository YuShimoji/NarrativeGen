# Task: モデル検証強化

Status: COMPLETED
Tier: 2
Branch: feature/model-validation
Owner: Worker
Created: 2026-02-06T13:35:00+09:00
Completed: 2026-02-06T13:45:00+09:00
Report: docs/inbox/TASK_105_model_validation_report.md

## Objective

- ID重複検出、参照整合性チェック、循環参照検出を強化し、詳細なエラーメッセージを提供する

## Context

- 現在の validateModel() は基本的なノード参照チェックのみ
- packages/engine-ts/src/index.ts に validateModel 関数あり
- models/schema/playthrough.schema.json で JSON Schema 検証済み

## Focus Area

- packages/engine-ts/src/index.ts（validateModel 強化）
- packages/engine-ts/test/（テスト追加）

## Forbidden Area

- apps/web-tester/（UI 変更禁止）
- packages/sdk-unity/

## Constraints

- テスト: 主要パスのみ
- 後方互換: 既存の validateModel API を壊さない

## DoD

- [x] ID重複検出が実装されている
- [x] 参照整合性チェック（存在しないターゲット検出）が強化されている
- [x] 循環参照検出が実装されている
- [x] エラーメッセージにノードID・行番号等の詳細が含まれる
- [x] 既存テスト + 新規テストが全て通過する
- [x] docs/inbox/ にレポートが作成されている
- [x] 本チケットの Report 欄にレポートパスが追記されている

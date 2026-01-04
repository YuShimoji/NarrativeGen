# Task: timeWindow条件のエンジン仕様との最終整合確認

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T12:18:00Z
Report: （未作成）

## Objective

`timeWindow`条件のエンジン仕様との最終整合を確認し、仕様書と実装の不整合があれば記録・修正する。

## Context

- `AI_CONTEXT.md`のバックログに「`timeWindow`条件のエンジン仕様との最終整合確認」が記載されている
- GUIエディタで`timeWindow`条件を設定できるが、エンジン側の仕様との整合性が不明確
- 仕様書（`docs/OpenSpec-WebTester.md`等）と実装（`Packages/engine-ts/`）の整合性を確認する必要がある

## Focus Area

- `docs/OpenSpec-WebTester.md`の`timeWindow`条件仕様確認
- `Packages/engine-ts/src/`の`timeWindow`条件実装確認
- `apps/web-tester/src/ui/condition-effect-editor.js`の`timeWindow`条件UI確認
- 仕様と実装の不整合があれば記録

## Forbidden Area

- エンジン側の実装変更（調査・確認のみ）
- 仕様書の大幅な改変（整合性確認の結果を記録するのみ）

## Constraints

- エンジン仕様の理解が必要
- 実装コードの読解が必要
- 不整合が見つかった場合、修正は別タスクとして起票する

## DoD

- [ ] `docs/OpenSpec-WebTester.md`の`timeWindow`条件仕様を確認
- [ ] `Packages/engine-ts/src/`の`timeWindow`条件実装を確認
- [ ] `apps/web-tester/src/ui/condition-effect-editor.js`の`timeWindow`条件UI実装を確認
- [ ] 仕様と実装の整合性を確認し、不整合があれば記録
- [ ] 不整合が見つかった場合、修正タスクを起票するか、既存Issueに紐付ける
- [ ] docs/inbox/ にレポート（REPORT_TASK_010_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 調査・確認のみのタスク。実装変更は別タスクとして起票する
- 不整合が見つかった場合、優先度に応じて修正タスクを起票する

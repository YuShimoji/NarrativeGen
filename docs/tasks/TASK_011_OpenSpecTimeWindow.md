# Task: OpenSpec-WebTester.mdにtimeWindow条件の仕様を追加

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T20:00:00Z
Report: （未作成）

## Objective

`docs/OpenSpec-WebTester.md`に`timeWindow`条件の仕様を追加し、他の条件（flag, resource, variable）と同レベルの詳細度で記載する。

## Context

- TASK_010の調査結果により、`docs/OpenSpec-WebTester.md`に`timeWindow`条件の記載がないことが判明
- エンジン実装では`timeWindow`条件が実装されており、UIでも使用可能
- 仕様書と実装の乖離を解消する必要がある
- 他の条件（flag, resource, variable）については記載があるが、timeWindowのみ欠落

## Focus Area

- `docs/OpenSpec-WebTester.md`の条件セクションに`timeWindow`条件の仕様を追加
- 条件の形式、評価ロジック、使用例を記載
- 他の条件と同レベルの詳細度で記載

## Forbidden Area

- エンジン側の実装変更（仕様書の追加のみ）
- 既存の条件仕様の大幅な改変（timeWindow条件の追加のみ）

## Constraints

- エンジン実装（`Packages/engine-ts/src/`）と整合性を保つ必要がある
- 評価ロジック: `time >= cond.start && time <= cond.end`（両端を含む）
- 型定義: `{ type: 'timeWindow', start: number, end: number }`

## DoD

- [ ] `docs/OpenSpec-WebTester.md`の条件セクションに`timeWindow`条件の仕様を追加
- [ ] 条件の形式（`{ type: 'timeWindow', start: number, end: number }`）を記載
- [ ] 評価ロジック（`time >= start && time <= end`、両端を含む）を明記
- [ ] 使用例を記載（他の条件と同レベル）
- [ ] 他の条件（flag, resource, variable）と整合性のある記載形式
- [ ] docs/inbox/ にレポート（REPORT_TASK_011_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- TASK_010の調査結果を参照して仕様を記載する
- エンジン実装との整合性を確認しながら記載する

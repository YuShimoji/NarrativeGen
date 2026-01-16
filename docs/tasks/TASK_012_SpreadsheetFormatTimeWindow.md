# Task: spreadsheet-format.mdにtimeWindow条件の評価ロジックを明記

Status: DONE
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T20:00:00Z
Report: docs/reports/REPORT_TASK_012_20260104_2125.md

## Objective

`docs/spreadsheet-format.md`に`timeWindow`条件の評価ロジック（両端を含む）を明記し、境界の扱いを明確にする。

## Context

- TASK_010の調査結果により、`docs/spreadsheet-format.md`に`timeWindow`条件の記載はあるが、評価ロジック（両端を含む）の明記がないことが判明
- エンジン実装では`time >= cond.start && time <= cond.end`として両端を含む（inclusive）評価を行っている
- ライターが`timeWindow:5-10`と記述した場合、時間5と時間10が含まれるかどうかが仕様書から判断できない
- 実装を確認しないと正確な動作が分からない状態を解消する必要がある

## Focus Area

- `docs/spreadsheet-format.md`の`timeWindow`条件セクションに評価ロジックを明記
- 境界の扱い（両端を含む）を明確に記載
- 使用例を追加

## Forbidden Area

- エンジン側の実装変更（仕様書の明記のみ）
- 既存の`timeWindow`条件記載の大幅な改変（評価ロジックの追加のみ）

## Constraints

- エンジン実装（`Packages/engine-ts/src/`）と整合性を保つ必要がある
- 評価ロジック: `time >= cond.start && time <= cond.end`（両端を含む）
- 既存の記載（`timeWindow:<start>-<end>`形式）を維持する

## DoD

- [x] `docs/spreadsheet-format.md`の`timeWindow`条件セクションに評価ロジックを明記
  - **結果**: 「timeWindow条件の評価ロジック」サブセクションを追加し、`time >= start && time <= end`を明記
- [x] 境界の扱い（両端を含む）を明確に記載
  - **結果**: 「開始時間と終了時間の両端を含む（inclusive）」と明記し、具体例（時間5、7、10が含まれ、時間4、11が含まれない）を追加
  - 例: 「`timeWindow:5-10`は、現在の時間が5以上10以下（両端を含む）の場合に条件を満たします」
- [x] 使用例を追加（既存の記載を補完）
  - **結果**: 例3に説明を追加し、時間5から10（両端を含む）の範囲で動作することを明記
- [x] エンジン実装との整合性を確認
  - **結果**: 3つの実装ファイル（`index.ts`, `session-ops.ts`, `browser.ts`）すべてで`time >= cond.start && time <= cond.end`の実装を確認し、仕様書と一致
- [x] docs/inbox/ にレポート（REPORT_TASK_012_*.md）が作成されている
  - **結果**: `docs/reports/REPORT_TASK_012_20260104_2125.md`を作成
- [x] 本チケットの Report 欄にレポートパスが追記されている
  - **結果**: `docs/reports/REPORT_TASK_012_20260104_2125.md`を追記

## Notes

- TASK_010の調査結果を参照して評価ロジックを明記する
- エンジン実装との整合性を確認しながら記載する

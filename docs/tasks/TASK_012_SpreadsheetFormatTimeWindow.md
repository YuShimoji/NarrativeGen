# Task: spreadsheet-format.mdにtimeWindow条件の評価ロジックを明記

Status: OPEN
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T20:00:00Z
Report: （未作成）

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

- [ ] `docs/spreadsheet-format.md`の`timeWindow`条件セクションに評価ロジックを明記
- [ ] 境界の扱い（両端を含む）を明確に記載
  - 例: 「`timeWindow:5-10`は、現在の時間が5以上10以下（両端を含む）の場合に条件を満たします」
- [ ] 使用例を追加（既存の記載を補完）
- [ ] エンジン実装との整合性を確認
- [ ] docs/inbox/ にレポート（REPORT_TASK_012_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- TASK_010の調査結果を参照して評価ロジックを明記する
- エンジン実装との整合性を確認しながら記載する

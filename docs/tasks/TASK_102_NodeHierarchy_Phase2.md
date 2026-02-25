# Task: ノード階層システム Phase 2
Status: COMPLETED
Tier: 2
Branch: feature/node-hierarchy-phase2
Owner: Worker
Created: 2026-02-06T13:35:00+09:00
Report: 

## Objective
- CSVパーサに node_group 列を追加し、ノードをフォルダ構造で管理できるようにする（後方互換を維持）

## Context
- OpenSpec 仕様書: .openspec/node-hierarchy-spec.md
- 現在のCSV列: node_id, node_text, choice_id, choice_text, choice_target, choice_conditions, choice_effects 等
- node_group 形式: "chapters/intro", "chapters/main_quest/battlefield"
- ローカルID解決: resolveNodeId(model, "battle", ["chapters", "main"])
- 完全ID形式: "chapters.main.battle"

## Focus Area
- packages/engine-ts/src/ (パーサー、型定義、参照解決)
- apps/web-tester/utils/csv-parser.js
- apps/web-tester/utils/csv-exporter.js
- packages/engine-ts/test/

## Forbidden Area
- packages/sdk-unity/（Unity SDK は後続タスク）

## Constraints
- テスト: 主要パスのみ（網羅テストは後続タスクへ分離）
- 後方互換必須: node_group 列がないCSVも従来通り動作すること
- データ外部化: テキスト・設定値・パラメータのハードコード禁止

## Divergent Thinking (P2.5S)
- **Slice Goal**: CSVパーサで `node_group` 列を読み込み、完全ID（`group.id`）で表示・ジャンプできる基本的なエンドツーエンドを実証する。
- **Min Path**:
  - `packages/engine-ts/src/types.ts` (Model/Node 型拡張)
  - `packages/engine-ts/src/parser.ts` (node_group 解析)
  - `apps/web-tester/utils/csv-parser.js` (UI側パーサ)
  - `apps/web-tester/handlers/nodes-panel.js` (ノード一覧表示)
- **Risk**: ID解決の競合（既存のフラットIDと新規階層IDの優先順位不整合）。
- **Mitigation**: `resolveNodeId` の優先順位を「完全ID -> グループ内 -> グローバル」の順で定義する。
- **Test Phase**: Slice (Build + Manual Verification + basic unit test in engine-ts)

## DoD
- [ ] CSVパーサが `node_group` 列を認識し、Model に反映する
- [ ] node_group なしのCSVが従来通り動作する（後方互換）
- [ ] エクスポートに node_group 出力オプションがある
- [ ] resolveNodeId 関数が実装されテストが通る
- [ ] 既存テスト（18件）が全て通過する
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes
- 参照解決は従来の nodes フラットマップも利用可能にする

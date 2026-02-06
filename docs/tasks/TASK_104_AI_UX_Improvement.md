# Task: AI UX 改善（採用ボタン）
Status: OPEN
Tier: 2
Branch: feature/ai-ux-improvement
Owner: Worker
Created: 2026-02-06T13:35:00+09:00
Report: 

## Objective
- AI 生成/言い換え結果に「採用」ボタンを実装し、結果をノードに反映できるようにする

## Context
- AI Provider インターフェースは packages/engine-ts/src/ai-provider.ts に実装済み（stub）
- handlers/ai-handler.js に AI 生成・言い換えロジックが分離済み
- 現在は生成結果を表示するのみで、ノードへの反映機能がない

## Focus Area
- apps/web-tester/handlers/ai-handler.js
- apps/web-tester/main.js（配線部分のみ）
- apps/web-tester/index.html（UI 追加）

## Forbidden Area
- packages/engine-ts/src/（エンジン本体の変更禁止）
- packages/sdk-unity/

## Constraints
- テスト: 主要パスのみ
- データ外部化: テキスト・設定値・パラメータのハードコード禁止

## DoD
- [ ] 生成結果に「採用」ボタンが表示される
- [ ] 「採用」ボタン押下でノードテキストが更新される
- [ ] 生成履歴の簡易保持（直近5件程度）
- [ ] npm run build -w @narrativegen/web-tester が成功する
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes
- バッチ生成インターフェースは別タスク（TASK_108）

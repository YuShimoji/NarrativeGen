# Task: バッチ AI 処理

Status: OPEN
Tier: 2
Branch: feature/batch-ai
Owner: Worker
Created: 2026-02-06T13:35:00+09:00
Report:

## Objective

- 全ノードの一括言い換え、条件付きバッチ生成、処理進捗表示を実装する

## Context

- AI Provider インターフェースは packages/engine-ts/src/ai-provider.ts に実装済み（stub）
- handlers/ai-handler.js に単一ノード向け AI ロジックが分離済み
- TASK_104（AI UX 改善）の完了が前提

## Focus Area

- apps/web-tester/handlers/ai-handler.js（バッチ処理追加）
- apps/web-tester/main.js（配線部分のみ）
- apps/web-tester/index.html（バッチ UI 追加）

## Forbidden Area

- packages/engine-ts/src/（エンジン本体の変更禁止）
- packages/sdk-unity/

## Constraints

- テスト: 主要パスのみ
- TASK_104 の完了が前提条件
- 処理進捗表示は presentation.json の progress_bar 形式に準拠

## DoD

- [ ] 全ノード一括言い換え機能が動作する
- [ ] 条件付きバッチ生成（特定ノードのみ）が動作する
- [ ] 処理進捗バーが表示される
- [ ] npm run build -w @narrativegen/web-tester が成功する
- [ ] docs/inbox/ にレポートが作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- TASK_104（AI UX 改善）が前提。TASK_104 が DONE でない場合は BLOCKED とする

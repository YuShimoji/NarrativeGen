# Worker Prompt: TASK_027_MainJsRefactoring

## 参照
- チケット: docs/tasks/TASK_027_MainJsRefactoring.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md

## 境界
- **Focus Area**: `apps/web-tester/main.js`, `apps/web-tester/src/bootstrap.js`, `apps/web-tester/src/ui-bindings.js`, `apps/web-tester/src/session-controller.js`
- **Forbidden Area**: `apps/web-tester/src/ui/` (GUI固有ロジックの変更禁止), `apps/web-tester/core/` (エンジンコア変更禁止)

## コンテキスト
`main.js` が肥大化（2200行超）しており、保守性が低下しています。これを責務ごとのモジュールに分割します。

## DoD
- [ ] `main.js` がコーディネーターとしての役割のみを持ち、行数が大幅に削減されていること
- [ ] 新規モジュール (`bootstrap.js`, `ui-bindings.js`, `session-controller.js`) が作成され、適切に責務が分離されていること
- [ ] `npm run check` がパスすること
- [ ] アプリケーションが正常に起動し、セッション開始等の基本動作が機能すること

## 停止条件
- 既存のUIコンポーネント (`src/ui/`) に深い依存があり、単純な移動では解決できない場合
- ビルドエラーが解消できない場合

## 納品先
- docs/inbox/REPORT_TASK_027_MainJsRefactoring.md

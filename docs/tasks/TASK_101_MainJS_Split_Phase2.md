# Task: main.js 分割（第2弾）
Status: IN_PROGRESS
Tier: 2
Branch: feature/main-js-split-phase2
Owner: Worker
Created: 2026-02-06T13:35:00+09:00
Updated: 2026-02-06T13:50:00+09:00
Report: 

## Objective
- apps/web-tester/main.js（現在1241行）をさらに分離し、目標1000行未満に縮小する

## Context
- 第1弾で handlers/story-handler.js, handlers/ai-handler.js, utils/ への分離は完了済み
- main.js は依存注入パターンを採用（アクセサ関数ベース）
- GUIエディタリファクタリング（PR #63）で依存注入の基盤は確立済み
- **handlers/nodes-panel.js (281行) は既に作成済み** — renderNodeOverview/jumpToNode/highlightNode/renderChoicesForNode が分離済み
- **handlers/tabs.js (97行) は既に作成済み** — switchTab とタブイベントバインドが分離済み
- **handlers/gui-editor.js (522行) は既に作成済み** — GUI編集モード関連が分離済み
- 2026-02-06: デッドコード除去・重複イベントリスナー除去・guiEditMode宣言追加で 1444行→1241行に削減

## Focus Area
- apps/web-tester/main.js（さらなる分離対象）

## Forbidden Area
- packages/engine-ts/（エンジン本体の変更禁止）
- packages/sdk-unity/

## Constraints
- テスト: 主要パスのみ（網羅テストは後続タスクへ分離）
- フォールバック: 新規追加禁止
- データ外部化: テキスト・設定値・パラメータのハードコード禁止
- 既存の handlers/ パターン（依存注入）に従う
- Vite dev server で動作確認必須

## DoD
- [x] handlers/nodes-panel.js が作成され、renderNodeOverview/jumpToNode/highlightNode/renderChoicesForNode が分離されている
- [x] handlers/tabs.js が作成され、switchTab とタブイベントバインドが分離されている
- [x] npm run build -w @narrativegen/web-tester が成功する
- [x] Vite dev server で基本操作（ノード一覧表示、タブ切り替え、ジャンプ）が動作する
- [ ] main.js が初期化と配線のみに縮小されている（目標: 1000行未満、現在: 1241行）
- [ ] main.js から以下を分離: renderGraph/グラフ制御、renderDebugInfo、CSV import、AI関連、split view
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes
- 残りの分離候補（main.js 内の大きな関数ブロック）:
  - B-1: handlers/graph-handler.js — renderGraph, グラフズーム制御 (~80行)
  - B-2: handlers/debug-handler.js — renderDebugInfo (~90行)
  - B-3: handlers/csv-import-handler.js — importCsvFile (~200行)
  - B-4: handlers/ai-config.js — initAiProvider, generateNextNode, paraphraseCurrentText (~100行) ※既存 ai-handler.js との統合検討
  - B-5: handlers/split-view.js — split view toggle, resizer (~60行)
  - 合計推定: ~530行を分離可能 → main.js は ~710行に縮小見込み

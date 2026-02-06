# Task: main.js 分割（第2弾）
Status: IN_PROGRESS
Tier: 2
Branch: feature/main-js-split-phase2
Owner: Worker
Created: 2026-02-06T13:35:00+09:00
Report: 

## Objective
- apps/web-tester/main.js（46KB）からノード一覧/ジャンプ系とタブ切り替えを分離し、保守性を向上させる

## Context
- 第1弾で handlers/story-handler.js, handlers/ai-handler.js, utils/ への分離は完了済み
- main.js は依存注入パターンを採用（アクセサ関数ベース）
- GUIエディタリファクタリング（PR #63）で依存注入の基盤は確立済み

## Focus Area
- apps/web-tester/main.js
- apps/web-tester/handlers/nodes-panel.js（新規作成）
- apps/web-tester/handlers/tabs.js（新規作成）

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
- [ ] handlers/nodes-panel.js が作成され、renderNodeOverview/jumpToNode/highlightNode/renderChoicesForNode が分離されている
- [ ] handlers/tabs.js が作成され、switchTab とタブイベントバインドが分離されている
- [ ] main.js が初期化と配線のみに縮小されている
- [ ] npm run build -w @narrativegen/web-tester が成功する
- [ ] Vite dev server で基本操作（ノード一覧表示、タブ切り替え、ジャンプ）が動作する
- [ ] docs/inbox/ にレポート（REPORT_...md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes
- A-1: nodes-panel.js — 対象関数: renderNodeOverview, highlightNode, jumpToNode, renderChoicesForNode
  - 依存注入: _model, session, setStatus, renderGraph, renderState, renderChoices, initStory, renderStoryEnhanced, DOM参照
- A-2: tabs.js — 対象関数: switchTab とタブイベントバインド
  - 依存注入: パネルDOM参照、renderGraph, renderDebugInfo, renderNodeOverview, initAiProvider

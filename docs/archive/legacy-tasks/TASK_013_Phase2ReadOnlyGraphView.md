# Task: Phase 2 読み取り専用のグラフビュー（スパイク）を最小で実装

Status: DONE
Tier: 2
Branch: main
Owner: Worker
Created: 2026-01-04T22:00:00Z
Report: docs/reports/REPORT_TASK_013_Phase2ReadOnlyGraphView.md

## Objective

Phase 2グラフエディタの最小実装として、読み取り専用のグラフビューを実装する。既存のリスト形式GUIエディタを補完し、ストーリー構造の俯瞰を可能にする。

## Context

- `AI_CONTEXT.md`のバックログに「Phase 2: 読み取り専用のグラフビュー（スパイク）を最小で実装」が記載されている
- `docs/NEXT_PHASE_PROPOSAL.md`にPhase 2グラフエディタの詳細設計が記載されている
- 現在のリスト形式GUIエディタは詳細なプロパティ編集に適しているが、全体構造の俯瞰には不向き
- グラフビューにより、ストーリー構造の可視化と理解が容易になる
- 本タスクは「スパイク」として最小実装から開始し、将来的な拡張の基盤を構築する

## Focus Area

- `apps/web-tester/src/ui/graph-editor/`ディレクトリの作成
- 読み取り専用のグラフビューの実装（Dagre.jsを使用した自動レイアウト）
- 既存の「ノードグラフ」タブへの統合
- ノードタイプ別の色分け表示
- ズーム・パン機能の基本実装

## Forbidden Area

- 既存のリスト形式GUIエディタの変更（補完のみ）
- 編集機能の実装（読み取り専用のみ）
- 既存のD3.jsグラフ（`graph.js`）の破壊的変更（段階的置換を想定）

## Constraints

- `docs/NEXT_PHASE_PROPOSAL.md`の設計を参照する
- Dagre.jsを使用した階層型レイアウト（トップダウン）
- 既存のGUIエディタ（`GuiEditorManager`）との状態同期を維持
- 最小実装のため、高度機能（ミニマップ、複数選択等）は将来の拡張とする

## DoD

- [ ] `apps/web-tester/src/ui/graph-editor/`ディレクトリを作成
- [ ] `GraphEditorManager.js`クラスを作成（基本構造）
- [ ] Dagre.jsをインストール・統合
- [ ] 読み取り専用のグラフビューを実装（ノード描画、エッジ描画）
- [ ] ノードタイプ別の色分け表示（開始：緑、会話：青、選択：黄、分岐：オレンジ、終了：赤）
- [ ] ズーム・パン機能の基本実装
- [ ] 既存の「ノードグラフ」タブに新エディタを統合
- [ ] 既存のGUIエディタとの状態同期を確認
- [ ] サンプルモデルで動作確認
- [ ] docs/inbox/ にレポート（REPORT_TASK_013_*.md）が作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

## Notes

- 本タスクは「スパイク」として最小実装から開始
- 将来的な拡張（編集機能、ミニマップ、複数選択等）は別タスクとして起票する
- `docs/NEXT_PHASE_PROPOSAL.md`の「ステップ1：基盤構築」と「ステップ2：ノード操作」を参考にする

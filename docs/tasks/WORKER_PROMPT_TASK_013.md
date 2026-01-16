# Worker Prompt: TASK_013_Phase2ReadOnlyGraphView

## 参照
- チケット: docs/tasks/TASK_013_Phase2ReadOnlyGraphView.md
- SSOT: docs/Windsurf_AI_Collab_Rules_latest.md
- HANDOVER: docs/HANDOVER.md
- MISSION_LOG: .cursor/MISSION_LOG.md（現在のフェーズ: P4完了、P5実行中）
- 設計ドキュメント: docs/NEXT_PHASE_PROPOSAL.md

## 境界
- Focus Area: `apps/web-tester/src/ui/graph-editor/`ディレクトリの作成、読み取り専用のグラフビュー実装、Dagre.js統合、既存の「ノードグラフ」タブへの統合、ノードタイプ別の色分け表示、ズーム・パン機能の基本実装
- Forbidden Area: 既存のリスト形式GUIエディタの変更、編集機能の実装（読み取り専用のみ）、既存のD3.jsグラフ（`graph.js`）の破壊的変更

## 前提条件
- Tier: 2
- Branch: main
- Report Target: docs/inbox/REPORT_TASK_013_20260104_*.md
- GitHubAutoApprove: false（docs/HANDOVER.md参照、pushは手動確認が必要）

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

## 停止条件
- Forbidden Area に触れないと解決できない
- 仕様仮定が3件以上
- SSOT が取得できない / `ensure-ssot.js` でも解決不可
- 依存追加 / 外部通信が必要で GitHubAutoApprove=false のため手動確認が必要
- 破壊的・復旧困難操作が必要
- 数分以上の待機が必須、またはタイムアウト超過が見込まれる

## 納品先
- docs/inbox/REPORT_TASK_013_20260104_*.md

## 実行手順（Worker向け）

### Phase 0: 参照と整備
1. `.cursor/MISSION_LOG.md` を読み込み、現在のフェーズと進捗を確認
2. SSOT: docs/Windsurf_AI_Collab_Rules_latest.md を確認
3. 進捗: docs/HANDOVER.md を確認
4. チケット: docs/tasks/TASK_013_Phase2ReadOnlyGraphView.md を確認
5. 設計ドキュメント: docs/NEXT_PHASE_PROPOSAL.md を確認（特に「ステップ1：基盤構築」と「ステップ2：ノード操作」）

### Phase 1: 前提の固定
1. Tier: 2
2. Branch: main（現在のブランチを確認）
3. Report Target: docs/inbox/REPORT_TASK_013_20260104_*.md
4. GitHubAutoApprove: false（pushは手動確認が必要）

### Phase 2: 境界確認
1. Focus Area: graph-editorディレクトリ作成、読み取り専用グラフビュー実装、Dagre.js統合、既存タブへの統合
2. Forbidden Area: 既存GUIエディタの変更、編集機能の実装、既存D3.jsグラフの破壊的変更

### Phase 3: 実行
1. `apps/web-tester/src/ui/graph-editor/`ディレクトリを作成
2. `GraphEditorManager.js`クラスを作成（基本構造）
3. Dagre.jsをインストール（`npm install dagre`）
4. 読み取り専用のグラフビューを実装（ノード描画、エッジ描画）
5. ノードタイプ別の色分け表示を実装
6. ズーム・パン機能の基本実装
7. 既存の「ノードグラフ」タブに新エディタを統合
8. 既存のGUIエディタとの状態同期を確認
9. サンプルモデルで動作確認

### Phase 4: 納品 & 検証
1. DoD各項目の達成確認（実際に実施した内容を記録）
2. チケットを DONE に更新し、DoD各項目に対して根拠を記入
3. docs/inbox/ にレポートを作成し、`report-validator.js` を実行
4. docs/HANDOVER.md を更新
5. `git status -sb` をクリーンにしてから commit（pushは手動確認が必要）

### Phase 5: チャット出力
- 完了時: `Done: docs/tasks/TASK_013_Phase2ReadOnlyGraphView.md. Report: docs/inbox/REPORT_TASK_013_*.md. Tests: <cmd>=<result>.`
- ブロッカー継続時: `Blocked: docs/tasks/TASK_013_Phase2ReadOnlyGraphView.md. Reason: <要点>. Next: <候補>. Report: docs/inbox/REPORT_TASK_013_*.md.`

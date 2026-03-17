# 推論エンジンUI統合仕様 (Inference Engine UI Integration)

## 概要

推論エンジン（Forward/Backward Chaining）の分析結果をWeb Testerエディタに統合し、ノード間の依存関係・到達可能性・影響範囲をインタラクティブに可視化する。

## 仕様ID

SP-INF-UI-001

## ステータス

done (Phase 1-3 実装完了)

## 動機

推論エンジン（SP-INF-001）は実装済みだが、現在テストコードからのみ利用可能。エディタUIに統合することで：

- ライターが「このノードに到達できるか？」を即座に確認できる
- 条件/効果の設定ミスを早期発見できる
- フラグ・変数の使用箇所を横断的に把握できる

## ユースケース

### UC-1: ノード到達パス表示 [実装済み]

**操作**: ノード選択時、Live Previewパネルに「到達パス」セクションを表示
**内容**: 開始ノードから選択ノードへのパスを表示（Backward Chaining: `findPathToGoal`）
**表示形式**: ステップリスト `start → [選択肢A] → node2 → [選択肢B] → 選択中ノード`
**クリック**: 各ステップのノードIDをクリックでそのノードに移動

### UC-2: 到達可能ノード一覧 [実装済み]

**操作**: Live Previewの「到達可能ノード」セクション
**内容**: 現在のセッション状態から到達可能なノード一覧（`findReachableNodes`）
**用途**: プレイスルー中にどのルートが開いているかを確認
**表示**: サマリー（N / M ノード到達可能）+ ノードID一覧。到達不能ノードはグレーアウト。
**グラフ連携**: 到達不能ノードはグラフビューで opacity 0.4 に半透明化。

### UC-3: 影響分析（Forward Chaining）[実装済み]

**操作**: ノード選択時、推論パネルの「影響分析」セクションに自動表示
**内容**: 選択ノードの各選択肢について、その選択肢を選んだ場合に影響を受ける他の選択肢を表示（`getAffectedChoices`）
**表示**: 選択肢ラベル + 影響先リスト（ノードID:選択肢ID）。影響先クリックで該当ノードに移動。

### UC-4: 状態キー逆引き [実装済み]

**操作**: ノード選択時、推論パネルの「状態キー使用状況」セクションに自動表示
**内容**: 選択ノードで使われている状態キーについて、他ノードでの条件参照・効果変更箇所を表示
**状態キー形式**: `{type}:{key}` (例: `flag:hasKey`, `resource:gold`)
**表示**: キーごとに条件参照先・効果変更先のリスト。クリックで該当ノードに移動。

### UC-5: What-if シミュレーション [実装済み]

**操作**: ノード選択時、推論パネルの「What-if シミュレーション」セクションに自動表示
**前提**: セッション状態が設定されていること（プレイスルー中）
**内容**: 各選択肢を仮選択した場合の状態変化と新たに到達可能になるノードを表示
**表示**:

- 状態差分: `key: before → after` 形式 (flags, resources, variables, inventory)
- 新規到達可能ノード: クリック可能なノードIDリスト
**実装**: `InferenceBridge.simulateChoice()` が `applyChoice` + `findReachableNodes` で差分計算

## UIデザイン

### 統合先: Live Previewパネル拡張

既存の`#livePreviewPanel`に折りたたみセクションとして追加する。

```text
Live Preview Panel
├── [既存] ノード情報 (#previewNodeDisplay)
├── [既存] 選択肢一覧 (#previewChoices)
├── [既存] パス表示 (#previewPath)
├── [既存] エンディング分析 (#endingVisualization)
└── [実装済み] 推論分析 (#inferenceAnalysis)      ← 折りたたみ可
    ├── 到達パス (UC-1)
    ├── 影響分析 (UC-3)
    ├── 状態キー使用状況 (UC-4)
    ├── What-if シミュレーション (UC-5)
    ├── 到達可能ノード (UC-2)
    └── クエリ (デバッグ用)
```

### グラフタブ連携 [実装済み]

ノードグラフタブにも同一の推論パネルを配置。`#graphInferencePanel` に `InferencePanel` インスタンスを追加。
Live Previewと同一の `InferenceBridge` を共有し、ノード選択に連動して更新される。

### デバッグクエリUI [実装済み]

推論パネル内にクエリセクションを配置。ノードIDを入力して推論分析を発火できる。

```text
推論分析パネル
├── 到達パス (UC-1)
├── 影響分析 (UC-3)
├── 状態キー使用状況 (UC-4)
├── What-if シミュレーション (UC-5)
├── 到達可能ノード (UC-2)
└── クエリ
    ├── ノードID入力フィールド
    ├── [分析] ボタン → update(nodeId) + onNodeClick(nodeId)
    └── [クリア] ボタン → update(null) でハイライト解除
```

### グラフエディタ視覚連携 [実装済み]

グラフビューでの視覚的フィードバック（Phase 3）。ノード選択時に自動的に適用される。

- **到達パスハイライト**: パス上のノード・エッジをゴールド (#d4a017) で強調、stroke-width 3
- **影響範囲色分け**: 影響を受けるノードをコーラル (#e07050) で強調、stroke-width 3
- **到達不能ノード半透明化**: セッション状態から到達不能なノードを opacity 0.4 に

**実装**: `GraphEditorManager.applyInferenceHighlight({ pathNodeIds, impactNodeIds, unreachableNodeIds })` で render() を呼ばずにスタイルのみ更新。`clearInferenceHighlight()` でクリア。
**連携**: `InferencePanel._syncGraphHighlight()` が update() のたびにハイライトデータを収集し、`onGraphHighlight` コールバック経由で `GraphEditorManager` に通知。

## 技術設計

### engine-ts側の変更 [実装済み]

`packages/engine-ts/src/browser.ts`に推論APIをre-export：

```typescript
// 推論エンジン
export { findPathToGoal, findReachableNodes } from './inference/backward-chaining.js'
export { buildDependencyGraph, getAffectedChoices } from './inference/forward-chaining.js'
export { getSupportedConditions, getSupportedEffects } from './inference/capabilities.js'
export { registry, registerBuiltins } from './inference/registry.js'
export type { Goal, PathStep, DependencyGraph, ForwardChainingResult } from './inference/types.js'
```

### web-tester側のモジュール

```text
apps/web-tester/src/features/inference/
├── inference-bridge.js   -- engine-tsの推論APIラッパー（キャッシュ・エラーハンドリング）[実装済み]
└── inference-panel.js    -- Live Previewパネルの推論セクション描画 [実装済み]
```

### InferenceBridge API [実装済み]

```javascript
class InferenceBridge {
  initialize(model)                              // モデルロード時に依存グラフを構築
  updateModel(model)                             // モデル変更時にキャッシュ再構築
  dispose()                                      // キャッシュ破棄

  findPath(goalNodeId, maxDepth = 20)            // UC-1: 到達パス
  getReachableNodes(session, maxDepth = 20)      // UC-2: 到達可能ノード
  getAffectedByChoice(nodeId, choiceId)          // UC-3: 影響分析
  findStateKeyUsage(stateKey)                    // UC-4: 状態キー逆引き
  getAllStateKeys()                               // UC-4: 全状態キー取得
  simulateChoice(session, nodeId, choiceId)      // UC-5: What-if シミュレーション

  get isReady                                    // 初期化済みか
}
```

### InferencePanel API [実装済み]

```javascript
class InferencePanel {
  constructor({ bridge, onNodeClick, onGraphHighlight })
  createElement()                  // DOM要素を生成
  update(nodeId)                   // 全セクションを更新 + グラフハイライト同期
  setSession(session)              // セッション状態を設定 (UC-2/UC-5に必要)
  setBridge(bridge)                // bridge参照を更新
}
```

内部メソッド:

- `_updatePath(nodeId)` — UC-1: 到達パス描画
- `_updateImpact(nodeId)` — UC-3: 影響分析描画
- `_updateStateKeys(nodeId)` — UC-4: 状態キー描画
- `_updateWhatIf(nodeId)` — UC-5: What-if描画
- `_updateReachable()` — UC-2: 到達可能ノード描画
- `_syncGraphHighlight(nodeId)` — グラフハイライトデータ収集・通知

### GraphEditorManager 推論ハイライトAPI [実装済み]

```javascript
// 推論ハイライトを適用 (render()を呼ばずにスタイルのみ更新)
applyInferenceHighlight({ pathNodeIds, impactNodeIds, unreachableNodeIds })

// 推論ハイライトをクリア
clearInferenceHighlight()
```

色定義:
- パスノード/エッジ: ゴールド (#d4a017), stroke-width 3
- 影響範囲ノード: コーラル (#e07050), stroke-width 3
- 到達不能ノード: opacity 0.4
- 選択状態は推論ハイライトより優先される

### GUI統合 (`gui-editor.js`) [実装済み]

```javascript
// 初期化
this.inferenceBridge = new InferenceBridge()
this.inferencePanel = new InferencePanel({ bridge, onNodeClick })
this.graphInferencePanel = new InferencePanel({ bridge, onNodeClick }) // グラフタブ用

// モデルロード時
this.inferenceBridge.initialize(model)

// ノード選択時
this.inferencePanel.setSession(session)
this.inferencePanel.update(nodeId)
this.graphInferencePanel.setSession(session)
this.graphInferencePanel.update(nodeId)
```

### 性能考慮

- `buildDependencyGraph`はモデルロード時に1回実行、以降キャッシュ
- `findPathToGoal`はBFS探索のため大規模モデルでは遅延の可能性 → maxDepth制限（デフォルト20）
- `findReachableNodes`はセッション状態依存 → プレイスルー操作のたびに再計算が必要
- UC-4（状態キー逆引き）は依存グラフから静的に取得可能、低コスト
- UC-5 simulateChoice は `applyChoice` + `findReachableNodes` x2 を実行。大規模モデルでは注意

## フェーズ分割

### Phase 1（最小実装）[完了]

- [x] `browser.ts`に推論APIをre-export

- [x] `inference-bridge.js`の基本実装 (initialize, findPath, getReachableNodes, getAffectedByChoice)
- [x] `inference-panel.js` Live Preview描画
- [x] Live Previewに到達パス表示（UC-1）
- [x] 到達パスのノードIDクリックで移動
- [x] `gui-editor.css` 推論パネルスタイル追加

### Phase 2（分析機能 + What-if）[完了 — 手動確認未実施]

- [x] 影響分析（UC-3）の表示 — InferencePanel._updateImpact
- [x] 状態キー逆引き（UC-4）のLive Previewパネル表示 — InferenceBridge.findStateKeyUsage/getAllStateKeys + InferencePanel._updateStateKeys
- [x] What-if シミュレーション（UC-5）— InferenceBridge.simulateChoice + InferencePanel._updateWhatIf
- [x] グラフタブ用推論パネル — graphInferencePanel として gui-editor.js に統合

### Phase 3（グラフ視覚連携 + 残機能）[完了]

- [x] 到達可能ノード一覧のパネルUI（UC-2）— InferencePanel._updateReachable + CSS追加
- [x] デバッグクエリUI — InferencePanel のクエリセクション (ノードID入力 + 分析/クリアボタン)
- [x] グラフエディタでのパスハイライト — GraphEditorManager.applyInferenceHighlight (ゴールド #d4a017)
- [x] 到達不能ノードの半透明化 — opacity 0.4
- [x] 影響範囲の色分け — コーラル #e07050
- [x] パネル→グラフ連携 — InferencePanel._syncGraphHighlight + onGraphHighlight コールバック
- [x] gui-editor.js: setGraphManager() でグラフエディタ参照を注入

## 依存仕様

- SP-INF-001: 推論エンジン（実装済み）
- SP-VAR-001: 変数システム（推論エンジンが変数条件をサポート）
- SP-HIE-001: 階層システム（ノード一覧の表示に影響）

## 制限事項

- 推論はモデル構造に基づく静的分析が中心。動的分析（`findReachableNodes`）はプレイスルー中のみ有効
- グラフハイライトは render() を呼ばずに D3 attr で直接更新するため、dagre レイアウト再計算は発生しない
- 大規模モデル（100ノード超）でのBFS探索は表示遅延の可能性あり
- 到達不能ノード半透明化はセッション未設定時には適用されない

## 実装ファイル

### Phase 1（実装済み）

- `packages/engine-ts/src/browser.ts` -- 推論APIのre-export追加
- `apps/web-tester/src/features/inference/inference-bridge.js` -- APIラッパー（キャッシュ付き）
- `apps/web-tester/src/features/inference/inference-panel.js` -- Live Preview描画（到達パス）
- `apps/web-tester/src/ui/gui-editor.js` -- 推論パネル統合
- `apps/web-tester/src/styles/gui-editor.css` -- 推論パネルスタイル

### Phase 2（実装済み）

- `apps/web-tester/src/features/inference/inference-bridge.js` -- findStateKeyUsage/getAllStateKeys/simulateChoice 追加
- `apps/web-tester/src/features/inference/inference-panel.js` -- 影響分析(_updateImpact)/状態キー(_updateStateKeys)/What-if(_updateWhatIf)セクション追加
- `apps/web-tester/src/ui/gui-editor.js` -- graphInferencePanel 統合
- `apps/web-tester/src/styles/gui-editor.css` -- 影響分析/状態キー/What-if UIスタイル追加

### Phase 3（実装済み）

- `apps/web-tester/src/ui/graph-editor/GraphEditorManager.js` -- applyInferenceHighlight/clearInferenceHighlight API追加、_updateSelectionStyles拡張
- `apps/web-tester/src/features/inference/inference-panel.js` -- onGraphHighlight コールバック、_syncGraphHighlight、クエリUI、_updateReachable
- `apps/web-tester/src/ui/gui-editor.js` -- setGraphManager()、graphInferencePanel に onGraphHighlight 接続
- `apps/web-tester/src/app-controller.js` -- guiEditorManager.setGraphManager(graphManager) 呼出
- `apps/web-tester/src/styles/gui-editor.css` -- クエリUI スタイル追加

## テスト

- `inference-bridge.js`のユニットテスト（キャッシュ・エラーハンドリング）
- 既存の`inference.test.ts`がエンジン側のロジックをカバー
- Phase 2 の手動確認は未実施（影響分析・状態キー・What-if の動作検証が必要）

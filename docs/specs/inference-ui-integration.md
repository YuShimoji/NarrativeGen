# 推論エンジンUI統合仕様 (Inference Engine UI Integration)

## 概要

推論エンジン（Forward/Backward Chaining）の分析結果をWeb Testerエディタに統合し、ノード間の依存関係・到達可能性・影響範囲をインタラクティブに可視化する。

## 仕様ID

SP-INF-UI-001

## ステータス

partial (Phase 1実装完了)

## 動機

推論エンジン（SP-INF-001）は実装済みだが、現在テストコードからのみ利用可能。エディタUIに統合することで：

- ライターが「このノードに到達できるか？」を即座に確認できる
- 条件/効果の設定ミスを早期発見できる
- フラグ・変数の使用箇所を横断的に把握できる

## ユースケース

### UC-1: ノード到達パス表示

**操作**: ノード選択時、Live Previewパネルに「到達パス」セクションを表示
**内容**: 開始ノードから選択ノードへのパスを表示（Backward Chaining: `findPathToGoal`）
**表示形式**: ステップリスト `start --[選択肢A]--> node2 --[選択肢B]--> 選択中ノード`
**クリック**: 各ステップのノードIDをクリックでそのノードに移動

### UC-2: 到達可能ノード一覧

**操作**: デバッグパネルまたはLive Previewの「到達可能」セクション
**内容**: 現在のセッション状態から到達可能なノード一覧（`findReachableNodes`）
**用途**: プレイスルー中にどのルートが開いているかを確認
**表示**: ノードID + タイトルのリスト、到達不能ノードはグレーアウト

### UC-3: 影響分析（Forward Chaining）

**操作**: 選択肢にホバーまたは選択肢の「影響分析」ボタン
**内容**: その選択肢を選んだ場合に影響を受ける他の選択肢を表示（`getAffectedChoices`）
**表示**: 影響先の選択肢リスト（ノードID:選択肢ID）

### UC-4: 状態キー逆引き

**操作**: フラグ・変数名で検索
**内容**: 指定した状態キー（フラグ/リソース/変数）を条件や効果で使用しているノード・選択肢の一覧
**用途**: 「このフラグはどこで設定され、どこで参照されているか」の横断検索

## UIデザイン

### 統合先: Live Previewパネル拡張

既存の`#livePreviewPanel`に折りたたみセクションとして追加する。

```
Live Preview Panel
├── [既存] ノード情報 (#previewNodeDisplay)
├── [既存] 選択肢一覧 (#previewChoices)
├── [既存] パス表示 (#previewPath)
├── [既存] エンディング分析 (#endingVisualization)
├── [新規] 推論分析 (#inferenceAnalysis)      ← 折りたたみ可
│   ├── 到達パス (#inferencePaths)
│   ├── 影響分析 (#inferenceImpact)
│   └── 状態キー使用状況 (#inferenceStateKeys)
└── [新規] 到達可能ノード (#reachabilityPanel) ← 折りたたみ可
```

### デバッグパネル拡張

`#debugPanel`に推論クエリ用のインターフェースを追加する。

```
Debug Panel
├── [既存] バリデーション結果
├── [新規] 推論クエリ (#inferenceQuery)
│   ├── クエリ種別セレクタ (到達パス / 到達可能ノード / 状態キー逆引き)
│   ├── パラメータ入力 (ノードID / 状態キー名)
│   └── 結果表示エリア
```

### グラフエディタ連携

グラフビューでの視覚的フィードバック（将来拡張）：

- 到達パス上のノード・エッジをハイライト
- 影響を受ける選択肢を色分け表示
- 到達不能ノードの半透明化

## 技術設計

### engine-ts側の変更

`packages/engine-ts/src/browser.ts`に推論APIをre-export：

```typescript
// 推論エンジン
export { findPathToGoal, findReachableNodes } from './inference/backward-chaining.js'
export { buildDependencyGraph, getAffectedChoices } from './inference/forward-chaining.js'
export { getSupportedConditions, getSupportedEffects } from './inference/capabilities.js'
export { registry, registerBuiltins } from './inference/registry.js'
export type { Goal, PathStep, DependencyGraph, ForwardChainingResult } from './inference/types.js'
```

### web-tester側の新規モジュール

```
apps/web-tester/src/features/inference/
├── inference-panel.js      -- Live Previewパネルの推論セクション描画
├── inference-query.js      -- デバッグパネルのクエリUI
└── inference-bridge.js     -- engine-tsの推論APIラッパー（キャッシュ・エラーハンドリング）
```

### inference-bridge.js（APIラッパー）

```typescript
class InferenceBridge {
  private depGraph: DependencyGraph | null = null

  // モデルロード時に依存グラフを構築（1回のみ）
  initialize(model: Model): void

  // UC-1: ノード到達パス
  findPath(startId: string, goalId: string): PathStep[] | null

  // UC-2: 到達可能ノード
  getReachableNodes(session: SessionState): Map<string, PathStep[]>

  // UC-3: 影響分析
  getAffectedByChoice(nodeId: string, choiceId: string): string[]

  // UC-4: 状態キー逆引き
  findStateKeyUsage(stateKey: string): { conditions: Location[], effects: Location[] }
}
```

### inference-panel.js（描画）

```typescript
// Live Previewのノード選択時に呼ばれる
function updateInferencePanel(nodeId: string, bridge: InferenceBridge): void

// 到達パスのステップリストをDOM生成
function renderPathSteps(steps: PathStep[]): HTMLElement

// 影響分析結果を表示
function renderImpactAnalysis(affected: string[]): HTMLElement
```

### 性能考慮

- `buildDependencyGraph`はモデルロード時に1回実行、以降キャッシュ
- `findPathToGoal`はBFS探索のため大規模モデルでは遅延の可能性 → maxDepth制限（デフォルト20）
- `findReachableNodes`はセッション状態依存 → プレイスルー操作のたびに再計算が必要
- UC-4（状態キー逆引き）は依存グラフから静的に取得可能、低コスト

## フェーズ分割

### Phase 1（最小実装）[完了]

- [x] `browser.ts`に推論APIをre-export
- [x] `inference-bridge.js`の基本実装
- [x] `inference-panel.js` Live Preview描画
- [x] Live Previewに到達パス表示（UC-1）
- [x] 到達パスのノードIDクリックで移動
- [x] `gui-editor.css` 推論パネルスタイル追加

### Phase 2（分析機能）[実装済み — 手動確認未実施]

- [x] 影響分析（UC-3）の表示 — InferencePanel._updateImpact
- [x] 状態キー逆引き（UC-4）のLive Previewパネル表示 — InferencePanel._updateStateKeys + InferenceBridge.findStateKeyUsage/getAllStateKeys
- [ ] 到達可能ノード一覧（UC-2）— セッション状態依存のため Phase 3 に移動

### Phase 3（グラフ連携・将来）

- [ ] グラフエディタでのパスハイライト
- [ ] 到達不能ノードの視覚的表示
- [ ] 影響範囲の色分け

## 依存仕様

- SP-INF-001: 推論エンジン（実装済み）
- SP-VAR-001: 変数システム（推論エンジンが変数条件をサポート）
- SP-HIE-001: 階層システム（ノード一覧の表示に影響）

## 制限事項

- 推論はモデル構造に基づく静的分析が中心。動的分析（`findReachableNodes`）はプレイスルー中のみ有効
- グラフエディタ連携（Phase 3）は既存のSVGレンダリングとの統合が必要で、設計が別途必要
- 大規模モデル（100ノード超）でのBFS探索は表示遅延の可能性あり

## 実装ファイル

### Phase 1（実装済み）
- `packages/engine-ts/src/browser.ts` -- 推論APIのre-export追加
- `apps/web-tester/src/features/inference/inference-bridge.js` -- APIラッパー（キャッシュ付き）
- `apps/web-tester/src/features/inference/inference-panel.js` -- Live Preview描画（到達パス）
- `apps/web-tester/src/ui/gui-editor.js` -- 推論パネル統合
- `apps/web-tester/src/styles/gui-editor.css` -- 推論パネルスタイル

### Phase 2（実装済み）
- `apps/web-tester/src/features/inference/inference-bridge.js` -- findStateKeyUsage/getAllStateKeys追加
- `apps/web-tester/src/features/inference/inference-panel.js` -- 影響分析(_updateImpact)/状態キー(_updateStateKeys)セクション追加
- `apps/web-tester/src/styles/gui-editor.css` -- 影響分析/状態キーUIスタイル追加

## テスト

- `inference-bridge.js`のユニットテスト（キャッシュ・エラーハンドリング）
- 既存の`inference.test.ts`がエンジン側のロジックをカバー

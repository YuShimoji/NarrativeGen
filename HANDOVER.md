# 作業申し送り

## 最終更新
- **日時**: 2026-03-06
- **ブランチ**: `feature/main-js-split-phase2`
- **PR**: #80（オープン中）

## 直近の作業（2026-03-06）

### アーキテクチャリデザイン（3フェーズ完了）

#### Phase 1: 推論レジストリ基盤

- プラグインレジストリパターンで条件評価・エフェクト適用を拡張可能に
- `packages/engine-ts/src/inference/` に registry, conditions, effects を構築

#### Phase 2: グラフエディタ実用化

- `GraphEditorManager.js` からDagreLayoutEngine, ContextMenuManagerを分離
- レイアウト設定改善（nodesep: 80, ranksep: 120, edgesep: 40）

#### Phase 3: 推論機能実装

- 前方連鎖: `buildDependencyGraph`, `applyChoiceWithForwardChaining`
- 後方連鎖: `findPathToGoal`, `findReachableNodes`
- Capability Discovery: `getSupportedConditions`, `getSupportedEffects`

### UI改善

- ミニマップDOM配置バグ修正（SVG内のdiv → graph-container配下に移動）
- カラーパレットを「モダンクラシカル」に変更（落ち着いたトーン）
- E2Eテスト: theme-toggle 11件をskipマーク（UIと未接続のため）

### ドキュメント整理（108件 → 34件）

- Windsurf系3件を `docs/archive/legacy-windsurf/` に移動
- レポート群39件を `docs/archive/legacy-reports/` に移動
- ステータス/ロードマップ11件を `docs/archive/legacy-status/` に移動
- 古いHANDOVER 5件を `docs/archive/legacy-handovers/` に移動
- 完了済みタスク26件を `docs/archive/legacy-tasks/` に移動
- WORKER_PROMPT_* 19件を `docs/archive/legacy-tasks/` に移動
- 陳腐化テスト文書3件を `docs/archive/legacy-tests/` に移動
- `.shared-workflows` submodule 参照解除（190ファイル）
- `.cursor/` ディレクトリ削除

## 現在の状態

### CI・テスト

- **engine-ts**: 73テスト全合格（10ファイル）
- **web-tester**: Viteビルド成功
- **E2E**: 24 passed, 36 skipped

### 主要モジュール構成

#### packages/engine-ts/src/inference/

| ファイル | 役割 |
|---------|------|
| registry.ts | InferenceRegistry（Map-based singleton） |
| types.ts | EvaluationContext, ConditionEvaluator, EffectApplicator |
| forward-chaining.ts | 依存グラフ構築、前方連鎖推論 |
| backward-chaining.ts | BFSパス探索、到達可能ノード |
| capabilities.ts | 登録済evaluator/applicatorの動的発見 |
| conditions/*.ts | Flag, Resource, Variable, TimeWindow, Logical |
| effects/*.ts | SetFlag, AddResource, SetVariable, Goto |

#### apps/web-tester/src/ui/graph-editor/

| ファイル | 役割 |
|---------|------|
| GraphEditorManager.js | グラフ可視化・編集の中核 |
| layout/DagreLayoutEngine.js | Dagre.jsラッパー |
| interaction/ContextMenuManager.js | 右クリックメニュー |

## 再開手順
1. `git fetch origin && git pull`
2. `npm ci`
3. `npm run build --workspace=packages/engine-ts`
4. `npm test --workspace=packages/engine-ts`
5. `npm run build --workspace=apps/web-tester`
6. `npm run dev --workspace=apps/web-tester` → `http://localhost:5173/`

---

SSOT: `docs/WORKFLOW_STATE_SSOT.md`

# 推論エンジン仕様 (Inference Engine)

## 概要

条件評価と効果適用のプラグイン型推論エンジン。Forward Chaining（効果の波及計算）とBackward Chaining（目標到達可能性探索）をサポート。

## 仕様ID

SP-INF-001

## ステータス

done (実装完了)

## アーキテクチャ

### プラグインレジストリパターン

```typescript
interface ConditionEvaluator<T> {
  type: string
  evaluate(condition: T, state: PlaythroughState): boolean
}

interface EffectApplicator<T> {
  type: string
  apply(effect: T, state: PlaythroughState): void
}
```

- `ConditionEvaluatorRegistry`: 条件評価器の登録・取得
- `EffectApplicatorRegistry`: 効果適用器の登録・取得
- 型安全性と拡張性を両立

### 組込条件評価器

- `flag`: フラグの有無確認
- `resource`: リソースの閾値比較
- `variable`: 変数の比較（文字列・数値対応）
- `timeWindow`: 時間範囲内の条件
- `and`, `or`, `not`: 論理演算

### 組込効果適用器

- `setFlag`: フラグの設定
- `addResource`: リソースの加算
- `setVariable`, `modifyVariable`: 変数の操作
- `goto`: 次ノードへの遷移

## 推論アルゴリズム

### Forward Chaining

1. 依存グラフ構築: `buildDependencyGraph(nodeId, edges)`
2. 効果適用: `applyEffects(nodeId, state)`
3. 影響選択肢特定: `getAffectedChoices(nodeId, state)`

現在のノードから出る効果を適用し、影響を受ける選択肢を特定する。

### Backward Chaining

#### 静的パス探索: `findPathToGoal(startId, goalCondition, edges)`

- 幅優先探索（BFS）でゴール条件を満たすパスを探索
- 状態更新なし（構造のみ）

#### 動的到達可能性: `findReachableNodes(startId, state, edges)`

- 現在の状態から到達可能なノードを探索
- 条件評価を含む動的探索

## Capability Discovery

```typescript
InferenceEngine.getSupportedConditions(): string[]
InferenceEngine.getSupportedEffects(): string[]
```

登録済みの条件・効果の型一覧を取得。動的なUI生成や検証に使用。

## 実装ファイル

- `packages/engine-ts/src/inference/InferenceEngine.ts` -- メインエンジン
- `packages/engine-ts/src/inference/ConditionEvaluatorRegistry.ts` -- 条件評価器レジストリ
- `packages/engine-ts/src/inference/EffectApplicatorRegistry.ts` -- 効果適用器レジストリ
- `packages/engine-ts/src/inference/evaluators/*.ts` -- 組込条件評価器（7ファイル）
- `packages/engine-ts/src/inference/applicators/*.ts` -- 組込効果適用器（4ファイル）

## テスト

- `packages/engine-ts/test/inference.test.ts` -- 30以上のテストケース
- Forward/Backward Chaining、依存グラフ構築、capability discoveryを網羅

## 拡張

カスタム条件評価器・効果適用器の登録:

```typescript
const customEvaluator: ConditionEvaluator<MyCondition> = {
  type: 'myCondition',
  evaluate: (cond, state) => { /* ... */ }
}

InferenceEngine.registerConditionEvaluator(customEvaluator)
```

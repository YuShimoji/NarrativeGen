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
interface EvaluationContext {
  flags: FlagState
  resources: ResourceState
  variables: VariableState
  time: number
  model?: Model
  session?: SessionState
}

interface ConditionEvaluator<T> {
  type: string
  evaluate(condition: T, context: EvaluationContext): boolean
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
- `hasItem`: inventory の所持判定
- `property`: Entity property の比較
- `hasEvent`: session event の存在判定
- `timeWindow`: 時間範囲内の条件
- `knowledgeRule`: SP-KNOW-002 pure evaluator による noticed 判定
- `and`, `or`, `not`: 論理演算

### KnowledgeRule evaluator boundary

`knowledgeRule` evaluator は direct choice path と同じ
`evaluateKnowledgeRule(session, model, ruleId)` を呼ぶ。`EvaluationContext` に
`model` または `session` がない場合は fail closed で false を返し、anomaly、
domain fallback、missing-reason logic を registry 側へ複製しない。

現在の dependency graph は flag/resource/variable など session key の依存を表す。
KnowledgeRule evaluator は model-only dependency を空集合として返すため、
character/entity/rule provenance や richer What-if dependency graph を実装済みとは
扱わない。詳細は
[SP-KNOW-002](knowledge-derived-choice-availability.md) を正とする。

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
getSupportedConditions(): string[]
getSupportedEffects(): string[]
```

登録済みの条件・効果の型一覧を取得。`knowledgeRule` を含め、動的なUI生成や
検証に使用する。

## 実装ファイル

- `packages/engine-ts/src/inference/registry.ts` -- 条件評価器 / 効果適用器レジストリ
- `packages/engine-ts/src/inference/types.ts` -- EvaluationContext と evaluator/applicator contract
- `packages/engine-ts/src/inference/capabilities.ts` -- capability discovery
- `packages/engine-ts/src/inference/conditions/*.ts` -- 組込条件評価器
- `packages/engine-ts/src/inference/effects/*.ts` -- 組込効果適用器
- `packages/engine-ts/src/inference/forward-chaining.ts` / `backward-chaining.ts` -- 推論アルゴリズム

## テスト

- `packages/engine-ts/test/inference.test.ts` -- registry / chaining / capability tests
- `packages/engine-ts/test/character-knowledge.spec.ts` -- shared knowledge evaluator parity tests
- Forward/Backward Chaining、依存グラフ構築、capability discoveryを網羅

## 拡張

カスタム条件評価器・効果適用器の登録:

```typescript
const customEvaluator: ConditionEvaluator<MyCondition> = {
  type: 'myCondition',
  evaluate: (cond, context) => { /* ... */ }
}

registry.registerCondition(customEvaluator)
```

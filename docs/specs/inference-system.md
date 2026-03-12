# SP-004: Inference System

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

engine-ts の推論システム。プラグイン可能な条件評価・エフェクト適用、前方連鎖・後方連鎖推論を提供。

## アーキテクチャ

```
inference/
  types.ts              # インターフェース定義
  registry.ts           # プラグインレジストリ (singleton)
  forward-chaining.ts   # 前方連鎖推論
  backward-chaining.ts  # 後方連鎖パス探索
  capabilities.ts       # 登録済み機能の動的発見
  conditions/           # 組み込み条件 Evaluator (5種)
  effects/              # 組み込みエフェクト Applicator (4種)
```

## レジストリパターン

`InferenceRegistry` にプラグインとして条件 Evaluator / エフェクト Applicator を登録。
`registerBuiltins()` がエンジン初期化時に自動呼出しされ、組み込みプラグインが登録される。

### ConditionEvaluator

```typescript
interface ConditionEvaluator<T = unknown> {
  readonly type: string
  evaluate(condition: T, context: EvaluationContext): boolean
  getDependencies?(condition: T): DependencyInfo
}
```

### EffectApplicator

```typescript
interface EffectApplicator<T = unknown> {
  readonly type: string
  apply(effect: T, session: SessionState): SessionState
  getAffectedKeys?(effect: T): DependencyInfo
}
```

### EvaluationContext

```typescript
interface EvaluationContext {
  flags: FlagState
  resources: ResourceState
  variables: VariableState
  time: number
}
```

## 組み込み条件 Evaluator

| type | フィールド |
|------|-----------|
| `flag` | `{ flag: string, value: boolean }` |
| `resource` | `{ resource: string, operator: string, value: number }` |
| `variable` | `{ variable: string, operator: string, value: string }` |
| `timeWindow` | `{ min?: number, max?: number }` |
| `and` / `or` / `not` | 論理結合 |

## 組み込みエフェクト Applicator

| type | フィールド |
|------|-----------|
| `setFlag` | `{ flag: string, value: boolean }` |
| `addResource` | `{ resource: string, amount: number }` |
| `setVariable` | `{ variable: string, value: string }` |
| `goto` | `{ target: string }` |

## 前方連鎖 (Forward Chaining)

選択肢のエフェクト適用後、影響を受ける他の選択肢を依存グラフから特定。

```typescript
buildDependencyGraph(model: Model): DependencyGraph
applyChoiceWithForwardChaining(session, model, choiceId, depGraph): ForwardChainingResult
```

### 依存グラフ

- `stateToChoices`: 状態キー → 依存する選択肢のセット
- `choiceToAffectedKeys`: 選択肢 → 変更する状態キーのセット
- 状態キー形式: `"flag:flagName"`, `"resource:gold"`, `"variable:mood"`

## 後方連鎖 (Backward Chaining)

ゴールノードへの到達パスを BFS で探索。

| 関数 | 条件評価 | 用途 |
|------|---------|------|
| `findPathToGoal` | なし (静的) | エディタ上の参考経路 |
| `findReachableNodes` | あり (動的) | デバッグパネルの到達可能ノード |

## Capability Discovery

```typescript
getSupportedConditions(): string[]
getSupportedEffects(): string[]
```

登録済みの条件/エフェクトの type 一覧を取得。web-tester でのフォーム動的生成に使用。

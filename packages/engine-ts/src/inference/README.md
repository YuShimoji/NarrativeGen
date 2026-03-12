# 推論システム (Inference System)

`@narrativegen/engine-ts` の条件評価・エフェクト適用・推論機能を提供する。

## アーキテクチャ

```
inference/
  types.ts              # インターフェース定義
  registry.ts           # プラグインレジストリ（singleton）
  forward-chaining.ts   # 前方連鎖推論
  backward-chaining.ts  # 後方連鎖パス探索
  capabilities.ts       # 登録済み機能の動的発見
  conditions/           # 組み込み条件Evaluator
    flag.ts             # { type: "flag", flag: string, value: boolean }
    resource.ts         # { type: "resource", resource: string, operator: string, value: number }
    variable.ts         # { type: "variable", variable: string, operator: string, value: string }
    time-window.ts      # { type: "timeWindow", min?: number, max?: number }
    logical.ts          # { type: "and"|"or"|"not", conditions/condition: ... }
  effects/              # 組み込みエフェクトApplicator
    set-flag.ts         # { type: "setFlag", flag: string, value: boolean }
    add-resource.ts     # { type: "addResource", resource: string, amount: number }
    set-variable.ts     # { type: "setVariable", variable: string, value: string }
    goto.ts             # { type: "goto", target: string }
```

## レジストリパターン

条件Evaluator・エフェクトApplicatorは `InferenceRegistry` に登録され、型文字列で動的にディスパッチされる。

### 組み込み登録

`registerBuiltins()` がエンジン初期化時（`index.ts` / `browser.ts`）に自動呼出しされ、全組み込みEvaluator/Applicatorが登録される。

### カスタムEvaluatorの追加方法

```typescript
import { registry } from '@narrativegen/engine-ts'
import type { ConditionEvaluator, EvaluationContext } from '@narrativegen/engine-ts'

const myEvaluator: ConditionEvaluator = {
  type: 'myCustomCondition',
  evaluate(cond, ctx: EvaluationContext): boolean {
    return ctx.flags['someFlag'] === true
  },
  getDependencies(cond) {
    return { flags: ['someFlag'] }
  }
}

registry.registerCondition(myEvaluator)
```

### カスタムApplicatorの追加方法

```typescript
import { registry } from '@narrativegen/engine-ts'
import type { EffectApplicator } from '@narrativegen/engine-ts'
import type { SessionState } from '@narrativegen/engine-ts'

const myApplicator: EffectApplicator = {
  type: 'myCustomEffect',
  apply(effect, session: SessionState): SessionState {
    return {
      ...session,
      flags: { ...session.flags, customFlag: true }
    }
  },
  getAffectedKeys(effect) {
    return { flags: ['customFlag'] }
  }
}

registry.registerEffect(myApplicator)
```

## インターフェース

### EvaluationContext

条件評価に渡されるコンテキスト:

```typescript
interface EvaluationContext {
  flags: FlagState       // Record<string, boolean>
  resources: ResourceState // Record<string, number>
  variables: VariableState // Record<string, string>
  time: number
}
```

### ConditionEvaluator

```typescript
interface ConditionEvaluator<T = unknown> {
  readonly type: string
  evaluate(condition: T, context: EvaluationContext): boolean
  getDependencies?(condition: T): DependencyInfo  // 前方連鎖で使用
}
```

### EffectApplicator

```typescript
interface EffectApplicator<T = unknown> {
  readonly type: string
  apply(effect: T, session: SessionState): SessionState
  getAffectedKeys?(effect: T): DependencyInfo  // 前方連鎖で使用
}
```

## 前方連鎖 (Forward Chaining)

選択肢のエフェクト適用後、影響を受ける他の選択肢を特定する。

```typescript
import { buildDependencyGraph, applyChoiceWithForwardChaining } from '@narrativegen/engine-ts'

// モデルから依存グラフを事前構築（1回のみ）
const depGraph = buildDependencyGraph(model)

// 選択肢を適用し、影響を受ける選択肢を取得
const result = applyChoiceWithForwardChaining(session, model, choiceId, depGraph)
// result.session: 更新されたセッション
// result.affectedChoices: ["nodeId:choiceId", ...] 形式で影響を受ける選択肢
```

### 依存グラフの構造

- `stateToChoices`: 状態キー → その状態に依存する選択肢のセット
- `choiceToAffectedKeys`: 選択肢 → そのエフェクトが変更する状態キーのセット
- 状態キーの形式: `"flag:flagName"`, `"resource:gold"`, `"variable:mood"` 等

## 後方連鎖 (Backward Chaining)

ゴールノードへの到達パスをBFSで探索する。

```typescript
import { findPathToGoal, findReachableNodes } from '@narrativegen/engine-ts'

// 静的グラフ上でゴールへのパスを探索（条件無視）
const path = findPathToGoal(model, currentNodeId, { type: 'reachNode', nodeId: 'ending_1' })
// path: [{ nodeId, choiceId, target }, ...] | null

// 現在のセッション状態から到達可能なノードを探索（条件評価あり）
const reachable = findReachableNodes(model, session, maxDepth)
// reachable: Map<nodeId, PathStep[]>
```

### findPathToGoal vs findReachableNodes

| 関数 | 条件評価 | 用途 |
|------|---------|------|
| `findPathToGoal` | しない（静的探索） | エディタ上で「このノードへどう辿り着くか」の参考経路 |
| `findReachableNodes` | する（動的探索） | デバッグパネルで「現在の状態から行ける場所」の表示 |

## Capability Discovery

```typescript
import { getSupportedConditions, getSupportedEffects } from '@narrativegen/engine-ts'

getSupportedConditions()
// → ["flag", "resource", "variable", "timeWindow", "and", "or", "not"]

getSupportedEffects()
// → ["setFlag", "addResource", "setVariable", "goto"]
```

web-tester側で条件/エフェクトフォームを動的生成する際に使用する。

## テスト

```bash
cd packages/engine-ts
npx vitest run
# 73テスト全通過（推論関連: 30+テスト）
```

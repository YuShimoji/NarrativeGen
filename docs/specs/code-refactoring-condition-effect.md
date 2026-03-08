# 条件・効果ロジック重複解消リファクタリング

## 概要

`evalCondition` / `applyEffect` / `cmp` の3ファイル重複実装を共通モジュール化。

## 仕様ID

SP-REFACTOR-001

## ステータス

done (完了: 2026-03-09)

## 背景

NarrativeGenエンジンは3つのエントリポイントを持つ:

1. **session-ops.ts** -- 条件評価キャッシュ機能付き実装（パフォーマンス重視）
2. **index.ts** -- Node.js環境向けシンプル実装（スキーマ検証あり）
3. **browser.ts** -- ブラウザ向けシンプル実装（Node.js機能なし）

変数拡張実装時、これら3ファイルすべてに同じ変更を適用する必要があり、保守性の問題が顕在化した。

## リファクタリング設計

### 共通モジュール作成

**ファイル:** `packages/engine-ts/src/condition-effect-ops.ts`

以下の関数を単一実装として提供:

```typescript
export function cmp(op: '>=' | '<=' | '>' | '<' | '==', a: number, b: number): boolean
export function evalCondition(cond: Condition, flags: FlagState, resources: ResourceState, variables: VariableState, time: number): boolean
export function applyEffect(effect: Effect, session: SessionState): SessionState
```

**実装内容:**
- 変数拡張を含む完全な条件評価・効果適用ロジック
- and/or/not再帰的条件評価
- 数値演算・比較条件対応
- ゼロ除算保護

### 各エントリポイントの変更

#### session-ops.ts

- `evalCondition`を`evalConditionCore`として共通モジュールからインポート
- ローカルの`evalCondition`をキャッシュラッパーとして維持（パフォーマンス特性保持）
- `applyEffect`は直接インポート
- ローカルの`cmp`定義を削除

```typescript
import { evalCondition as evalConditionCore, applyEffect } from './condition-effect-ops.js'

// キャッシュラッパー
export function evalCondition(cond: Condition, flags: FlagState, resources: ResourceState, variables: VariableState, time: number): boolean {
  const key = JSON.stringify({ cond, flags, resources, variables, time })
  if (conditionCache.has(key)) return conditionCache.get(key)!
  const result = evalConditionCore(cond, flags, resources, variables, time)
  if (conditionCache.size > 10000) conditionCache.clear()
  conditionCache.set(key, result)
  return result
}
```

#### index.ts

- `evalCondition`, `applyEffect`を共通モジュールからインポート
- ローカルの`cmp`, `evalCondition`, `applyEffect`定義を削除（約90行削減）

```typescript
import {
  evalCondition,
  applyEffect,
} from './condition-effect-ops.js'
```

#### browser.ts

- `evalCondition`, `applyEffect`を共通モジュールからインポート
- ローカルの`cmp`, `evalCondition`, `applyEffect`定義を削除（約100行削減）
- 不要な型インポート（`Condition`, `Effect`, `FlagState`, `ResourceState`, `VariableState`）を削除

```typescript
import {
  evalCondition,
  applyEffect,
} from './condition-effect-ops.js'
```

## 検証

以下のテストで動作保証:

1. **TypeScript型チェック**: `npx tsc --noEmit` -- エラーなし
2. **ユニットテスト**: `npx vitest run` -- 15件全通過
3. **エクスポート検証**: `verify-export-formatters.mjs` -- 全フォーマッター正常
4. **ビルド**: `npx vite build apps/web-tester` -- 成功

## 効果

- **保守性向上**: ロジック変更が1箇所で完結
- **コード削減**: 約190行の重複コード削除
- **型安全性**: 共通モジュールが単一の型定義を参照
- **パフォーマンス**: session-ops.tsのキャッシュ機構は維持

## 残存差異（意図的）

- **session-ops.ts**: キャッシュラッパーを保持（パフォーマンス最適化）
- **index.ts**: スキーマ検証機能あり（Node.js環境向け）
- **browser.ts**: fsモジュールなし（ブラウザ互換性）

これらは各エントリポイントの責務であり、共通化すべきでない差異として残す。

## 関連ファイル

- `packages/engine-ts/src/condition-effect-ops.ts` -- 共通実装（新規作成）
- `packages/engine-ts/src/session-ops.ts` -- キャッシュラッパー化
- `packages/engine-ts/src/index.ts` -- 共通モジュールに切り替え
- `packages/engine-ts/src/browser.ts` -- 共通モジュールに切り替え

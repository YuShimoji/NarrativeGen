# SP-DESC-001: Description Tracker

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

Entity の描写履歴を追跡し、同一プロパティの重複記述を避けつつ、表現を豊かに積み重ねるための基盤。原初ビジョン (ORIGINAL_DESIGN_PHILOSOPHY.md 4.3) の実装。

## API

```typescript
markDescribed(state, entityId, propertyKey): DescriptionState
isDescribed(state, entityId, propertyKey): boolean
getUndescribedKeys(state, entityId, allPropertyKeys): string[]
getDescriptionCount(state, entityId): number
resetDescriptions(state, entityId?): DescriptionState
```

## データモデル

```typescript
interface DescriptionRecord {
  describedKeys: string[]    // 記述済みプロパティキー
  descriptionCount: number   // 総記述回数
}

type DescriptionState = Record<string, DescriptionRecord>
```

## 設計判断

- SessionState に直接組み込まず、独立した状態オブジェクトとして管理 (Worker B との競合回避)
- 不変 (immutable) 設計: markDescribed は新しいオブジェクトを返す
- 重複キーは追加しないが、descriptionCount は常にインクリメント (同一プロパティの再言及を記録)
- resetDescriptions: 章区切り等でリセット可能

## 依存

- SP-PROP-001: getEntityProperties で全プロパティキーを取得可能 → getUndescribedKeys と組み合わせ

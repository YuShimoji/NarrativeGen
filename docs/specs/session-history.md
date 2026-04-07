# SP-HIST-001: Session History (Undo/Back)

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

イミュータブルなセッション状態スナップショットのスタックによる Undo / 戻るナビゲーション。

## 実装参照（正）

- TypeScript: `packages/engine-ts/src/session-history.ts`（`createSessionHistory` / `pushHistory` / `popHistory` / `clearHistory` / `canGoBack` / `maxDepth`）
- Web Tester: グラフ Undo との統合（実装箇所はエディタ・セッション制御側）

単体の長文仕様書は置かず、上記コードとユニットテストを SoT とする。

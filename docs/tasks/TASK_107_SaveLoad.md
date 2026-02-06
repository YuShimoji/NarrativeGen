# Task: セーブ/ロード機能

Status: OPEN
Tier: 2
Branch: feature/save-load
Owner: Worker
Created: 2026-02-06T13:35:00+09:00
Report:

## Objective

- セッション状態のブラウザストレージ保存、モデル編集状態の自動保存、履歴管理を実装する

## Context

- 現在はページリロードで全状態が失われる
- GameSession クラス（packages/engine-ts/src/game-session.ts）にセッション状態あり
- Inventory 管理（packages/engine-ts/src/inventory.ts）も保存対象

## Focus Area

- apps/web-tester/（UI + ストレージ連携）
- apps/web-tester/utils/（ストレージユーティリティ新規作成）

## Forbidden Area

- packages/engine-ts/src/（エンジン本体の変更禁止）
- packages/sdk-unity/

## Constraints

- テスト: 主要パスのみ
- ブラウザストレージ: localStorage を使用（IndexedDB は後続タスク）

## DoD

- [ ] セッション状態が localStorage に保存される
- [ ] ページリロード後にセッションが復元される
- [ ] モデル編集状態の自動保存が動作する
- [ ] npm run build -w @narrativegen/web-tester が成功する
- [ ] docs/inbox/ にレポートが作成されている
- [ ] 本チケットの Report 欄にレポートパスが追記されている

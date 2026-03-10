# ノード階層システム仕様 (Node Hierarchy System)

## 概要

ノードをグループ化し、ツリー構造で表示・操作するための階層管理システム。展開状態の永続化とナビゲーション機能を提供。

## 仕様ID

SP-HIE-001

## ステータス

done (実装完了)

## グループパス形式

```
parent/child/grandchild
```

スラッシュ区切りで階層を表現。ノードはグループパスを持ち、階層構造に配置される。

## ユーティリティ関数

### `hierarchy-utils.js` (10関数)

- `buildHierarchyTree(nodes)`: フラットなノード配列からツリー構造を構築
- `buildNestedTree(nodes, currentPath)`: 指定パス配下の入れ子ツリーを構築
- `getAllGroups(nodes)`: すべてのグループパスを抽出
- `getChildGroups(nodes, parentPath)`: 指定グループの直下の子グループを取得
- `getGroupChildren(nodes, groupPath)`: 指定グループ直下のノードを取得
- `getGroupDepth(groupPath)`: グループの階層深度を計算（スラッシュ数+1）
- `getGroupDisplayName(groupPath)`: グループの表示名を取得（最後の要素）
- `getParentGroup(groupPath)`: 親グループのパスを取得
- `isChildGroup(groupPath, parentPath)`: グループAがグループBの子孫か判定
- `sortHierarchically(nodes)`: ノードを階層順にソート

## 展開状態管理

### `hierarchy-state.js`

```typescript
interface HierarchyState {
  expanded: Set<string> // 展開中のグループパス
}
```

#### API

- `initHierarchyState()`: 初期化（localStorageから復元）
- `getExpansionState(groupPath)`: 展開状態を取得
- `setExpansionState(groupPath, expanded)`: 展開状態を設定
- `toggleExpansionState(groupPath)`: 展開状態をトグル
- `expandAll(nodes)`: すべてのグループを展開
- `collapseAll()`: すべてのグループを折りたたむ
- `exportState()`: 展開状態をJSONにエクスポート
- `importState(stateObj)`: 展開状態をインポート

#### 永続化

- ストレージキー: `ng_hierarchy_expansion`
- `localStorage`に自動保存
- ページリロード時に復元

## 実装ファイル

- `apps/web-tester/utils/hierarchy-utils.js` -- ツリー構築・ナビゲーション
- `apps/web-tester/src/ui/hierarchy-state.js` -- 展開状態管理

## テスト

- `apps/web-tester/test/hierarchy-state.test.js` -- 展開状態管理のテスト
- `apps/web-tester/test/hierarchy-utils.test.js` -- ユーティリティ関数のテスト

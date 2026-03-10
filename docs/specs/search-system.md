# 検索システム仕様 (Search System)

## 概要

3層アーキテクチャによる高度な検索システム。キーワード検索・同義語展開・セマンティック検索をハイブリッド統合。

## 仕様ID

SP-SEARCH-001

## ステータス

done (実装完了)

## 3層アーキテクチャ

### Layer 1: キーワード検索 (`search-utils.js`)

```typescript
searchInGroup(searchText: string, nodes: Node[], filters?: Filters): Node[]
```

- 部分一致検索（ID, タイトル, テキスト, タグ, グループ, 条件, 効果）
- 9要素のスコアリング: `rankSearchResults(results, searchText)`
  - 完全一致: ID(100), タイトル(90), テキスト(80)
  - 前方一致: ID(70), タイトル(60), テキスト(50)
  - 部分一致: ID(40), タイトル(30), テキスト(20), タグ(15), グループ(10)
- フィルタリング: `applyFilters(nodes, filters)` -- nodeType, tags, group
- ソート: `sortNodes(nodes, sortBy, sortDir)` -- id/title/group + asc/desc

### Layer 2: 同義語展開 (`synonym-dict.js`)

```typescript
expandQuery(query: string): string[]
```

- 30組込定義（日英対応）
  - 例: "セリフ" → ["セリフ", "台詞", "dialogue", "line"]
  - 例: "選択肢" → ["選択肢", "選択", "choice", "option", "branch"]
- カスタム同義語追加: `addCustomSynonym(term, synonyms)`
- ストレージキー: `ng_custom_synonyms`

### Layer 3: セマンティック検索 (`semantic-search.js`)

```typescript
searchSemantic(query: string, nodes: Node[], topK: number): Promise<ScoredNode[]>
```

- OpenAI `text-embedding-3-small` を使用
- コサイン類似度でスコアリング
- `embeddings-cache.js` でlocalStorageキャッシュ（ストレージキー: `ng_embeddings_cache`）
- キャッシュヒット時はAPI呼び出しなし

## ハイブリッド統合 (`hybrid-search.js`)

```typescript
class HybridSearch {
  search(query: string, nodes: Node[], options: HybridOptions): Promise<ScoredNode[]>
}

interface HybridOptions {
  keywordWeight: number    // 0.0 ~ 1.0 (default: 0.5)
  semanticWeight: number   // 0.0 ~ 1.0 (default: 0.5)
  enableSynonym: boolean   // default: true
  topK: number             // default: 10
}
```

**スコア計算:**

```
finalScore = keywordScore * (1 - semanticWeight) + semanticScore * semanticWeight
```

## 検索履歴 (`search-history.js`)

```typescript
class SearchHistory {
  add(query: string): void
  getAll(): string[]
  getSuggestions(prefix: string): string[]
  clear(): void
}
```

- 最大20件
- ストレージキー: `ng_search_history`
- プレフィックスによるサジェスチョン機能

## 実装ファイル

- `apps/web-tester/src/features/search/search-utils.js` -- Layer 1
- `apps/web-tester/src/features/search/synonym-dict.js` -- Layer 2（同義語辞書）
- `apps/web-tester/src/features/search/semantic-search.js` -- Layer 3（OpenAI連携）
- `apps/web-tester/src/features/search/embeddings-cache.js` -- Layer 3（キャッシュ）
- `apps/web-tester/src/features/search/hybrid-search.js` -- ハイブリッド統合
- `apps/web-tester/src/features/search/search-history.js` -- 履歴管理

## 制限事項

- セマンティック検索はOpenAI APIキーが必要
- キャッシュは`localStorage`容量制限あり（通常5-10MB）
- 大量ノードでの初回セマンティック検索はAPI呼び出しコスト発生

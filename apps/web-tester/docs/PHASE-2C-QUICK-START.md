# Phase 2C-Enhanced: クイックスタートガイド

## 5分で始める高度な検索

### 1. デモページを開く

```bash
# ブラウザで以下を開く
apps/web-tester/tests/advanced-search-demo.html
```

### 2. サンプルモデルを読み込む

「サンプルモデル読み込み」ボタンをクリック

### 3. 検索を試す

#### キーワード検索
```
検索ボックスに「dragon」と入力
→ dragonを含むノードが表示される
```

#### 同義語検索
```
1. 「同義語検索」チェックボックスをON
2. 検索ボックスに「battle」と入力
→ battle, fight, combat, 戦闘, 戦い, バトルを含むノードが表示される
```

#### セマンティック検索(オプション、API Key必要)
```
1. 「セマンティック検索を初期化」ボタンをクリック
2. OpenAI API Keyを入力
3. 「セマンティック検索」チェックボックスをON
4. 検索ボックスに「epic dragon fight」と入力
→ 意味的に類似したノードが表示される
```

## 主要機能

### 🔍 検索タイプ

| タイプ | 説明 | 例 |
|--------|------|-----|
| **キーワード** | 完全/部分一致 | "dragon" → "dragon_battle" |
| **同義語** | 類義語展開 | "battle" → "fight", "combat", "戦闘" |
| **セマンティック** | 意味理解 | "epic fight" → "dragon_battle", "hero_duel" |

### 📊 検索スコア

ノードの横に表示される `[K: 85 S: 72]`:
- **K**: キーワードスコア (高いほど関連度高)
- **S**: セマンティックスコア (0-100、AIによる類似度)

### 📚 組み込み同義語

- **戦闘**: battle, fight, combat, 戦闘, 戦い, バトル
- **竜**: dragon, drake, wyrm, ドラゴン, 竜, 龍, 古龍
- **クエスト**: quest, mission, クエスト, 任務, ミッション
- **村**: village, town, 村, 町, 街
- **勇者**: hero, warrior, 勇者, 英雄, 戦士
- **宝物**: treasure, item, 宝物, アイテム, 財宝

## プログラマティック使用

### 基本検索

```javascript
import { searchInGroup, rankSearchResults } from './utils/search-utils.js';

const results = searchInGroup('dragon', nodes, 'story/chapter1');
const ranked = rankSearchResults('dragon', results.matches);
```

### 同義語検索

```javascript
import { SynonymDictionary } from './utils/synonym-dict.js';

const dict = new SynonymDictionary();
const results = dict.searchWithSynonyms('battle', nodes);
```

### ハイブリッド検索

```javascript
import { HybridSearch } from './utils/hybrid-search.js';
import { SemanticSearch } from './utils/semantic-search.js';
import { SynonymDictionary } from './utils/synonym-dict.js';

const semanticSearch = new SemanticSearch(aiProvider);
await semanticSearch.initialize();

const hybridSearch = new HybridSearch(semanticSearch, new SynonymDictionary());

const results = await hybridSearch.search('dragon fight', nodes, {
  useSemanticSearch: true,
  useSynonyms: true,
  semanticWeight: 0.5
});
```

## トラブルシューティング

### Q: セマンティック検索が動かない
**A**: OpenAI API Keyを設定してください(AI設定パネル)

### Q: 検索が遅い
**A**: グループスコープを絞るか、セマンティック検索を一時的にOFF

### Q: 同義語を追加したい
**A**:
```javascript
const dict = new SynonymDictionary();
dict.saveCustomSynonyms({
  'magic': ['spell', '魔法', 'マジック']
});
```

## 詳細ドキュメント

完全なドキュメントは `PHASE-2C-ENHANCED-SEARCH.md` を参照してください。

## APIリファレンス

### SearchHistory
```javascript
const history = new SearchHistory(20);
history.add('dragon');
const suggestions = history.getSuggestions('drag', 5);
```

### SynonymDictionary
```javascript
const dict = new SynonymDictionary();
const synonyms = dict.getSynonyms('battle');
const expanded = dict.expandTerm('battle');
```

### SemanticSearch
```javascript
const search = new SemanticSearch(aiProvider);
await search.initialize();
const results = await search.searchBySemantic('query', nodes, 0.7);
```

### HybridSearch
```javascript
const hybrid = new HybridSearch(semanticSearch, synonymDict);
const results = await hybrid.search('query', nodes, {
  useSemanticSearch: true,
  useSynonyms: true,
  semanticWeight: 0.5
});
```

---

**次のステップ**: メインアプリケーションへの統合 → `handlers/nodes-panel.js` の使用方法参照

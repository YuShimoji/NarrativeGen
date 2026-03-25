# 移行ノート

**対象バージョン**: Phase 2A-C
**作成日**: 2026-03-05
**ブランチ**: feature/main-js-split-phase2

---

## 概要

Phase 2への移行に関する重要情報をまとめたドキュメントです。既存のコードベースへの影響、必要なアクション、潜在的な問題について説明します。

---

## 破壊的変更

### なし

**Phase 2A-Cではすべて後方互換性を維持しています。**

既存の機能は変更なく動作し、新機能はオプトイン方式で有効化できます。

---

## 新機能の有効化

### 1. 階層ツリービュー

#### 自動有効化
デフォルトで有効です。既存のフラットなノードモデルも引き続き動作します。

#### 使用方法
CSVインポート時に`node_group`列を追加するだけ:
```csv
id,label,node_group
n1,ノード1,group1
n2,ノード2,group1/subgroup
```

`node_group`列がない場合、すべてのノードはルートグループ（`/`）に配置されます。

---

### 2. セマンティック検索

#### オプトイン
OpenAI API Key設定時のみ有効。未設定でも従来通りキーワード検索が動作します。

#### 有効化手順
```javascript
// ブラウザコンソールで実行
localStorage.setItem('openai_api_key', 'sk-your-api-key');

// またはUIで入力
```

#### 無効化手順
```javascript
localStorage.removeItem('openai_api_key');
```

---

### 3. 同義語検索

#### オプトイン
UIのチェックボックスで有効化。デフォルトはOFF。

#### カスタマイズ
`apps/web-tester/utils/synonym-dictionary.js` を編集して独自の同義語を追加:
```javascript
export const synonymDictionary = {
    actions: {
        'カスタム': ['custom', 'custom-action'],
        // 既存の定義に追加
    }
};
```

---

## 既存コードへの影響

### 1. データモデル

#### 変更前
```javascript
const node = {
    id: 'n1',
    label: 'ノード1',
    text: '説明文'
};
```

#### 変更後（オプション）
```javascript
const node = {
    id: 'n1',
    label: 'ノード1',
    text: '説明文',
    node_group: 'scenes/chapter1' // オプション
};
```

**影響**: なし。`node_group`がない場合、デフォルト値（`/`）が使用されます。

---

### 2. API呼び出し

#### 従来の検索
```javascript
// 変更前（引き続き動作）
const results = searchNodes('キーワード', nodes);
```

#### 新しい検索（オプション）
```javascript
// 変更後（オプション）
import { hybridSearch } from './utils/search-utils.js';

const results = await hybridSearch('キーワード', nodes, {
    useSynonyms: true,
    useAI: true,
    apiKey: 'sk-...'
});
```

**影響**: なし。既存の`searchNodes()`は変更なく動作します。

---

### 3. UI レンダリング

#### 従来のリスト表示
```javascript
// 変更前（引き続き動作）
renderNodeList(nodes, container);
```

#### 新しいツリー表示（オプション）
```javascript
// 変更後（オプション）
import { renderNodeTreeView } from './handlers/nodes-panel.js';

renderNodeTreeView(nodes, container);
```

**影響**: なし。既存のレンダリング関数は変更なく動作します。

---

## 必要なアクション

### プロジェクト全体

#### なし
Phase 2への移行に必要な強制的なアクションはありません。

### 新機能を使う場合

#### 1. 階層ツリービューを使う
- CSVに`node_group`列を追加
- グループパスを設計（例: `scenes/chapter1/intro`）

#### 2. セマンティック検索を使う
- OpenAI APIアカウント作成（無料）
- API Keyを取得
- LocalStorageに保存

#### 3. 同義語検索を使う
- 特別なアクション不要
- UIでチェックボックスをON

---

## パフォーマンスへの影響

### メモリ使用量

| データサイズ | Phase 1 | Phase 2 | 増加 |
|------------|---------|---------|------|
| 100ノード | 10MB | 12MB | +20% |
| 500ノード | 35MB | 42MB | +20% |
| 1000ノード | 未計測 | 未計測 | - |

**理由**: 階層状態管理のためのオーバーヘッド

**影響**: 軽微。通常使用では問題なし。

---

### レンダリング速度

| 操作 | Phase 1 | Phase 2 | 変化 |
|------|---------|---------|------|
| リスト表示 | 10ms | 10ms | 変化なし |
| ツリー表示 | - | 15ms | 新機能 |
| 検索（キーワード） | 8ms | 8ms | 変化なし |
| 検索（AI） | - | 450ms | 新機能 |

**影響**: なし。既存機能のパフォーマンスは維持されています。

---

### ネットワーク使用量

#### OpenAI API使用時のみ
- 検索ごとに1リクエスト（約1KB）
- キャッシュにより2回目以降は高速
- オフライン時は自動的にフォールバック

**影響**: API使用時のみ。キーワード検索は影響なし。

---

## 潜在的な問題

### 1. LocalStorageの容量

#### 問題
検索履歴やEmbeddingsキャッシュがLocalStorageに保存され、容量制限（5-10MB）に達する可能性。

#### 対策
定期的にクリア:
```javascript
// 検索履歴をクリア
localStorage.removeItem('search_history');

// Embeddingsキャッシュをクリア
localStorage.removeItem('embeddings_cache');
```

---

### 2. API レート制限

#### 問題
OpenAI APIのレート制限（無料アカウント: 3 requests/min）。

#### 対策
- 簡易レート制限実装済み（500ms間隔）
- キャッシュにより同じ検索は高速
- エラー時は自動的にキーワード検索にフォールバック

---

### 3. ブラウザ互換性

#### 問題
Safari でのClipboard API制限。

#### 対策
フォールバック実装済み。Safariでも基本機能は動作。

---

## ロールバック手順

Phase 2の機能を無効化する必要がある場合:

### 1. UIでの無効化
- ビューモードを「List」に変更
- 同義語検索のチェックを外す
- AI検索をOFF

### 2. コードでの無効化
```javascript
// 階層機能を使わない
const flatNodes = nodes.map(n => ({ ...n, node_group: '/' }));

// セマンティック検索を無効化
localStorage.removeItem('openai_api_key');
```

### 3. ブランチ切り替え
```bash
git checkout origin/open-ws/engine-skeleton-2025-09-02
npm ci
npm run build:engine
```

---

## テスト戦略

### 既存機能の検証

#### 推奨テスト
1. CSVインポート（`node_group`なし）
2. キーワード検索
3. ノード選択
4. ノード編集
5. エクスポート

**期待結果**: すべて変更なく動作

### 新機能の検証

#### 推奨テスト
1. CSVインポート（`node_group`あり）
2. Tree Viewでグループ展開
3. 同義語検索
4. セマンティック検索
5. グループスコープ検索

**期待結果**: 新機能が正常動作

---

## サポートとドキュメント

### 移行サポート
- `docs/QUICK_START_PHASE2.md` - クイックスタートガイド
- `docs/SESSION_SUMMARY_2026-03-05.md` - 詳細な実装説明

### API ドキュメント
- `docs/hierarchy-api-reference.md` - 階層API
- `docs/PHASE-2C-ENHANCED-SEARCH.md` - 検索API

### サンプルコード
- `apps/web-tester/tests/hierarchy-utils.test.js` - 階層機能の例
- `apps/web-tester/tests/search-utils.test.js` - 検索機能の例

---

## FAQ

### Q1: 既存のCSVファイルは動作しますか?
**A**: はい、完全に動作します。`node_group`列がない場合、すべてのノードはルートグループに配置されます。

### Q2: OpenAI API Keyは必須ですか?
**A**: いいえ、オプションです。セマンティック検索を使う場合のみ必要です。

### Q3: パフォーマンスに影響はありますか?
**A**: 軽微なメモリオーバーヘッド（+20%）がありますが、通常使用では問題ありません。

### Q4: モバイルブラウザで動作しますか?
**A**: はい、基本機能は動作します。一部のインタラクション（ドラッグ&ドロップ）はPhase 2Eで対応予定です。

### Q5: 前のバージョンに戻せますか?
**A**: はい、上記「ロールバック手順」を参照してください。

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2026-03-05 | Phase 2A | Foundation実装 |
| 2026-03-05 | Phase 2B | Tree View UI実装 |
| 2026-03-05 | Phase 2C | Enhanced Search実装 |

---

## 次のステップ

Phase 2D-Fの実装予定:
- **Phase 2D**: Graph Visualization（階層的グラフ表示）
- **Phase 2E**: GUI Editor統合（ドラッグ&ドロップ編集）
- **Phase 2F**: Testing & Polish（品質保証）

これらの機能も後方互換性を維持する予定です。

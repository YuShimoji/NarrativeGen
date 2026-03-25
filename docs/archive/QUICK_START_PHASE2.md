# Phase 2機能クイックスタート

**対象バージョン**: Phase 2A-C（2026-03-05時点）
**所要時間**: 10分

---

## 前提条件

- Node.js 20.x 以上
- npm 10.x 以上
- モダンブラウザ（Chrome, Firefox, Edge推奨）

---

## セットアップ

### 1. リポジトリのクローンと依存関係インストール

```bash
git clone <repository-url>
cd NarrativeGen
git checkout feature/main-js-split-phase2
npm ci
```

### 2. ビルドとテスト

```bash
# エンジンをビルド
npm run build:engine

# テスト実行（オプション）
npm run test

# Web Testerを起動
npm run dev:tester
```

ブラウザで `http://localhost:5173` を開く。

---

## 機能1: 階層ツリービュー

### 基本的な使い方

#### ステップ1: CSVインポート
階層構造を持つCSVファイルを用意します。

**例: nodes-hierarchy.csv**
```csv
id,label,node_group,text
n1,物語の始まり,scenes/chapter1,主人公が村で目覚める
n2,謎の声,scenes/chapter1,不思議な声が聞こえる
n3,旅立ちの決意,scenes/chapter1/decision,村を出る決断をする
n4,別れ,scenes/chapter1/decision,家族に別れを告げる
n5,森への入口,scenes/chapter2,暗い森に足を踏み入れる
```

**重要**: `node_group` 列にグループパスを指定
- 区切り文字: `/`（スラッシュ）
- 例: `scenes/chapter1/decision`

#### ステップ2: インポート実行
1. Web Testerで「Import」タブを開く
2. 「Choose File」でCSVを選択
3. 「Import」ボタンをクリック

#### ステップ3: Tree Viewを表示
1. 「Nodes」タブを開く
2. ビューモードセレクターで「Tree」を選択
3. グループが階層表示される

#### ステップ4: 操作
- **展開/折りたたみ**: グループヘッダーをクリック
- **ノード選択**: ノードアイテムをクリック
- **詳細表示**: 選択したノードの詳細が右パネルに表示

---

## 機能2: 同義語検索

### 基本的な使い方

#### ステップ1: 通常検索
1. 検索ボックスに「戦う」と入力
2. Enterキーを押す
3. 「戦う」を含むノードが表示される

#### ステップ2: 同義語検索を有効化
1. 検索ボックスの下にある「同義語検索」チェックボックスをON
2. 再度「戦う」と検索
3. 「fight」「battle」「戦闘」なども検索される

### 対応する同義語

#### アクション
- 戦う ↔ fight, battle, 戦闘, combat
- 逃げる ↔ escape, flee, 逃走, run away
- 話す ↔ talk, speak, 会話, conversation

#### 感情
- 怒り ↔ anger, rage, 憤怒, fury
- 喜び ↔ joy, happiness, 歓喜, delight
- 悲しみ ↔ sadness, sorrow, 哀愁, grief

#### 場所
- 城 ↔ castle, fortress, 砦, palace
- 森 ↔ forest, woods, 樹海, jungle
- 街 ↔ town, city, 都市, village

#### その他
`apps/web-tester/utils/synonym-dictionary.js` を参照

---

## 機能3: セマンティック検索（AI）

### 前提条件
OpenAI API Keyが必要です（無料アカウントでOK）。

### セットアップ

#### ステップ1: API Keyを取得
1. https://platform.openai.com/ にアクセス
2. アカウント作成（無料）
3. API Keysページで新しいキーを作成
4. キーをコピー（`sk-...`形式）

#### ステップ2: API Keyを設定
ブラウザのDevToolsコンソール（F12）で実行:
```javascript
localStorage.setItem('openai_api_key', 'sk-your-api-key-here');
```

または、デモページのUI（後述）で入力。

### 使い方

#### ステップ1: AI検索を有効化
1. 検索ボックスの下にある「AI検索」トグルをON
2. API Keyが設定されていることを確認

#### ステップ2: 意味検索
1. 検索ボックスに「勇気ある行動」と入力
2. Enterキーを押す
3. 意味的に類似したノードが表示される
   - 「決意」「挑戦」「立ち向かう」なども検出

#### ステップ3: スコア確認
検索結果に2種類のスコアが表示されます:
```
主人公の決意 [K: 85 S: 72]
```
- **K**: キーワードスコア（0-100）
- **S**: セマンティックスコア（0-100）

---

## 機能4: グループスコープ検索

特定グループ内のみを検索できます。

### 使い方

#### ステップ1: グループを選択
1. Tree Viewでグループヘッダーを右クリック
2. 「このグループ内を検索」を選択

#### ステップ2: 検索実行
1. 検索ボックスにキーワード入力
2. 選択したグループとその子孫のみが対象

#### ステップ3: スコープ解除
1. 検索ボックスの「スコープ: scenes/chapter1」バッジをクリック
2. 全体検索に戻る

---

## デモページ

### スタンドアロンデモ（最も簡単）

**特徴**:
- サーバー不要
- ダブルクリックで起動
- OpenAI API Key入力UI付き
- モックデータ内蔵

**使用方法**:
```bash
# Windowsの場合
start apps/web-tester/tests/search-demo-standalone.html

# macOS/Linuxの場合
open apps/web-tester/tests/search-demo-standalone.html
```

**操作**:
1. ブラウザでページが開く
2. 「OpenAI API Key」入力欄にキーを入力（オプション）
3. 検索ボックスでキーワード検索を試す
4. 「同義語検索」をONにして再検索
5. API Keyを入力した場合、「AI検索」もONにして試す

---

### フル機能デモ

**特徴**:
- 実際のモジュールを使用
- リアルタイムUI
- デバッグコンソール

**使用方法**:
```bash
cd apps/web-tester
npx vite
```

ブラウザで `http://localhost:5173/tests/advanced-search-demo.html` を開く。

**操作**:
1. 左パネルでノードを選択
2. 検索ボックスで検索
3. 検索結果をクリックで詳細表示
4. デバッグコンソールでスコア確認

---

## トラブルシューティング

### Tree Viewが表示されない

**原因**: CSVに`node_group`列がない

**解決策**:
```csv
id,label,node_group
n1,ノード1,group1
```

### 同義語検索が動かない

**原因**: チェックボックスがOFFになっている

**解決策**: 検索ボックス下の「同義語検索」をONに

### AI検索でエラーが出る

**原因1**: API Keyが未設定

**解決策**:
```javascript
localStorage.setItem('openai_api_key', 'sk-...');
```

**原因2**: API Keyが無効

**解決策**: OpenAIダッシュボードでキーを確認

**原因3**: レート制限

**解決策**: 500ms待ってから再試行

### デモページが404エラー

**原因**: Viteサーバーが起動していない

**解決策**:
```bash
cd apps/web-tester
npx vite
```

---

## 次のステップ

### 1. 実際のデータでテスト
自分のストーリーデータをCSVで作成してインポート。

### 2. 階層構造を設計
効果的なグループ分けの例:
```
scenes/chapter1/intro
scenes/chapter1/conflict
scenes/chapter1/resolution
characters/protagonists
characters/antagonists
locations/towns
locations/dungeons
```

### 3. カスタマイズ
`apps/web-tester/utils/synonym-dictionary.js` を編集して自分の同義語を追加。

### 4. APIの活用
プログラムから検索機能を使用:
```javascript
import { hybridSearch } from './utils/search-utils.js';

const results = await hybridSearch('勇気', nodes, {
    useSynonyms: true,
    useAI: true,
    apiKey: 'sk-...'
});
```

---

## パフォーマンスヒント

### 大規模データの場合

- グループを適切に分割（1グループ50ノード以下推奨）
- 不要なグループは折りたたむ
- AI検索は必要な時だけ使用（キャッシュされるため2回目以降は高速）

### メモリ節約

- 使わないタブを閉じる
- 検索履歴を定期的にクリア:
  ```javascript
  localStorage.removeItem('search_history');
  ```

---

## サポート

### ドキュメント
- `docs/SESSION_SUMMARY_2026-03-05.md` - 全機能の詳細
- `docs/PHASE-2B-TREE-VIEW-IMPLEMENTATION.md` - Tree View詳細
- `docs/PHASE-2C-ENHANCED-SEARCH.md` - 検索機能詳細
- `docs/hierarchy-api-reference.md` - API リファレンス

### テストファイル
- `apps/web-tester/tests/hierarchy-utils.test.js` - 使用例
- `apps/web-tester/tests/search-utils.test.js` - 検索例

### 問題報告
GitHub Issuesでバグ報告や機能要望を受け付けています。

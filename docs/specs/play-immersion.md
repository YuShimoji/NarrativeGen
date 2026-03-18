# SP-PLAY-001: プレイ没入感 MVP

## 概要

Web Tester のプレイ画面に没入感を与えるテキスト演出基盤を導入する。
Phase 1 はテキスト演出のみ（画像・BGM は Phase 2 以降）。

## 設計原則

1. **拡張可能なトランジション・アーキテクチャ**: Strategy パターンで遷移方式を登録・切替可能にする
2. **モデル指定 + ランタイム切替**: モデル JSON でデフォルト指定、UI でランタイム切替可能
3. **段階的導入**: 既存の即座表示は残し、新しい演出は opt-in で追加
4. **パフォーマンス**: CSS アニメーション主体。JS は orchestration のみ

## アーキテクチャ

### TransitionRegistry（コア）

```
TransitionRegistry
├── register(name, TransitionStrategy)
├── get(name) → TransitionStrategy
├── list() → string[]
└── default → string

TransitionStrategy (interface)
├── name: string
├── enter(container, content, options) → Promise<void>
├── exit(container, options) → Promise<void>
└── cleanup(container) → void
```

### 組み込みトランジション

| 名前 | 動作 | 用途 |
|------|------|------|
| `crossfade` | 旧テキスト fadeOut → 新テキスト fadeIn | シーン切替感。デフォルト |
| `append-scroll` | 旧テキストを残し、新テキストを下に追加してスクロール | チャットノベル風。履歴一覧 |

### 将来拡張例（Phase 1 では未実装、設計のみ受容）

- `slide-left` / `slide-right`: 横スライド遷移
- `typewriter`: 一文字ずつ表示（段落フェードインと組合せ可能）
- `shake`: 画面振動 + フェード
- `custom`: モデル JSON からの CSS animation 名指定

### PlayRenderer（統合レイヤー）

```
PlayRenderer
├── constructor(storyView, choicesContainer, registry)
├── setTransitionMode(name)
├── getTransitionMode() → string
├── renderNode(nodeText, choices, options) → Promise<void>
│   ├── exit current content
│   ├── build new content (paragraphs + inline choices)
│   └── enter new content
├── renderAppendNode(nodeText, choices, options) → Promise<void>
│   ├── build new entry (paragraphs + inline choices)
│   └── append + scroll
└── clear()
```

## 機能仕様

### 1. 段落フェードイン

ノードテキストを段落（`\n\n` 区切り、または `<br>` 区切り）ごとに分割し、
各段落を stagger delay 付きでフェードイン表示する。

```
段落1: [opacity 0→1, 0.3s, delay 0ms]
段落2: [opacity 0→1, 0.3s, delay 150ms]
段落3: [opacity 0→1, 0.3s, delay 300ms]
```

- CSS: `@keyframes paragraphFadeIn` + `.paragraph-enter` クラス
- stagger delay: 150ms/段落（定数、将来設定可能化）
- フェード完了後に `.paragraph-enter` クラスを除去

### 2. インライン選択肢

選択肢をストーリーテキストの下に表示する。サイドバーからストーリービュー内に移動。

```
┌──────────────────────────────────┐
│ あなたは暗い部屋にいる。          │
│ 気配がする。どうする？            │
│                                  │
│   ┌─────────────────────┐       │
│   │ ▸ ドアを開ける       │       │
│   ├─────────────────────┤       │
│   │ ▸ 物音の方へ行く     │       │
│   ├─────────────────────┤       │
│   │ ▸ じっとしている     │       │
│   └─────────────────────┘       │
│                                  │
│   ← 戻る                        │
└──────────────────────────────────┘
```

- 選択肢ボタンも段落フェードインの stagger に含める（テキスト段落の後に続く）
- 選択後、選択したテキストを `> 選択テキスト` の引用形式でストーリーに挿入（append-scroll モード時）
- サイドバーの `#choices` は状態表示（flags/resources/variables）のみに

### 3. ノード遷移モード

#### crossfade モード（デフォルト）

1. 現在のコンテンツに `.exit` クラス付与 → opacity fadeOut (0.3s)
2. 0.1s gap
3. 新コンテンツを生成 → `.enter` クラス付与 → opacity fadeIn (0.3s)
4. 段落フェードインは enter 内で適用

過去ノードのテキストは画面上に残らない（現在ノードのみ表示）。

#### append-scroll モード

1. 選択した選択肢テキストを `> 引用` として現在ストーリーに追加
2. 区切り線 `<hr>` を挿入
3. 新ノードテキストを段落フェードインで追加
4. 新コンテンツ位置までスムーズスクロール

過去ノードのテキストがすべて残る（チャットノベル風）。

#### 切替 UI

- ストーリービュー右上に小さなトグルボタン（アイコン: crossfade ↔ scroll）
- `localStorage` に保存、次回起動時に復元
- モデル JSON の `settings.defaultTransition` で初期値指定可能

### 4. モデル JSON 拡張

```json
{
  "settings": {
    "presentation": {
      "defaultTransition": "crossfade",
      "paragraphDelay": 150,
      "transitionDuration": 300
    }
  },
  "nodes": {
    "dramatic_scene": {
      "text": "...",
      "presentation": {
        "transition": "crossfade"
      }
    }
  }
}
```

- `settings.presentation`: モデル全体のデフォルト（任意）
- `nodes.*.presentation`: ノード個別の上書き（任意）
- 未指定時: `crossfade` をデフォルトとする
- スキーマ (`playthrough.schema.json`) への追加は任意フィールドとして

### 5. エンディング表示

選択肢が 0 件のノード（エンディング）では、テキストの後に到達表示を出す。

```
┌──────────────────────────────────┐
│ 外は明るい朝だった。             │
│ あなたの冒険は、ここで幕を閉じる。│
│                                  │
│   ─── End ───                    │
│                                  │
│   [最初から] [別の結末を探す]     │
└──────────────────────────────────┘
```

- 「最初から」: `initStory()` + `startNewSession()` 相当
- 「別の結末を探す」: 戻る機能（sessionHistory.popHistory）

## ファイル構成

```
apps/web-tester/
├── src/
│   └── ui/
│       └── play/
│           ├── PlayRenderer.js        # 統合レイヤー
│           ├── TransitionRegistry.js   # Strategy 登録・取得
│           ├── transitions/
│           │   ├── CrossfadeTransition.js
│           │   └── AppendScrollTransition.js
│           └── play.css               # 演出用 CSS
```

## 受け入れ条件

### AC-1: 段落フェードイン
- ノードテキストが段落ごとに stagger delay 付きでフェードインする
- 複数段落のテキストで、各段落が順番に現れることが視認できる

### AC-2: インライン選択肢
- 選択肢ボタンがストーリーテキストの下に表示される
- 選択肢をクリックすると次のノードに遷移する

### AC-3: クロスフェード遷移
- 選択肢クリック後、旧テキストがフェードアウトし新テキストがフェードインする
- 遷移中に操作がブロックされない

### AC-4: 追記スクロール遷移
- 選択肢クリック後、選択テキストが引用形式で追加され、新テキストが下に追加される
- 自動スクロールで新テキストが見える位置に移動する

### AC-5: モード切替
- UI トグルで crossfade ↔ append-scroll を切替できる
- 設定が localStorage に永続化される
- モデル JSON の `settings.presentation.defaultTransition` が初期値として反映される

### AC-6: エンディング
- 選択肢なしノードで「End」表示と「最初から」ボタンが現れる

### AC-7: 拡張性
- 新しい TransitionStrategy を register するだけで、コード変更なしに遷移方式を追加できる

## スコープ外（Phase 2 以降）

- 背景画像・キャラクター画像
- BGM・SE
- タイプライター表示（個別文字送り）
- パーティクル・エフェクト
- ノード個別 CSS animation 指定
- レスポンシブ / モバイル対応

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

## Phase 2: シーン画像 / BGM サポート

### 設計原則

1. **全フィールド任意**: 既存モデルへの破壊的変更なし（後方互換）
2. **autoplay 対応**: ブラウザの autoplay ポリシーに従い、最初のユーザー操作後に BGM 再生を開始
3. **HTMLAudioElement 主体**: Web Audio API は不使用。HTMLAudioElement のダブルバッファリングでクロスフェード
4. **画像はイラスト配置**: テキスト上部にシーン画像を表示（背景全画面ではない）
5. **BGM 二層構造**: settings デフォルト + ノード単位上書き。未指定時は前ノードの BGM を継続

### 6. シーン画像

ノードの `presentation.image` に URL を指定すると、テキスト上部にシーン画像を表示する。

```
+----------------------------------+
|  [シーン画像 (max-height: 40vh)] |
|                                  |
| あなたは暗い部屋にいる。          |
| 気配がする。どうする？            |
|                                  |
|   +---------------------+       |
|   | > ドアを開ける       |       |
|   +---------------------+       |
+----------------------------------+
```

- 画像は段落フェードインの stagger に含める（最初のフェードイン要素として表示）
- `max-width: 100%`, `max-height: 40vh`, `object-fit: contain`
- `border-radius: 8px` で角丸
- 画像なしノードでは画像要素を生成しない
- アセットパス: 相対 URL（Vite dev server では `public/media/` に配置）

### 7. BGM（背景音楽）

#### BGM 指定の優先順位

1. ノード `presentation.bgm` (string): そのノードで再生する BGM URL
2. ノード `presentation.bgm` (null): 明示的に BGM を停止
3. ノード `presentation.bgm` 未指定: 前ノードの BGM を継続（変更なし）
4. `settings.presentation.defaultBgm` (string): モデル全体のデフォルト BGM

#### AudioManager

HTMLAudioElement x2 のダブルバッファリングでクロスフェードを実現する。

```
AudioManager
+-- play(url)           # 即時再生（同じ URL なら no-op）
+-- crossfadeTo(url)    # クロスフェードで切替
+-- fadeOut()           # フェードアウトして停止
+-- stop()             # 即時停止
+-- unlock()           # autoplay ポリシー解除
+-- dispose()          # リソース解放
```

- 音量: `settings.presentation.bgmVolume` (0-1, デフォルト 0.5)
- クロスフェード時間: `settings.presentation.bgmCrossfadeDuration` (ms, デフォルト 1000)
- フェードは setInterval (50ms 刻み) で volume を操作
- `unlock()` は最初のユーザー操作（click / touchstart）で一度だけ呼ぶ

#### autoplay ポリシー対応

ブラウザの autoplay ポリシーにより、ユーザー操作なしでの音声再生は拒否される。
PlayRenderer のコンストラクタで document に click/touchstart リスナーを登録し、
最初のユーザー操作時に AudioManager.unlock() を呼ぶ。

開始ノードに defaultBgm が指定されていても、最初の選択肢クリック後に再生が始まる設計とする。

### 8. モデル JSON 拡張（Phase 2）

```json
{
  "settings": {
    "presentation": {
      "defaultTransition": "crossfade",
      "paragraphDelay": 150,
      "transitionDuration": 300,
      "defaultBgm": "media/ambient.mp3",
      "bgmVolume": 0.5,
      "bgmCrossfadeDuration": 1000
    }
  },
  "nodes": {
    "dramatic_scene": {
      "text": "...",
      "presentation": {
        "transition": "crossfade",
        "image": "media/scene-dark-room.jpg",
        "bgm": "media/tension.mp3"
      }
    },
    "silence_scene": {
      "text": "...",
      "presentation": {
        "bgm": null
      }
    }
  }
}
```

### ファイル構成（Phase 2 追加分）

```
apps/web-tester/
+-- src/
|   +-- ui/
|       +-- play/
|           +-- AudioManager.js         # BGM 再生管理
|           +-- PlayRenderer.js         # 画像表示 + AudioManager 統合
|           +-- play.css               # .play-scene-image スタイル追加
+-- public/
    +-- media/                         # テスト用メディアファイル
```

### 受け入れ条件（Phase 2）

#### AC-8: シーン画像表示
- ノードに `presentation.image` を指定すると、テキスト上部に画像が表示される
- 画像は段落フェードインの stagger に含まれてアニメーション表示される
- `max-height: 40vh` で表示され、アスペクト比が維持される

#### AC-9: BGM 再生
- BGM 指定のあるノードに遷移すると音楽が再生される
- `settings.presentation.bgmVolume` で音量が制御される

#### AC-10: BGM クロスフェード
- 異なる BGM のノードに遷移すると、クロスフェードで BGM が切り替わる
- クロスフェード時間は `settings.presentation.bgmCrossfadeDuration` に従う

#### AC-11: BGM 明示停止
- `presentation.bgm: null` のノードで BGM がフェードアウトして停止する

#### AC-12: autoplay 対応
- autoplay 制限環境で、最初のユーザー操作後に BGM が再生される
- ユーザー操作前にエラーが発生しない

#### AC-13: 後方互換
- 画像・BGM 未指定の既存モデルが正常に動作する
- Phase 1 のテキスト演出に影響しない

## スコープ外（Phase 3 以降）

- キャラクター立ち絵（画像はシーン画像のみ）
- SE（効果音）
- タイプライター表示（個別文字送り）
- パーティクル・エフェクト
- ノード個別 CSS animation 指定
- レスポンシブ / モバイル対応
- BGM プレイリスト（Phase 2 はノード単位指定のみ）

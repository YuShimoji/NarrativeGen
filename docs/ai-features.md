# AI 機能設計

## 概要

NarrativeGen エンジンに AI アシスト機能を統合し、ライター/デザイナーのコンテンツ制作を加速する。

## 設計原則

- **エンジン本体は AI 非依存**: コア実行ロジック（`packages/engine-ts`, `packages/sdk-unity`）は AI API を呼ばず、決定論的に動作する。
- **AI 機能はツール層**: Web Tester や専用エディタツールが AI API を呼び、結果を JSON モデルに反映する。
- **プライバシー保護**: AI API への送信内容を明示し、ユーザーが送信可否を選択できるようにする。
- **段階的導入**: モック実装 → ローカルLLM → クラウドAPI の順で展開し、各段階で動作確認する。

## 機能1: 次の妥当な物語展開を自然に生成

### 目的

- 現在のノードから次に遷移するノードのテキストを AI が自動生成する。
- ライターは生成結果を参考に編集・採用し、物語展開を加速する。

### ユースケース

1. **ノード追加時の初期テキスト生成**
   - ライターが「ノードを追加」ボタンを押す
   - 現在のストーリー文脈（直前のノード群のテキスト）を AI に送信
   - AI が次の展開として自然な文章を提案
   - ライターが採用 or 手動編集

2. **分岐後の展開補完**
   - 選択肢A/B/C を設定済みで、それぞれの遷移先ノードが未記述
   - 各選択肢の結果として妥当なテキストを AI が一括生成
   - ライターが各提案を確認・調整

### 技術設計

#### データフロー

```
[Web Tester GUI] → [AI Provider Adapter] → [LLM API]
                         ↓
                    [生成テキスト]
                         ↓
                    [Model JSON に反映]
```

#### AI Provider Adapter

- インターフェース:
  ```typescript
  interface AIProvider {
    generateNextNode(context: StoryContext): Promise<string>
  }
  
  interface StoryContext {
    previousNodes: { id: string; text: string }[]
    currentNodeText: string
    choiceText?: string // 選択肢が前提の場合
  }
  ```

- 実装例:
  - `MockAIProvider`: ランダムサンプルテキストを返す（現在の実装）
  - `OpenAIProvider`: OpenAI Chat Completions API を呼ぶ
  - `LocalLLMProvider`: Ollama など Local LLM を呼ぶ

#### プロンプト設計

```
あなたはインタラクティブ小説のライターアシスタントです。
以下のストーリー展開から、次のノードで表示する自然な文章を生成してください。

【前の展開】
{previousNodes[0].text}
...

【現在のノード】
{currentNodeText}

【選択肢】（ある場合）
{choiceText}

【生成条件】
- 150文字程度の簡潔な文章
- 自然な日本語
- 読者の没入感を損なわない表現

【次のノードの文章】:
```

#### Web Tester UI 拡張

- GUI 編集モードに「AI生成」ボタンを追加（各ノード・選択肢ごと）
- 生成中はローディング表示
- 生成結果をテキストフィールドにプリセット（ライターが編集可能）

### 実装フェーズ

- **Phase 1 (完了)**: モック実装（ランダムサンプル）
- **Phase 2 (完了)**: プロンプト設計 + OpenAI API 統合（API Key 設定 UI 含む）
- **Phase 3 (完了)**: ローカル LLM 統合（Ollama）
- **Phase 4**: 生成履歴・再生成機能

## 機能2: 言い換え（Paraphrase）

### 目的

- 既存のノードテキストや選択肢テキストを、AI が別の表現に言い換える。
- ニュアンス調整・文体統一・表現のバリエーション確保に活用する。

### ユースケース

1. **文体統一**
   - 複数ライターが執筆した結果、文体がバラバラ
   - 全ノードのテキストを「です・ます調」「だ・である調」などに統一
   - AI が各テキストを指定文体で言い換え

2. **ニュアンス調整**
   - 「怒り」→「焦り」に感情トーンを変更
   - 「丁寧」→「カジュアル」に口調を変更
   - AI が元テキストの意味を保ちつつニュアンスを調整

3. **バリエーション生成**
   - 同じ選択肢を複数の表現で提示（プレイヤーの選択履歴に応じて変える等）
   - AI が 3～5 パターンの言い換えを生成
   - ライターが最適な表現を選択

### 技術設計

#### データフロー

```
[元テキスト + 言い換え指示] → [AI Provider] → [言い換えテキスト]
                                      ↓
                                 [ライター確認]
                                      ↓
                                 [Model JSON に反映]
```

#### AI Provider Adapter

- インターフェース拡張:
  ```typescript
  interface AIProvider {
    paraphrase(text: string, options: ParaphraseOptions): Promise<string[]>
  }
  
  interface ParaphraseOptions {
    tone?: 'formal' | 'casual' | 'neutral'
    emotion?: 'angry' | 'happy' | 'sad' | 'anxious' | 'neutral'
    style?: 'desu-masu' | 'da-dearu' | 'informal'
    variantCount?: number // 生成する言い換えパターン数
  }
  ```

#### プロンプト設計

```
以下のテキストを、指定された条件で言い換えてください。

【元のテキスト】
{originalText}

【言い換え条件】
- 文体: {style}
- トーン: {tone}
- 感情: {emotion}
- 生成パターン数: {variantCount}

【言い換えテキスト】:
1. ...
2. ...
```

#### Web Tester UI 拡張

- 各テキストフィールドに「言い換え」ボタンを追加
- クリックでモーダル表示:
  - 言い換えオプション選択（文体・トーン・感情）
  - 「生成」ボタンで AI 呼び出し
  - 複数パターンをリスト表示
  - ライターがクリックで採用

### 実装フェーズ

- **Phase 1 (完了)**: プロンプト設計 + モック実装（固定サンプルを返す）
- **Phase 2 (完了)**: OpenAI API 統合（API Key 設定 UI 含む）
- **Phase 3 (完了)**: ローカル LLM 統合
- **Phase 4**: バッチ言い換え（全ノード一括変換）機能

## セキュリティ・プライバシー考慮

### API Key 管理

- Web Tester では localStorage に保存（クライアントサイドのみ）
- Unity 版では PlayerPrefs に暗号化保存
- サーバー送信しない（直接 LLM API に接続）

### データ送信の透明性

- AI に送信される内容を UI 上で明示
- 送信前に確認ダイアログを表示
- オプトアウト可能（AI 機能を無効化）

### ローカル LLM 優先

- インターネット接続不要なローカル LLM を推奨
- Ollama, llama.cpp などを統合
- クラウド API は追加オプション

## 実装優先度

1. **Phase 1 (完了)**: モック実装
2. **Phase 2 (完了)**: OpenAI API 統合
3. **Phase 3 (完了)**: ローカル LLM 統合
4. **Phase 4**: バッチ処理・履歴管理

## 参考実装

- `apps/web-tester/main.js` の AI提案ボタン（モック実装）
- 将来: `packages/ai-adapter/` に AI Provider を抽象化して配置

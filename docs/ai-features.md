# 言い換え・バリアント生成 機能設計（非AI中心）

## 概要

NarrativeGen の言い換えは「非AIの決定的（deterministic）なバリアント生成」を中核とし、ライター/デザイナーが安全に文体統一・表現バリエーションを作るための支援機能です。AI 連携（OpenAI/Ollama 等）は任意の追加オプションであり、プロジェクトや開発をブロックしません。

## 設計原則

- **非AIを中核**: 同義語置換・文体変換・文単位の入れ替えなどを、決定的なルールと乱数シードで生成。
- **デザイナー主導**: 同義語辞書・置換ルール・テンプレートはプロジェクト側で管理・拡張可能。
- **オフライン動作**: 外部API不要。バージョン管理・再現性確保が容易。
- **AIは補助のみ**: 必要に応じてAIアダプタを追加可能だが、未設定でも全機能が動作。

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

## 機能: 言い換え（Paraphrase / Variant Generation）

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
   - 非AIが 3～5 パターンの言い換えを生成
   - ライターが最適な表現を選択

### 技術設計（非AI）

#### データフロー

```bash
[元テキスト + 置換ルール/同義語辞書/文体指定/乱数シード]
           ↓
[Variant Generator（決定的）]
           ↓
[複数バリアント]
           ↓
[ライターが採用・編集]
```

#### インターフェース（実装済み: Packages/engine-ts/src/paraphrase.ts）

```typescript
export type ParaphraseStyle = 'desu-masu' | 'da-dearu' | 'plain'

export interface ParaphraseOptions {
  variantCount?: number
  style?: ParaphraseStyle
  seed?: number
}

export function paraphraseJa(text: string, options?: ParaphraseOptions): string[]
export function chooseParaphrase(text: string, options?: ParaphraseOptions): string
```

- 同義語辞書を元に単語置換
- 文体変換（です・ます調/だ・である調）
- 乱数シードに基づく決定的なバリアント生成（再現性）

#### 使用例（GUI/非AI）
- Web Tester の GUI 編集内「言い換え」ボタンは `chooseParaphrase()` を呼び出し、即時に代替表現を挿入します（API不要・オフライン）。


#### Web Tester UI 拡張

- 各テキストフィールドに「言い換え」ボタンを追加
- クリックでモーダル表示:
  - 言い換えオプション選択（文体・トーン・感情）
  - 「生成」ボタンで非AIを呼び出し
  - 「生成」ボタンで AI 呼び出し
  - 複数パターンをリスト表示
  - ライターがクリックで採用

### 実装フェーズ

- ✅ 非AIバリアント生成（同義語置換・文体変換・決定的乱数）
- ✅ GUI統合（ノード/選択肢の「言い換え」ボタン）
- ⏳ バッチ言い換え（全ノード一括変換）
- ◇ オプション: AIアダプタ（OpenAI/Ollama）。未設定でも全機能利用可能。

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

# SP-006: Paraphrase System

**Status**: done | **Pct**: 100 | **Cat**: core

## 概要

テキストの言い換え (パラフレーズ) を提供する2層システム。

## 層構成

### 1. ローカル言い換え (`paraphrase.ts`)

外部API不要の決定的な言い換え。同義語辞書ベース。

```typescript
paraphraseJa(text: string, options?: ParaphraseOptions): string[]
chooseParaphrase(text: string, options?: ParaphraseOptions): string
getParaphraseLexicon(): ParaphraseLexicon
setParaphraseLexicon(lexicon, options?: { merge?: boolean }): void
```

- **ParaphraseLexicon**: `Record<string, string[]>` (元の表現 → 言い換え候補の配列)
- **PRNG**: mulberry32 (シード指定可能、決定的)
- **スタイル変換**: `desu-masu` / `da-dearu` / `plain`
- **デフォルト辞書**: 日本語 + 英語 (デモ用) の基本同義語

### 2. AI 言い換え (`ai-provider.ts`)

OpenAI API (または Mock) を使用した高品質な言い換え。

```typescript
interface AIProvider {
  generateNextNode(context: StoryContext): Promise<string>
  paraphrase(text: string, options?: ParaphraseOptions): Promise<string[]>
}
```

- **Mock**: 単純な `"(バリエーション N)"` 付与
- **OpenAI**: `gpt-3.5-turbo` でプロンプトベースの言い換え生成

### ParaphraseOptions

| フィールド | 型 | デフォルト |
|-----------|---|-----------|
| `variantCount` | `number` | 3 |
| `style` | `'desu-masu' \| 'da-dearu' \| 'plain'` | `'plain'` |
| `seed` | `number` | 123456 |
| `lexicon` | `ParaphraseLexicon` | ランタイム辞書 |
| `tone` | `'formal' \| 'casual' \| 'neutral'` | `'neutral'` (AI のみ) |
| `emotion` | `'angry' \| 'happy' \| 'sad' \| 'anxious' \| 'neutral'` | `'neutral'` (AI のみ) |

## スキーマ

`schemas/lexicon.schema.json`: カスタム辞書の JSON Schema
```json
{ "additionalProperties": { "type": "array", "items": { "type": "string" }, "minItems": 1 } }
```

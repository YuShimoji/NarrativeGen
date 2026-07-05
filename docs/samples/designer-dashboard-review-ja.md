# Designer Dashboard v0 review

目的: Web Tester でモデル構造、現在ルート、状態キー、検証結果、非AI生成境界を同じ画面で確認する。

## 開き方

```powershell
npm run dev
```

Vite が表示した URL を開く。通常は `http://localhost:5173/`。

1. `vertical-slice.json` を選ぶ。
2. `実行` を押す。
3. `設計ダッシュボード` タブを開く。

## 確認する値

- モデル概要: `vertical-slice`、開始ノード `desk`、ノード数、選択肢数、終端ノード数。
- ルート / プレイ状態: 現在ノード、現在選択肢数、ストーリーログ長、セッション時刻。
- 構造ヘルス: 検証エラー、検証警告、到達可能 / 不可能、孤立ノード、壊れた参照。
- 状態設計キー: flags、resources、variables、entities、templates / lexicon。
- 非AI生成境界: OpenAI、local LLM、外部 API、認証、課金、公開処理を実行しないこと。

## 手動観察メモ

- `Open the old notebook` を選んだ後、現在ノードが `notebook` に更新されるか。
- `found_hook`、`focus`、`evidence`、`lead_name` などの state keys が見えるか。
- 生成証跡は deterministic / procedural / rule-based evidence として読めるか。
- AI品質、本番承認、公開準備の完了を示す表示になっていないか。

## 境界

この review は Designer Dashboard v0 の GUI 確認だけを対象にする。OpenAI/local LLM/provider 統合、CSV schema redesign、core transition semantics、SP-DTYARN 拡張、Unity/WritingPage 実装は対象外。

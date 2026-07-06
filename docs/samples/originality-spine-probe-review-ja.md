# Originality Spine Probe v0 review

目的: NarrativeGen が旧来の flag/resource ADV に留まっているか、Entity-Property / Event / Dynamic Text / ConversationTemplate の独自プリミティブが実際の play route に入っているかを確認する。

## 開き方

```powershell
npm run dev
```

Vite が表示した URL を開く。通常は `http://localhost:5173/`。

1. `originality-spine-probe.json` を選ぶ。
2. `実行` を押す。
3. 最初の画面で `Receipt Fragment` の `provenance` / `owner` / `contradiction` / `credibility` が本文に展開されることを見る。
4. `Ask Mira to test the receipt against her archive memory` を選ぶ。
5. `設計ダッシュボード` を開き、`NarrativeGen独自プリミティブ` を見る。

## 重要ルート

```text
desk
  -> Ask Mira to test the receipt against her archive memory
memory_reframed
  -> Follow the semantic contradiction to the archive ledger
semantic_end
```

## 見る点

- `Receipt Fragment` が evidence point ではなく、`provenance`、`owner`、`contradiction`、`credibility` を持つ story object として読めるか。
- Mira の行動で `event_mira_reframes_receipt` が作られ、その event が次の choice の条件と本文表示に入っているか。
- `Template response:` が event property に反応して出ており、固定本文ではなく ConversationTemplate 由来に見えるか。
- `設計ダッシュボード` の `NarrativeGen独自プリミティブ` で、最初は Event が `present_model_only`、選択後は `live_in_route` に変わるか。
- `Character Knowledge` は JSON 内の Mira profile として見えるが、まだ route mutation には入っていない。これは独自性の未完了部分として扱う。

## 判定メモ

- 設計盤らしい: object property、event trace、template response が同じ route で意味を作っている。
- まだ旧来ADV的: branching 自体は node-and-choice、Character Knowledge は保存されているだけ、property condition はこの probe の route gate に使っていない。
- 次の最短軸: Character Knowledge の `perceiveEntity()` 結果を event 生成または choice availability に接続する。

## 境界

この review はローカル/offline の deterministic probe だけを対象にする。OpenAI、local LLM、外部 API、認証、課金、公開処理、AI文章品質、本番承認は対象外。

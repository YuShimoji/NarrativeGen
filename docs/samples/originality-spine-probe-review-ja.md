# Originality Spine Probe v0 review

## Perception Policy v0 review note

After selecting `Ask Mira to test the receipt against her archive memory`, the
Story text should stay human-readable and Japanese-first. Raw policy/debug
tokens such as `perceptionPolicy:mira_receipt_contradiction_policy`,
`trigger=memory_reframed`, and `noticed=true` are diagnostics, not player copy.
Use this readback JSON and the Designer Dashboard for those signals. In the
Designer Dashboard, Character Knowledge should start as `present_model_only`
with `1 policies` and `0 direct perceiveEntity`, then change to
`live_in_route` with `1 live (1 policy)` after the route reaches
`memory_reframed`.

目的: NarrativeGen が旧来の flag/resource ADV に留まっているか、Entity-Property / Event / Dynamic Text / ConversationTemplate の独自プリミティブが実際の play route に入っているかを確認する。

## 開き方

```powershell
npm run dev
```

Vite が表示した URL を開く。通常は `http://localhost:5173/`。

1. `originality-spine-probe.json` を選ぶ。
2. `実行` を押す。
3. 最初の画面で `レシート片` の出所 / 持ち主 / 矛盾 / 信用度が、点数や debug tag ではなく自然な説明として本文に展開されることを見る。
4. `Ask Mira to test the receipt against her archive memory` を選ぶ。
5. 本文が、ミラの書庫知識によってレシート片の意味が変わったことを自然に説明することを見る。
6. `設計ダッシュボード` を開き、`NarrativeGen独自プリミティブ` を見る。

## 重要ルート

```text
desk
  -> Ask Mira to test the receipt against her archive memory
memory_reframed
  -> Follow the semantic contradiction to the archive ledger
semantic_end
```

## 見る点

- `レシート片` が evidence point ではなく、出所・持ち主・矛盾・信用度を持つ story object として読めるか。
- Mira の行動で `event_mira_perceives_receipt_contradiction` が作られ、その event が次の choice の条件に入っているか。
- Story 本文から raw policy/debug token が消え、`perceptionPolicy` / `trigger` / `noticed` は readback JSON や dashboard 診断として追えるか。
- `ミラの補足:` が event property に反応して出ており、固定本文ではなく ConversationTemplate 由来に見えるか。
- `設計ダッシュボード` の `NarrativeGen独自プリミティブ` で、最初は Character Knowledge が `present_model_only`、選択後は `live_in_route` に変わるか。

## 判定メモ

- 設計盤らしい: object property、event trace、template response が同じ route で意味を作りつつ、Story 本文は人間向けに読める。
- まだ旧来ADV的: branching 自体は node-and-choice、Perception Policy は author-written の特定 node trigger に留まり、property condition はこの probe の route gate に使っていない。
- 次の最短軸: Character Knowledge の perception result を author-written effect ではなく、choice availability や event generation policy に接続する。

## 境界

この review はローカル/offline の deterministic probe だけを対象にする。OpenAI、local LLM、外部 API、認証、課金、公開処理、AI文章品質、本番承認は対象外。

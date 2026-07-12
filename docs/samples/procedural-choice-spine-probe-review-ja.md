# Procedural Choice Spine Probe G2 review

## 目的

Mira の Character Knowledge が persistent perception event を作らず、reusable pure rule から `follow_semantic_change` の availability を直接決めることを確認する。Story は自然な物語文だけを表示し、rule ID、domain fallback、profile match、missing reason、anomaly fact は既存 Designer Dashboard 内の診断面へ分離する。

この probe の normative contract は [SP-KNOW-002](../specs/knowledge-derived-choice-availability.md)、機械読戻しは [procedural-choice-spine-probe-readback.json](procedural-choice-spine-probe-readback.json) を正とする。G0 の主観的な物語・日本語・GUI 判定は別 Review Debt のまま。

## 開き方

```powershell
npm run build:engine
npm run dev
```

通常は `http://localhost:5173/` を開く。

1. `procedural-choice-spine-probe.json` を選び、`実行` を押す。
2. `設計ダッシュボード` の `NarrativeGen独自プリミティブ` を開く。
3. `Knowledge Rule 定義` が `1 rules`、`現在のルール使用` が `0 uses`、知識由来 event が `0 policy-derived` であることを見る。
4. Story に戻り、`Ask Mira to test the receipt against her archive memory` を選ぶ。
5. `Follow the semantic contradiction to the archive ledger` が表示されることを見る。
6. Dashboard で `mira_receipt_contradiction`、`noticed`、`archive_records → archive_records`、`exact`、欠損理由 `なし`、choice attribution を確認する。
7. Dashboard の知識由来 event が `0 policy-derived` のままであることを見る。exact event ID の不在は readback と engine test が確認する。
8. Story に戻り `follow_semantic_change` を選び、`semantic_end` へ到達する。

## 重要ルート

```text
desk
  -> ask_mira_reframe
     -> authored event_mira_reframes_receipt remains
memory_reframed
  -> pure mira_receipt_contradiction evaluation
  -> follow_semantic_change becomes available
semantic_end
```

## 判定点

- `receipt_fragment.credibility=72` と expectation `50` が exact `archive_records` profile で anomaly と判定される。
- 同じ model/session の反復評価で fact と ordered choices が一致する。
- availability 前後で serialized SessionState が同一である。
- live event は authored `event_mira_reframes_receipt` のみで、knowledge-derived perception event は作られない。
- Story に `mira_receipt_contradiction`、`archive_records`、`profileMatch`、`missingReason`、`noticed` が表示されない。
- old/new sample switch 後に route、DOM、diagnostic、event state が漏れない。

## 境界

- SP-KNOW-001 の current originality probe は node-triggered persistent event v0 として保持する。
- broader deterministic event generation、Choice Consequence Lens、Unity/C# parity はこの probe の対象外。
- JSON が canonical export path。Yarn 等の非JSON形式に `knowledgeRule` parity があるとは扱わない。
- この review は deterministic local evidence であり、AI文章品質、本番承認、public distribution を意味しない。

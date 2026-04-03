# Project Context

## PROJECT CONTEXT

- プロジェクト名: NarrativeGen
- 環境: Node.js 22 / TypeScript 5.x / Vite 5 / Vitest / Playwright
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: Pipeline定義 → 最終ワークフロー確立
- 直近の状態 (2026-04-03 session 18):
  - SP-PIPE-001: done/100% (HUMAN_AUTHORITY 5件を本文反映、AUTHORING_GUIDE 全5ステージ拡張)
  - WritingPage 連携: 早期実装コードを stash 退避 (WritingPage v0.3.32 不安定のため延期)
  - Canonical docs 3件 (INVARIANTS / OPERATOR_WORKFLOW / USER_REQUEST_LEDGER) を実コンテンツで補完
  - SP-PLAY-001: 98% (BGM 手動確認のみ残)
  - 33 specs: done 30 / partial 3 (SP-009 90%, SP-UNITY-001 85%, SP-PLAY-001 98%) / todo 0

---

## CURRENT DEVELOPMENT AXIS

- 主軸: Pipeline 確立完了。次の優先は Unity SDK パリティ (SP-UNITY-001) または WritingPage 安定後の連携
- この軸を優先する理由: SP-PIPE-001 done。ワークフローが定義され、AUTHORING_GUIDE が全5ステージをカバー。残りは実装系のギャップ埋め
- 今ここで避けるべき脱線: 新規エンジン機能の追加、コンテンツ執筆、UI装飾

---

## CURRENT LANE

- 主レーン: Docs / Spec Completion (SP-PIPE-001 完了 + Canonical docs 補完)
- 副レーン: なし
- 今このレーンを優先する理由: SP-PIPE-001 完了と canonical docs 初期化を本セッションで実施。次セッションから実装系に移行可能
- いまは深入りしないレーン: Runtime Core (十分成熟)、Experience Slice (SP-PLAY-001 手動確認のみ残)

---

## CURRENT SLICE

- スライス名: SP-PIPE-001 完了 + Canonical docs 補完
- 成功状態: SP-PIPE-001 が done/100%、AUTHORING_GUIDE が全5ステージカバー、canonical docs 3件が実コンテンツ
- 今回はやらないこと: Unity SDK パリティ、WritingPage 連携実装 (延期中)、AI 支援機能

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: インタラクティブ物語のオーサリングツール + ランタイムエンジン
  - Web Tester: ライター/デザイナーがノードベースのストーリーを視覚的に制作・検証するGUIツール
  - engine-ts: TypeScript ストーリー実行エンジン (ブラウザ/Node.js 両対応)
  - sdk-unity: Unity C# SDK (UPM パッケージ)
  - 5形式エクスポート (JSON/CSV/Ink/Twine/Yarn)
- 最終的なユーザーワークフロー: SP-PIPE-001 で定義中 (Design → Author → Validate → Export → Integrate)
- 受け入れ時の使われ方: ライターが Web Tester で物語を完成させ、エクスポートして Unity 等で実行できる
- 現時点で未確定な要素:
  - WritingPage 連携の具体設計 (WritingPage 安定後に策定)

---

## DECISION LOG

このファイルには session 13 以降の決定のみ記録する。
それ以前の決定は CLAUDE.md の Decision Log を参照。

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-23 | SP-PIPE-001 Pipeline Workflow ドラフト策定 | Pipeline先行 / SP-PLAY-001閉じ優先 / WritingPage先行 / 体験ウォークスルー | 基盤能力は充実。次に進むべきは「この基盤で何を作るか」の言語化。Pipeline仕様なしに機能を積み上げると使われない機能が増える |
| 2026-03-26 | レガシー根絶: 孤立ドキュメント/偽テスト/陳腐化仕様の一斉削除 | 個別対応 / 一斉削除 | task-scoutによる全体スキャンでL01-L07を特定。4ルートファイル+1偽テスト+SP-004 legacy+旧ブランチ参照+陳腐化docs 5件。一斉処理が効率的 |
| 2026-03-26 | 安定版化: デッドコード根絶 + UI改善 + CSS重複修正 | Excise先行 / Advance先行 / 並行 | 保守偏重脱出のためExcise→Advance→Refactorの順で実行。user-visible change (empty state + sidebar) を確実に含めた |
| 2026-03-27 | SP-PIPE-001 方向性確定: 1人運用/WritingPage次スライス/JSON主軸/AI支援スコープ外/AUTHORING_GUIDE拡張 | 各項目に3択 | Pipeline仕様のHUMAN_AUTHORITY 5件を全件レビュー。次スライスはWritingPage連携に決定 |
| 2026-04-03 | WritingPage 連携の早期実装コードを stash 退避 | stash / ブランチ分離 / 仕様策定先行 | WritingPage v0.3.32 のフォーマットが不安定。349行で再実装容易。安定後に改めて連携仕様を策定 |
| 2026-04-03 | SP-PIPE-001 完了 (70% → 100%) + Canonical docs 補完 | HUMAN_AUTHORITY 反映 + AUTHORING_GUIDE 拡張 + canonical docs 初期化 | 5件の決定を本文に反映し、全5ステージのガイドを完成。テンプレート状態だった3件の canonical docs を実コンテンツ化 |

---

## IDEA POOL

CLAUDE.md の IDEA POOL を参照。

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Docs / Spec Completion
- 現在のスライス: SP-PIPE-001 完了 + Canonical docs 補完
- 今回変更した対象 (session 18):
  - SP-PIPE-001: done/100% (HUMAN_AUTHORITY 5件を本文反映)
  - AUTHORING_GUIDE.md: Stage 1/3/4/5 追加 (全5ステージカバー)
  - Canonical docs 3件: INVARIANTS / OPERATOR_WORKFLOW / USER_REQUEST_LEDGER を実コンテンツ化
  - WritingPage 連携: 早期実装コードを stash 退避
  - project-context.md / runtime-state.md / spec-index.json 同期
- 次回最初に確認すべきファイル:
  - docs/USER_REQUEST_LEDGER.md (Backlog Delta)
  - docs/specs/spec-unity-sdk.md (SP-UNITY-001: 次の高優先タスク候補)
- 未確定の設計論点:
  - WritingPage 連携の具体設計 (WritingPage 安定後)
- 今は触らない範囲:
  - WritingPage 連携実装 (延期中)
  - AI 支援機能 (スコープ外決定済み)
  - コンテンツ執筆

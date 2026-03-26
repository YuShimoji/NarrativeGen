# Project Context

## PROJECT CONTEXT

- プロジェクト名: NarrativeGen
- 環境: Node.js 22 / TypeScript 5.x / Vite 5 / Vitest / Playwright
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: Pipeline定義 → 最終ワークフロー確立
- 直近の状態 (2026-03-26 session 15 nightshift):
  - Excise: デッドコード8件削除 (1072行+), utils/logger.js統合, 陳腐化docs 2件archive移動
  - Advance: Empty State UI追加, サイドバートグルCSS修正
  - Refactor: inline.css内部重複3箇所統一 (42行削減)
  - docs: Wiki 6セクション追加, OpenSpecデッドリンク修正, spec-index 33エントリ (done 29 / partial 3 / todo 1)
  - 250テスト全緑、ビルド成功、E2E 57件、Visual Audit実施済み

---

## CURRENT DEVELOPMENT AXIS

- 主軸: Pipeline定義 / 最終ワークフロー確立
- この軸を優先する理由: 基盤能力 (エンジンコア・推論・Entity-Property・Dynamic Text・Event・Template) は充実したが、「誰が何をどう使うか」が未定義。機能追加よりワークフロー確立が先
- 今ここで避けるべき脱線: 新規エンジン機能の追加、コンテンツ執筆、UI装飾

---

## CURRENT LANE

- 主レーン: Authoring / Tooling (Pipeline 定義)
- 副レーン: なし
- 今このレーンを優先する理由: SP-PIPE-001 のドラフトを HUMAN_AUTHORITY レビューに通し、次の実装方向を決定するため
- いまは深入りしないレーン: Runtime Core (十分成熟)、Experience Slice (SP-PLAY-001 手動確認のみ残)

---

## CURRENT SLICE

- スライス名: SP-PIPE-001 Pipeline Workflow 仕様策定
- ユーザー操作列: ドラフト読み → ペルソナ/ステージ/Gap のレビュー → 方向性承認 → 具体化
- 成功状態: Pipeline 仕様が承認され、次の実装対象 (WritingPage連携 or Unity SDK or Pipeline ガイド) が決定
- このスライスで必要な基盤能力: なし (仕様策定のみ)
- このスライスから抽出されるツール要求: Pipeline ガイド (AUTHORING_GUIDE.md の拡張候補)
- 今回はやらないこと: SP-PIPE-001 に基づく実装、Unity SDK パリティ

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
  - WritingPage 連携の具体設計
  - ペルソナ (1人運用 vs チーム) の確定
  - エクスポート戦略 (JSON主軸 vs 他形式も同等か)
  - Stage 1 AI 支援のスコープ

---

## DECISION LOG

このファイルには session 13 以降の決定のみ記録する。
それ以前の決定は CLAUDE.md の Decision Log を参照。

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-23 | SP-PIPE-001 Pipeline Workflow ドラフト策定 | Pipeline先行 / SP-PLAY-001閉じ優先 / WritingPage先行 / 体験ウォークスルー | 基盤能力は充実。次に進むべきは「この基盤で何を作るか」の言語化。Pipeline仕様なしに機能を積み上げると使われない機能が増える |
| 2026-03-26 | レガシー根絶: 孤立ドキュメント/偽テスト/陳腐化仕様の一斉削除 | 個別対応 / 一斉削除 | task-scoutによる全体スキャンでL01-L07を特定。4ルートファイル+1偽テスト+SP-004 legacy+旧ブランチ参照+陳腐化docs 5件。一斉処理が効率的 |
| 2026-03-26 | 安定版化: デッドコード根絶 + UI改善 + CSS重複修正 | Excise先行 / Advance先行 / 並行 | 保守偏重脱出のためExcise→Advance→Refactorの順で実行。user-visible change (empty state + sidebar) を確実に含めた |

---

## IDEA POOL

CLAUDE.md の IDEA POOL を参照。

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Authoring / Tooling (Pipeline 定義)
- 現在のスライス: SP-PIPE-001 Pipeline Workflow 仕様策定 (ドラフト完了、レビュー待ち)
- 今回変更した対象 (session 15):
  - 削除: PHASE-2A-COMPLETE.md, copy-models.js, verify-phase-2a.mjs, verify-phase2b.sh, hierarchy-integration-example.js, theme-manager.js, csv-exporter.js, utils/logger.js
  - archive移動: WORKFLOW_STATE_SSOT.md, WEB_TESTER_BROWSER_VERIFICATION.md
  - UI追加: empty state (index.html), サイドバートグルCSS (main.css)
  - CSS修正: inline.css内部重複統一
  - docs更新: NarrativeGen_Reference_Wiki.md, OpenSpec-WebTester.md, TECHNICAL_DEBT.md, spec-index.json, runtime-state.md, HANDOVER.md, TASKS.md, project-context.md
- 次回最初に確認すべきファイル:
  - docs/project-status.md (全体ステータス表)
  - docs/specs/pipeline-workflow.md (HUMAN_AUTHORITY レビュー対象)
- 未確定の設計論点:
  - SP-PIPE-001 の5つの HUMAN_AUTHORITY 確認事項 (ペルソナ/WritingPage優先度/エクスポート戦略/AI支援スコープ/ガイド形態)
- 今は触らない範囲:
  - Unity SDK パリティ (別セッション推奨)
  - 新規エンジン機能追加
  - コンテンツ執筆

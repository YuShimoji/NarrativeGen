# Project Context

## PROJECT CONTEXT

- プロジェクト名: NarrativeGen
- 環境: Node.js 22 / TypeScript 5.x / Vite 5 / Vitest / Playwright
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: Pipeline定義 → 最終ワークフロー確立
- 直近の状態 (2026-03-27 session 16):
  - SP-PIPE-001: HUMAN_AUTHORITY 5件レビュー完了 (1人運用/WritingPage次スライス/JSON主軸/AI支援スコープ外/AUTHORING_GUIDE拡張)
  - SP-PLAY-001: visual-scout で AC-1/2/8/13 確認、テストメディアを有効ファイルに置換。BGM 再生の人間確認のみ残 (95%→98%)
  - Excise: Phase-2B/2C レガシー7ファイル削除 (-2376行)、DEVELOPMENT_PLAN.md 数値修正
  - 33 specs: done 29 / partial 3 (SP-UNITY-001 85%, SP-PLAY-001 98%, SP-PIPE-001 70%) / todo 0

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

- スライス名: WritingPage 連携仕様策定 + 実装 (SP-PIPE-001 Stage 2a)
- ユーザー操作列: WritingPage でテキスト執筆 → NarrativeGen にノードとして流し込み / NarrativeGen のノードテキストを WritingPage で長文編集
- 成功状態: WritingPage と NarrativeGen 間で双方向にテキストを受け渡せる
- このスライスで必要な基盤能力: WritingPage のデータ構造理解、連携インターフェース設計
- このスライスから抽出されるツール要求: インポート/エクスポートハンドラー、WritingPage 側の対応
- 今回はやらないこと: Unity SDK パリティ、AI 支援機能

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
| 2026-03-27 | SP-PIPE-001 方向性確定: 1人運用/WritingPage次スライス/JSON主軸/AI支援スコープ外/AUTHORING_GUIDE拡張 | 各項目に3択 | Pipeline仕様のHUMAN_AUTHORITY 5件を全件レビュー。次スライスはWritingPage連携に決定 |

---

## IDEA POOL

CLAUDE.md の IDEA POOL を参照。

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Advance (WritingPage 連携)
- 現在のスライス: WritingPage 連携仕様策定 + 実装
- 今回変更した対象 (session 16):
  - SP-PIPE-001: HUMAN_AUTHORITY 5件レビュー完了、ステータス todo→partial (70%)
  - docs: pipeline-workflow.md 決定反映、spec-index.json 更新、project-context.md 更新、CLAUDE.md Project Context session 15→16 反映
- 次回最初に確認すべきファイル:
  - docs/specs/pipeline-workflow.md (確定済み方向性)
  - WritingPage プロジェクトのデータ構造
- 未確定の設計論点:
  - WritingPage 連携の具体設計 (データフォーマット、インターフェース)
- 今は触らない範囲:
  - Unity SDK パリティ (別セッション推奨)
  - AI 支援機能 (スコープ外決定済み)
  - コンテンツ執筆

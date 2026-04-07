# プロジェクトコンテキスト（セッション用メモ）

環境・ブランチ・CI の**最新の正**はルート [`HANDOVER.md`](../HANDOVER.md)。本ファイルは**意思決定の補助線**と、長期 Decision Log（session 13 以降）の置き場。

---

## 現在の焦点

- **いま優先しやすいこと**: Unity SDK パリティ（**SP-UNITY-001** / [`specs/unity-sdk.md`](specs/unity-sdk.md)）、または **SP-PLAY-001** の手動確認（`play-immersion.md` 検証表）。WritingPage 連携は外部フォーマット安定まで**実装しない**。
- **背景**: **SP-PIPE-001** は spec-index 上 **done**。オーサリングの流れは `pipeline-workflow.md` と [`AUTHORING_GUIDE.md`](AUTHORING_GUIDE.md) がカバー。
- **いま深追いしないこと**: エンジンの大型機能追加、本編コンテンツ執筆、UI の装飾のみの変更。

## 直近スナップショット（2026-04-03 / session 18 時点）

- SP-PIPE-001: 本文・AUTHORING_GUIDE 5 ステージまで反映済み。
- WritingPage: 早期実装は stash 退避（相手フォーマット不安定のため）。
- Canonical 3 件（INVARIANTS / OPERATOR_WORKFLOW / USER_REQUEST_LEDGER）を実記述に更新。
- SP-PLAY-001: 手動確認が残る（BGM 等）。
- 仕様エントリ数は **spec-index.json** を見たときの **34 件**が正（done / partial は `spec-viewer` で確認）。

## 次に読むファイル

1. [`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md)（バックログ）
2. [`specs/unity-sdk.md`](specs/unity-sdk.md)（Unity 次タスクの核）
3. 全体の健康状態の一行版: [`project-status.md`](project-status.md)

---

## 成果物の像（短く）

ライターが **Web Tester** でノード物語を作り、**5 形式エクスポート**し、**engine-ts** または **Unity SDK** で実行する。ワークフロー語彙は Design → Author → Validate → Export → Integrate。**WritingPage** の接続点は未確定（相手安定後）。

---

## Decision Log（session 13 以降）

それ以前の長期記録は [`governance/decision-log.md`](governance/decision-log.md)。ルート [`CLAUDE.md`](../CLAUDE.md) には直近3件の抜粋のみ。

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-23 | SP-PIPE-001 Pipeline Workflow ドラフト策定 | Pipeline先行 / SP-PLAY-001閉じ優先 / WritingPage先行 / 体験ウォークスルー | 基盤は揃っている。次は「誰が何をどう使うか」の言語化。Pipeline なしで機能だけ増やすと未使用機能が増える |
| 2026-03-26 | 孤立ドキュメント・偽テスト・陳腐化仕様の整理削除 | 個別対応 / バッチ削除 | task-scout で L01-L07 を特定。対象をまとめて処理した方が速い |
| 2026-03-26 | デッドコード除去・UI 改善・CSS 重複解消 | Excise先行 / Advance先行 / 並行 | 保守に偏らないよう Excise→Advance→Refactor。empty state とサイドバーなどユーザーに見える変更を含めた |
| 2026-03-27 | SP-PIPE-001 方向性（1人運用・WritingPage 次・JSON 主軸・AI 支援スコープ外・AUTHORING_GUIDE 拡張） | 各項目で複数案 | HUMAN_AUTHORITY 5 件を全件レビュー。次スライスは WritingPage 連携 |
| 2026-04-03 | WritingPage 連携の早期実装を stash 退避 | stash / ブランチ分離 / 仕様先行 | 相手 v0.3.32 のフォーマットが不安定。行数は小さく再実装しやすい |
| 2026-04-03 | SP-PIPE-001 完了（70%→100%）と Canonical 3 件の実記述化 | 同上 | 5 件を本文に反映し、ガイドとテンプレ脱却 |

---

## IDEA POOL

[`CLAUDE.md`](../CLAUDE.md) の IDEA POOL 節 → [`USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md)。

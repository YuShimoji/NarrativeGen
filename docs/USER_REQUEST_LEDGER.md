# User Request Ledger

ユーザーの継続要望・差分要求・backlog を保持する台帳。

## 現在有効な要求

- WritingPage 連携 (双方向テキスト受け渡し) -- 延期中。WritingPage のフォーマット安定後に着手
- Pipeline 定義の完了と AUTHORING_GUIDE.md の全5ステージ拡張 (Decision #5)
- 意思決定・手動確認地点で区切りを設け、プランを提示する

## 未反映の是正要求

- (なし -- SP-PIPE-001 本文反映、project-context.md 同期は本セッションで実施)

## Backlog Delta

| ID | 項目 | 優先度 | 状態 |
|----|------|--------|------|
| B-001 | Unity SDK 7機能移植 (SP-UNITY-001 85% → 100%) | 高 | 未着手 (別セッション推奨) |
| B-002 | SP-PLAY-001 BGM 手動ブラウザ確認 → 100% | 中 | 未着手 (ユーザー操作必要) |
| B-003 | Visual evidence 再取得 (スクリーンショット消失) | 中 | 未着手 |
| B-004 | Dynamic Text エクスポート変換ルール定義 | 低 | 未着手 (JSON 主軸で回避可能) |
| B-005 | CI 統合 (spec-index / encoding-safety checks) | 中 | 未着手 |
| B-006 | GUI Undo/Redo 手動回帰テスト | 中 | 未着手 |

## 今後明文化すべきこと

- WritingPage 連携の具体設計 (データフォーマット、インターフェース) -- WritingPage 安定後
- Stage 1 → 2 のデータ引き継ぎ方法の改善策

## 運用ルール

- 会話で一度出た要求のうち、次回以降も効くものをここへ残す
- 単なる感想ではなく、仕様・設計・backlog に効くものを優先する

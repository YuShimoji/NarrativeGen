# User Request Ledger

ユーザーの継続要望・差分要求・backlog を保持する台帳。

## 現在有効な要求

- WritingPage 連携 (双方向テキスト受け渡し) -- 延期中。WritingPage のフォーマット安定後に着手
- Pipeline 定義の完了と AUTHORING_GUIDE.md の全5ステージ拡張 (Decision #5)
- 意思決定・手動確認地点で区切りを設け、プランを提示する
- 監修 AI は実装手順を細切れにせず、1 bottleneck を閉じる成果契約として Prompt を渡す
- 開発 AI はスコープ内の可逆な判断、関連修正、ローカル検証、正本同期、git follow-through を連続して行い、routine な継続許可を求めない
- 高主観な UI・言語・コンテンツ・色・フォント・アニメーション変更では、実装前に異質な方向案と比較材料を出し、人間の高位判断後は一まとまりで実装・レビューする
- 進捗と次作業は `HANDOVER.md` の current snapshot に集約し、GitHub 上から同じ内容を確認可能にする。手動更新の Wiki や status 文書を第二正本にしない
- 今後、外部 status 面を設ける場合は正本から自動投影する。GitHub Pages / Wiki 初期化のような外部公開は人間の承認後に行う
- material slice の CLOSE では、検証鮮度、未決事項、触らない範囲、次回確認ファイル、remote parity を current snapshot に残して push し、別端末が会話ログなしで再開できる状態にする

## 未反映の是正要求

- GitHub Pages または Wiki による外部 Project Cockpit は未実装。内部正本の整理と再発防止を先に完了し、公開方式と公開範囲を決めてから着手する

## Backlog Delta

| ID | 項目 | 優先度 | 状態 |
|----|------|--------|------|
| B-001 | Unity SDK 残パリティ (SP-UNITY-001 96% → 100%) | 高 | 完了（C# createEvent runtime、expandTemplate 主要エッジ、ローカル NuGet pack 準備。公開は human-owned） |
| B-002 | SP-PLAY-001 BGM 手動ブラウザ確認 → 100% | 中 | 完了（`play-media-bgm-ac.spec.js` + 検証表 Pass。耳視聴は任意） |
| B-003 | Visual evidence 再取得 (スクリーンショット消失) | 中 | 未着手 |
| B-004 | Dynamic Text エクスポート変換ルール定義 | 低 | 未着手 (JSON 主軸で回避可能) |
| B-005 | CI 統合 (spec-index / encoding-safety / models-sync checks) | 中 | 完了（governance job） |
| B-006 | GUI Undo/Redo 手動回帰テスト | 中 | 未着手 |

## 今後明文化すべきこと

- WritingPage 連携の具体設計 (データフォーマット、インターフェース) -- `docs/specs/writingpage-io-contract.md` に最小契約を定義済み
- Stage 1 → 2 のデータ引き継ぎ方法の改善策

## ロードマップ上の扱い（2026-04 更新）

- 参照: `docs/plans/DEVELOPMENT_PLAN.md`
- WritingPage 連携は **長期トラック（3〜6か月）** で扱う
- 着手条件:
  - 外部フォーマットが安定していること
  - 入出力契約（最小フィールド）が確定していること
  - 先行して短期（SP-PLAY / SP-UNITY / E2E安定化）が完了していること
  - `docs/specs/writingpage-io-contract.md` の着手ゲートを満たすこと

## 運用ルール

- 会話で一度出た要求のうち、次回以降も効くものをここへ残す
- 単なる感想ではなく、仕様・設計・backlog に効くものを優先する

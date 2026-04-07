# バックログ項目の昇格（運用メモ）

`docs/TECHNICAL_DEBT.md` の **Backlog（要件確定後にチケット化）** 表に載っている項目は、実装に着手する直前に次のいずれかへ移す。

1. **GitHub Issue**（推奨）: 受け入れ条件を1〜3行で書き、`docs/spec-index.json` の該当 SP と相互リンクする。
2. **`docs/plans/DEVELOPMENT_PLAN.md`**: マイルストーン行として1行追加し、Issue 番号が付いたら追記する。

## 現在の表エントリ

| ID | 昇格時に含めること |
|----|-------------------|
| BL-TGEN-META | `model.metadata` に `{…}` を載せるか、対象フィールド、プレイ本線で使うか |

（BGM 人的検証は `docs/specs/play-immersion.md` の「検証記録」表で管理。Issue 化する場合はその表へのリンクを添える。）

昇格後は `TECHNICAL_DEBT.md` の表から該当行を **削除**し、Issue/DEVELOPMENT_PLAN 側を正とする。

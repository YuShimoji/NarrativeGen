# バックログ項目の昇格（運用メモ）

`docs/TECHNICAL_DEBT.md` の **Backlog（要件確定後にチケット化）** 表に載っている項目は、実装に着手する直前に次のいずれかへ移す。

1. **GitHub Issue**（推奨）: 受け入れ条件を1〜3行で書き、`docs/spec-index.json` の該当 SP と相互リンクする。
2. **`docs/plans/DEVELOPMENT_PLAN.md`**: マイルストーン行として1行追加し、Issue 番号が付いたら追記する。

## BL-TGEN-META（決定済み 2026-04-08）

当面コアに `model.metadata` の `{…}` 展開を載せない。将来ニーズが出たら [docs/plans/issue-stubs/BL-TGEN-META.md](issue-stubs/BL-TGEN-META.md) から GitHub Issue を起票する。

## BGM 検証

`docs/specs/play-immersion.md` の検証記録表および `play-media.spec.js` の E2E を正とする。

昇格後は `TECHNICAL_DEBT.md` の Backlog から該当行を **削除**し、Issue/DEVELOPMENT_PLAN 側を正とする。

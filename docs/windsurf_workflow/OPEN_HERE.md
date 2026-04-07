# 開発再開・オンボーディング入口

このリポジトリには `.shared-workflows`（submodule）は**未導入**の場合があります。

**次の 1 → 2 → 3 を、この順で読む。**

## 人間・エージェント共通

| 順 | ファイル | 用途 |
|----|----------|------|
| 1 | [`HANDOVER.md`](../../HANDOVER.md)（ルート） | 直近の状態・CI・次の推奨作業・再開コマンド |
| 2 | [`CLAUDE.md`](../../CLAUDE.md) | キーパス・コマンド・Decision Log（長期は [`docs/governance/decision-log.md`](../governance/decision-log.md)） |
| 3 | [`docs/project-context.md`](../project-context.md) | セッション用の焦点・補助線 |

## 仕様（Source of Truth）

- [`docs/spec-index.json`](../spec-index.json) — エントリ一覧とステータス
- [`docs/spec-viewer.html`](../spec-viewer.html) — ブラウザ閲覧（`npx serve docs` 等）
- ライター向け: [`docs/AUTHORING_GUIDE.md`](../AUTHORING_GUIDE.md)

## shared-workflows を入れている場合

- 追加で `.shared-workflows/docs/windsurf_workflow/OPEN_HERE.md` および `ORCHESTRATOR_DRIVER.txt` を参照してよい。

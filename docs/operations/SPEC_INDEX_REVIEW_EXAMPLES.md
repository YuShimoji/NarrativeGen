# spec-index.json 変更レビュー例

最終更新: 2026-04-09

目的: [docs/TECHNICAL_DEBT.md](../TECHNICAL_DEBT.md) の「spec 保守運用」における、PR レビュー時の最低チェック例を固定する。

## 例1: 新規仕様ファイルを追加する

- [ ] `docs/spec-index.json` に 1 エントリ追加（`id`, `title`, `status`, `pct`, `cat`, `file`, `summary`）
- [ ] `file` がリポジトリ内の実在パスである（`npm run check:spec-index` で検証）
- [ ] 既存 `id` と重複していない
- [ ] 関連する親ドキュメント（例: `pipeline-workflow.md`）に 1 行参照を足した

## 例2: 既存エントリの `pct` / `summary` だけ更新する

- [ ] `summary` が「残タスク」と矛盾していない（完了なら `status` を `done` に寄せる検討）
- [ ] 数値 `pct` の根拠がコミットメッセージまたは仕様本文で説明できる
- [ ] 仕様ファイル側の「ステータス」見出しがあれば同期した

## 例3: 仕様ファイルをリネーム・移動する

- [ ] `spec-index.json` の `file` を新パスへ更新
- [ ] 他ドキュメントからのリンクを一括置換（grep で旧パスを確認）
- [ ] `npm run check:spec-index` が通る

## 実行コマンド

```bash
npm run check:spec-index
```

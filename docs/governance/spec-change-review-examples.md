# 仕様変更レビュー例（spec-index 運用）

`docs/TECHNICAL_DEBT.md` の「spec SoT 運用」向け。PR で次を確認する際のチェックリスト例。

## 例1: 新規 SP ドキュメントを追加したとき

- [ ] `docs/spec-index.json` にエントリ追加（`id`, `title`, `status`, `pct`, `cat`, `file`, `summary`）
- [ ] `npm run check:spec-index` が通る（パス実在・JSON 構文）
- [ ] 既存 SP との重複がない、または `summary` で差分が分かる

## 例2: 既存仕様のステータスを `partial` → `done` に上げたとき

- [ ] 受け入れ条件に対応するテストまたは検証記録への参照を1行以上 `summary` に含める
- [ ] 実装が未完了の箇所は別 SP か Backlog に残し、`pct` を 100 にしない

## 例3: 仕様ファイルをリネーム・移動したとき

- [ ] `spec-index.json` の `file` を新パスに更新
- [ ] リポジトリ内参照（`HANDOVER.md`, `CLAUDE.md`, 他 spec からのリンク）を一括 grep で確認

## 例4: 破壊的モデル変更（JSON Schema）のとき

- [ ] `models/schema/playthrough.schema.json` と `npm run validate`（または CI 相当）
- [ ] `npm run sync:models` 実行済みで `check:models-sync` 通過
- [ ] `docs/spreadsheet-format.md` または `AUTHORING_GUIDE.md` に執筆者向け差分が必要なら追記

## 例5: エンコーディングに触れたとき

- [ ] `docs/`, `scripts/`, `package.json`, `.gitattributes`, Vite 設定のいずれかを変えたら `npm run check:safety`（変更が限定的なら `check:safety:changed`）

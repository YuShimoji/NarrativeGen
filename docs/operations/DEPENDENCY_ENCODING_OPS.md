# 依存関係・エンコーディング運用メモ

最終更新: 2026-04-09

[docs/TECHNICAL_DEBT.md](../TECHNICAL_DEBT.md) §2（依存）§3（encoding）の実務補足。

## 依存（npm）

- リリース前または月 1 回: リポジトリルートで `npm ls --depth=0` を実行し、`extraneous` / `invalid` が無いことを確認する。
- 権限エラーやサンドボックスで `npm ci` が失敗する場合: 同じ Node バージョン（CI は 20）を使うこと、企業プロキシ環境では `npm config get proxy` を確認すること。

## エンコーディング

- ドキュメント・JSON・スクリプトを触ったら: `npm run check:safety:changed`（作業中）、マージ前に `npm run check:safety`。
- UTF-8 を前提とし、PowerShell での一括置換で JSON に不正なエスケープが残らないようにする（過去インシデント: `docs/governance/encoding-safety-incident-2026-03-10.md`）。
- pre-commit への組み込みは任意。チーム合意が取れたら `.husky` 等で `check:safety:changed` を足す。

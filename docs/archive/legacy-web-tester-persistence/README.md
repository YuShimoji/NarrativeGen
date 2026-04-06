# 廃止: Web Tester の `StorageManager` / `save-load-handler` 経路

**状態（2026-04）**: `apps/web-tester/utils/storage-utils.js` と `apps/web-tester/handlers/save-load-handler.js` は **リポジトリから削除**した。プレイ本線の永続化は **`SaveManager`**（`narrativeGen_save_slot_*` / オートセーブ）のみとする。

## 以前の役割

- `narrativeGen_savedSession` / `narrativeGen_savedMetadata` など別キーでのセッション JSON 保存
- `initSaveLoadHandler` による手動保存・再開モーダル（**エントリから未配線のまま保守のみ**だった）

## ソースの参照先

復元が必要な場合は **削除前のコミット**（例: `eef60fb` より前）の git history を参照する。

## ローカルに残るデータ

ユーザー環境の localStorage に旧キーが残っていても、アプリは読み込まない。必要ならブラウザの開発者ツールから手動削除可能。

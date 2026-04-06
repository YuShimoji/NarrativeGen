# Web Tester (`@narrativegen/web-tester`)

ブラウザ向けのモデル編集・プレイ検証 UI。

## セッション永続化（2系統）

| 経路 | ストレージ | 本線 |
|------|------------|------|
| **SaveManager**（`src/features/save-manager.js`） | `narrativeGen_save_slot_*` / `narrativeGen_autosave` | **はい** — デバッグパネル「セーブ・ロード」から利用 |
| **StorageManager**（`utils/storage-utils.js`） + `handlers/save-load-handler.js` | `narrativeGen_savedSession` 等 | **いいえ**（現状エントリ未配線）。配線時は `descriptionState` 用の `getDescriptionState` / `restoreDescriptionState` を `initSaveLoadHandler` に渡すこと |

Undo 用の `sessionHistory` と `descriptionState` 履歴は、ロード直後に本線仕様でリセットする必要がある。

## ビルド

ルートから `npm run build:tester`。エンジンは `packages/engine-ts` の `dist` を参照する。

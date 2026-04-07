# Web Tester (`@narrativegen/web-tester`)

ブラウザ向けのモデル編集・プレイ検証 UI。

## セッション永続化

| 経路 | ストレージ | 説明 |
|------|------------|------|
| **SaveManager**（`src/features/save-manager.js`） | `narrativeGen_save_slot_*` / `narrativeGen_autosave` | **唯一の本線** — デバッグパネル「セーブ・ロード」 |

旧 **`StorageManager`**（`narrativeGen_savedSession`）と **`handlers/save-load-handler.js`** は **廃止**。経緯の説明は Git 履歴で `legacy-web-tester-persistence` 等を検索。

Undo 用の `sessionHistory` と `descriptionState` 履歴は、ロード直後に本線仕様でリセットする必要がある。

## ビルド

ルートから `npm run build:tester`。エンジンは `packages/engine-ts` の `dist` を参照する。

# AI_CONTEXT

## 現在の状況

- 作業対象: `apps/web-tester`（GUIエディタ/条件効果/実行画面/保存）
- ブランチ: `main`（`origin/main` と同期、作業ツリーに未コミット変更あり）
- 目的: GUI一括編集（Batch Choice Editing）の構造化対応、raw(JSON) 往復、後方互換維持。

## 今回の決定事項

- 条件/効果は **エンジン互換の構造化オブジェクト** を基本とし、
  未対応形式は **raw(カスタム)** として破壊せず保持する。
- GUI保存/キャンセル時のモード終了は `exitGuiEditMode()` に統一。
- ストーリー描画は UIコンテナ（`#storyContent`）ではなく、本文エリア（`#storyView`）に限定する。

## 直近の変更（未コミット）

- `apps/web-tester/src/ui/story.js`
  - `StoryManager` の描画先を `#storyView` 優先に修正（UI破壊防止）
- `apps/web-tester/main.js`
  - GUI保存/キャンセルで `exitGuiEditMode()` を使用
  - GUI保存前の検証関数 `validateModel()` を追加
- `apps/web-tester/src/ui/condition-effect-editor.js`
  - 構造化 condition/effect 対応、raw(JSON) 往復、operator制御
- `apps/web-tester/src/ui/gui-editor.js`
  - Batch choice editing の構造化対応、ドラフト保存強化
- `apps/web-tester/src/features/model-validator.js`
  - `key/flag` 揺れ吸収
- `apps/web-tester/index.html`
  - UI軽微変更
- `apps/web-tester/src/ui/condition-effect-editor.js`
  - `EffectTypes.SET_RESOURCE` を削除（エンジン非互換のため）。既存の `setResource:` 文字列は raw として保持。
- `docs/OpenSpec-WebTester.md`
  - 構造化条件/効果対応の反映など、現状に合わせて更新。
- `docs/PROJECT_STATUS.md`
  - `meta.paraphraseLexicon` のエクスポート時自動埋め込みを「実装済み」に更新。

## 検証（実施済み）

- Puppeteer: `branching_flags` で GUI編集→条件追加→保存→選択肢が絞られること、`draft_model` が object 保存されること。
- `apps/web-tester`: `npm run build` 成功。
- ルート: `npm run check`（lint/test/validate/build）成功。

## 次の中断可能点

- ドキュメント整合（OpenSpec/PROJECT_STATUS/AI_CONTEXT）の更新をコミットに含める。
- Lexicon UX（GUIクイック追加 + import検証）実装に着手。

## Backlog / 次タスク

- `docs/GUI_EDITOR_TEST_GUIDE.md` に沿った手動テスト（回帰）を実施し、レポート化。
- `timeWindow` 条件のエンジン仕様との最終整合確認。
- レキシコン: GUIクイック追加、インポート時スキーマ検証（Ajv）。
- Phase 2: 読み取り専用のグラフビュー（スパイク）を最小で実装。

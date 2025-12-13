# AI_CONTEXT

## 現在の状況

- 作業対象: `apps/web-tester`（GUIエディタ/条件効果/実行画面/保存）
- ブランチ: `lexicon-ux-ajv-packages-casing`（作業ツリー: clean）
- 目的: Lexicon UX（GUIクイック追加 + Ajv スキーマ検証 + runtime 同期）および `Packages/` の表記統一（Linux/CI の case-sensitive 対応）。

## 参照リンク

- PR: https://github.com/YuShimoji/NarrativeGen/pull/64

## 今回の決定事項

- 条件/効果は **エンジン互換の構造化オブジェクト** を基本とし、
  未対応形式は **raw(カスタム)** として破壊せず保持する。
- GUI保存/キャンセル時のモード終了は `exitGuiEditMode()` に統一。
- ストーリー描画は UIコンテナ（`#storyContent`）ではなく、本文エリア（`#storyView`）に限定する。

## 直近の変更（コミット済み）

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
- `apps/web-tester/src/ui/lexicon-ui-manager.js`
  - Lexicon JSON の import/merge/replace に Ajv スキーマ検証を追加
  - クイック追加フォーム（原文 + variants）の UI 操作を追加
  - designer lexicon 変更時に engine runtime lexicon へ同期
- `apps/web-tester/main.js`
  - 起動時に designer lexicon を engine runtime lexicon に初期反映
  - Lexicon UI からの変更を engine runtime lexicon へ適用するコールバックを接続
- 各所
  - `packages/` → `Packages/` の表記をコード/CI/docs で統一
- `docs/UI_IMPROVEMENTS_TEST.md`, `docs/GUI_EDITOR_TEST_GUIDE.md`
  - 手動回帰テストの実施記録欄を追加
  - Puppeteer によるスモーク結果を記録（起動/実行/タブ切替/GUI編集入退場/レキシコン操作）

## 検証（実施済み）

- Puppeteer: `branching_flags` で GUI編集→条件追加→保存→選択肢が絞られること、`draft_model` が object 保存されること。
- `apps/web-tester`: `npm run build` 成功。
- ルート: `npm run check`（lint/test/validate/build）成功。

## 次の中断可能点

- PR #64 のレビュー/マージ待ち（Lexicon UX + `Packages/` 表記統一 + 回帰スモーク記録）。
- ルールSSOTとして参照している `docs/Windsurf_AI_Collab_Rules_v1.1.md` がリポジトリ内に存在しないため、実ファイルの所在を確認する。

## Backlog / 次タスク

- `docs/GUI_EDITOR_TEST_GUIDE.md` に沿った手動テスト（回帰）を継続（必要に応じて追加観点/自動化）。
- `timeWindow` 条件のエンジン仕様との最終整合確認。
- Phase 2: 読み取り専用のグラフビュー（スパイク）を最小で実装。

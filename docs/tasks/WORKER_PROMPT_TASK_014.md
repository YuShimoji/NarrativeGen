# Worker Prompt: TASK_014 GUIエディタバグ修正

## タスク情報

- **チケット**: `docs/tasks/TASK_014_GUIEditorBugFixes.md`
- **Status**: OPEN
- **Tier**: 2
- **Owner**: Worker

## 目的

GUIエディタ手動テスト（TASK_009）で発見されたバグを修正する。検索UIの虫眼鏡アイコン表示、クイックノードモーダルのキャンセル機能、テーマモーダル閉鎖時のツールバー表示問題を解決する。

## 背景

TASK_009の手動テスト実施中に以下の問題が発見されました:

1. **検索UIの虫眼鏡アイコンが見つからない**
   - `index.html`の2112行目で`<use href="#icon-search"></use>`を参照しているが、`icons.svg`に`icon-search`シンボルが定義されていない
   - 検索・フィルタ機能のテストが実施できない状況

2. **クイックノードモーダルからキャンセルができない**
   - モーダルを閉じるにはノードを作成するしかない
   - ユーザビリティの問題

3. **テーマモーダルを閉じる際にツールバーが一瞬表示される**
   - 左側にテーマのツールバーのようなものが一瞬だけ表示される
   - CSSトランジションと`display: none`のタイミング問題の可能性

## 実装要件

### 1. 検索アイコンの追加

- `apps/web-tester/icons.svg`に`icon-search`シンボルを追加
- Lucide Iconsの`search`アイコンを使用（他のアイコンと同様のスタイル）
- 参考: 既存のアイコン定義（例: `icon-eye`, `icon-save`等）

### 2. クイックノードモーダルのキャンセル機能

- `apps/web-tester/index.html`のクイックノードモーダルにキャンセルボタンを追加
- `apps/web-tester/src/ui/gui-editor.js`にキャンセル処理を実装
- 他のモーダル（バッチ編集、スニペット等）と同様の実装パターンを参考にする
- キャンセル時はモーダルを閉じるだけで、ノードは作成しない

### 3. テーマモーダル閉鎖時の表示問題修正

- `apps/web-tester/src/ui/theme.js`の`setupThemeEventListeners()`を確認
- モーダル閉鎖時のCSSトランジションと`display: none`のタイミングを調整
- ツールバーが一瞬表示される問題を解決

## 制約事項

- 既存の正常動作している機能に影響を与えないこと
- 修正は最小限とすること
- 動作確認（ブラウザでの手動テスト）を必ず実施すること

## 完了条件（DoD）

- [ ] `icons.svg`に`icon-search`シンボルを追加
- [ ] クイックノードモーダルにキャンセルボタンを追加
- [ ] `gui-editor.js`にキャンセル処理を実装
- [ ] テーマモーダル閉鎖時の表示問題を修正
- [ ] 各修正について動作確認（ブラウザでの手動テスト）
- [ ] 修正内容を`docs/GUI_EDITOR_TEST_GUIDE.md`のテスト実施記録に追記
- [ ] `docs/inbox/`にレポート（`REPORT_TASK_014_*.md`）を作成
- [ ] チケットのReport欄にレポートパスを追記

## 参考資料

- `docs/tasks/TASK_014_GUIEditorBugFixes.md`: タスクチケット
- `docs/GUI_EDITOR_TEST_GUIDE.md`: テストガイド（テスト実施記録を更新）
- `apps/web-tester/src/ui/gui-editor.js`: GUIエディタマネージャー
- `apps/web-tester/src/ui/theme.js`: テーマ管理モジュール
- `apps/web-tester/icons.svg`: SVGアイコン定義
- `apps/web-tester/index.html`: HTMLテンプレート

## 注意事項

- 修正後は必ずブラウザで動作確認を行うこと
- 検索UIが正しく表示されることを確認すること
- クイックノードモーダルがキャンセルできることを確認すること
- テーマモーダルを閉じる際にツールバーが表示されないことを確認すること

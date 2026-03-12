# 今後の開発タスク表

**最終更新**: 2026-03-09

## 完了済みタスク

| タスク | ステータス | 完了日 | 詳細 |
|--------|-----------|--------|------|
| ストーリーテキスト改行処理改善 | 完了 | 2025-10-31 | HTML 段落レンダリング実装 |
| main.js 分割 Phase 1 | 完了 | 2025-10-31 | handlers/, utils/ への機能分離 |
| main.js 分割 Phase 2〜4 | 完了 | 2026-03-09 | main.js 2365行→69行。app-controller.js + app-editor-events.js |
| 推論レジストリ基盤 | 完了 | 2026-03-06 | inference/ プラグインパターン |
| グラフエディタモジュール分割 | 完了 | 2026-03-06 | DagreLayoutEngine, ContextMenuManager 分離 |
| 前方/後方連鎖推論 | 完了 | 2026-03-06 | forward-chaining, backward-chaining 実装 |
| condition-effect-ops.ts 統合 | 完了 | 2026-03-09 | 3ファイルの重複 evalCondition/applyEffect を集約 |
| Yarn Spinner エクスポート | 完了 | 2026-03-09 | YarnFormatter.js 追加（4形式目） |
| 変数システム拡張 | 完了 | 2026-03-09 | 数値型・四則演算・比較条件・UI対応 |
| ドキュメント整理 | 完了 | 2026-03-06 | 108件 → 23件（アクティブ） |
| AI 採用ボタン | 完了 | 2026-03 | 生成履歴の簡易保持 |
| Undo/Redo 基本実装 | 完了 | 2026-03 | |
| セーブ/ロード（localStorage） | 完了 | 2026-03 | localStorage + 自動保存 |
| ノード階層 Phase 2 | 完了 | 2026-03 | node_group 対応 |
| XSS Phase 1 修正 | 完了 | 2026-02 | html-utils 中央化 |
| Spec Viewer 導入 | 完了 | 2026-03-09 | spec-index.json + spec-viewer.html |

## 優先度順タスク一覧

| 優先度 | タスク | 対象 | 難易度 | 見積時間 |
|--------|--------|------|--------|----------|
| ~~高~~ | ~~E2E skip 36件の要否判断と対応~~ | ~~web-tester~~ | ~~中~~ | **完了** |
| **高** | Yarn Spinner エクスポート実運用検証 | web-tester | 低 | 0.5日 |
| **高** | GUI Undo/Redo の手動回帰テスト（SSOT Done 条件） | web-tester | 中 | 1日 |
| **中** | inference/ ディレクトリの方針決定 | engine-ts | 中 | 0.5日 |
| **中** | チャンクサイズ警告解消（rollup manualChunks） | web-tester | 中 | 1日 |
| **低** | アクセシビリティ改善（ARIA ラベル等） | web-tester | 低 | 1日 |
| **低** | モバイル/タブレット対応 | web-tester | 高 | 2-3日 |

## タスク詳細

### 高優先度

#### E2E skip 36件の整理

**課題**: 36件がスキップのまま。SSOT の Done 条件に直結。

**分類方針**:
- theme-toggle 11件: UI 未接続のため削除候補
- undo-redo 系: 基本テストのみ。拡充候補
- その他: 個別に理由を精査して「有効化 / 削除 / 保留明記」の3択

#### Yarn Spinner エクスポート実運用検証

**確認内容**:
- `models/` 配下のサンプルモデルを Yarn 形式に出力
- Yarn Spinner Dialogue System（Unity / Web Previewer）で読み込み確認
- `docs/specs/yarn-spinner-export.md` との仕様整合チェック

#### GUI Undo/Redo 手動回帰テスト

**確認内容**（`docs/GUI_EDITOR_TEST_GUIDE.md` 参照）:
- ノード追加/削除/編集の Undo/Redo
- 条件/エフェクト編集の Undo/Redo
- 複数操作後の Redo の一貫性

### 中優先度

#### inference/ ディレクトリの方針

origin/main では `inference/` を削除して `condition-effect-ops.ts` に統合。
現ブランチには `inference/` が残存（推論レジストリ・前方/後方連鎖）。

**選択肢**:
- A. `condition-effect-ops.ts` に forward/backward chaining も統合して `inference/` を削除
- B. `inference/` を維持（API として外部公開）
- C. 別パッケージ（`@narrativegen/engine-inference`）に分離

#### チャンクサイズ警告解消

`build.rollupOptions.output.manualChunks` で分割。または dynamic import でコード分割。
対象: `index-*.js: 325 kB`, `cytoscape.esm.js: 442 kB`

## 進捗指標

- **テスト**: engine-ts 73/73 合格。E2E 22 passed / 5 skipped (theme-toggle 33件削除済み、残skipは防御的ガード)
- **ビルド**: engine-ts + web-tester ともに成功
- **保守性**: main.js 69行（目標達成）
- **エクスポート形式**: 4形式（CSV / Ink / Twine / Yarn）

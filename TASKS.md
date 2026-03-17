# 今後の開発タスク表

**最終更新**: 2026-03-16

## 完了済みタスク

| タスク | ステータス | 完了日 | 詳細 |
|--------|-----------|--------|------|
| ストーリーテキスト改行処理改善 | 完了 | 2025-10-31 | HTML 段落レンダリング実装 |
| main.js 分割 Phase 1 | 完了 | 2025-10-31 | handlers/, utils/ への機能分離 |
| main.js 分割 Phase 2〜4 | 完了 | 2026-03-09 | main.js 2365行→469行。app-controller.js + app-editor-events.js |
| 推論レジストリ基盤 | 完了 | 2026-03-06 | inference/ プラグインパターン |
| グラフエディタモジュール分割 | 完了 | 2026-03-06 | DagreLayoutEngine, ContextMenuManager 分離 |
| 前方/後方連鎖推論 | 完了 | 2026-03-06 | forward-chaining, backward-chaining 実装 |
| condition-effect-ops.ts 統合 | 完了 | 2026-03-09 | 3ファイルの重複 evalCondition/applyEffect を集約 |
| Yarn Spinner エクスポート | 完了 | 2026-03-09 | YarnFormatter.js 追加（5形式目） |
| 変数システム拡張 | 完了 | 2026-03-09 | 数値型・四則演算・比較条件・UI対応 |
| ドキュメント整理 | 完了 | 2026-03-06 | 108件 → 23件（アクティブ） |
| AI 採用ボタン | 完了 | 2026-03 | 生成履歴の簡易保持 |
| Undo/Redo 基本実装 | 完了 | 2026-03 | |
| セーブ/ロード（localStorage） | 完了 | 2026-03 | localStorage + 自動保存 |
| ノード階層 Phase 2 | 完了 | 2026-03 | node_group 対応 |
| XSS Phase 1 修正 | 完了 | 2026-02 | html-utils 中央化 |
| Spec Viewer 導入 | 完了 | 2026-03-09 | spec-index.json + spec-viewer.html |
| feature/main-js-split-phase2 統合 | 完了 | 2026-03-11 | 85コミット、コンフリクト8件解決、テスト15→73件 |
| 推論UI Phase 1 | 完了 | 2026-03-11 | Live Preview に推論セクション追加 (UC-1: 到達パス) |
| 推論UI Phase 2 | 完了 | 2026-03-12 | UC-3 影響分析 + UC-4 状態キー使用。InferenceBridge 拡張 |
| validate キャッシュ汚染修正 | 完了 | 2026-03-12 | clearSessionCaches() 追加 |
| E2E skip 36件整理 | 完了 | 2026-03-12 | theme-toggle 33件削除、22 passed / 5 skipped |
| Entity/Inventory + C# SDK 統合 | 完了 | 2026-03-13 | hasItem/addItem/removeItem + InferenceRegistry |
| ブランチ統合 (master→main) | 完了 | 2026-03-16 | ローカルを main に切替、origin/main に同期 |
| 推論UI Phase 3 パネル | 完了 | 2026-03-16 | UC-2 到達可能ノード + UC-5 What-if パネルUI |
| グラフエディタ安全化 | 完了 | 2026-03-16 | unsafe render() 全面排除 + minimap ダーク化 |
| 推論UI Phase 3 グラフ視覚統合 | 完了 | 2026-03-17 | T1-T4: パスハイライト(ゴールド) + 到達不能半透明化 + 影響色分け(コーラル) + デバッグクエリUI |
| Entity/Inventory condition-effect-editor UI | 完了 | 2026-03-17 | hasItem/addItem/removeItem ドロップダウン + スキーマ更新 |

## 優先度順タスク一覧

| 優先度 | タスク | 対象 | 難易度 | 見積時間 | 状態 |
|--------|--------|------|--------|----------|------|
| **高** | Entity 定義管理 UI (モデル内 entities の GUI 編集) | web-tester | 中 | 1日 | 進行中 |
| **高** | Yarn Spinner エクスポート実運用検証 | web-tester | 低 | 0.5日 | 未着手 |
| **高** | GUI Undo/Redo の手動回帰テスト | web-tester | 中 | 1日 | 未着手 |
| **中** | チャンクサイズ警告解消 | web-tester | 中 | 1日 | 進行中 |
| **中** | inference/ ディレクトリ方針決定 | engine-ts | 中 | 0.5日 | 未着手 |
| **低** | アクセシビリティ改善（ARIA ラベル等） | web-tester | 低 | 1日 | 未着手 |
| **低** | モバイル/タブレット対応 | web-tester | 高 | 2-3日 | 未着手 |

## タスク詳細

### 高優先度

#### Entity 定義管理 UI

モデル内 `entities` マップの GUI 編集。エンティティの一覧表示・追加・編集・削除。
condition-effect-editor の hasItem/addItem/removeItem は実装済み。残りは定義管理パネル。

**完了条件**: SP-ENTITY-001 の pct を 100% に更新可能な状態

#### Yarn Spinner エクスポート実運用検証

**確認内容**:
- `models/` 配下のサンプルモデルを Yarn 形式に出力
- Yarn Spinner Dialogue System（Unity / Web Previewer）で読み込み確認
- `docs/specs/yarn-spinner-export.md` との仕様整合チェック

#### GUI Undo/Redo 手動回帰テスト

**確認内容** (`docs/GUI_EDITOR_TEST_GUIDE.md` 参照):
- ノード追加/削除/編集の Undo/Redo
- 条件/エフェクト編集の Undo/Redo
- 複数操作後の Redo の一貫性

### 中優先度

#### inference/ ディレクトリの方針

推論UI Phase 3 完了済み。

**選択肢**:
- A. `condition-effect-ops.ts` に forward/backward chaining も統合して `inference/` を削除
- B. `inference/` を維持（API として外部公開）
- C. 別パッケージ（`@narrativegen/engine-inference`）に分離

#### チャンクサイズ警告解消

`build.rollupOptions.output.manualChunks` で分割。vendor-mermaid 1.79MB が主因。

## 進捗指標

- **テスト**: engine-ts 73/73 合格。E2E 22 passed / 5 skipped
- **ビルド**: engine-ts + web-tester ともに成功
- **保守性**: main.js 469行（目標達成）
- **エクスポート形式**: 5形式（CSV / Ink / Twine / JSON / Yarn）
- **仕様書**: 23エントリ (done 18 / partial 4 / legacy 1)

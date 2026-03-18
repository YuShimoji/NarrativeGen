# 今後の開発タスク表

**最終更新**: 2026-03-18

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
| 推論UI Phase 1-3 | 完了 | 2026-03-17 | UC-1〜UC-5 + グラフ視覚統合 (パスハイライト/到達不能半透明化/影響色分け/デバッグクエリUI) |
| validate キャッシュ汚染修正 | 完了 | 2026-03-12 | clearSessionCaches() 追加 |
| E2E skip 36件整理 | 完了 | 2026-03-12 | theme-toggle 33件削除 |
| Entity/Inventory + C# SDK 統合 | 完了 | 2026-03-13 | hasItem/addItem/removeItem + InferenceRegistry |
| ブランチ統合 (master→main) | 完了 | 2026-03-16 | ローカルを main に切替 |
| Entity/Inventory condition-effect-editor UI | 完了 | 2026-03-17 | hasItem/addItem/removeItem ドロップダウン + スキーマ更新 |
| Entity 定義管理 UI | 完了 | 2026-03-17 | コラプシブルパネル、CRUD、インライン編集、11 E2E |
| 原初ビジョン全8スペック | 完了 | 2026-03-17 | SP-PROP-001 ~ SP-DYNAMIC-001 + SP-EVENT-001 |
| Authoring体験逆算スライス | 完了 | 2026-03-17 | Entity定義/Template GUI/Dynamic Textプレビュー/createEvent GUI |
| ConversationTemplate GUI | 完了 | 2026-03-17 | Phase 4完了、テンプレートCRUD + trigger条件編集 + 10 E2E |
| チャンクサイズ最適化 | 完了 | 2026-03-17 | Dynamic import + manual chunking |
| E2E root Vitest衝突解決 | 完了 | 2026-03-17 | test:e2e スクリプト追加 |
| SP-PLAY-001 プレイ没入感 MVP | 進行中 | 2026-03-18 | TransitionRegistry + PlayRenderer + CSS animations + schema拡張。E2E・手動確認残 |

## 優先度順タスク一覧

| 優先度 | タスク | 対象 | 難易度 | 状態 |
|--------|--------|------|--------|------|
| **高** | Unity SDK パリティ (TS側7機能移植) | sdk-unity | 高 | 未着手 |
| **高** | ライター向けオーサリングガイド / サンプルストーリー | docs + models | 中 | 完了 (AUTHORING_GUIDE.md + writer_tutorial.json) |
| **中** | Yarn Spinner エクスポート実運用検証 | web-tester | 低 | 構造検証済み (変数宣言/条件/効果/jump全OK。Dynamic Text構文のYarn変換は未対応 — 将来課題) |
| **中** | GUI Undo/Redo の手動回帰テスト | web-tester | 中 | 未着手 |
| **中** | CI統合 (spec-index/encoding-safety checks) | infra | 低 | 未着手 |
| **中** | [entity~prop_pool] 構文 (DescriptionState統合) | engine-ts | 中 | 完了 (expandTemplateWithTracking + 7テスト) |
| **低** | アクセシビリティ改善（ARIA ラベル等） | web-tester | 低 | 未着手 |
| **低** | モバイル/タブレット対応 | web-tester | 高 | 未着手 |

## タスク詳細

### 高優先度

#### Unity SDK パリティ

TS側の原初ビジョン7機能を C# SDK に移植:
1. Entity-Property System (resolveProperty, getEntityProperties, getInheritanceChain)
2. Dynamic Text Engine (template expansion)
3. Property Anomaly Detection (detectAnomaly)
4. Character Knowledge Model (perceiveEntity)
5. Event Entity Generation (createEventEntity)
6. Description Tracker (markDescribed, isDescribed)
7. Conversation Templates (trigger matching)

**完了条件**: SP-UNITY-001 pct → 100%

#### ライター向けオーサリングガイド

原初ビジョン機能 (Entity-Property, Dynamic Text, ConversationTemplate, Event等) を使った:
- 実用的なサンプルストーリー (models/ に配置)
- ライター向けガイドドキュメント (docs/ に配置)
- Web Tester での操作手順

### 中優先度

#### Yarn Spinner エクスポート実運用検証

- `models/` のサンプルモデルを Yarn 形式に出力
- Yarn Spinner で読込確認
- `docs/specs/yarn-spinner-export.md` との仕様整合チェック

#### [entity~prop_pool] 構文

DescriptionState と Dynamic Text Engine の統合:
- `[entity~prop_pool]` 構文で未描写プロパティから自動選択
- 重複回避テキスト生成

## 進捗指標

- **テスト**: engine-ts 250/250 合格 (20ファイル)。E2E 44件
- **モデル検証**: 14モデル通過
- **ビルド**: engine-ts + web-tester ともに成功
- **エクスポート形式**: 5形式（CSV / Ink / Twine / JSON / Yarn）
- **仕様書**: 32エントリ (done 30 / partial 2)
- **ドキュメント**: AUTHORING_GUIDE.md (ライター向けステップバイステップガイド)

# NarrativeGen プロジェクト全体ステータス

**調査日**: 2026-03-26
**ブランチ**: main (origin/main +4 commits ahead, 未push)
**テスト**: engine-ts 250/250, E2E 57件 (6 spec files), モデル検証 16通過

---

## 1. 実装済み機能

| # | 機能 | 検証方法 | 検証状態 | 仕様ID | 備考 |
|---|------|---------|---------|--------|------|
| F01 | ストーリーエンジンコア (モデル読込/セッション/条件8種/エフェクト7種) | Unit 250件 | 確認済 | SP-ENGINE-001 | |
| F02 | JSON Schema バリデーション (Ajv, 構造+整合性) | Unit + 16モデル検証 | 確認済 | SP-SCHEMA-001 | |
| F03 | 推論エンジン (前方/後方連鎖, プラグインレジストリ) | Unit | 確認済 | SP-INF-001 | |
| F04 | Entity-Property System (階層/継承/resolveProperty) | Unit 19+1件 | 確認済 | SP-PROP-001 | |
| F05 | Dynamic Text Engine ([entity.property], {variable}, {?条件:text}) | Unit 31件 | 確認済 | SP-TEXT-001 | |
| F06 | Paraphrase System (同義語辞書+AIプロバイダ) | Unit | 確認済 | SP-PARA-001 | |
| F07 | Paraphrase Property Matching (ConditionalVariant, UsageHistory) | Unit 13件 | 確認済 | SP-PARA-002 | |
| F08 | Property Anomaly Detection (偏差スコアリング) | Unit 13件 | 確認済 | SP-ANOMALY-001 | |
| F09 | Character Knowledge Model (perceiveEntity) | Unit 7件 | 確認済 | SP-KNOW-001 | |
| F10 | Description Tracker (markDescribed/isDescribed) | Unit 14件 | 確認済 | SP-DESC-001 | |
| F11 | Dynamic Story Expansion (ConversationTemplate, trigger) | Unit 14件 + E2E 10件 | 確認済 | SP-DYNAMIC-001 | |
| F12 | Event Entity Generation (createEvent/hasEvent) | Unit + E2E | 確認済 | SP-EVENT-001 | |
| F13 | Entity/Inventory System (hasItem/addItem/removeItem) | Unit + E2E 11件 | 確認済 | SP-ENTITY-001 | |
| F14 | Variable System (数値型/四則演算/比較条件) | Unit | 確認済 | SP-VAR-001 | |
| F15 | Web Tester: GUI Editor (ノードCRUD/グラフエディタ/Dagre) | E2E + 手動 | 確認済 | SP-001 | |
| F16 | Web Tester: 推論UI (パス/影響/状態キー/What-if/グラフ視覚連携) | E2E + 手動 | 確認済 | SP-INF-UI-001 | |
| F17 | Web Tester: Entity定義パネル (CRUD/インライン編集) | E2E 11件 | 確認済 | SP-ENTITY-001 | |
| F18 | Web Tester: ConversationTemplate GUI (CRUD/trigger条件編集) | E2E 10件 | 確認済 | SP-DYNAMIC-001 | |
| F19 | Web Tester: Play Immersion Phase 1 (段落フェードイン/インライン選択肢/遷移) | E2E 8件 | 確認済 | SP-PLAY-001 | |
| F20 | Web Tester: Play Immersion Phase 2 (シーン画像/BGM) | E2E 5件 | **手動確認未了** | SP-PLAY-001 | pct 95% |
| F21 | エクスポート 5形式 (CSV/Ink/Twine/JSON/Yarn) | verify-export-formatters.mjs | 確認済 | SP-005/SP-EXP-YARN-001 | |
| F22 | Node Hierarchy (グループ/ツリー表示/展開状態) | Unit + E2E | 確認済 | SP-HIE-001 | |
| F23 | Search System (キーワード/同義語/セマンティック) | Unit | 確認済 | SP-SEARCH-001 | |
| F24 | XSS Protection (html-utils中央化) | Unit | 確認済 | SP-XSS-001 | |
| F25 | Mermaid Preview (ズーム/パン) | E2E | 確認済 | SP-003 | |
| F26 | AI Provider (Mock + OpenAI stub) | Unit | 確認済 | SP-006 | |
| F27 | REST API (Express, CRUD, セッション管理) | 手動 | 部分確認 | SP-API-001 | pct 90% |
| F28 | Condition/Effect共通モジュール (condition-effect-ops.ts) | Unit | 確認済 | SP-REFACTOR-001 | |
| F29 | Session History (Undo) | Unit | 確認済 | -- | 仕様書なし |
| F30 | Encoding Safety Check (check:safety) | Script | 確認済 | -- | |
| F31 | Model Sync (sync:models / check:models-sync) | Script | 確認済 | -- | |

## 2. 未確認・手動確認待ち機能

| # | 機能 | 確認手段 | 現状 | 対応優先度 |
|---|------|---------|------|-----------|
| U01 | Play Immersion Phase 2 (画像/BGM操作感) | ブラウザ手動操作 | E2E通過だが手動操作感は未確認 | 高 |
| U02 | REST API 全エンドポイント | Postman / curl | 仕様上pct 90%だが実動作確認記録なし | 低 |
| U03 | Undo/Redo (GUI) | ブラウザ手動操作 | E2E 3件skip (防御的)。手動回帰テスト未実施 | 中 |
| U04 | Graph Editor 操作感 | ブラウザ手動操作 | Visual audit未実施 | 中 |

## 3. 未実装機能

| # | 機能 | 仕様ID | 状態 | 優先度 | 備考 |
|---|------|--------|------|--------|------|
| N01 | Unity SDK: TS側7機能のC#移植 | SP-UNITY-001 (85%) | 未着手 | 高 | Entity-Property/DynamicText/Anomaly/Knowledge/Event/DescTracker/ConvTemplate |
| N02 | Pipeline Workflow (ライターワークフロー全体定義) | SP-PIPE-001 (10%) | ドラフト | 高 | HUMAN_AUTHORITY確認待ち |
| N03 | WritingPage連携 (双方向) | -- | 未着手 | 中 | 仕様策定前 |
| N04 | Dynamic Text Yarn変換 | -- | 未着手 | 中 | |
| N05 | CI統合 (spec-index/encoding-safety) | SP-009残項目 | 未着手 | 中 | |
| N06 | アクセシビリティ (ARIA) | SP-009残項目 | 未着手 | 低 | |
| N07 | モバイル/タブレット対応 | SP-009残項目 | 未着手 | 低 | |

## 4. 懸念事項

| # | 懸念 | 深刻度 | 詳細 | 対応状況 |
|---|------|--------|------|---------|
| C01 | E2Eバッチ間欠失敗 (AC-5 mode toggle) | 低 | CPU競合による。workers=2/timeout=45s/retries=1で緩和済み | mitigated |
| C02 | Packages/ (大文字P) ディレクトリ残存 | 低 | git管理外だがディスク上に存在。CaseSensitive環境でのCI問題リスク | 未対応 |
| C03 | 未push コミット 4件 | 中 | session 12-13の成果が未push | 今回push予定 |
| C04 | Undo/Redo E2E skip 3件 | 低 | 防御的skip。graph表示依存の不安定さを隠蔽している可能性 | 既知 |
| C05 | SP-PIPE-001 方向性未確定 | 高 | ペルソナ定義/WritingPage優先度/エクスポート戦略が未決定 | HUMAN_AUTHORITY待ち |

## 5. レガシー・デッドコード (削除対象)

| # | 対象 | 種別 | 理由 | 対応 |
|---|------|------|------|------|
| L01 | hands-on-testing.md (ルート) | 孤立ドキュメント | 2025年作成の手動テスト手順。E2E 57件+自動テスト250件で陳腐化。`git push origin master`を含む | 削除 |
| L02 | API_ENDPOINTS.md (ルート) | 孤立ドキュメント | 2025-01-26作成。未実装の将来構想API仕様。現実のExpress APIと大きく乖離 | 削除 |
| L03 | API_DEVELOPMENT_WORKFLOW.md (ルート) | 孤立ドキュメント | 2025-01-26作成。存在しないnpmコマンド(validate:spec等)を多数参照。完全に空想 | 削除 |
| L04 | test-ai-features.md (ルート) | 孤立ドキュメント | 手動テスト手順。hands-on-testing.mdと大きく重複。自動テストで代替済み | 削除 |
| L05 | hierarchy-state.test.js | 偽テスト | ブラウザコンソール手動確認用スクリプト。自動テスト環境では動作しない。`.test.js`命名がテストランナーを混乱させる | 削除 |
| L06 | SP-004 (spec-index legacy) | レガシー仕様 | "Design Improvements" legacy (2025-11)。アーカイブ済み仕様の参照をspec-indexに残す意味なし | spec-index.jsonから削除 |
| L07 | docs/troubleshooting.md L214 `git push origin master` | 旧ブランチ参照 | main移行済み(2026-03-16)だが旧参照が残存 | main に修正 |

## 6. 定量指標

| 指標 | 値 |
|------|-----|
| engine-ts Unit テスト | 250 (20ファイル) |
| E2E テスト | 57件 (6 spec files) |
| E2E skip | 3件 (undo-redo 防御的skip) |
| モデル検証 | 16モデル通過 |
| 仕様書 (spec-index) | 32エントリ (done 28 / partial 3 / todo 1) |
| エクスポート形式 | 5 (CSV/Ink/Twine/JSON/Yarn) |
| scripts/ | 8スクリプト (dev-check, encoding-safety x3, doctor, spec-index x2, sync-models) |
| ルート孤立ファイル | 4件 (削除対象) |
| 未push コミット | 4件 |
| ローカルブランチ | 15 (main + 14 feature/fix ブランチ) |

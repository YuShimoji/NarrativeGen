# NarrativeGen

インタラクティブ物語エンジン。TypeScript コアエンジン + Express API + Web Tester + Unity C# SDK のモノレポ構成。

## Key Paths

- Engine (TS): `packages/engine-ts/` (src/, test/, dist/)
- Backend (Express): `packages/backend/` (src/index.ts)
- Web Tester: `apps/web-tester/` (main.js, src/, handlers/, utils/)
- Unity SDK (C#): `packages/sdk-unity/` (Runtime/, Editor/)
- C# Tests: `packages/tests/`
- Model Schema: `models/schema/playthrough.schema.json`
- Example Models: `models/examples/`
- Specs: `docs/specs/`, `docs/spec-index.json`
- Dev Plan: `docs/plans/DEVELOPMENT_PLAN.md`
- Scripts: `scripts/`

## Rules

- Respond in Japanese
- No emoji
- Keep responses concise
- Do NOT read `docs/reports/`, `docs/inbox/` unless explicitly asked

## Commands

- Test (engine): `npm run test:engine`
- Test (all): `npm run test`
- Build (engine): `npm run build:engine`
- Build (all): `npm run build:all`
- Dev server: `npm run dev` (Vite, web-tester)
- Validate models: `npm run validate`
- Encoding safety: `npm run check:safety`
- Doctor: `npm run doctor`

## Spec View

仕様ドキュメントの一覧・ステータス・実装率をブラウザで確認できる。

- データ: `docs/spec-index.json` (Source of Truth)
- 閲覧: `docs/spec-viewer.html` (`npx serve docs` → `http://localhost:3000/spec-viewer.html`)
- 仕様を追加・更新したら spec-index.json も併せて更新すること

## Architecture

### engine-ts

- `index.ts`: Node.js エントリ (fs使用, Ajv schema validation)
- `browser.ts`: ブラウザエントリ (fs不使用, インライン条件評価)
- `session-ops.ts`: メモ化キャッシュ付きセッション操作
- `condition-effect-ops.ts`: 条件評価・エフェクト適用の共通モジュール
- `inference/`: 前方連鎖・後方連鎖推論、条件/エフェクトレジストリ
- `resolver.ts`: ノードIDリゾルバ (グループスコープ対応)
- `ai-provider.ts`: AI テキスト生成 (Mock + OpenAI stub)
- `inventory.ts` / `entities.ts` / `game-session.ts`

### web-tester (apps/web-tester)

- `main.js`: 薄いエントリポイント (~469行)
- `src/app-controller.js`: イベント処理・マネージャー初期化 (~1630行)
- `handlers/`: DI パターンによるUI論理分離 (10モジュール)
- `src/ui/graph-editor/`: SVGビジュアルエディタ (Dagre, minimap)
- `src/features/inference/`: 推論UI (bridge + panel)
- `src/features/export/`: 5形式エクスポート (CSV/Ink/Twine/JSON/Yarn)

### backend

- Express REST API (port 3001), インメモリストレージ

### sdk-unity

- UPM パッケージ形式
- InferenceRegistry: 条件8種 / エフェクト7種 (TS パリティ)
- Session: Flags, Resources, Variables, Inventory, Time

## Decision Log

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-16 | ブランチ統合: ローカルをmaster→mainに切替 | main切替 / masterにマージ / 保留 | origin/mainが正。masterのEntity/Inventory変更は既にcherry-pick済み。337ファイル差分 |
| 2026-03-07 | Ollama (ローカルLLM) プロバイダを完全削除 | A) OpenRouter統合 / B) Ollama改善 / C) 処理 / D) 完全削除 | 精度・リソース費用に難あり。非AIパラフレーズがオフライン対応済み。AIProviderインターフェースは拡張可能なため将来再実装可能 |
| 2026-03-07 | レガシーDoc 7件をdocs/archive/に移動 | 移動 / 保留 | Windsurf AI Collab Rules x3 + ヒント集.md x3 + REPORT_CONFIG.yml。CLAUDE.md更新で不使用。移動スクリプト不在 |
| 2026-03-07 | 旧計画Doc 4件削除。DEVELOPMENT_PLAN.mdで置換 | archive移動 / 部分統合 / 完全削除 | MID_TERM_TASKS, NEXT_PHASE_PROPOSAL, features-status, RESTART_ROADMAPはShared Workflows削除に伴いレガシー化。コード探索ベースの新プランで置換 |
| 2026-03-07 | AIバッチ校閲・全ノード一括AI言い換えを削除 | 含める / 削除 / 保留 | コスト対効果疑問。BatchEditorの検索置換バッチは子続 |
| 2026-03-07 | コラボ機能(バージョン管理/マルチユーザー/共有リンク)を削除 | 部分利用 / 全保留 / 全削除 | スコープ過大。シングルユーザーツールとして運用 |
| 2026-03-07 | 開発優先順: 変数拡張→main.js分離→Yarn Spinner→レスポンシブ/a11y→チャンク最適化 | 複数案 | 機能の基盤(変数)を先行、安定化(main.js)は次点 |
| 2026-03-08 | WritingPage連携は双方向 | GUI中心 / WritingPage埋込 / 独自DSL / ハイブリッド | NarrativeGen→WritingPage、WritingPage→NarrativeGenの双方を想定 |
| 2026-03-08 | 条件/効果設定はライター自身が担当 | ライター自身 / 別者(デザイナー) | 別設計モデルではない。条件/効果エディタのUXが重要 |
| 2026-03-08 | Twine/Inkエクスポーターは継続 | 継続 / Yarn優先 / 削除 | 実用互換出力として子続。Yarn追加は別途 |
| 2026-03-09 | SPEC VIEW実装 (軽量HTMLビューア) | 軽量HTML / Quartz4 / 不要 / 別の方法 | 依存なし・ビルド不要。spec-index.json+spec-viewer.htmlで一覧・進捗確認 |
| 2026-03-08 | main.jsリファクタリング完了 | 継続分割 / 現状維持 | Phase 1-4完了。main.js 2365行→469行。app-controller.js ~1630行、app-editor-events.js ~430行に分離 |
| 2026-03-09 | Yarn Spinner エクスポート実装完了 | 優先順位3タスク | YarnFormatter.js追加。verify-export-formatters.mjsでテスト済み。5形式目のエクスポーターとして登録 |
| 2026-03-09 | 変数システム仕様策定 | 仕様先行 / 実装先行 | docs/specs/variable-system.md作成。数値変数・演算・テキスト展開を定義。実装は次フェーズ |
| 2026-03-09 | spec-viewer.html実装 | ドキュメント形式 | Markdown管理 + WebビューアでF仕様一覧・進捗確認。spec-index.jsonがSource of Truth |
| 2026-03-09 | 変数システム拡張実装 (Priority 1) | 数値変数追加 + 基本四則演算 | VariableState型拡張、modifyVariable効果、数値比較条件(>=, <=, >, <)、UI対応完了。condition-effect-editor.jsで自動判定 |
| 2026-03-09 | evalCondition/applyEffect重複解消 | 共通モジュール化 / 現状維持 / 部分統合 | 3ファイル(session-ops.ts/index.ts/browser.ts)で90行超の重複を`condition-effect-ops.ts`に集約。session-ops.tsのキャッシュ機能は維持 |
| 2026-03-10 | 文字コード安全運用を導入 | アドホック運用 / 安全チェック導入 | `spec-index`破損と文字化け再発を受け、`check:safety` / `check:safety:changed`、運用手順、インシデント記録を追加 |
| 2026-03-10 | Mermaidチャンク分割を更新 | 現状維持 / 遅延読込のみ / 依存分離 | `vendor-mermaid` 1.79MB 警告を分離し、依存と共有レイアウト処理を別チャンク化して状況を可視化 |
| 2026-03-11 | feature/main-js-split-phase2をmainに統合 | マージ / cherry-pick / 保留 | 85コミット分の機能(推論エンジン/階層UI/セマンティック検索/XSS修正/Save-Load/ハンドラー分離)を一括統合。コンフリクト8件解決。テスト15→73件に増加 |
| 2026-03-11 | 推論エンジンUI統合 Phase 1実装 | Live Preview拡張 / 新タブ / グラフ内表示 | Live Previewパネルに折りたたみセクションとして追加。既存UIへの構造変更を最小化。Phase 2-3は別途 |
| 2026-03-12 | 推論UI Phase 2実装 (UC-3/UC-4) | Phase 2先行 / Phase 3先行 / 別タスク | InferenceBridge: findStateKeyUsage/getAllStateKeys追加。InferencePanel: 3セクション構成(到達パス/影響分析/状態キー使用)に全面書き換え。SP-INF-UI-001 75% |
| 2026-03-12 | validateキャッシュ汚染バグ修正 | clearSessionCaches追加 / キーにmodelId含める | session-ops.tsのモジュールレベルMap(choicesCache/conditionCache)がモデル間で汚染。clearSessionCaches()をexportし、validate-models.tsで毎モデル前に呼出 |
| 2026-03-12 | E2E skip 36件整理完了 | 全削除 / 個別判断 / 保留 | theme-toggle 33件(UI未実装)を削除。undo-redo 5件(防御的skip)は正当として残存。22 passed / 5 skipped |
| 2026-03-13 | origin/master統合方針: main正+手動cherry-pick | 直接マージ / cherry-pick / 並行運用 | masterは別セッションでweb-tester構造を巻き戻し(main.js 2371行復活)+推論UI/E2E削除。358ファイル差分で直接マージ不可。mainのweb-tester分離/推論UI/E2Eを維持しつつ、masterのEntity/Inventory統合+C# SDK推論パリティのみ手動取り込み |
| 2026-03-13 | Entity/Inventory + C# SDK InferenceRegistryをmainに手動統合 | 手動 / 延期 | hasItem条件+addItem/removeItemエフェクト+modifyVariable推論登録+EntityDef型+brand→nameリネーム+C# SDK InferenceRegistry(条件8種/エフェクト7種)。73テスト全緑維持 |
| 2026-03-16 | SP-INF-UI-001 Phase 3: グラフ視覚連携プラン承認 (T1-T4全件) | T1-T4全件 / T1-T3のみ / 色変更 / 再検討 | GraphEditorManager.applyInferenceHighlight()方式。パス=ゴールド、影響=コーラル、到達不能=opacity 0.4。デバッグクエリUIも含む |
| 2026-03-17 | Entity-Property基盤着手を決定 | Entity-Property / 動的テキスト構文 / 現行深化 / 中断計画 | 原初ビジョン(ORIGINAL_DESIGN_PHILOSOPHY)との構造的ギャップを特定。現行フラットEntityDefからプロパティ階層・継承・範囲定義へ段階拡張。SP-PROP-001として仕様策定 |
| 2026-03-17 | 原初ビジョンと現行実装の乖離を認識・記録 | N/A | レガシードキュメント分析で5つの高深刻度ギャップを特定 (Entity-Property, 動的テキスト構文, プロパティ比較推論, 事象Entity動的生成, 動的ストーリー展開)。段階的に基盤から積み上げる方針 |
| 2026-03-17 | SP-PARA-002: 言い換え辞書プロパティマッチング拡張 | flat辞書維持 / ConditionalVariant拡張 / AI依存 | ConditionalVariant + match条件 + UsageHistory + buildParaphraseContextで原初ビジョン§4.2を実現。後方互換維持 |
| 2026-03-17 | Runtime Core→Authoring体験逆算へ軸切替 | Authoring逆算 / 手動検証 / Unity SDK / 基盤続行 | 原初ビジョン8スペック完了でエンジンAPIは充実。しかしライターが使えるGUIが追いついていないためAuthoring軸へ。Entity定義パネルbug修正・ConversationTemplate GUI・Dynamic Textプレビュー完了 |
| 2026-03-18 | G4: Model.characters (CharacterDef) をスキーマに追加 | 追加 / 保留 | モデルJSON内でキャラクター知識プロファイルを完結させる。perceiveEntity APIとの接続を可能に。任意フィールドでリスク低 |
| 2026-03-18 | G5: Model.paraphraseLexicon (PropertyAwareLexicon) をスキーマに追加 | 追加 / 保留 | モデルJSON内で言い換え辞書を完結させる。ConditionalVariant+match対応。任意フィールドでリスク低 |
| 2026-03-18 | SP-PLAY-001: テキスト表示は段落フェードイン方式 | タイプライター / 段落フェードイン / 即座表示維持 | 段落単位のstagger表示で読みやすさと没入感を両立。タイプライターより軽量 |
| 2026-03-18 | SP-PLAY-001: 選択肢はストーリー内インライン配置 | インライン / サイドバー維持 / モード切替 | 小説/ゲームブック的な一体感。サイドバーは状態表示のみに |
| 2026-03-18 | SP-PLAY-001: ノード遷移はcrossfade+append-scroll両対応 | crossfadeのみ / append-scrollのみ / 両方切替 | 用途に応じて切替可能にする。拡張可能なTransitionRegistry設計で将来のAnimation追加も受容 |
| 2026-03-18 | SP-PLAY-001: Phase 1はテキスト演出のみ | テキストのみ / 画像含む / 画像+BGM | スコープを絞りプレイ基盤を先に確立。画像/BGMはPhase 2 |
| 2026-03-18 | UI設計はマウス操作主体 (NarrativeGenにも適用) | マウス主体 / キーボード主体 | WritingPageでの決定をNarrativeGenにも適用 |

## Project Context

プロジェクト名: NarrativeGen
環境: Node.js 22 / TypeScript 5.x / Vite 5 / Vitest / Playwright
ブランチ戦略: trunk-based (main のみ)
現フェーズ: 体験逆算 → プレイ品質向上フェーズ
方針: 最終体験からの逆算で基盤能力の空白を埋める
直近の状態 (2026-03-22 session 12):

- main ブランチ、origin/main +3 commits ahead (未push) + ローカル未コミット変更あり
- 250テスト全緑 (20ファイル)、15モデル検証通過、ビルド成功
- E2E: 57件 (Phase 2: 5件新規追加、全パス。バッチ全体 135 passed / 1 flaky)
- 32 specs: done 30 / partial 2 (SP-UNITY-001 85%, SP-PLAY-001 95%)
- Session 12 成果:
  - SP-PLAY-001 Phase 2 実装完了: シーン画像 + BGM (AudioManager)
  - AudioManager: HTMLAudioElement ダブルバッファリング、クロスフェード、autoplay対応
  - PlayRenderer: 画像表示 (テキスト上部)、BGM制御、レンダーキュー追加
  - スキーマ拡張: node.presentation.image/bgm + settings.presentation.defaultBgm/bgmVolume/bgmCrossfadeDuration
  - engine-ts types.ts: NodePresentation/PresentationSettings インターフェース追加
  - media-test.json テストモデル追加
  - PlayRenderer renderNodeキュー機構: トランジション中の操作ロスを防止
- 既知問題:
  - E2Eバッチ実行で間欠的に1件が失敗 (AC-5 mode toggle、CPU競合)
- 次回着手: SP-PLAY-001 手動確認 (ブラウザで画像/BGM操作感検証) → pct 100%化
- 次回着手候補:
  - WritingPage連携仕様策定 (DECISION LOG 2026-03-08 双方向、未仕様)
  - Dynamic Text Yarn変換 (NarrativeGen構文 → Yarn Spinnerネイティブ)
  - Unity SDK パリティ (7機能移植) — 別セッション推奨

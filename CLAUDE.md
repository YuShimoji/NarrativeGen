# NarrativeGen

ナラティブ生成システム。TypeScript / Node.js API バックエンド。

## Key Paths

- Source: `src/`

## Rules

- Respond in Japanese
- No emoji
- Do NOT read `docs/reports/`, `docs/inbox/` unless explicitly asked
- Use Serena's symbolic tools (find_symbol, get_symbols_overview) instead of reading entire source files
- When exploring code, start with get_symbols_overview, then read only the specific symbols needed
- Keep responses concise -- avoid repeating file contents back to the user

## Spec View

仕様ドキュメントの一覧・ステータス・実装率をブラウザで確認できる。

- データ: `docs/spec-index.json` (Source of Truth)
- 閲覧: `docs/spec-viewer.html` (`npx serve docs` → `http://localhost:3000/spec-viewer.html`)
- 仕様を追加・更新したら spec-index.json も併せて更新すること

## Decision Log

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
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

## Project Context

プロジェクト名: NarrativeGen
環境: Node.js 20+ / TypeScript 5.x / Vite 5 / Vitest / Playwright
ブランチ戦略: trunk-based (main のみ)
現フェーズ: 安定化完了 → 機能拡張フェーズ
直近の状態: SSOT Done条件4/4達成。推論UI Phase 2実装完了(影響分析UC-3/状態キー逆引きUC-4)。validateキャッシュ汚染バグ修正。E2E skip整理(33削除、22passed/5skip)。Export全モデル検証(6x4=24チェック)。build/test(73件)/check:safety全通過。Phase 2の手動確認(dev server)が次ステップ。
記録先: 文字コード運用は `docs/plans/DEVELOPMENT_PLAN.md`、インシデント記録は `docs/governance/encoding-safety-incident-2026-03-10.md`、残課題は `docs/TECHNICAL_DEBT.md` で管理。

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
- Keep responses concise — avoid repeating file contents back to the user

## Spec View

仕様ドキュメントの一覧・ステータス・実装率をブラウザで確認できる。

- データ: `docs/spec-index.json` (Source of Truth)
- 閲覧: `docs/spec-viewer.html` (`npx serve docs` → `http://localhost:3000/spec-viewer.html`)
- 仕様を追加・更新したら spec-index.json も併せて更新すること

## Decision Log

| 日付 | 決定事項 | 選択肢 | 決定理由 |
|------|----------|--------|----------|
| 2026-03-07 | Ollama (ローカルLLM) プロバイダを完全削除 | A) OpenRouter統合 / B) Ollama改善 / C) 凍結 / D) 完全削除 | 精度・リソース負荷に難あり。非AIパラフレーズがオフライン対応済み。AIProviderインターフェースは拡張可能なため将来再実装可能 |
| 2026-03-07 | レガシーDoc 7件をdocs/archive/に移動 | 移動 / 保留 | Windsurf AI Collab Rules x3 + ヒント系.md x3 + REPORT_CONFIG.yml。CLAUDE.md体制で不使用、連動スクリプト不在 |
| 2026-03-07 | 旧計画Doc 4件削除、DEVELOPMENT_PLAN.mdで置換 | archive移動 / 部分整理 / 完全削除 | MID_TERM_TASKS, NEXT_PHASE_PROPOSAL, features-status, RESTART_ROADMAPはShared Workflows削除に伴いレガシー化。コード探索ベースの新プランで置換 |
| 2026-03-07 | AIバッチ処理(全ノード一括AI言い換え)を削除 | 含める / 削除 / 保留 | コスト対効果不明。BatchEditorの検索置換バッチは存続 |
| 2026-03-07 | コラボ機能(バージョン管理/マルチユーザー/共有リンク)を削除 | 部分採用 / 全保留 / 全削除 | スコープ過大。シングルユーザーツールとして運用 |
| 2026-03-07 | 開発優先順: 変数拡張→main.js分割→Yarn Spinner→レスポンシブ/a11y→チャンク最適化 | 複数案 | 機能の核(変数)を先行、保守性(main.js)は次点 |
| 2026-03-08 | WritingPage連携は双方向 | GUI中心 / WritingPage埋込 / 独自DSL / ハイブリッド | NarrativeGen→WritingPage、WritingPage→NarrativeGenの両方を想定 |
| 2026-03-08 | 条件/効果設定はライター自身が担当 | ライター自身 / 別担当(デザイナー) | 分業モデルではない。条件/効果エディタのUXが重要 |
| 2026-03-08 | Twine/Inkエクスポーターは維持 | 維持 / Yarn優先 / 削除 | 汎用互換出力として存続。Yarn追加は別途 |
| 2026-03-09 | SPEC VIEW導入 (軽量HTMLビューア) | 軽量HTML / Quartz4 / 不要 / 別の方法 | 依存なし・ビルド不要。spec-index.json+spec-viewer.htmlで一覧・進捗確認 |
| 2026-03-08 | main.jsリファクタリング完了 | 継続分割 / 現状維持 | Phase 1-4完了。main.js 2365行→69行。app-controller.js ~1630行、app-editor-events.js ~430行に分割 |
| 2026-03-09 | Yarn Spinner エクスポート実装完了 | 優先度3タスク | YarnFormatter.js追加、verify-export-formatters.mjsでテスト済み。5形式目のエクスポーターとして登録 |
| 2026-03-09 | 変数システム仕様策定 | 仕様先行 / 実装先行 | docs/specs/variable-system.md作成。数値型変数・演算・テキスト内展開を定義。実装は次フェーズ |
| 2026-03-09 | spec-viewer.html導入 | ドキュメント形式 | Markdown管理 + Webビューアで仕様一覧・進捗確認。spec-index.jsonがSource of Truth |

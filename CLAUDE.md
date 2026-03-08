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

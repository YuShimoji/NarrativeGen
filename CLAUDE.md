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

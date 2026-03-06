# EVERY_SESSION

## Purpose
- このファイルは Orchestrator の運用 SSOT。
- 毎セッションで同じ手順を実行し、状態と次アクションを必ず残す。

## Driver Flow
1. Step A: 状態を読む
- `.cursor/MISSION_LOG.md` を読む。無ければテンプレートから作成。
- `docs/WORKFLOW_STATE_SSOT.md` を読む。無ければ作成。
- `Current Phase / In-progress / Blockers / Next Tasks` を抽出。
- `Next Action` が空、または同一準備が2回続いた場合は `Next Action` を1つに再定義。

2. Step B: モジュールを読む
- `prompts/orchestrator/modules/00_core.md`（必須）。
- `Current Phase` に対応するモジュールを1つ読む。
- モジュールが欠落している場合は欠落を記録し、フォールバック方針で継続する。

3. Step C: 実行して更新する
- 現フェーズの作業を実行する。
- `.cursor/MISSION_LOG.md` を更新する。
- `docs/WORKFLOW_STATE_SSOT.md` を更新する。
- 出力は `data/presentation.json` の固定5セクションに従う。

## Stop Rules
- 途中停止でも次を必須とする。
- MISSION_LOG 更新
- 停止理由の記録
- 次の選択肢提示

## Worker Delegation
- 実装は Worker に委譲する。
- Orchestrator は分割、統制、統合漏れ防止に集中する。

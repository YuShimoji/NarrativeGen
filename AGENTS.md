# AGENTS.md

Primary thin adapter for AI coding tools. Do not store project state, decision logs, output style, or workflow mandates here.

## Read Order

1. `HANDOVER.md`
2. `README.md`
3. `docs/ai/*.md` when task touches agent workflow or decision gates
4. `docs/spec-index.json` and the relevant spec files when behavior changes

## Adapter Rules

- Current state and next work belong in `HANDOVER.md`, not in agent-entry files.
- Project facts belong in visible docs such as `README.md`, `docs/spec-index.json`, and `docs/governance/decision-log.md`.
- Do not recreate hidden session-state, restart-roadmap, or output-style rule files.
- Read-only phases stay read-only.
- Selection of a proposed item is not implementation approval.
- Human-owned creative/manual work does not become assistant-owned by default.

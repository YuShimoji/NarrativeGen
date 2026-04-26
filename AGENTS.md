# AGENTS.md

Codex adapter. Keep thin.

## Normal Resume

Read `HANDOVER.md` first. It is the single restart entrypoint and points to the current state, next work, commands, and supporting docs.

## Rules

- Shared AI behavior rules live in `docs/ai/*.md`.
- Project memory lives in `docs/INVARIANTS.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/OPERATOR_WORKFLOW.md`, and `docs/INTERACTION_NOTES.md`.
- Specification status lives in `docs/spec-index.json`.
- Long-term decisions live in `docs/governance/decision-log.md`.
- Do not recreate session-state or restart-roadmap files; use `HANDOVER.md` for current handoff state.
- Read-only phases stay read-only.
- Selection of a proposed item is not implementation approval.
- Human-owned creative/manual work does not become assistant-owned by default.

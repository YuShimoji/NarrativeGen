# AGENTS.md - NarrativeGen entry pointer

This file is only a repo entry pointer. Do not grow it into an operations
manual, status snapshot, closeout template, roadmap, or handoff log.

## Read Order

1. `docs/REPO_LOCAL_RULES.md`
2. `HANDOVER.md`
3. `README.md` when project overview or commands are needed
4. `docs/spec-index.json` and relevant spec files when behavior changes
5. `docs/ai/*.md` only when the task touches agent workflow or decision gates

If a referenced file is missing, treat that reference as stale and continue
with the nearest available project doc.

## Authority

- User and developer instructions override this file.
- Repo-local docs override global Codex fallback rules and global prompt helpers.
- `docs/REPO_LOCAL_RULES.md` owns restart budget, core behavior, ask hygiene,
  reporting intent, and git/test follow-through.
- `HANDOVER.md` owns current state and next work.
- `docs/spec-index.json` owns feature/spec lifecycle state.
- `docs/INVARIANTS.md` owns non-negotiable product boundaries.

## Anti-Growth Rule

Do not add detailed procedures, work history, report formats, option menus,
feature status, or temporary plans to this file.

Put changes in the narrow owner instead:

- Rules / ask / reporting behavior: `docs/REPO_LOCAL_RULES.md` or
  `docs/INTERACTION_NOTES.md`
- Current state / next action: `HANDOVER.md`
- Roadmap: `docs/plans/DEVELOPMENT_PLAN.md`
- Decisions / handoff history: `docs/governance/decision-log.md`
- Feature and spec status: `docs/spec-index.json`

Global files under `C:\Users\thank\.codex\` are fallback helpers, not
NarrativeGen authority.

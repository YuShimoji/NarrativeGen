# Decision Log

NarrativeGen durable decisions remain in `docs/governance/decision-log.md`. This Project Capsule file records only re-kickstart loop decisions introduced by the 2026-07-09 kit.

## 2026-07-10: Adopt material-evidence-first restart loop for Project Capsule

Decision:

- BUILD turns cannot complete with analysis, planning, research, or documentation only.
- Each BUILD turn must produce material evidence.
- Existing NarrativeGen authority docs stay in force; Project Capsule files point to them instead of replacing them.

Reason:

- The re-kickstart kit requires validation, artifact, screenshot, implementation, or probe evidence before completion.
- NarrativeGen already has strong repo-local docs, so overwriting `AGENTS.md`, `HANDOVER.md`, or the roadmap would reduce clarity.

Rejected alternatives:

- Overwrite repo-local `AGENTS.md` with the generic kit entry pointer.
- Treat `docs/RUNTIME_STATE.md` as replacing `HANDOVER.md`.
- Add untracked Unity residue during an unrelated re-kickstart.

Evidence:

- `npm run build:engine` passed and logged to `artifacts/review/re-kickstart-build-engine-2026-07-10.log`.

Reversal condition:

- If the user decides Project Capsule should become the main authority chain, update `AGENTS.md`, `docs/REPO_LOCAL_RULES.md`, and `HANDOVER.md` explicitly in a separate docs-governance slice.

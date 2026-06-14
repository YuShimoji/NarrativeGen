# WORKFLOWS_AND_PHASES.md
Ruleset-Version: v20
Status: canonical

## Recommended read budget on resume / continue / refresh

Normal restart read budget is owned by `docs/REPO_LOCAL_RULES.md`. `docs/ai` is not a default full-corpus read; use only the relevant gate / workflow section when needed.

1. `HANDOVER.md`
2. `docs/spec-index.json` or `docs/spec-viewer.html` when spec status matters
3. `docs/plans/DEVELOPMENT_PLAN.md` when roadmap priority matters
4. The relevant section of `docs/INVARIANTS.md`, `docs/USER_REQUEST_LEDGER.md`, `docs/OPERATOR_WORKFLOW.md`, or `docs/INTERACTION_NOTES.md` only when the task needs durable project memory

## Resume / Continue / Refresh
### Resume
Recover project-local canonical context first, then identify the active artifact and bottleneck. If a prompt file, chat summary, or handoff note disagrees with `HANDOVER.md`, `docs/spec-index.json`, or `docs/governance/decision-log.md`, trust the repo docs.

### Continue
Do not rely on momentum. Re-check whether the current block still matches the bottleneck, actor, and value path.

### Refresh / Reanchor / Scan
These are read-only only when the user explicitly declares that phase in the current block. Do not self-trigger read-only mode by interpretation. In a declared read-only block, avoid writes unless the user explicitly asks for mutation.
Do not auto-fill newly initialized project docs and commit them as “refresh work”.
Initialization may be prepared, but long-lived writes belong to an explicit write block.

## Prompt hygiene
- Resume prompts and chat summaries are convenience entrypoints, not canonical state stores.
- Prompts must avoid embedding stale backlog status or outdated next steps when those belong in project docs.
- When a prompt and repo docs differ, update the prompt or ignore it; do not override repo docs with prompt text.

## Task-scout requirements
A scout pass should include, when relevant:
- active artifact and bottleneck
- stale evidence / visual evidence freshness
- user-carried constraints
- re-ask risk
- canonical coverage
- value path risk
- bottleneck substitution risk
- actor risk

## Manual verification pattern
- Put verification items in normal text, not inside the ask field.
- Before using a short result code, state the task connection floor: what to open, what to create/modify, the source object, the actor, the owner artifact, and what the result code means.
- Before asking the user to place or create artifacts, list the exact required files, conditional files, target paths, and returned JSON/text. Generic words such as "materials", "inputs", or "artifacts" are not enough unless expanded immediately.
- Use `OK / NG` or `PASS / FAIL` only after that floor is explicit.
- Ask for next direction separately.

## Option generation
Each major option should show:
- lane (`Advance`, `Audit`, `Excise`, `Unlock` or another justified lane)
- actor
- owner artifact
- bottleneck addressed
- what becomes possible if done

Avoid options whose main meaning is merely commit / not commit / cleanup only / end.

## Workflow-proof examples
Good workflow-proof tasks:
- validate that the human-authoring path runs once end-to-end
- confirm the operator can use the designed toolchain without improvising new steps
- move a verification target into a debug harness instead of using main content as the experiment bed

## Interaction safety
Do not compress unrelated intents into one ask.
Do not use markdown tables in a short ask field.
Do not present broad re-explanation prompts when canonical context already exists.
Do not recreate session-state, runtime-state, restart-roadmap, output-style, or context-cache files. Current state belongs in `HANDOVER.md`.

## Commit and push hygiene
Commit/push are follow-through actions after a justified block, not substitutes for strategy. Do not present "commit or not" as the main next-direction option.

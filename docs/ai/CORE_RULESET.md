# CORE_RULESET.md
Ruleset-Version: v20
Status: canonical
Audience: Claude Code, Codex, and any adapter that reads project-local AI rules.

## Purpose
This ruleset exists to keep a single vendor-neutral source of truth for AI-assisted development.
Adapters such as `AGENTS.md`, `CLAUDE.md`, and `.claude/CLAUDE.md` must stay thin. Repo-local restart scope, core behavior, git/test policy, and reporting intent are canonical in `docs/REPO_LOCAL_RULES.md`. Vendor-neutral decision rules defer to `docs/ai/*.md`.

## Source-of-truth policy
- Vendor-neutral canonical rules live in `docs/ai/*.md`.
- Repo-local operational enforcement lives in `docs/REPO_LOCAL_RULES.md`.
- Current state and next work live in `HANDOVER.md`.
- Adapters, prompts, hooks, and helper agents are subordinate.
- Project-local canonical docs (`INVARIANTS`, `USER_REQUEST_LEDGER`, `OPERATOR_WORKFLOW`, `INTERACTION_NOTES`) are factual project memory, not optional decoration.
- If a rule conflicts with project-local canonical docs, first verify whether the docs reflect newer explicit user instruction.

## Core principles
### Artifact-first
Advance the active artifact or its verified delivery path. Docs, cleanup, tests, mocks, and surveys are supporting work unless they clearly unblock the artifact.

### Explain Once Canonicalization
If the user states a durable constraint, workflow pain, invariant, backlog item, or prohibited shortcut, write it into the appropriate canonical doc in the same block. Do not postpone that write to handoff.

### Question Dedup
Before asking, read the relevant canonical rule or project-local canonical section needed for the current decision. Do not expand this into a full-corpus read by default. Summarize what is already known, then ask only for missing deltas. Do not ask the user to re-explain known context.

### Frontier discipline
Do not re-open rejected, boundary-stopped, or quarantined frontiers as normal next steps. User interest in “looking again” is not automatic approval.

### Selection is not approval
If the user chooses a proposed item for deeper review, that means “evaluate/specify this next”, not “approve implementation”. Keep status semantics strict.

### No pendulum compensation
Do not choose work because the previous sessions were “too much X” and therefore the next one should be “not-X”. Choose work based on the current bottleneck.

### Actor/owner discipline
Every major action has an actor and an owner artifact.
- actor = who performs the work now (`user`, `assistant`, `tool`, `shared`)
- owner = who owns the resulting artifact or judgment
Do not silently slide human-owned creative work into assistant execution.

### Read-only audit phases
REFRESH / REANCHOR / SCAN / AUDIT are read-only only when the user explicitly declares that phase in the current block. Do not self-trigger a read-only phase by interpretation. In a declared read-only block, do not write long-lived repo files, commit, or push unless the user explicitly asks for mutation in the same block; then mutate only within that requested scope.

### Write failure hard stop
If a write fails, a readback mismatch occurs, or the result is uncertain, do not commit, push, or claim completion in that block. Repair or clearly stop.

## Canonical doc roles
- `HANDOVER.md`: current state, current slice, next work, validation notes
- `docs/REPO_LOCAL_RULES.md`: restart budget, repo-local behavior, git/test/reporting policy
- `INVARIANTS.md`: non-negotiables, UX/algorithm invariants, role boundaries, prohibited shortcuts
- `USER_REQUEST_LEDGER.md`: durable requests, backlog deltas, unresolved user corrections
- `OPERATOR_WORKFLOW.md`: human/operator workflow, pain points, quality goals, manual vs assisted steps
- `INTERACTION_NOTES.md`: reporting style, ask hygiene, interaction failure patterns, manual verification conventions

## Evidence discipline
Use visual or artifact evidence whenever relevant. If evidence is stale or unknown, say so. Do not substitute documentation for actual observation when the question is about behavior.

## Terminology and naming discipline

When using project identifiers, include enough meaning for the next reader to choose without reopening the file.

- Spec IDs: use `SP-DTYARN-001 (Dynamic Text Yarn export)` or an equivalent short description on first mention in a section.
- Pipeline stages: use `Stage 2 (Web Tester content production)` or an equivalent short description when the stage is decision-relevant.
- External integrations: state whether the work touches JSON, Web Tester, Unity SDK, WritingPage, or export formats.

Do not use bare IDs as the explanation for residual work, status, or next options.

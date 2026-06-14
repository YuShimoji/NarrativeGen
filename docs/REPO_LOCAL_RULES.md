# REPO_LOCAL_RULES.md - repo-local operating rules

NarrativeGen の通常再開で読む短い front-door。ここには毎回効く行動ルールだけを置く。事故履歴、報告テンプレート、個別スライスの手順、status snapshot は置かない。

詳細の置き場:

- 現在位置 / next action: `HANDOVER.md`
- プロジェクト概要 / コマンド: `README.md`
- 仕様と lifecycle state: `docs/spec-index.json`
- 非交渉の product boundary: `docs/INVARIANTS.md`
- 継続要求 / backlog delta: `docs/USER_REQUEST_LEDGER.md`
- human/operator workflow: `docs/OPERATOR_WORKFLOW.md`
- 対話・報告 failure class: `docs/INTERACTION_NOTES.md`
- 決定履歴: `docs/governance/decision-log.md`
- ロードマップ: `docs/plans/DEVELOPMENT_PLAN.md`

## Restart Read Budget

通常再開で読むのは次の 3 点まで。

1. `AGENTS.md`
2. `docs/REPO_LOCAL_RULES.md`
3. `HANDOVER.md`

追加で読むのは、今の作業を進める根拠が不足している場合だけ。読む範囲は該当節・該当 ID・該当 artifact に限定し、全文読了を progress にしない。

## Core Rules

- Repo-local authority comes first. Global Codex files and prompt helpers are fallback only.
- `AGENTS.md` is an entry pointer. Do not add procedures, status, roadmaps, report formats, option menus, or history there.
- Current state and next work belong in `HANDOVER.md`. Do not create session-state, runtime-state, restart-roadmap, output-style, or context-cache files.
- For development slices, default to Playable first, then green. Tests, lint, schema, CI, doctor, and refactors are guards for the story-making/playback experience, not the primary progress signal.
- If a referenced file is missing, treat that reference as stale, not as a blocker.
- Stay inside this repo unless the user explicitly names a cross-project scope. If cross-project scope is explicit, touch only that scope.
- Selection of a proposed item means evaluate or specify it next. It is not implementation approval.
- Human-owned creative/manual work does not become assistant-owned by default.
- Read-only phases are read-only only when the user explicitly declares that phase in the current block. If the user asks for mutation in the same block, mutate only within that requested scope.
- Do not ask broad questions when repo evidence can decide the next move. If a question is necessary, ask only the decision that changes the bottleneck.

## Git And Tests

- Git follow-through is assistant-owned after a validated implementation or docs slice unless the user forbids it. Stop before destructive operations, pushed-history rewrites, ambiguous large deletions, cross-repo publication, or any explicitly prohibited action.
- Commit/push are follow-through actions, not primary next-direction choices.
- For docs-only or agent-instruction edits, run `git diff --check` and targeted readback. Do not run the full test suite unless an executable contract changed.
- For `packages/`, `apps/`, `scripts/`, or CLI/API contract changes, run the narrow relevant check first, then widen only when the blast radius justifies it.
- Use current command output for test counts, branch state, and sync state. Do not copy old numbers from docs into reports as live facts.

## Reporting Rule

Reports should make the work usable without forcing the user to open files. State what changed, why it matters, what remains uncertain, and what the next concrete move is.

Do not emit fixed closeout labels such as `summary`, `evidence`, `risk`, `next owner`, `assistant status`, or `assistant next` unless the user asks for that structure. Those concepts are internal checks, not output fields.

When listing residual work, include each item's purpose, effect, requirements, state, owner, and next move. Avoid path lists or test names as the explanation.

If the next step requires user input, include the executable details in normal language: exact path or artifact, required versus optional inputs, success signal, what to return on failure, and what the assistant will verify after receiving it.

## Ask Hygiene

- Ask only high-level decisions with real tradeoffs.
- Offer 2-4 options only when they solve different bottlenecks.
- Do not include unrelated repos, memories, or tools as options unless the user made that scope explicit.
- When corrected, verify the claim against repo evidence, then proceed with the smallest safe fix in the same block.

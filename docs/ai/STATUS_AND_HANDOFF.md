# STATUS_AND_HANDOFF.md
Ruleset-Version: v20
Status: canonical

## Scope and usage
This file is a **supplementary rubric** for AI-oriented handoff quality checks.
Use it when updating `docs/ai/*` canonical docs or when reviewing handoff/report quality.
For normal development resume, prioritize `docs/REPO_LOCAL_RULES.md`, `HANDOVER.md`, and `docs/spec-index.json`. Use `docs/project-status.md` as a supporting status reference, not the restart authority.

## Feature status semantics
Keep priority separate from status.

### Priority
Priority answers: “How worth looking at is this item compared with others?”
Examples: high / medium / low, or a ranked list.

### Status
Status answers: “What lifecycle state is this item in now?”
Use these meanings strictly:
- `proposed`: value is still being validated or the spec is incomplete
- `approved`: specification and scope are defined enough for implementation to start, and the user has approved that move
- `hold`: not rejected, but not the current move due to prerequisites, weak value path, timing, or other blockers
- `rejected`: should not be pursued within the current product/workflow scope
- `quarantined`: potentially contaminated or unauthorized batch-derived item; do not treat as a normal candidate until re-reviewed

Selection of a `proposed` item for deeper review does **not** upgrade it to `approved`.

## Feature and backlog status discipline
Use `docs/spec-index.json` for specification lifecycle state and `docs/USER_REQUEST_LEDGER.md` for durable user requests or backlog deltas. Do not create a separate feature registry unless the user explicitly asks for one.

For each feature candidate that is tracked in a surviving doc, keep at least:
- short description
- priority
- status
- rationale
- integration point / value path note
- actor / owner note when relevant

`approved` requires all of the following:
- clear input/output or scope boundary
- no unresolved boundary violation
- value path is stated
- user approval for implementation is explicit

If an unauthorized item appears in a proposal batch, quarantine the whole batch by default until individually re-reviewed.

## Canonical context fields to surface in reports
Use these report fields whenever relevant:
- Non-Negotiables
- Reused Canonical Context
- New Fossils
- Backlog Delta
- Current Trust Assessment

## Current Trust Assessment
When a thread has become noisy or risky, classify changes into:
- trusted
- needs re-check
- dangerous / rollback candidate
State why.

## Handoff minimum
A robust handoff should preserve:
- shared focus
- non-negotiables
- current trust assessment
- active artifact and bottleneck
- recovered canonical context
- feature/backlog status with strict semantics
- safe next-thread plan
- what not to do next
- new fossils created in the current thread

## No progress laundering
Do not claim progress merely because:
- a doc was created during refresh
- a framework-compliant report was produced
- a list of changed files was shown
- a low-friction helper feature was specified
Report what became easier, safer, or more real for the actual artifact path.

## Closeout chain minimum

Final responses should not merely summarize activity; they should make the next move executable.

Do not force fixed section names or emit internal labels unless the user asks for that structure. Preserve the logical chain in normal language: what is complete, what was deliberately not changed, what changed for the workflow or decision space, what evidence supports it, what uncertainty remains, who moves next, and what happens after any return from the user.

File paths, line numbers, commits, and test names are evidence, not explanation. Put the user-readable meaning first, then cite files as support.

If the next blocker depends on operator input, explain why work is waiting and what can still run in parallel. A response that ends with only "please check" or "continue from here" is incomplete unless the exact required input and follow-up work are already clear.

## Residual work contract

When reporting residual work, give each item enough context to act:

- purpose
- effect
- requirements
- current state
- owner
- next move

Avoid `P0/P1`, path lists, or test names as the explanation.

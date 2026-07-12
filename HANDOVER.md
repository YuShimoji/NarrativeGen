# 作業申し送り

## 現在地 — 2026-07-13

`main` / `origin/main` が開発正本。G2 closeout 監査の開始時は `31b108b`、`HEAD...origin/main = 0 0`。`git fetch --prune origin` は成功したが、`character-knowledge.ts` と `types.ts` に同じ G2 の partial tracked diff が既にあったため pull は行わず、その差分を保全・監査して完成させた。既知の untracked Unity harness (`Assets/`, `ProjectSettings/`, `packages/manifest.json`, `packages/packages-lock.json`, generated `.meta`) は変更・stage・削除せず保全している。

User は 2026-07-12 に G1 Contract A と public / diagnostic / fixture / spec defaults を承認した。現在の slice は G2 `SP-KNOW-002: Knowledge-Derived Choice Availability`。別 fixture `procedural-choice-spine-probe.json` で reusable pure rule が `follow_semantic_change` を直接開き、availability 中に SessionState を変更せず、knowledge-derived `event_mira_perceives_receipt_contradiction` を作らない。現行 `originality-spine-probe.json` は SP-KNOW-001 の node-triggered persistent-event baseline として挙動を変えずに保持した。

Schema、engine、inference、model-aware cache、fixture、既存 Designer Dashboard 内の日本語優先診断、Story boundary、tests、readback、canonical docs は local acceptance を通過した。SP-KNOW-002 は commit-associated CI を待つ間だけ `partial / 95`。CI が成功した closeout で `done / 100` にする。

## G2 delivery snapshot

| 観点 | 現在の正本状態 |
|---|---|
| 位相 / lane / slice | `VERIFY` / ORIGINALITY_POLICY / G2 procedural-choice vertical slice |
| normative owner | `docs/specs/knowledge-derived-choice-availability.md` (SP-KNOW-002) |
| model surface | optional `knowledgeRules`; canonical dictionary key; character/entity/domain/non-empty numeric expectations |
| condition | `{ type: "knowledgeRule", rule: "<id>", result: "noticed" }`; recursive `not` handles not-noticed |
| public evaluator | `evaluateKnowledgeRule(session, model, ruleId): KnowledgeEvaluationFact`; Node/browser exports; `getAvailableChoices(): Choice[]` unchanged |
| purity | repeated facts / choices deterministic; serialized SessionState identical; zero knowledge-derived event mutation |
| missing / fallback | exact then `general`; six stable fail-closed reasons; one invalid expected property fails the whole rule |
| cache | model identity plus rule/character/entity/current-node semantics; model switch and in-place edit tests pass |
| inference | registry uses the same evaluator; missing model/session context fails closed; capability reports `knowledgeRule` |
| fixed route | `desk -> ask_mira_reframe -> memory_reframed -> follow_semantic_change -> semantic_end` |
| event boundary | authored `event_mira_reframes_receipt` remains; `event_mira_perceives_receipt_contradiction` is absent |
| review evidence | `docs/samples/procedural-choice-spine-probe-readback.json` and `procedural-choice-spine-probe-review-ja.md` |

## Local evidence

- Focused engine: 5 files / 83 tests passed (evaluator, malformed/prototype guards, recursive not, nested integrity, inference parity, cache invalidation, both probes).
- Full engine regression: 27 files / 335 tests passed。
- Canonical model validation: 18 JSON models passed, including the new probe.
- Web formatter smoke: 72 checks across 18 models x 4 formatters passed.
- Playwright: current originality + procedural-choice specs, Chromium / Firefox / WebKit, final exact rerun 12/12 passed。最初の run が発見した disposed crossfade の旧 DOM 再追加 race は PlayRenderer の transition cancellation で修復した。
- Engine build、TypeScript no-emit check、engine lint、Web Tester build passed。Web build retained known `fs` externalization / large-chunk warnings only。
- `check:safety`: 37 spec entries、docs authority 4/4、92 Markdown filenames、328 text files、19 synced model files passed。

These counts are this slice's current command output, not evergreen project totals. Final Git/CI state must be read from Git and the commit-associated workflow run.

## Authority and deferred boundaries

- SP-KNOW-001 remains `done`: node-triggered PerceptionPolicy creates a persistent event.
- SP-KNOW-002 owns pure choice availability only. Contract B event lifecycle is not implemented.
- JSON is the full-fidelity path. Yarn / other non-JSON exporters do not gain knowledgeRule parity from this slice.
- Current inference dependency graph records session-key dependencies only; model-only rule/character/entity What-if provenance remains future work.
- Unity/C# implementation、Unity Editor visual acceptance、Choice Consequence Lens、broad UI redesign、Story creative rewrite、WritingPage、provider/API/auth/payment、dependency/security/toolchain upgrades、publication are outside G2.
- G0 human story/Japanese/GUI review remains user-owned and is not completed by automated evidence.

## Residual work

- **G2 CI closeout**: purpose is to confirm the pushed implementation in repository CI and make SP-KNOW-002 lifecycle honest. Effect is a committed/pushed `done / 100` spec with final parity. Requirement is the exact commit-associated `CI` run. State is active pending first push; owner is development AI. Next move is explicit-path commit/push, watch CI, then a transparent lifecycle closeout commit if green.
- **G0 human originality review**: purpose is to separate machine correctness from story/Japanese/GUI usefulness. Effect is a human pass or concrete defects for both SP-KNOW-001 routes and the Dashboard. Requirement is local Web Tester review; state is pending; owner is user. Next move is the existing v0 review flow, independent of G2 CI.
- **G3 direction evidence**: purpose is to make deterministic engine facts understandable as “why available / what changes / what opens.” Effect is one selected read-only Choice Consequence Lens macro direction. Requirements are stable SP-KNOW-002 facts and three materially different same-content directions; state is proposed, not authorized for implementation; owner is shared with user direction. Next move is a separate EXPLORE packet after G2 closeout.
- **G5 Unity parity**: purpose is cross-runtime semantics. Effect is equivalent C# model/evaluator/condition behavior without persistent-event drift. Requirement is separate Unity `IMPLEMENT` authority and later Editor review; state is hold; owner is shared. Do not start from this handoff.
- **Release/security debt**: purpose is reproducible supported consumption. Effect is pinned toolchain, approved audit treatment, backend/Web lint gates. Requirements include human-approved dependency/toolchain scope; state is unchanged non-blocking debt; owner is shared. Do not mix it into G2.

## 次の異なる入口

| 入口 | 状態 | 次の動き |
|---|---|---|
| **Close — G2 CI** | active、development AI owned | exact implementation pathsをcommit/pushし、commit SHAの `CI` をwatch。green後にSP-KNOW-002/index/roadmap/HANDOVERをdoneへ閉じる |
| **Verify — G0 human baseline** | pending、user owned | `npm run dev` で existing originality probe の両routeとDashboardを一括目視し、passまたは具体的defectを返す |
| **Explore — G3 Choice Consequence Lens** | proposed、G2 closeout後 | same deterministic factsを使う3方向のread-only evidenceだけを比較し、userがmacro directionを選ぶ |
| **Implement — G5 Unity parity** | hold、authorityなし | separate packetなしに開始しない |

## 再開

通常は `AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書を読む。G2 closeout中だけ SP-KNOW-002、readback、spec index、roadmapを追加確認する。

```powershell
git fetch --prune origin
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
npm run check:safety
```

Safe next command before the first implementation push is `git diff --check`。push後は latest run ではなく exact commit SHA で `CI` workflowを特定する。

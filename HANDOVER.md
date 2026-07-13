# 作業申し送り

## 現在地 — 2026-07-13

`main` / `origin/main` が開発正本。2026-07-13 の再開整備で `git fetch --prune origin` と `git pull --ff-only origin main` を実行し、ローカルを `be5e874` から `6cce1ac` (`chore: preserve Unity restart context`) へ fast-forward した。同期後の `HEAD...origin/main = 0 0` を確認済み。従来ローカルだけにあった Unity harness (`Assets/`, `ProjectSettings/`, `packages/manifest.json`, `packages/packages-lock.json`, generated `.meta`) は、別端末で同じ Unity project を復元できるよう tracked context に移った。Unity cache (`Library/`, `Logs/`, `UserSettings/` など) は引き続き除外する。この harness の履歴化は G5 Unity parity の実装開始を意味しない。

User は 2026-07-12 に G1 Contract A と public / diagnostic / fixture / spec defaults を承認した。G2 `SP-KNOW-002: Knowledge-Derived Choice Availability` は 2026-07-13 に完了。別 fixture `procedural-choice-spine-probe.json` で reusable pure rule が `follow_semantic_change` を直接開き、availability 中に SessionState を変更せず、knowledge-derived `event_mira_perceives_receipt_contradiction` を作らない。現行 `originality-spine-probe.json` は SP-KNOW-001 の node-triggered persistent-event baseline として挙動を変えずに保持した。

Schema、engine、inference、model-aware cache、fixture、既存 Designer Dashboard 内の日本語優先診断、Story boundary、tests、readback、canonical docs は local acceptance を通過した。implementation commit `a32d024` に紐づく CI run `29204576238` も governance / web-tester / engine-ts / sdk-unity の4 jobすべて成功し、SP-KNOW-002 は `done / 100`。

## 監修AIへの現状報告

現在のローカルは、リモート正本の取得、lockfile 準拠の依存復元、構造診断、安全検査、TypeScript/Web の回帰検証とビルド、Unity SDK の .NET テストまで完了しており、次の承認済み slice を開始できる。今回の作業は環境再開と現状確認であり、G3 の方向決定、G5 の実装、依存更新のいずれも新たに承認されたとは扱わない。

| 監修時の判断対象 | 現在確認できていること | workflow 上の意味 |
|---|---|---|
| 正本との一致 | `6cce1ac` まで fast-forward、`HEAD...origin/main = 0 0` | 古い前提や未取得差分を抱えず次の packet を評価できる |
| 開発再開性 | `npm ci` 成功、doctor 25/25、Node 22.19.0 / npm 10.9.3 / .NET SDK 9.0.304 | 現行 README 要件を満たし、ローカルで編集・検証を継続できる |
| 実行契約 | `npm run check` 成功、engine 335 tests、formatter 72 checks、18 models、両 build、Unity 32 tests が成功 | SP-KNOW-002 完了状態を壊さず、後続 slice の基準点にできる |
| 未解消の品質債務 | Web Tester lint は未設定、Vite の `fs` externalization / large chunk、C# nullable/XML doc 警告、`npm ci` は 43 vulnerabilities を報告 | 開発停止要因ではないが、release/toolchain 専用 slice で扱う。自動 upgrade は行わない |
| 次工程の権限 | G0 は user review、G3 は EXPLORE、G5 と dependency/toolchain は未承認 | 監修AIは異なる bottleneck を一つ選び、目的の異なる作業を混在させない |

## G2 delivery snapshot

| 観点 | 現在の正本状態 |
|---|---|
| 位相 / lane / slice | `CLOSE` / ORIGINALITY_POLICY / G2 procedural-choice vertical slice done |
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
- Transition repair の widened check は、明示的に保持した Vite server に対する Chromium Play Immersion 8/8 が passed。process-managed の全ブラウザ run は assertion failure ではなく、途中で Vite server が終了して connection refused になったため、E2E server lifecycle / runbook debt として残す。
- Engine build、engine lint、Web Tester build passed。Web build retained known `fs` externalization / large-chunk warnings only。
- `check:safety`: 37 spec entries、docs authority 4/4、92 Markdown filenames、328 text files、19 synced model files passed。
- Spec lifecycle after G2 closeout: 37 total / 33 done / 4 partial。

These counts are this slice's command output, not evergreen project totals。再開時の最新 Git parity は Git から読み、G2 implementation CI evidence は上記 immutable commit/run を参照する。

## Authority and deferred boundaries

- SP-KNOW-001 remains `done`: node-triggered PerceptionPolicy creates a persistent event.
- SP-KNOW-002 owns pure choice availability only. Contract B event lifecycle is not implemented.
- JSON is the full-fidelity path. Yarn / other non-JSON exporters do not gain knowledgeRule parity from this slice.
- Current inference dependency graph records session-key dependencies only; model-only rule/character/entity What-if provenance remains future work.
- Unity/C# implementation、Unity Editor visual acceptance、Choice Consequence Lens、broad UI redesign、Story creative rewrite、WritingPage、provider/API/auth/payment、dependency/security/toolchain upgrades、publication are outside G2.
- G0 human story/Japanese/GUI review remains user-owned and is not completed by automated evidence.

## Residual work

- **G0 human originality review**: purpose is to separate machine correctness from story/Japanese/GUI usefulness. Effect is a human pass or concrete defects for both SP-KNOW-001 routes and the Dashboard. Requirement is local Web Tester review; state is pending; owner is user. Next move is the existing v0 review flow, independent of G2 CI.
- **G3 direction evidence**: purpose is to make deterministic engine facts understandable as “why available / what changes / what opens.” Effect is one selected read-only Choice Consequence Lens macro direction. Requirements are stable SP-KNOW-002 facts and three materially different same-content directions; state is proposed/unlocked but not authorized for implementation; owner is shared with user direction. Next move is a separate EXPLORE packet.
- **G5 Unity parity**: purpose is cross-runtime semantics. Effect is equivalent C# model/evaluator/condition behavior without persistent-event drift. Requirements are separate Unity `IMPLEMENT` authority, tracked Unity 6000.3.6f1 harness, and later Editor review; state is hold with the restartable harness present but semantic parity unimplemented; owner is shared. Next move is to wait for a separate G5 packet rather than treating project restoration as implementation approval.
- **Release/security debt**: purpose is reproducible supported consumption. Effect is pinned toolchain, approved audit treatment, backend/Web lint gates. Requirements include human-approved dependency/toolchain scope; state is unchanged non-blocking debt; owner is shared. Do not mix it into G2.

## 次の異なる入口

| 入口 | 状態 | 次の動き |
|---|---|---|
| **Verify — G0 human baseline** | pending、user owned | `npm run dev` で existing originality probe の両routeとDashboardを一括目視し、passまたは具体的defectを返す |
| **Explore — G3 Choice Consequence Lens** | proposed / unlocked、未開始 | same deterministic factsを使う3方向のread-only evidenceだけを比較し、userがmacro directionを選ぶ |
| **Implement — G5 Unity parity** | hold、authorityなし | separate packetなしに開始しない |
| **Audit — release/toolchain** | non-blocking debt、authorityなし | Actions runtime、nullable、toolchain、lintを専用sliceで扱い、G2へ混ぜない |

## 再開

通常は `AGENTS.md` → `docs/REPO_LOCAL_RULES.md` → この文書を読む。G3 または G5 を扱う時だけ SP-KNOW-002 と readback を追加確認する。

```powershell
git fetch --prune origin
git status --short --branch
git rev-list --left-right --count HEAD...origin/main
npm run check:safety
```

Safe next command は `git status --short --branch`。G0 review、G3 EXPLORE、G5 IMPLEMENT、release/toolchain は目的と authority が異なるため、一つの次sliceへ混ぜない。

別端末で Unity harness を開く場合は Unity `6000.3.6f1` を使う。初回 open で再生成される `Library/`、`Logs/`、`UserSettings/` はローカル状態であり、Git に追加しない。

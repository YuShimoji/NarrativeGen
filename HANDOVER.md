# 作業申し送り

## 現在地 — 2026-07-15

`main` / `origin/main` が開発正本。2026-07-15 の本端末再開では clean worktree を確認してから `git fetch --prune origin` を実行し、remote の追加 1 commit を検出した。`git pull --ff-only origin main` により `33a561f` から `0b2b65a` (`docs: refresh supervisor restart verification`) へ fast-forward し、取り込み直後の `HEAD...origin/main = 0 0` を確認した。取得差分は `HANDOVER.md` のみで executable contract の変更はない。Unity harness (`Assets/`, `ProjectSettings/`, `packages/manifest.json`, `packages/packages-lock.json`, generated `.meta`) は、別端末で同じ Unity project を復元できる tracked context になっている。Unity cache (`Library/`, `Logs/`, `UserSettings/` など) は引き続き除外する。この harness の履歴化と今回の再開検証は G5 Unity parity の実装開始を意味しない。

User は 2026-07-12 に G1 Contract A と public / diagnostic / fixture / spec defaults を承認した。G2 `SP-KNOW-002: Knowledge-Derived Choice Availability` は 2026-07-13 に完了。別 fixture `procedural-choice-spine-probe.json` で reusable pure rule が `follow_semantic_change` を直接開き、availability 中に SessionState を変更せず、knowledge-derived `event_mira_perceives_receipt_contradiction` を作らない。現行 `originality-spine-probe.json` は SP-KNOW-001 の node-triggered persistent-event baseline として挙動を変えずに保持した。

Schema、engine、inference、model-aware cache、fixture、既存 Designer Dashboard 内の日本語優先診断、Story boundary、tests、readback、canonical docs は local acceptance を通過した。implementation commit `a32d024` に紐づく CI run `29204576238` も governance / web-tester / engine-ts / sdk-unity の4 jobすべて成功し、SP-KNOW-002 は `done / 100`。

## 監修AIへの現状報告

現在のローカルは、リモート正本の取得、lockfile 準拠の依存復元、構造診断、安全検査、TypeScript/Web の回帰検証とビルド、Unity SDK の .NET テスト、Web Tester の HTTP 起動スモークまで完了しており、次の承認済み slice を開始できる。今回の作業は環境再開と現状確認であり、G3 の方向決定、G5 の実装、依存更新のいずれも新たに承認されたとは扱わない。

| 監修時の判断対象 | 現在確認できていること | workflow 上の意味 |
|---|---|---|
| 正本との一致 | remote 追加分 `0b2b65a` まで fast-forward。本報告の反映後も `HEAD...origin/main = 0 0` | 古い前提や未取得差分を抱えず次の packet を評価できる |
| 開発再開性 | lockfile から依存を再展開し、`npm ls --depth=0` と doctor 25/25 が成功。Node 24.13.0 / npm 11.6.2 / .NET SDK 10.0.204、`npm run dev` は HTTP 200 | 現行 README の Node 20+ / .NET 9 要件を満たし、ローカルで編集・実行・検証を継続できる |
| 実行契約 | `npm run check` 成功、engine 335 tests、formatter 72 checks、18 models、両 build、Unity 32 tests が成功 | SP-KNOW-002 完了状態を壊さず、後続 slice の基準点にできる |
| 未解消の品質債務 | Web Tester lint は未設定、Vite の `fs` externalization / large chunk、C# nullable/XML doc 警告、`npm audit --json` は 43 vulnerabilities を報告 | 開発停止要因ではないが、release/toolchain 専用 slice で扱う。自動 upgrade は行わない |
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

### Current terminal restart verification

- Runtime versions: Node 24.13.0 / npm 11.6.2 / .NET SDK 10.0.204. README の Node 20+ / .NET 9 要件を満たす。
- `npm ci` は lockfile から依存を再展開したが、npm child 終了後も本実行ラッパーが最終 exit code を返さなかったため、command success とは断定しない。再展開後の `npm ls --depth=0`、doctor、標準回帰、両 build はすべて exit 0 であり、開発に必要な依存ツリーは利用可能。分離実行した `npm audit --json` は 43 findings (1 low / 28 moderate / 10 high / 4 critical) を報告した。dependency/toolchain 専用 slice の承認がないため、自動 upgrade や `npm audit fix` は行っていない。
- `npm run doctor`: 25/25 checks passed, with zero doctor warnings.
- `npm run check:safety`: 37 spec entries, docs authority tests 4/4, 92 Markdown filenames, 328 text files, and 19 synced model files passed.
- `npm run check`: engine lint passed; Web Tester lint explicitly reported `not configured (skipped)`; 27 files / 335 engine tests, 72 formatter checks, 18 canonical model validations, engine build, and Web Tester build passed.
- `dotnet test .\packages\tests\NarrativeGen.Tests\NarrativeGen.Tests.csproj --nologo`: 32/32 passed. Existing nullable and XML-documentation warnings remain non-blocking release/toolchain debt.
- `npm run dev`: Vite started at `http://localhost:5173/`; an HTTP request returned 200 with title `NarrativeGen Web Tester`. The smoke process was then stopped intentionally.
- This restart reran the standard contract but not the full Playwright matrix because the fetched remote delta was docs-only. The immutable G2 implementation/browser evidence remains below; G0 の人手による story / 日本語 / GUI review は引き続き automated evidence で代替しない。

### G2 implementation evidence

- Focused engine: 5 files / 83 tests passed (evaluator, malformed/prototype guards, recursive not, nested integrity, inference parity, cache invalidation, both probes).
- Playwright: current originality + procedural-choice specs, Chromium / Firefox / WebKit, final exact rerun 12/12 passed。最初の run が発見した disposed crossfade の旧 DOM 再追加 race は PlayRenderer の transition cancellation で修復した。
- Transition repair の widened check は、明示的に保持した Vite server に対する Chromium Play Immersion 8/8 が passed。process-managed の全ブラウザ run は assertion failure ではなく、途中で Vite server が終了して connection refused になったため、E2E server lifecycle / runbook debt として残す。
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

監修AIへの推奨 next mission は **G3 の EXPLORE packet 1本**。目的は同一の deterministic facts を使う Choice Consequence Lens の異質な3方向を read-only evidence として比較可能にすることで、実装承認や broad UI redesign には進まない。G0 の human review は user-owned の独立確認として並行可能だが、同じ packet に混ぜない。G3 以降の G4〜G8 dependency ladder と完了条件は `docs/plans/DEVELOPMENT_PLAN.md` を正本とする。

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

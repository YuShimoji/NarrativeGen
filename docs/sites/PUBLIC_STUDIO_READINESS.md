# Public Studio Sites Readiness

Status: `local_candidate`
Last verified: 2026-07-19
Lane: `SITES_PUBLIC_STUDIO`
Artifact owner: `apps/public-studio/`

## Verdict

`apps/public-studio/dist/` is a self-contained, static, Japanese-first local candidate for a private Sites compatibility check. It is not deployed, published, connected to analytics, or proven compatible with a saved Sites project. The next gate is a human-owned **private import and save only**; public visibility must remain disabled.

## What Is Ready

| Surface | Local evidence | Boundary |
|---|---|---|
| Public demo | The canonical `procedural-choice-spine-probe.json` starts automatically and choices run through `@narrativegen/engine-ts/browser` | One bounded sample; not a general hosted editor claim |
| Local editing | Node body, choice copy, and choice target update the live preview | Existing nodes and choices only; node creation/deletion is not in v0 |
| Draft continuity | Versioned `localStorage` envelope restores after reload; reset returns to a build-time clone of the canonical sample | Same browser/profile only; no account or cross-device sync |
| JSON transfer | Exported JSON reloads through the full Node engine validator in the browser test; JSON import rejects simplified structural errors before preview | Browser UI exposes a simplified check; canonical development validation remains authoritative |
| Responsive review | Chromium automation passes at desktop and 390 x 844 with no horizontal overflow; screenshots were inspected locally | No physical-device, other-browser, assistive-technology, or production proof |
| Public-surface hygiene | Built assets pass the forbidden-term scan; no form, account, personal-data input, remote script/style, purchase flow, or visible commercial link by default | Build scan is bounded to generated text assets and DOM assertions |

## Runtime And Source Boundaries

- Vite imports `models/examples/procedural-choice-spine-probe.json` at build time. The generated site does not fetch a model from the repository at runtime.
- The runtime imports the shared browser engine; it does not copy or replace NarrativeGen evaluation semantics.
- Generated asset paths are relative (`./assets/...`). The output contains one HTML file, one CSS asset, and one JavaScript asset.
- The application makes no network request for normal demo, editing, validation, persistence, import, or export behavior.
- Commercial information is copy-only. `VITE_PUBLIC_STUDIO_CONTACT_URL` is optional, accepts HTTPS only, and leaves the link hidden when blank or invalid. Any approved URL remains a human configuration decision.
- There is no hosting configuration in this lane. Publication, custom domain, analytics, credentials, and monetization are explicitly outside this candidate.

## Local Build And Review

From the repository root:

```powershell
npm ci --ignore-scripts --no-audit --prefer-offline
npm ls --depth=0
npm run test:public
npm run build:public
npm run scan:public
npm run test:e2e:public
npm run preview:public
```

Then open `http://127.0.0.1:4174/`. The generated artifact is:

```text
C:\Users\thank\Storage\Game Projects\NarrativeGen\apps\public-studio\dist\
```

The 2026-07-19 local output was 3 files / 48,467 bytes. Build emitted a Vite warning that `fs` from the shared engine entity module was browser-externalized; demo, edit, persistence, export/import, and browser tests still passed. Treat removal of that warning as engine packaging debt, not as proof that private Sites save will work.

## Exact Human-Owned Private Sites Gate

Required action:

1. Start from a private, unpublished Sites project or private import workspace.
2. Import the contents of `apps/public-studio/dist/` using the supported static-site intake. If Sites accepts source rather than built output, stop and report `needs_adapter`; do not improvise a second runtime.
3. Keep all publication, sharing, analytics, form, domain, and commerce controls disabled.
4. Save privately.
5. In the private preview, confirm root render, CSS/JavaScript loading, automatic sample start, one choice transition, one node-text edit, reload persistence, JSON export, and absence of account/payment/internal-development surfaces.
6. Do not publish even if all checks pass.

Return exactly these findings to the supervising AI:

```json
{
  "private_save_completed": false,
  "root_rendered": false,
  "assets_loaded": false,
  "sample_auto_started": false,
  "choice_transition_worked": false,
  "node_edit_updated_preview": false,
  "local_draft_survived_reload": false,
  "json_export_worked": false,
  "forbidden_surface_found": false,
  "sites_intake_mode": "built_output_or_source_only_or_unknown",
  "runtime_notes": []
}
```

Success signal: every functional boolean except `forbidden_surface_found` is `true`, `forbidden_surface_found` is `false`, and the project remains private and unpublished. On failure, include the exact step, visible message, and whether the failure happened before or after the first page render.

## Post-Gate Classification

- Keep `local_candidate` when local evidence is green but the private Sites gate has not run.
- Use `needs_adapter` when Sites cannot ingest the static output or changes its relative asset/runtime behavior, but a bounded adapter is plausible.
- Use `blocked` when private import/save cannot be attempted or would require publication, credentials, data collection, a second runtime, or another out-of-scope capability.

After a successful private gate, select one concrete friction finding for the next bounded editing slice. Do not add analytics or public distribution until an explicit public-release decision exists.

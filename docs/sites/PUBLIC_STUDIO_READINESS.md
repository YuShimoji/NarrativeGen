# Public Studio Sites Readiness

Status: `adapter_candidate`
Last verified: 2026-07-21
Lane: `SITES_SOURCE_ADAPTER`
Artifact owners: `apps/public-studio/` and `apps/sites-public-studio-adapter/`

## Verdict

Raw static intake requires a source-project adapter. `apps/sites-public-studio-adapter/` is now a locally verified vinext source candidate that serves the exact three-file Japanese-first Public Studio payload. It has not been imported, saved, deployed, published, connected to analytics, or proven compatible with Sites. The next gate is a human-owned **source import and version save only**; every deployment remains disabled.

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
- The separate adapter has the minimum local hosting manifest (`d1: null`, `r2: null`) and no `project_id`. Publication, deployment, custom domain, analytics, credentials, authentication, persistence, and monetization are explicitly outside this candidate.

## Source Adapter

Give Sites exactly this folder in the later human gate:

```text
C:\Users\thank\Storage\Game Projects\NarrativeGen\apps\sites-public-studio-adapter\
```

The adapter redirects `/` to `/studio/` and serves the embedded
`studio/index.html` plus its relative assets without changing payload bytes.
Its architecture, hashes, commands, and manifest boundary are owned by
`docs/sites/SITES_SOURCE_ADAPTER.md`.

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

## Exact Human-Owned Sites Source Gate

Required action:

1. Start from a private, unpublished Sites project or source-import workspace.
2. Import `apps/sites-public-studio-adapter/` as the source project. Do not import only `dist/` and do not rewrite the Studio into another runtime.
3. Keep all publication, sharing, analytics, form, domain, and commerce controls disabled.
4. Save a version only if Sites accepts and builds the source without requiring a deployment.
5. Do not deploy. If Sites requires any production deployment to render a URL, report that requirement and stop.
6. If a non-deployed review surface exists, confirm root render, CSS/JavaScript loading, automatic sample start, one choice transition, one node-text edit, reload persistence, JSON export, and absence of account/payment/internal-development surfaces.

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
  "sites_intake_mode": "source_adapter_or_unknown",
  "runtime_notes": []
}
```

Success signal: every functional boolean except `forbidden_surface_found` is `true`, `forbidden_surface_found` is `false`, and the project remains private and unpublished. On failure, include the exact step, visible message, and whether the failure happened before or after the first page render.

## Post-Gate Classification

- Keep `adapter_candidate` while local adapter evidence is green but Sites source import/version save has not run.
- Use `adapter_partial` when Sites accepts the source shape but changes relative asset/runtime behavior or cannot save the version without a bounded repair.
- Use `blocked` when private import/save cannot be attempted or would require publication, credentials, data collection, a second runtime, or another out-of-scope capability.

After a successful private gate, select one concrete friction finding for the next bounded editing slice. Do not add analytics or public distribution until an explicit public-release decision exists.

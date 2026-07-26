# Public Studio Sites Readiness

Status: `adapter_partial`
Last reconciled: 2026-07-27
Lane: `SITES_SOURCE_ADAPTER`
Artifact owners: `apps/public-studio/` and `apps/sites-public-studio-adapter/`

## Verdict

Raw static intake requires a source-project adapter. Human-observed Sites
evidence records that `apps/sites-public-studio-adapter/` was imported, built,
and saved as Version 1 with owner-only custom access. No Preview URL or Live URL
exists, and deployment was neither required nor performed.

The source/save gate therefore passes. Root rendering, asset loading, story
flow, editing, reload persistence, and export on the hosted runtime were not
observed; they are unknown rather than failed. Overall private hosted-runtime
compatibility remains partial. The next human gate is an explicit decision to
owner-only deploy Version 1 for runtime review or to hold.

## What Is Ready

| Surface | Local evidence | Boundary |
|---|---|---|
| Public demo | The canonical `procedural-choice-spine-probe.json` starts automatically and choices run through `@narrativegen/engine-ts/browser` | One bounded sample; not a general hosted editor claim |
| Local editing | Node body, choice copy, and choice target update the live preview | Existing nodes and choices only; node creation/deletion is not in v0 |
| Draft continuity | Versioned `localStorage` envelope restores after reload; reset returns to a build-time clone of the canonical sample | Same browser/profile only; no account or cross-device sync |
| JSON transfer | Exported JSON reloads through the full Node engine validator in the browser test; JSON import rejects simplified structural errors before preview | Browser UI exposes a simplified check; canonical development validation remains authoritative |
| Responsive review | Chromium automation passes at desktop and 390 x 844 with no horizontal overflow; screenshots were inspected locally | No physical-device, other-browser, assistive-technology, or production proof |
| Public-surface hygiene | Built assets pass the forbidden-term scan; no form, account, personal-data input, remote script/style, purchase flow, or visible commercial link by default | Build scan is bounded to generated text assets and DOM assertions |
| Sites source/save | Human-observed source import, build, and Version 1 save succeeded; access remained owner-only custom | No Preview/Live URL and no hosted render evidence; deployment/publication were not performed |

## Runtime And Source Boundaries

- Vite imports `models/examples/procedural-choice-spine-probe.json` at build time. The generated site does not fetch a model from the repository at runtime.
- The runtime imports the shared browser engine; it does not copy or replace NarrativeGen evaluation semantics.
- Generated asset paths are relative (`./assets/...`). The output contains one HTML file, one CSS asset, and one JavaScript asset.
- The application makes no network request for normal demo, editing, validation, persistence, import, or export behavior.
- Commercial information is copy-only. `VITE_PUBLIC_STUDIO_CONTACT_URL` is optional, accepts HTTPS only, and leaves the link hidden when blank or invalid. Any approved URL remains a human configuration decision.
- The adapter hosting manifest contains the provisioned non-secret `project_id`
  plus `d1: null` and `r2: null`. It contains no token, credential, URL, secret,
  analytics, authentication, or storage value. The binding is source linkage,
  not deployment or runtime proof.

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

## Current Sites Evidence

The human-observed return record is:

```json
{
  "private_save_completed": true,
  "saved_version": 1,
  "access": "owner-only custom",
  "preview_url": null,
  "live_url": null,
  "deployment_required": false,
  "deployment_performed": false,
  "root_rendered": null,
  "assets_loaded": null,
  "sample_auto_started": null,
  "choice_transition_worked": null,
  "node_edit_updated_preview": null,
  "local_draft_survived_reload": null,
  "json_export_worked": null,
  "forbidden_surface_found": null,
  "sites_intake_mode": "source_adapter",
  "runtime_notes": [
    "Source import, build, and Version 1 save passed.",
    "No non-deployed preview or live URL was available.",
    "Hosted runtime behavior was not observed."
  ]
}
```

`null` means unobserved. It must not be converted to a failed boolean. Local
Worker checks remain valid within local scope but do not fill the hosted-runtime
evidence gap.

## Exact Next Human Gate

1. Decide whether to owner-only deploy saved Version 1 for runtime review or
   explicitly hold deployment.
2. A hold preserves the current owner-only project, saved version, absent URLs,
   and unknown runtime evidence.
3. A separately authorized deployment must retain owner-only custom access and
   target Version 1.
4. After deployment, verify root/assets/story/edit/reload/export and update the
   `null` fields with observed pass/fail results.
5. Public access, sharing, analytics, form, domain, authentication, storage,
   commerce, and monetization remain locked behind separate gates.

## Post-Gate Classification

- Use `adapter_partial` when source import/save has passed but hosted-runtime
  behavior remains unobserved, or when a bounded runtime repair is still needed.
- Use `adapter_accepted` only after owner-only hosted review confirms
  root/assets/story/edit/reload/export without changing runtime semantics.
- Use `blocked` when private import/save cannot be attempted or would require publication, credentials, data collection, a second runtime, or another out-of-scope capability.

Select S2 only after one concrete local or hosted review friction is observed.
Do not treat the current runtime evidence gap as a friction finding, and do not
add analytics or public distribution until an explicit public-release decision
exists.

# NarrativeGen Public Studio Sites Source Adapter

Status: `adapter_partial`
Last reconciled: 2026-07-27
Source-import folder: `apps/sites-public-studio-adapter/`

## Purpose And Boundary

This workspace is a hosting adapter only. It gives current Sites source intake a
minimal vinext/Cloudflare Worker project while preserving the existing Public
Studio production payload byte-for-byte. It does not reimplement the editor,
story runtime, validation, persistence, or JSON transfer logic.

Sites evidence records a successful source import, build, Version 1 save, and
deployment of that existing version only. The project still uses owner-only
custom access with one allowed account user and no allowed groups. A Live URL
exists, but its value is intentionally not stored or repeated in this
repository. No Preview URL exists. Hosted runtime behavior remains unobserved.

## Architecture

- `app/page.tsx` redirects `/` to `/studio/`; the static asset runtime
  canonicalizes `studio/index.html` to that directory URL.
- `public/studio/` contains the committed Public Studio payload.
- The browser loads only that HTML and its relative `./assets/...` JavaScript
  and CSS references. There is no iframe or visual wrapper.
- `worker/index.ts`, `vite.config.ts`, and `build/sites-vite-plugin.ts` retain
  the minimal Sites vinext/Cloudflare Worker build shape.
- `build/sites-vite-plugin.ts` is a tracked source file even though the root
  Unity ignore policy excludes other `Build/` directories. Removing the narrow
  `.gitignore` exception makes a clean clone fail while loading `vite.config.ts`.
- Production-like local review uses the built Worker and its asset binding via
  Wrangler. This is local emulation only and performs no deployment.
- Visitor runtime code does not read `apps/public-studio/`,
  `packages/engine-ts/`, or other sibling workspace files.

## Canonical Payload Identity

The manifest is `apps/sites-public-studio-adapter/public-studio-payload.sha256.json`.
Both canonical and embedded files must match its size and SHA-256.

| Canonical source | Embedded target | Bytes | SHA-256 |
|---|---|---:|---|
| `apps/public-studio/dist/index.html` | `public/studio/index.html` | 8,932 | `e63f37ea6b33305317d30a8407fc07d7f2f0fa95b37ff5d10aa29337158f9976` |
| `apps/public-studio/dist/assets/index-BKLVLmRp.js` | `public/studio/assets/index-BKLVLmRp.js` | 26,133 | `c45c190bd5c9ba935853e41848f3b60d1f4066f70063161ee5dd314d5bf7527f` |
| `apps/public-studio/dist/assets/index-DIOR_NPc.css` | `public/studio/assets/index-DIOR_NPc.css` | 13,402 | `4f2f3b8dbaf46ca46734b245979c33c0870cbaac4e517a45557e4d6ef8c1ba0c` |

Regenerate the canonical payload first, then update the embedded copy:

```powershell
npm run build:public
npm run sync:sites-adapter
npm run check:sites-adapter
npm run scan:sites-adapter
```

`sync:sites-adapter` is the only command that rewrites the embedded copy and
manifest. `check:sites-adapter` fails on changed bytes, names, missing files, or
extra payload files. `check:embedded` can validate an isolated adapter checkout
without reading the sibling canonical build.

## Hosting Manifest Boundary

`.openai/hosting.json` contains only:

```json
{
  "project_id": "appgprj_6a65fabf5ca48191a9b7f2b063d05cf8",
  "d1": null,
  "r2": null
}
```

The `project_id` is the real non-secret linkage returned by the authorized Sites
provisioning flow. It is not a credential, URL, deployment proof, or runtime
acceptance. D1, R2, authentication, secrets, analytics, storage, and environment
configuration remain absent.

`scripts/hosting-manifest-contract.mjs` accepts only two exact safe shapes:
unprovisioned `{ d1: null, r2: null }`, or provisioned with a syntactically
valid `appgprj_...` project ID plus those two null bindings. Unexpected keys,
malformed IDs, and non-null D1/R2 bindings fail closed. Four focused tests cover
both accepted shapes and the rejection cases.

## Local Commands

From the repository root:

```powershell
npm run check:sites-adapter
npm run scan:sites-adapter
npm run test:hosting-manifest -w @narrativegen/sites-public-studio-adapter
npm run build:sites-adapter
npm run preview:sites-adapter
npm run test:e2e:sites-adapter
npm run test:sites-adapter
```

The production-like local URL is `http://127.0.0.1:4184/`. It redirects to
`http://127.0.0.1:4184/studio/`.

## Verified Evidence

- A fresh lockfile install exposed that the required Sites Vite plugin had been
  omitted by the root `Build/` ignore pattern. The plugin was restored from the
  bundled Sites starter, made narrowly trackable, and the full adapter test was
  rerun successfully.
- vinext build emitted a callable `dist/server/index.js`, the exact static
  payload under `dist/client/studio/`, and `dist/.openai/hosting.json`.
- Workerd HTTP returned root redirect, Studio HTML, JavaScript, and CSS. The
  served payload hashes matched the canonical build.
- Chromium adapter smoke passed 3/3: automatic start, choice transition, live
  node edit, reload persistence, JSON export/import, no forbidden surface, and
  desktop plus 390 x 844 layout.
- Desktop and narrow screenshots were inspected. The Studio was unobstructed,
  readable, and showed no adapter UI.
- The bounded text/DOM scan passed 3 files / 48,467 bytes and nine forbidden
  pattern classes.
- Sites intake accepted this adapter source, completed its build, saved Version
  1, and successfully deployed that existing version only. Access remains
  custom with one allowed account user and no allowed groups. A Live URL exists
  but is intentionally unrecorded; hosted runtime behavior was not observed.
- Provisioning exposed that the previous scan accepted only a pre-provisioning
  manifest. The bounded contract repair accepts the exact provisioned shape,
  rejects added capabilities, and passes 4/4 focused tests plus the full 3/3
  adapter Chromium suite.

This evidence establishes a locally verified source adapter and an accepted
Sites source-import/build/version-save contract. It does not establish hosted
runtime behavior, private-preview compatibility, production readiness,
public-release readiness, analytics readiness, or revenue readiness.

## Exact Next Human Gate

1. Open the existing deployment in an owner-authenticated browser without
   repeating the Live URL value in repository files or reports.
2. Verify root/assets/story/edit/reload/export and record observed pass/fail
   results. A failure stops this gate; it does not authorize source repair or
   redeployment.
3. Keep Version 1, owner-only custom access, and the current capability-free
   manifest unchanged.
4. Public visibility, sharing, analytics, form, domain, authentication, storage,
   commerce, and monetization remain locked behind separate gates.

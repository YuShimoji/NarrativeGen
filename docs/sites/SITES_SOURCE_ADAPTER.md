# NarrativeGen Public Studio Sites Source Adapter

Status: `adapter_candidate`
Last verified: 2026-07-21
Source-import folder: `apps/sites-public-studio-adapter/`

## Purpose And Boundary

This workspace is a hosting adapter only. It gives current Sites source intake a
minimal vinext/Cloudflare Worker project while preserving the existing Public
Studio production payload byte-for-byte. It does not reimplement the editor,
story runtime, validation, persistence, or JSON transfer logic.

The adapter has not been imported into Sites. No Sites project, project ID,
credential, saved version, deployment, URL, access change, domain, analytics,
authentication, storage binding, form, or commerce capability was created.

## Architecture

- `app/page.tsx` redirects `/` to `/studio/`; the static asset runtime
  canonicalizes `studio/index.html` to that directory URL.
- `public/studio/` contains the committed Public Studio payload.
- The browser loads only that HTML and its relative `./assets/...` JavaScript
  and CSS references. There is no iframe or visual wrapper.
- `worker/index.ts`, `vite.config.ts`, and `build/sites-vite-plugin.ts` retain
  the minimal Sites vinext/Cloudflare Worker build shape.
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
  "d1": null,
  "r2": null
}
```

It intentionally omits `project_id`. Do not fabricate one. A real project ID
may be written only by an authorized later Sites provisioning flow. D1, R2,
authentication, secrets, analytics, and environment configuration remain absent.

## Local Commands

From the repository root:

```powershell
npm run check:sites-adapter
npm run scan:sites-adapter
npm run build:sites-adapter
npm run preview:sites-adapter
npm run test:e2e:sites-adapter
npm run test:sites-adapter
```

The production-like local URL is `http://127.0.0.1:4184/`. It redirects to
`http://127.0.0.1:4184/studio/`.

## Verified Local Evidence

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

This evidence establishes a locally verified source adapter only. It does not
establish Sites source-import, version-save, hosted-runtime, private-preview,
production, public-release, or revenue readiness.

## Exact Next Human Gate

1. Give Sites exactly `apps/sites-public-studio-adapter/` as a source project.
2. Keep the project unpublished and all sharing, analytics, form, domain,
   authentication, storage, and commerce controls disabled.
3. Attempt source import and version save only.
4. Stop before any deployment, including owner-only production deployment.
5. Report the exact intake/build/save result. On failure, include the visible
   message and whether failure occurred before or after the first hosted render.

Only a later explicit owner decision may authorize owner-only production
deployment. Public visibility remains locked behind a separate release gate.

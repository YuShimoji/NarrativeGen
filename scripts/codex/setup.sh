#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
node scripts/codex/runtime.mjs
npm ci --no-audit --no-fund
browser_install_args=()
if [[ "$(uname -s)" == Linux ]]; then
  if [[ "$(id -u)" == 0 ]] || { command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; }; then
    browser_install_args+=(--with-deps)
  else
    printf '%s\n' 'No unattended root access; checking browsers against the installed OS libraries.'
  fi
fi
node node_modules/@playwright/test/cli.js install "${browser_install_args[@]}" chromium firefox webkit
node --input-type=module <<'NODE'
import { chromium, firefox, webkit } from '@playwright/test';
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<title>${name}</title>`);
    if (await page.title() !== name) throw new Error(`${name}: browser smoke check failed`);
    console.log(`${name}: browser launch and page check passed`);
  } finally {
    await browser.close();
  }
}
NODE
npm run build:all
node scripts/codex/runtime.mjs --record
printf '%s\n' 'NarrativeGen cloud dependencies, browser engines and build outputs are ready.'

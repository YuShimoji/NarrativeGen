#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
node scripts/codex/runtime.mjs
npm ci --no-audit --no-fund
if [[ "$(uname -s)" == Linux ]]; then
  node node_modules/@playwright/test/cli.js install --with-deps chromium firefox webkit
else
  node node_modules/@playwright/test/cli.js install chromium firefox webkit
fi
npm run build:all
node scripts/codex/runtime.mjs --record
printf '%s\n' 'NarrativeGen cloud dependencies, browser engines and build outputs are ready.'

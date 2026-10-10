#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
node scripts/codex/runtime.mjs --current
npm run check:safety
npm run build:all
npm run test
npm run test:e2e:public
printf '%s\n' 'Source checks, builds, unit/contract tests and Public Studio Chromium interaction checks passed.'

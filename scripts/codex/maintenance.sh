#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
node scripts/codex/runtime.mjs
if ! node scripts/codex/runtime.mjs --current; then
  bash scripts/codex/setup.sh
else
  npm run build:all
fi

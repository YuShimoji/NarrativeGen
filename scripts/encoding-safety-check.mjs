#!/usr/bin/env node

import { collectRepoFiles, scanFiles } from './encoding-safety-lib.mjs'

const SELF_EXCLUDES = [
  'scripts/encoding-safety-lib.mjs',
  'scripts/encoding-safety-check.mjs',
  'scripts/encoding-safety-check-changed.mjs',
]

const files = collectRepoFiles({ skipFiles: SELF_EXCLUDES })
const { hardFail, warnings, scannedCount } = scanFiles(files)

if (warnings.length > 0) {
  console.warn('[encoding-safety] warnings:')
  for (const w of warnings) console.warn(`- ${w}`)
}

if (hardFail.length > 0) {
  console.error('[encoding-safety] failures:')
  for (const f of hardFail) console.error(`- ${f}`)
  process.exit(1)
}

console.log(`[encoding-safety] OK: scanned ${scannedCount} text files`)
#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { normalize } from 'node:path'

import { collectRepoFiles, isTextTarget, scanFiles } from './encoding-safety-lib.mjs'
import { validateSpecIndex } from './spec-index-lib.mjs'

const SELF_EXCLUDES = new Set([
  normalize('scripts/encoding-safety-lib.mjs'),
  normalize('scripts/encoding-safety-check.mjs'),
  normalize('scripts/encoding-safety-check-changed.mjs'),
])

function readGitList(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return null
  }
}

function getChangedFiles() {
  const modified = readGitList(['diff', '--name-only', '--diff-filter=ACMRTUXB', 'HEAD'])
  if (modified == null) return null

  const untracked = readGitList(['ls-files', '--others', '--exclude-standard']) || []
  return [...new Set([...modified, ...untracked])].map((file) => normalize(file))
}

function reportEncodingScan(files, label) {
  const { hardFail, warnings, scannedCount } = scanFiles(files)

  if (warnings.length > 0) {
    console.warn(`[encoding-safety:${label}] warnings:`)
    for (const warning of warnings) console.warn(`- ${warning}`)
  }

  if (hardFail.length > 0) {
    console.error(`[encoding-safety:${label}] failures:`)
    for (const failure of hardFail) console.error(`- ${failure}`)
    process.exit(1)
  }

  console.log(`[encoding-safety:${label}] OK: scanned ${scannedCount} text files`)
}

const changedFiles = getChangedFiles()

if (changedFiles == null) {
  console.warn('[safety-check-changed] git unavailable, falling back to full safety scan')
  const allFiles = collectRepoFiles({ skipFiles: Array.from(SELF_EXCLUDES) })
  reportEncodingScan(allFiles, 'fallback')

  const specResult = validateSpecIndex()
  if (!specResult.ok) {
    for (const message of specResult.messages) {
      console.error(`[spec-index-check] ${message}`)
    }
    console.error(`[spec-index-check] NG: ${specResult.issues} issue(s)`)
    process.exit(1)
  }

  console.log(`[spec-index-check] OK: ${specResult.records} entries`)
  process.exit(0)
}

const textTargets = changedFiles.filter((file) => isTextTarget(file) && !SELF_EXCLUDES.has(file))

if (textTargets.length === 0) {
  console.log('[safety-check-changed] OK: no changed text/config files')
} else {
  reportEncodingScan(textTargets, 'changed')
}

if (changedFiles.includes(normalize('docs/spec-index.json'))) {
  const specResult = validateSpecIndex()
  if (!specResult.ok) {
    for (const message of specResult.messages) {
      console.error(`[spec-index-check] ${message}`)
    }
    console.error(`[spec-index-check] NG: ${specResult.issues} issue(s)`)
    process.exit(1)
  }

  console.log(`[spec-index-check] OK: ${specResult.records} entries`)
} else {
  console.log('[spec-index-check] skipped: docs/spec-index.json not changed')
}
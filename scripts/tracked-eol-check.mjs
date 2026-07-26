#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), '..')

function splitNullTerminated(buffer) {
  return buffer
    .toString('utf8')
    .split('\0')
    .filter((value) => value.length > 0)
}

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: null,
    windowsHide: true,
  })

  if (result.error) throw result.error
  return result
}

function readAttributes(path, cwd) {
  const result = runGit(['check-attr', '-z', 'text', 'eol', '--', path], cwd)
  if (result.status !== 0) {
    throw new Error(`git check-attr failed for ${path}: ${result.stderr.toString('utf8').trim()}`)
  }

  const fields = splitNullTerminated(result.stdout)
  const attributes = new Map()
  for (let index = 0; index + 2 < fields.length; index += 3) {
    attributes.set(fields[index + 1], fields[index + 2])
  }
  return attributes
}

function findTrackedLfViolations(cwd = REPO_ROOT) {
  const result = runGit(['grep', '-I', '-l', '-z', '-F', '-e', '\r', '--cached', '--'], cwd)
  if (result.status === 1) return []
  if (result.status !== 0) {
    throw new Error(`git grep failed: ${result.stderr.toString('utf8').trim()}`)
  }

  const violations = []
  for (const path of splitNullTerminated(result.stdout)) {
    const attributes = readAttributes(path, cwd)
    const text = attributes.get('text')
    const eol = attributes.get('eol')
    const governedAsText = text !== 'unset' && text !== 'unspecified'

    if (governedAsText && eol === 'lf') {
      violations.push({ path, text, eol })
    }
  }
  return violations
}

function runTrackedEolCheck(cwd = REPO_ROOT) {
  const violations = findTrackedLfViolations(cwd)
  if (violations.length > 0) {
    console.error('[tracked-eol] failures:')
    for (const violation of violations) {
      console.error(`- ${violation.path}: index blob contains CR bytes under text=${violation.text} eol=${violation.eol}`)
    }
    console.error(`[tracked-eol] NG: ${violations.length} governed tracked text blob(s) violate the LF policy`)
    return false
  }

  console.log('[tracked-eol] OK: governed tracked text index blobs contain no CR bytes')
  return true
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(SCRIPT_PATH)) {
  if (!runTrackedEolCheck()) process.exitCode = 1
}

export { findTrackedLfViolations, runTrackedEolCheck, splitNullTerminated }

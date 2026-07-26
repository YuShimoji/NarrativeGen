import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

import { findTrackedLfViolations } from './tracked-eol-check.mjs'

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  }).trim()
}

function putRawBlobInIndex(cwd, path, content) {
  writeFileSync(resolve(cwd, path), content)
  const blob = git(cwd, ['hash-object', '-w', '--no-filters', path])
  git(cwd, ['update-index', '--add', '--cacheinfo', `100644,${blob},${path}`])
}

test('distinguishes a committed CRLF blob from an LF blob under the LF policy', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'narrativegen-tracked-eol-'))

  try {
    git(root, ['init', '--quiet'])
    git(root, ['config', 'core.autocrlf', 'false'])
    writeFileSync(resolve(root, '.gitattributes'), '* text=auto eol=lf\n')
    git(root, ['add', '.gitattributes'])

    putRawBlobInIndex(root, 'sample.txt', 'alpha\r\nbeta\r\n')
    assert.deepEqual(findTrackedLfViolations(root), [
      {
        path: 'sample.txt',
        text: 'auto',
        eol: 'lf',
      },
    ])

    putRawBlobInIndex(root, 'sample.txt', 'alpha\nbeta\n')
    assert.deepEqual(findTrackedLfViolations(root), [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { validateHostingManifest } from './hosting-manifest-contract.mjs'

test('accepts the unprovisioned manifest shape', () => {
  assert.deepEqual(validateHostingManifest({ d1: null, r2: null }), {
    d1: null,
    r2: null,
    projectIdPresent: false,
  })
})

test('accepts a provisioned non-secret project binding', () => {
  assert.deepEqual(
    validateHostingManifest({
      project_id: 'appgprj_0123456789abcdef0123456789abcdef',
      d1: null,
      r2: null,
    }),
    {
      d1: null,
      r2: null,
      projectIdPresent: true,
    },
  )
})

test('rejects malformed project bindings', () => {
  assert.throws(
    () => validateHostingManifest({ project_id: '', d1: null, r2: null }),
    /invalid project_id/,
  )
  assert.throws(
    () => validateHostingManifest({ project_id: 'wrong_0123456789abcdef', d1: null, r2: null }),
    /invalid project_id/,
  )
})

test('rejects unexpected or non-null hosted capabilities', () => {
  assert.throws(
    () => validateHostingManifest({ project_id: 'appgprj_0123456789abcdef0123456789abcdef', d1: null, r2: null, token: 'secret' }),
    /only optional project_id/,
  )
  assert.throws(
    () => validateHostingManifest({ d1: 'database', r2: null }),
    /only optional project_id/,
  )
  assert.throws(
    () => validateHostingManifest({ d1: null, r2: { bucket: 'assets' } }),
    /only optional project_id/,
  )
})

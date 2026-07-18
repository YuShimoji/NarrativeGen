import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { loadModel } from '../../../packages/engine-ts/dist/index.js'
import { validateDraft, validationCounts } from '../src/validation.js'

const repoRoot = new URL('../../../', import.meta.url)
const canonicalPath = new URL('models/examples/procedural-choice-spine-probe.json', repoRoot)
const canonical = JSON.parse(await readFile(canonicalPath, 'utf8'))

test('canonical procedural choice sample remains engine-valid and locally draft-valid', () => {
  const loaded = loadModel(canonical)
  assert.equal(loaded.startNode, 'desk')

  const counts = validationCounts(validateDraft(canonical))
  assert.equal(counts.error, 0)
  assert.equal(counts.warning, 0)
})

test('draft validation rejects broken choice targets without throwing', () => {
  const broken = structuredClone(canonical)
  broken.nodes.desk.choices[0].target = 'missing-node'
  broken.nodes.memory_reframed.choices = { invalid: true }

  const issues = validateDraft(broken)
  assert.ok(issues.some((item) => item.severity === 'error' && item.message.includes('missing-node')))
  assert.ok(issues.some((item) => item.severity === 'error' && item.message.includes('choices')))
})

test('public app reuses the browser engine and canonical sample at build time', async () => {
  const mainSource = await readFile(new URL('../src/main.js', import.meta.url), 'utf8')
  const sampleSource = await readFile(new URL('../src/public-sample.js', import.meta.url), 'utf8')
  const viteSource = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8')

  assert.match(mainSource, /from '@narrativegen\/engine-ts\/browser'/)
  assert.match(sampleSource, /models\/examples\/procedural-choice-spine-probe\.json/)
  assert.match(viteSource, /base:\s*['"]\.\/['"]/)
})

test('public document has no account or personal-data form', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(html, /<form\b/i)
  assert.doesNotMatch(html, /type=["'](?:email|password|tel)["']/i)
  assert.match(html, /id="commercial-contact"[^>]*hidden/)
})

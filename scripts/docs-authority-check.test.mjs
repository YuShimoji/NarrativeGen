import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'

import { collectMarkdownFiles, extractLocalLinks, findCapsuleViolation } from './docs-authority-check.mjs'

test('rejects common aliases for duplicate authority capsules', () => {
  const rejected = [
    'docs/CURRENT_STATE.md',
    'docs/current-project-status.md',
    'docs/HANDOFF.md',
    'docs/PROGRESS.md',
    'docs/DEVELOPMENT_PLAN-copy.md',
    'docs/ROADMAP-v2.md',
    'docs/PRODUCT_ROADMAP.md',
    'docs/DECISION_LOG-local.md',
    'docs/LOCAL_DECISION_LOG.md',
    'docs/PROJECT_BRIEF.md',
    'docs/OUTPUT_STYLE.md',
    'docs/CONTEXT_CACHE.md',
  ]

  for (const path of rejected) {
    assert.ok(findCapsuleViolation(path), `${path} should be rejected`)
  }
})

test('allows canonical owners and unrelated durable documents', () => {
  const allowed = [
    'HANDOVER.md',
    'docs/project-status.md',
    'docs/ai/STATUS_AND_HANDOFF.md',
    'docs/governance/decision-log.md',
    'docs/plans/DEVELOPMENT_PLAN.md',
    'docs/specs/session-history.md',
    'docs/tasks/FLAKY_ISSUES_TRACKER.md',
  ]

  for (const path of allowed) {
    assert.equal(findCapsuleViolation(path), null, `${path} should be allowed`)
  }
})

test('skips ignored tool-local directories when collecting Markdown files', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'narrativegen-docs-authority-'))

  try {
    mkdirSync(resolve(root, 'docs'), { recursive: true })
    mkdirSync(resolve(root, '.codex', 'notes'), { recursive: true })
    mkdirSync(resolve(root, '.serena', 'memories'), { recursive: true })
    writeFileSync(resolve(root, 'docs', 'guide.md'), '# Guide\n')
    writeFileSync(resolve(root, '.codex', 'notes', 'project-overview.md'), '# Local tool note\n')
    writeFileSync(resolve(root, '.serena', 'memories', 'project-overview.md'), '# Local tool note\n')

    const files = collectMarkdownFiles(root).map((path) => path.replaceAll('\\', '/'))
    assert.equal(files.length, 1)
    assert.ok(files[0].endsWith('/docs/guide.md'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('extracts valid local Markdown destinations without treating code examples as links', () => {
  const sourcePath = resolve('README.md')
  const markdown = [
    '[plain](docs/file.md)',
    '[parentheses](docs/foo(bar).md)',
    '[angle](<docs/file name.md>)',
    '[with title](docs/titled.md "Readable title")',
    '`[inline code](docs/missing-inline.md)`',
    '``[double tick code](docs/missing-double.md)``',
    '```md',
    '[fenced code](docs/missing-fenced.md)',
    '```',
    '[external](https://example.com/page)',
    '[anchor](#section)',
    '[reference][ref]',
    '[ref]: docs/reference.md',
    '[reference with spaces][ref-space]',
    '[ref-space]: <docs/reference file.md>',
    '<a href="docs/from-html.md">HTML</a>',
  ].join('\n')

  const targets = extractLocalLinks(sourcePath, markdown).map(({ target }) => target)
  assert.deepEqual(targets, [
    'docs/file.md',
    'docs/foo(bar).md',
    'docs/file name.md',
    'docs/titled.md',
    'docs/reference.md',
    'docs/reference file.md',
    'docs/from-html.md',
  ])
})

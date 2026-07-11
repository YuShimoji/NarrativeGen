#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), '..')

const REQUIRED_AUTHORITIES = [
  ['AGENTS.md', 'AI entry pointer'],
  ['README.md', 'project overview'],
  ['HANDOVER.md', 'current state and next work'],
  ['docs/REPO_LOCAL_RULES.md', 'repo-local operating rules'],
  ['docs/spec-index.json', 'spec lifecycle state'],
  ['docs/INVARIANTS.md', 'non-negotiable product boundaries'],
  ['docs/USER_REQUEST_LEDGER.md', 'durable user requests'],
  ['docs/OPERATOR_WORKFLOW.md', 'operator workflow'],
  ['docs/INTERACTION_NOTES.md', 'interaction and reporting rules'],
  ['docs/AUTHORING_GUIDE.md', 'authoring workflow'],
  ['docs/governance/decision-log.md', 'durable decisions'],
  ['docs/plans/DEVELOPMENT_PLAN.md', 'roadmap'],
  ['docs/ai/CORE_RULESET.md', 'vendor-neutral AI rules'],
  ['docs/ai/DECISION_GATES.md', 'AI decision gates'],
  ['docs/ai/STATUS_AND_HANDOFF.md', 'AI handoff rubric'],
  ['docs/ai/WORKFLOWS_AND_PHASES.md', 'AI workflow rules'],
]

const MARKDOWN_ENTRYPOINTS = [
  'AGENTS.md',
  'CLAUDE.md',
  '.claude/CLAUDE.md',
  'README.md',
  'HANDOVER.md',
  ...REQUIRED_AUTHORITIES.map(([path]) => path).filter((path) => path.endsWith('.md')),
  'docs/project-status.md',
]

const ALLOWED_CAPSULE_PATHS = new Set([
  'HANDOVER.md',
  'docs/project-status.md',
  'docs/ai/STATUS_AND_HANDOFF.md',
  'docs/governance/decision-log.md',
  'docs/plans/DEVELOPMENT_PLAN.md',
])

const CAPSULE_NAME_RULES = [
  {
    pattern: /^(?:(?:current|project|session|runtime|development|features?)[-_])*(?:state|status|progress|handoff|handover)(?:[-_].+)?\.md$/i,
    owner: 'Current state and restart context belong in HANDOVER.md.',
  },
  {
    pattern: /^(?:development[-_]plan|restart[-_]roadmap|(?:.+[-_])?roadmap)(?:[-_].+)?\.md$/i,
    owner: 'Roadmap intent belongs in docs/plans/DEVELOPMENT_PLAN.md.',
  },
  {
    pattern: /^(?:.+[-_])?decision[-_]log(?:[-_].+)?\.md$/i,
    owner: 'Durable decisions belong in docs/governance/decision-log.md.',
  },
  {
    pattern: /^(?:project[-_])?(?:brief|overview)(?:[-_].+)?\.md$/i,
    owner: 'Project overview belongs in README.md.',
  },
  {
    pattern: /^(?:output[-_]style|context[-_]cache)(?:[-_].+)?\.md$/i,
    owner: 'Interaction rules belong in docs/INTERACTION_NOTES.md; do not add a context capsule.',
  },
]

const SKIPPED_DIRECTORIES = new Set([
  '.git',
  '.codex',
  '.serena',
  'node_modules',
  'dist',
  'coverage',
  'bin',
  'obj',
  'Library',
  'Logs',
  'Temp',
  'playwright-report',
  'test-results',
])

function repoPath(absolutePath) {
  return relative(REPO_ROOT, absolutePath).replaceAll('\\', '/')
}

function collectMarkdownFiles(directory, files = []) {
  let entries
  try {
    entries = readdirSync(directory, { withFileTypes: true })
  } catch {
    return files
  }

  for (const entry of entries) {
    if (entry.isDirectory() && SKIPPED_DIRECTORIES.has(entry.name)) continue

    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      collectMarkdownFiles(path, files)
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(path)
    }
  }

  return files
}

function maskInlineCode(text) {
  let masked = ''
  let cursor = 0

  while (cursor < text.length) {
    if (text[cursor] !== '`') {
      masked += text[cursor]
      cursor += 1
      continue
    }

    let runLength = 1
    while (text[cursor + runLength] === '`') runLength += 1
    const delimiter = '`'.repeat(runLength)
    const closing = text.indexOf(delimiter, cursor + runLength)
    if (closing === -1) {
      masked += text[cursor]
      cursor += 1
      continue
    }

    const end = closing + runLength
    masked += text.slice(cursor, end).replace(/[^\r\n]/g, ' ')
    cursor = end
  }

  return masked
}

function maskNonLinkMarkdown(text) {
  const lines = text.split(/(?<=\n)/)
  let fence = null

  const withoutBlocks = lines
    .map((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/)
      if (marker) {
        if (fence === null) fence = marker[1][0]
        else if (marker[1][0] === fence) fence = null
        return line.replace(/[^\r\n]/g, ' ')
      }
      if (fence !== null) return line.replace(/[^\r\n]/g, ' ')
      return line
    })
    .join('')
    .replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\r\n]/g, ' '))

  return maskInlineCode(withoutBlocks)
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length
}

function normalizeLinkTarget(rawTarget) {
  let target = rawTarget.trim()
  if (target.startsWith('<')) {
    const closing = target.indexOf('>')
    if (closing === -1) return null
    target = target.slice(1, closing)
  } else {
    target = target.split(/\s+["'(]/, 1)[0]
  }

  if (
    target === '' ||
    target.startsWith('#') ||
    target.startsWith('//') ||
    isAbsolute(target) ||
    /^[a-z][a-z\d+.-]*:/i.test(target)
  ) {
    return null
  }

  target = target.split('#', 1)[0].split('?', 1)[0]
  try {
    return decodeURIComponent(target)
  } catch {
    return target
  }
}

function extractInlineLinks(text) {
  const links = []
  const opener = /!?\[[^\]\n]*\]\(/g

  for (const match of text.matchAll(opener)) {
    const openingParen = match.index + match[0].length - 1
    let depth = 1
    let inAngleTarget = false
    let escaped = false
    let cursor = openingParen + 1

    for (; cursor < text.length; cursor += 1) {
      const char = text[cursor]
      if (char === '\n' || char === '\r') break
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === '<' && depth === 1) {
        inAngleTarget = true
        continue
      }
      if (char === '>' && inAngleTarget) {
        inAngleTarget = false
        continue
      }
      if (inAngleTarget) continue
      if (char === '(') depth += 1
      if (char === ')') {
        depth -= 1
        if (depth === 0) break
      }
    }

    if (depth === 0) {
      links.push({ rawTarget: text.slice(openingParen + 1, cursor), index: match.index })
    }
  }

  return links
}

function extractLocalLinks(sourcePath, text) {
  const maskedText = maskNonLinkMarkdown(text)
  const links = []
  const patterns = [
    /^\s{0,3}\[[^\]\n]+\]:\s*(<[^>\n]+>|\S+)/gm,
    /<(?:a|img)\b[^>]*?\b(?:href|src)=["']([^"']+)["'][^>]*>/gi,
  ]

  for (const match of extractInlineLinks(maskedText)) {
    const target = normalizeLinkTarget(match.rawTarget)
    if (target === null) continue
    links.push({
      target,
      line: lineNumberAt(maskedText, match.index),
      resolvedPath: resolve(dirname(sourcePath), target),
    })
  }

  for (const pattern of patterns) {
    for (const match of maskedText.matchAll(pattern)) {
      const target = normalizeLinkTarget(match[1])
      if (target === null) continue
      links.push({
        target,
        line: lineNumberAt(maskedText, match.index),
        resolvedPath: resolve(dirname(sourcePath), target),
      })
    }
  }

  return links
}

function findCapsuleViolation(path) {
  const normalizedPath = path.replaceAll('\\', '/')
  if (ALLOWED_CAPSULE_PATHS.has(normalizedPath)) return null
  return CAPSULE_NAME_RULES.find(({ pattern }) => pattern.test(basename(normalizedPath))) ?? null
}

function inspectRepository() {
  const issues = []
  const missingAuthorityPaths = new Set()

  for (const [path, role] of REQUIRED_AUTHORITIES) {
    const absolutePath = resolve(REPO_ROOT, path)
    if (!existsSync(absolutePath)) {
      missingAuthorityPaths.add(absolutePath)
      issues.push(`Missing required authority: ${path} (${role}). Restore the canonical owner instead of adding a substitute capsule.`)
    }
  }

  const markdownFiles = collectMarkdownFiles(REPO_ROOT)
  for (const absolutePath of markdownFiles) {
    const path = repoPath(absolutePath)
    const rule = findCapsuleViolation(path)
    if (rule) issues.push(`Forbidden duplicate capsule: ${path}. ${rule.owner}`)
  }

  let checkedLinks = 0
  const checkedEntrypoints = new Set(MARKDOWN_ENTRYPOINTS)
  for (const path of checkedEntrypoints) {
    const absolutePath = resolve(REPO_ROOT, path)
    if (!existsSync(absolutePath)) {
      if (!missingAuthorityPaths.has(absolutePath)) {
        issues.push(`Missing Markdown entrypoint: ${path}. Restore it or remove it from the authority check intentionally.`)
      }
      continue
    }

    let text
    try {
      text = readFileSync(absolutePath, 'utf8')
    } catch (error) {
      issues.push(`Cannot read Markdown entrypoint: ${path} (${error.message}).`)
      continue
    }

    for (const link of extractLocalLinks(absolutePath, text)) {
      checkedLinks += 1
      if (!existsSync(link.resolvedPath) && !missingAuthorityPaths.has(link.resolvedPath)) {
        issues.push(`Broken local link: ${path}:${link.line} -> ${link.target} (resolved as ${repoPath(link.resolvedPath)}).`)
      }
    }
  }

  return {
    issues,
    requiredAuthorities: REQUIRED_AUTHORITIES.length,
    checkedEntrypoints: checkedEntrypoints.size,
    checkedLinks,
    markdownFiles: markdownFiles.length,
  }
}

function runAuthorityCheck() {
  const result = inspectRepository()
  if (result.issues.length > 0) {
    console.error('[docs-authority-check] failures:')
    for (const issue of result.issues) console.error(`- ${issue}`)
    console.error(`[docs-authority-check] NG: ${result.issues.length} issue(s). Fix the canonical owner or the source link; do not add a parallel status capsule.`)
    return false
  }

  console.log(
    `[docs-authority-check] OK: ${result.requiredAuthorities} required authorities, ${result.checkedEntrypoints} Markdown entrypoints, ${result.checkedLinks} local links, ${result.markdownFiles} Markdown filenames`,
  )
  return true
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(SCRIPT_PATH)) {
  if (!runAuthorityCheck()) process.exitCode = 1
}

export { collectMarkdownFiles, extractLocalLinks, findCapsuleViolation, inspectRepository, maskNonLinkMarkdown, normalizeLinkTarget }

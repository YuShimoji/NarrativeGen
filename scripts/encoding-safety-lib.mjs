import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

export const ROOTS = ['apps', 'packages', 'docs', 'scripts']
export const TARGET_FILE_NAMES = new Set(['package.json', '.gitattributes', '.editorconfig'])
export const TEXT_EXTS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.md', '.css', '.html', '.yml', '.yaml'])

const EXCLUDED_DIR_PARTS = [
  join('node_modules'),
  join('.git'),
  join('dist'),
  join('bin'),
  join('obj'),
  join('playwright-report'),
  join('docs', 'reports'),
  join('docs', 'inbox'),
]

const CRITICAL_FILES = new Set([
  normalize('package.json'),
  normalize('docs/spec-index.json'),
  normalize('docs/TECHNICAL_DEBT.md'),
])

const MOJIBAKE_MARKERS = [
  '鬯ｩ',
  '鬩幃',
  '垓驛｢',
  '繝ｻ・ｽ',
  '驛｢譎｢',
  '鬯ｯ・ｯ',
  '鬩幢ｽ｢隴趣ｽ｢',
]

export function shouldSkip(path) {
  const normalized = normalize(path)
  return EXCLUDED_DIR_PARTS.some((part) => normalized.includes(part))
}

export function isTextTarget(path) {
  const ext = extname(path).toLowerCase()
  const filename = normalize(path).split(/[\\/]/).pop()
  return TEXT_EXTS.has(ext) || TARGET_FILE_NAMES.has(filename)
}

export function collectFiles(root, out, options = {}) {
  const skipFiles = new Set((options.skipFiles || []).map((file) => normalize(file)))
  let entries = []

  try {
    entries = readdirSync(root)
  } catch {
    return
  }

  for (const name of entries) {
    const path = join(root, name)
    if (shouldSkip(path)) continue

    let st
    try {
      st = statSync(path)
    } catch {
      continue
    }

    if (st.isDirectory()) {
      collectFiles(path, out, options)
      continue
    }

    if (skipFiles.has(normalize(path))) continue
    if (isTextTarget(path)) out.push(path)
  }
}

export function collectRepoFiles(options = {}) {
  const files = []
  for (const root of ROOTS) collectFiles(root, files, options)

  const skipFiles = new Set((options.skipFiles || []).map((file) => normalize(file)))
  for (const file of TARGET_FILE_NAMES) {
    if (files.includes(file) || skipFiles.has(normalize(file))) continue

    try {
      statSync(file)
      files.push(file)
    } catch {
      // ignore missing optional files
    }
  }

  return files
}

export function scanFiles(files) {
  const hardFail = []
  const warnings = []

  for (const file of files) {
    let text
    try {
      text = readFileSync(file, 'utf8')
    } catch (error) {
      hardFail.push(`${file}: read error (${error.message})`)
      continue
    }

    if (text.includes('\uFFFD')) {
      hardFail.push(`${file}: contains replacement character (U+FFFD)`)
    }

    const normalizedFile = normalize(file)
    const isCritical = CRITICAL_FILES.has(normalizedFile)
    const hasMojibake = MOJIBAKE_MARKERS.some((marker) => text.includes(marker))

    if (hasMojibake) {
      const message = `${file}: suspicious mojibake pattern detected`
      if (isCritical) hardFail.push(message)
      else warnings.push(message)
    }

    const ext = extname(file).toLowerCase()
    const isJsonLike = ext === '.json' || ext === '.yml' || ext === '.yaml' || normalizedFile === normalize('package.json')
    if (isJsonLike && /`[rn]/.test(text)) {
      const message = `${file}: literal backtick escape detected in config`
      if (isCritical) hardFail.push(message)
      else warnings.push(message)
    }
  }

  return { hardFail, warnings, scannedCount: files.length }
}
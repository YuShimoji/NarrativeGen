import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const studioRoot = resolve(import.meta.dirname, '..', 'public', 'studio')
const adapterRoot = resolve(import.meta.dirname, '..')
const forbiddenPatterns = [
  ['AI service name', /\bOpenAI\b/i],
  ['API credential prompt', /API[ _-]?Key/i],
  ['AI settings label', /AI設定|AI支援機能/i],
  ['payment flow', /\bpayment\b/i],
  ['checkout flow', /\bcheckout\b/i],
  ['card data', /\bcard(?:holder|[-_ ]?data)?\b/i],
  ['subscription flow', /\bsubscription\b/i],
  ['payment vendor', /\bStripe\b/i],
  ['debug surface', /\bdebug\b/i],
]

async function collectFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await collectFiles(path)))
    else files.push(path)
  }
  return files.sort()
}

const files = await collectFiles(studioRoot)
const indexPath = resolve(studioRoot, 'index.html')
const html = await readFile(indexPath, 'utf8')
const executableAssets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1])

if (files.length !== 3) throw new Error(`Expected three embedded payload files, found ${files.length}`)
if (executableAssets.length !== 2) throw new Error('Expected one JavaScript and one CSS reference')
if (executableAssets.some((reference) => reference.startsWith('/') || /^https?:/i.test(reference))) {
  throw new Error(`Embedded assets must stay relative: ${executableAssets.join(', ')}`)
}
if (/<form\b/i.test(html) || /type=["'](?:email|password|tel)["']/i.test(html)) {
  throw new Error('Embedded Studio contains a forbidden account or personal-data form surface')
}
if (/<script\b[^>]*\bsrc=["']https?:|<link\b[^>]*\bhref=["']https?:/i.test(html)) {
  throw new Error('Embedded Studio contains an external script or style reference')
}
if (!/id="commercial-contact"[^>]*\bhidden\b/i.test(html)) {
  throw new Error('Commercial contact link must remain hidden')
}

const hosting = JSON.parse(await readFile(resolve(adapterRoot, '.openai', 'hosting.json'), 'utf8'))
const hostingKeys = Object.keys(hosting).sort()
if (JSON.stringify(hostingKeys) !== JSON.stringify(['d1', 'r2']) || hosting.d1 !== null || hosting.r2 !== null) {
  throw new Error('Hosting manifest must contain only null d1 and r2 bindings before provisioning')
}

const violations = []
for (const file of files) {
  const content = await readFile(file, 'utf8')
  for (const [label, pattern] of forbiddenPatterns) {
    if (pattern.test(content)) violations.push(`${label}: ${file}`)
  }
}
if (violations.length > 0) throw new Error(`Forbidden adapter terms found:\n${violations.join('\n')}`)

const totalBytes = (await Promise.all(files.map(async (file) => (await stat(file)).size))).reduce(
  (total, bytes) => total + bytes,
  0,
)
console.log(
  JSON.stringify(
    {
      verdict: 'pass',
      files: files.length,
      totalBytes,
      executableAssets,
      forbiddenPatterns: forbiddenPatterns.length,
      hostingManifest: { d1: hosting.d1, r2: hosting.r2, projectIdPresent: 'project_id' in hosting },
    },
    null,
    2,
  ),
)

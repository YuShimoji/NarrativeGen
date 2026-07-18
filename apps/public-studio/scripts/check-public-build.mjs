import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const distDirectory = resolve(import.meta.dirname, '..', 'dist')
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.map', '.txt'])
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
  return files
}

function extension(path) {
  const match = path.match(/\.[^.\\/]+$/)
  return match?.[0]?.toLowerCase() ?? ''
}

const indexPath = resolve(distDirectory, 'index.html')
const indexInfo = await stat(indexPath)
if (!indexInfo.isFile()) throw new Error('dist/index.html was not generated')

const files = await collectFiles(distDirectory)
const indexHtml = await readFile(indexPath, 'utf8')
const assetReferences = [...indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1])
const executableAssets = assetReferences.filter((reference) => /\.(?:css|js)(?:$|\?)/.test(reference))

if (executableAssets.length < 2) {
  throw new Error('Built index does not reference both JavaScript and CSS assets')
}
if (executableAssets.some((reference) => reference.startsWith('/') || /^https?:/i.test(reference))) {
  throw new Error(`Built assets must use relative paths: ${executableAssets.join(', ')}`)
}
if (indexHtml.includes('/src/main.js')) {
  throw new Error('Built index still points to the source entry')
}

const violations = []
for (const file of files) {
  if (!textExtensions.has(extension(file))) continue
  const content = await readFile(file, 'utf8')
  for (const [label, pattern] of forbiddenPatterns) {
    if (pattern.test(content)) violations.push(`${label}: ${file.slice(distDirectory.length + 1)}`)
  }
}

if (violations.length > 0) {
  throw new Error(`Forbidden public-build terms found:\n${violations.join('\n')}`)
}

const totalBytes = (await Promise.all(files.map(async (file) => (await stat(file)).size))).reduce(
  (total, size) => total + size,
  0,
)
console.log(
  JSON.stringify(
    {
      verdict: 'pass',
      distDirectory,
      files: files.length,
      totalBytes,
      executableAssets,
      forbiddenPatterns: forbiddenPatterns.length,
    },
    null,
    2,
  ),
)

import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

const adapterRoot = resolve(import.meta.dirname, '..')
const canonicalRoot = resolve(adapterRoot, '..', 'public-studio', 'dist')
const embeddedRoot = resolve(adapterRoot, 'public', 'studio')
const manifestPath = resolve(adapterRoot, 'public-studio-payload.sha256.json')

function assertContained(root, target) {
  const relation = relative(root, target)
  if (relation === '' || (!relation.startsWith(`..${sep}`) && relation !== '..')) return
  throw new Error(`Refusing path outside adapter root: ${target}`)
}

function toPosix(path) {
  return path.split(sep).join('/')
}

async function collectFiles(root, directory = root) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await collectFiles(root, path)))
    else files.push(toPosix(relative(root, path)))
  }
  return files.sort()
}

async function digest(path) {
  const bytes = await readFile(path)
  return {
    bytes: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

async function canonicalFiles() {
  const files = await collectFiles(canonicalRoot)
  const html = await readFile(resolve(canonicalRoot, 'index.html'), 'utf8')
  const assetReferences = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"?]+\.(?:js|css))"/g)].map(
    (match) => match[1].slice(2),
  )
  const expected = ['index.html', ...assetReferences].sort()

  if (assetReferences.filter((path) => path.endsWith('.js')).length !== 1) {
    throw new Error('Canonical build must reference exactly one JavaScript asset')
  }
  if (assetReferences.filter((path) => path.endsWith('.css')).length !== 1) {
    throw new Error('Canonical build must reference exactly one CSS asset')
  }
  if (files.length !== 3 || JSON.stringify(files) !== JSON.stringify(expected)) {
    throw new Error(`Canonical build must contain only index.html and its two assets: ${files.join(', ')}`)
  }
  return files
}

async function buildManifest(files) {
  return {
    version: 1,
    algorithm: 'sha256',
    files: await Promise.all(
      files.map(async (path) => ({
        source: `apps/public-studio/dist/${path}`,
        target: `public/studio/${path}`,
        ...(await digest(resolve(canonicalRoot, path))),
      })),
    ),
  }
}

async function syncPayload() {
  const files = await canonicalFiles()
  assertContained(adapterRoot, embeddedRoot)
  await rm(embeddedRoot, { recursive: true, force: true })
  for (const path of files) {
    const target = resolve(embeddedRoot, path)
    assertContained(embeddedRoot, target)
    await mkdir(resolve(target, '..'), { recursive: true })
    await copyFile(resolve(canonicalRoot, path), target)
  }
  const manifest = await buildManifest(files)
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return manifest
}

async function readManifest() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (manifest.version !== 1 || manifest.algorithm !== 'sha256' || !Array.isArray(manifest.files)) {
    throw new Error('Payload manifest schema is invalid')
  }
  if (manifest.files.length !== 3) throw new Error('Payload manifest must contain exactly three files')
  for (const entry of manifest.files) {
    if (!/^apps\/public-studio\/dist\/(?:index\.html|assets\/[^/]+\.(?:js|css))$/.test(entry.source)) {
      throw new Error(`Payload manifest source is outside the canonical build: ${entry.source}`)
    }
    if (!/^public\/studio\/(?:index\.html|assets\/[^/]+\.(?:js|css))$/.test(entry.target)) {
      throw new Error(`Payload manifest target is outside the embedded Studio: ${entry.target}`)
    }
    if (!Number.isInteger(entry.bytes) || entry.bytes < 1 || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw new Error(`Payload manifest digest metadata is invalid: ${entry.target}`)
    }
  }
  return manifest
}

async function verifyFile(path, expected, label) {
  const actual = await digest(path)
  if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
    throw new Error(`${label} drifted: ${path}`)
  }
}

async function verifyPayload({ embeddedOnly }) {
  const manifest = await readManifest()
  const expectedEmbedded = manifest.files.map((entry) => entry.target.replace(/^public\/studio\//, '')).sort()
  const actualEmbedded = await collectFiles(embeddedRoot)
  if (JSON.stringify(actualEmbedded) !== JSON.stringify(expectedEmbedded)) {
    throw new Error(`Embedded payload file set drifted: ${actualEmbedded.join(', ')}`)
  }

  if (!embeddedOnly) {
    const currentCanonical = await canonicalFiles()
    const recordedCanonical = manifest.files.map((entry) => entry.source.replace(/^apps\/public-studio\/dist\//, '')).sort()
    if (JSON.stringify(currentCanonical) !== JSON.stringify(recordedCanonical)) {
      throw new Error('Canonical payload file set differs from the recorded manifest')
    }
  }

  for (const entry of manifest.files) {
    await verifyFile(resolve(adapterRoot, entry.target), entry, 'Embedded payload')
    if (!embeddedOnly) {
      await verifyFile(resolve(adapterRoot, '..', '..', entry.source), entry, 'Canonical payload')
    }
  }
  return manifest
}

const mode = process.argv[2]
if (!['--write', '--check', '--embedded-only'].includes(mode)) {
  throw new Error('Usage: sync-public-studio.mjs --write|--check|--embedded-only')
}

const manifest = mode === '--write' ? await syncPayload() : await verifyPayload({ embeddedOnly: mode === '--embedded-only' })
console.log(JSON.stringify({ verdict: 'pass', mode, files: manifest.files }, null, 2))

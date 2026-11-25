// Write the expected screen frames (SP-SCREEN-001) for fixed routes.
// The TypeScript engine is the reference; the C# SDK test
// (packages/tests/NarrativeGen.Tests/ScreenFrameConformanceTests.cs) and other
// renderers compare their frames with these files.
//   node scripts/generate-screen-frames.mjs          write the files
//   node scripts/generate-screen-frames.mjs --check  fail when a file is stale
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadModel, playScreenFrames } from '../packages/engine-ts/dist/index.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'packages/tests/NarrativeGen.Tests/ScreenFrames')

export const ROUTES = [
  { name: 'brass-weight', model: 'models/generated/brass-weight.json', path: ['look_baker', 'tell_baker_clerk', 'look_clerk', 'verify_baker'] },
  { name: 'blue-selvedge', model: 'models/examples/blue-selvedge.json', path: ['go_loom', 'ask_thread', 'go_cloth', 'match_thread', 'go_desk', 'give_maker'] },
  { name: 'ebb-stair', model: 'models/examples/ebb-stair.json', path: ['go_steps', 'wait', 'read', 'signal'] },
  { name: 'cheeseburger-weight', model: 'models/generated/cheeseburger-weight.json', path: ['look_detective_a', 'verify_detective_a'] },
]

export function routeDocument(route) {
  const model = loadModel(JSON.parse(readFileSync(join(root, route.model), 'utf8')))
  const options = route.layout ? { layout: route.layout } : {}
  return {
    format: 'narrativegen-screen-route',
    version: 1,
    model: route.model,
    ...(route.layout ? { layout: route.layout } : {}),
    path: route.path,
    frames: playScreenFrames(model, route.path, options),
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes('--check')
  let stale = 0
  for (const route of ROUTES) {
    const file = join(outDir, `${route.name}.json`)
    const body = JSON.stringify(routeDocument(route), null, 2) + '\n'
    if (check) {
      if (!existsSync(file) || readFileSync(file, 'utf8') !== body) { console.error(`stale: ${file}`); stale++ }
    } else {
      writeFileSync(file, body)
      console.log(`wrote ${file}`)
    }
  }
  if (stale) process.exit(1)
}

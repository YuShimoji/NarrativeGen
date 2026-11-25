import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { stripGeneratedChoiceLabels } from './src/edit.js'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = path.resolve(rootDir, '../../')
const modelsRoot = path.resolve(repoRoot, 'models')

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 5_000_000) reject(new Error('too large'))
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

/**
 * Dev-only save route. Writes an edited model back to an existing JSON file
 * under models/, after the same schema and integrity check the engine uses.
 */
function studioSave() {
  return {
    name: 'narrativegen-studio-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__studio/save', async (req, res) => {
        const reply = (status, data) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(data))
        }
        if (req.method !== 'POST') return reply(405, { ok: false, error: 'POST only' })
        try {
          const { file, model } = JSON.parse(await readBody(req))
          const target = path.resolve(repoRoot, String(file ?? ''))
          if (!target.startsWith(modelsRoot + path.sep) || !target.endsWith('.json')) {
            return reply(400, { ok: false, error: 'models/ 配下のJSONだけ保存できます' })
          }
          if (!fs.existsSync(target)) return reply(404, { ok: false, error: '元のファイルがありません' })
          const { loadModel } = await import('@narrativegen/engine-ts')
          try {
            loadModel(structuredClone(model))
          } catch (err) {
            return reply(422, { ok: false, error: err instanceof Error ? err.message : String(err) })
          }
          const before = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n')
          const reformatted = JSON.stringify(JSON.parse(before), null, 2) + '\n' !== before
          fs.writeFileSync(target, JSON.stringify(model, null, 2) + '\n', 'utf8')
          return reply(200, { ok: true, file: path.relative(repoRoot, target).replace(/\\/g, '/'), reformatted })
        } catch (err) {
          return reply(500, { ok: false, error: err instanceof Error ? err.message : String(err) })
        }
      })
    },
  }
}

/**
 * Dev-only route for stories built from a premise. models/generated stays rebuildable,
 * so a story the author wants to edit is copied to models/examples/ under a free name
 * (and to the legacy tester's mirror, which check:models-sync compares).
 */
function studioGrow() {
  return {
    name: 'narrativegen-studio-grow',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__studio/grow', async (req, res) => {
        const reply = (status, data) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(data))
        }
        if (req.method !== 'POST') return reply(405, { ok: false, error: 'POST only' })
        try {
          const { file, model } = JSON.parse(await readBody(req))
          const source = path.resolve(repoRoot, String(file ?? ''))
          const generatedRoot = path.resolve(modelsRoot, 'generated')
          if (!source.startsWith(generatedRoot + path.sep) || !source.endsWith('.json') || !fs.existsSync(source)) {
            return reply(400, { ok: false, error: 'models/generated/ の物語だけ写せます' })
          }
          const { loadModel } = await import('@narrativegen/engine-ts')
          try {
            loadModel(structuredClone(model))
          } catch (err) {
            return reply(422, { ok: false, error: err instanceof Error ? err.message : String(err) })
          }
          const examples = path.resolve(modelsRoot, 'examples')
          const base = path.basename(source, '.json')
          let name = base
          for (let n = 2; fs.existsSync(path.resolve(examples, `${name}.json`)); n += 1) name = `${base}-${n}`
          // the copy will be edited by hand, so the generator's probability labels would go stale
          stripGeneratedChoiceLabels(model)
          const text = JSON.stringify(model, null, 2) + '\n'
          fs.writeFileSync(path.resolve(examples, `${name}.json`), text, 'utf8')
          const mirror = path.resolve(repoRoot, 'apps/web-tester/models/examples')
          if (fs.existsSync(mirror)) fs.writeFileSync(path.resolve(mirror, `${name}.json`), text, 'utf8')
          return reply(200, { ok: true, file: `models/examples/${name}.json`, model })
        } catch (err) {
          return reply(500, { ok: false, error: err instanceof Error ? err.message : String(err) })
        }
      })
    },
  }
}

export default defineConfig({
  root: rootDir,
  base: './',
  plugins: [studioSave(), studioGrow()],
  resolve: {
    alias: {
      // use the engine source directly so the Studio always shows current semantics
      '@narrativegen/engine-ts/browser': path.resolve(repoRoot, 'packages/engine-ts/src/browser.ts'),
    },
  },
  server: { fs: { allow: [repoRoot] } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    rolldownOptions: {
      input: [
        path.join(rootDir, 'index.html'),
        path.join(rootDir, 'testimony-scene.html'),
      ],
    },
  },
  publicDir: false,
})

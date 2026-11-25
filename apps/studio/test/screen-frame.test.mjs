// The screen frame (SP-SCREEN-001) must describe what the Studio inquiry window
// draws. Render ferryWindow for every step of the fixed routes and compare the
// speaker, place, linked topic words, menu order and note count with the frame.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildScreenFrame, loadModel, traceStart, traceStep } from '@narrativegen/engine-ts'
import { ROUTES } from '../../../scripts/generate-screen-frames.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../../..')

// ash-ferry.js imports its stylesheet; load it without the CSS for Node.
async function loadFerry() {
  const src = join(here, '../src/ash-ferry.js')
  const code = readFileSync(src, 'utf8')
    .replace("import './ash-ferry.css'", '')
    .replace(/from '\.\/([^']+)'/g, (_, f) => `from '${pathToFileURL(join(here, '../src', f)).href}'`)
  return import(`data:text/javascript,${encodeURIComponent(code)}`)
}

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
const between = (html, start, end) => {
  const i = html.indexOf(start)
  return i < 0 ? '' : html.slice(i + start.length, html.indexOf(end, i + start.length))
}

test('screen frames match the Studio inquiry window on every step', async () => {
  const { ferryWindow } = await loadFerry()
  for (const route of ROUTES) {
    const model = loadModel(JSON.parse(readFileSync(join(root, route.model), 'utf8')))
    if (model.variables?.['表示形式'] !== '聞き込み') continue
    const steps = [traceStart(model)]
    for (let i = 0; i <= route.path.length; i++) {
      if (i > 0) {
        const last = steps[steps.length - 1]
        steps.push(traceStep(last.session, model, route.path[i - 1], last.templateUsage))
      }
      const html = ferryWindow(model, steps[steps.length - 1], steps)
      const frame = buildScreenFrame(model, steps)
      const where = `${route.name} step ${i}`

      assert.equal(decode(between(html, 'class="ferry-speaker" tabindex="-1">', '</h2>')), frame.speaker, where)
      assert.equal(decode(between(html, '<i aria-hidden="true"></i><span>', '</span></div>')), frame.place, where)
      assert.equal(decode(between(html, '<h1>', '</h1>')), frame.header.title, where)

      const prose = between(html, '<div class="ferry-prose">', '</div>')
      const linked = [...prose.matchAll(/data-choice="([^"]+)"/g)].map((m) => m[1])
      assert.deepEqual(linked, frame.paragraphs.flat().filter((s) => s.choiceId).map((s) => s.choiceId), where)
      assert.equal(decode(prose.replace(/<[^>]+>/g, '')), frame.paragraphs.map((p) => p.map((s) => s.text).join('')).join(''), where)
      assert.equal((prose.match(/<p>/g) ?? []).length, frame.paragraphs.length, where)

      const menu = between(html, '<nav class="ferry-menu"', '</nav>')
      const menuIds = [...menu.matchAll(/data-choice="([^"]+)"/g)].map((m) => m[1])
      assert.deepEqual(menuIds, frame.choiceGroups.flatMap((g) => g.choices.map((c) => c.id)), where)
      const asked = [...menu.matchAll(/class="ferry-topic asked" data-choice="([^"]+)"/g)].map((m) => m[1])
      assert.deepEqual(asked, frame.choiceGroups.filter((g) => g.role === 'topic').flatMap((g) => g.choices.filter((c) => c.visited).map((c) => c.id)), where)

      assert.equal(Number(between(html, '旅の手帳<span>', '</span>')), frame.notes.length + 1, where)
      assert.equal(html.includes('旅の手帳に記した'), frame.newNote, where)
      assert.equal(html.includes('<span>結末</span>'), frame.ending, where)
    }
  }
})

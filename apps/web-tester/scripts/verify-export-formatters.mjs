import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CsvFormatter } from '../src/features/export/formatters/CsvFormatter.js'
import { InkFormatter } from '../src/features/export/formatters/InkFormatter.js'
import { TwineFormatter } from '../src/features/export/formatters/TwineFormatter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sampleModel = JSON.parse(
  readFileSync(resolve(__dirname, '../../../models/examples/branching_flags.json'), 'utf8')
)

function testTwineFormatter() {
  const formatter = new TwineFormatter()
  const output = formatter.format(sampleModel)

  assert.match(output, /^:: StoryTitle/m)
  assert.match(output, /:: start/m)
  assert.match(output, /\[\[Search for a key->hall\]\]/)
  assert.match(output, /\[\[Force the door->bruise\]\]/)
}

function testInkFormatter() {
  const formatter = new InkFormatter()
  const output = formatter.format(sampleModel)

  assert.match(output, /^-> start/m)
  assert.match(output, /^=== start ===/m)
  assert.match(output, /\* \[Search for a key\] -> hall/)
  assert.match(output, /\* \[Force the door\] -> bruise/)
  assert.match(output, /-> END/)
}

function testCsvFormatter() {
  const formatter = new CsvFormatter()
  const output = formatter.format(sampleModel)

  assert.match(output, /^id,text,choices$/m)
  assert.match(output, /^"start","A locked door blocks your way\."/m)
  assert.match(output, /"hall","You found a key in the hall\."/)
}

function testInvalidModels() {
  const twineFormatter = new TwineFormatter()
  const inkFormatter = new InkFormatter()
  const csvFormatter = new CsvFormatter()

  assert.throws(() => twineFormatter.format(null), /Invalid model/)
  assert.throws(() => inkFormatter.format({}), /Invalid model/)
  assert.equal(csvFormatter.format(null), 'id,text,choices\n')
}

testTwineFormatter()
testInkFormatter()
testCsvFormatter()
testInvalidModels()

console.log('verify-export-formatters: all checks passed')

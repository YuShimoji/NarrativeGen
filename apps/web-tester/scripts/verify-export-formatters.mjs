import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CsvFormatter } from '../src/features/export/formatters/CsvFormatter.js'
import { InkFormatter } from '../src/features/export/formatters/InkFormatter.js'
import { TwineFormatter } from '../src/features/export/formatters/TwineFormatter.js'
import { YarnFormatter } from '../src/features/export/formatters/YarnFormatter.js'

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

function testYarnFormatter() {
  const formatter = new YarnFormatter()
  const output = formatter.format(sampleModel)

  // Variable declarations from model.flags
  assert.match(output, /<<declare \$hasKey = false>>/)

  // Start redirect node
  assert.match(output, /^title: Start$/m)
  assert.match(output, /<<jump start>>/)

  // Story nodes with Yarn structure
  assert.match(output, /^title: start$/m)
  assert.match(output, /^---$/m)
  assert.match(output, /A locked door blocks your way\./)
  assert.match(output, /^===$/m)

  // Choices with -> syntax
  assert.match(output, /-> Search for a key/)
  assert.match(output, /-> Force the door/)

  // Effects mapped to <<set>>
  assert.match(output, /<<set \$hasKey to true>>/)

  // Jumps
  assert.match(output, /<<jump hall>>/)
  assert.match(output, /<<jump bruise>>/)
}

function testYarnFormatterConditions() {
  const formatter = new YarnFormatter()
  const modelWithConditions = {
    modelType: 'test',
    startNode: 'a',
    nodes: {
      a: {
        id: 'a',
        text: 'Test node',
        choices: [
          {
            id: 'c1',
            text: 'Guarded choice',
            target: 'b',
            conditions: [{ type: 'flag', key: 'hasKey', value: true }],
            effects: [{ type: 'addResource', key: 'gold', delta: 10 }]
          }
        ]
      },
      b: { id: 'b', text: 'End', choices: [] }
    }
  }
  const output = formatter.format(modelWithConditions)

  assert.match(output, /-> Guarded choice <<if \$hasKey>>/)
  assert.match(output, /<<set \$gold to \$gold \+ 10>>/)
}

function testInvalidModels() {
  const twineFormatter = new TwineFormatter()
  const inkFormatter = new InkFormatter()
  const csvFormatter = new CsvFormatter()
  const yarnFormatter = new YarnFormatter()

  assert.throws(() => twineFormatter.format(null), /Invalid model/)
  assert.throws(() => inkFormatter.format({}), /Invalid model/)
  assert.equal(csvFormatter.format(null), 'id,text,choices\n')
  assert.throws(() => yarnFormatter.format(null), /Invalid model/)
  assert.throws(() => yarnFormatter.format({}), /Invalid model/)
}

testTwineFormatter()
testInkFormatter()
testCsvFormatter()
testYarnFormatter()
testYarnFormatterConditions()
testInvalidModels()

console.log('verify-export-formatters: all checks passed')

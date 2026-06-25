import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CsvFormatter } from '../src/features/export/formatters/CsvFormatter.js'
import { InkFormatter } from '../src/features/export/formatters/InkFormatter.js'
import { TwineFormatter } from '../src/features/export/formatters/TwineFormatter.js'
import { YarnFormatter } from '../src/features/export/formatters/YarnFormatter.js'
import { parseCsvModel } from '../src/utils/model-csv-import.js'

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

  assert.match(output, /^id,speaker,text,choices,model_type,start_node,initial_flags,initial_resources,initial_variables,settings_presentation$/m)
  assert.match(output, /^"start","","A locked door blocks your way\."/m)
  assert.match(output, /"hall","","You found a key in the hall\."/)
  assert.match(output, /"hasKey=false"/)
  assert.match(output, /"start"/)
}

function testCsvFormatterRoundTripShape() {
  const formatter = new CsvFormatter()
  const model = {
    modelType: 'adventure-playthrough',
    startNode: 'start',
    flags: { hasKey: false },
    resources: { focus: 2, evidence: 0 },
    variables: { lead_name: 'the missing bell' },
    settings: {
      presentation: {
        defaultTransition: 'append-scroll',
        paragraphDelay: 60,
        transitionDuration: 180
      }
    },
    nodes: {
      start: {
        id: 'start',
        speaker: 'Narrator',
        text: 'A first line.\n\nA second line.',
        choices: [
          {
            id: 'open',
            text: 'Open',
            target: 'end',
            conditions: [{ type: 'resource', key: 'focus', op: '>=', value: 1 }],
            effects: [{ type: 'addResource', key: 'focus', delta: -1 }]
          }
        ]
      },
      end: { id: 'end', text: 'Done', choices: [] }
    }
  }

  const output = formatter.format(model)
  assert.ok(output.includes('"A first line.\n\nA second line."'))

  const parsed = parseCsvModel(output, { filename: 'roundtrip.csv' })
  assert.equal(parsed.modelType, model.modelType)
  assert.equal(parsed.startNode, model.startNode)
  assert.deepEqual(parsed.flags, model.flags)
  assert.deepEqual(parsed.resources, model.resources)
  assert.deepEqual(parsed.variables, model.variables)
  assert.deepEqual(parsed.settings, model.settings)
  assert.equal(parsed.nodes.start.speaker, 'Narrator')
  assert.equal(parsed.nodes.start.text, 'A first line.\n\nA second line.')
  assert.deepEqual(parsed.nodes.start.choices[0].conditions, model.nodes.start.choices[0].conditions)
  assert.deepEqual(parsed.nodes.start.choices[0].effects, model.nodes.start.choices[0].effects)
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

function testYarnFormatterDynamicTextMinimal() {
  const formatter = new YarnFormatter()
  const model = {
    modelType: 'test',
    startNode: 'start',
    nodes: {
      start: {
        id: 'start',
        text: 'Hello {playerName}. {?hasKey:Door opens.} {?!hasKey:Door is locked.}',
        choices: [
          {
            id: 'c1',
            text: 'Ask {playerName}',
            target: 'end'
          }
        ]
      },
      end: { id: 'end', text: 'End', choices: [] }
    }
  }
  const output = formatter.format(model)

  assert.match(output, /Hello \{\$playerName\}\./)
  assert.match(output, /<<if \$hasKey>>Door opens\.<</)
  assert.match(output, /<<if \$hasKey == false>>Door is locked\.<</)
  assert.match(output, /-> Ask \{\$playerName\}/)
}

function testYarnFormatterDynamicTextEntityAndComparison() {
  const formatter = new YarnFormatter()
  const model = {
    modelType: 'test',
    startNode: 'start',
    entities: {
      npc: {
        id: 'npc',
        name: 'Merchant',
        properties: {
          mood: { key: 'mood', type: 'string', defaultValue: 'calm' },
          gold: { key: 'gold', type: 'number', defaultValue: 99 }
        }
      }
    },
    nodes: {
      start: {
        id: 'start',
        text: 'Talk to [npc]. Mood is [npc.mood]. {?gold>=10:Rich hint.}',
        choices: []
      }
    }
  }
  const output = formatter.format(model)

  assert.match(output, /<<declare \$npc_name = "Merchant">>/)
  assert.match(output, /<<declare \$npc_mood = "calm">>/)
  assert.match(output, /<<declare \$npc_gold = 99>>/)
  assert.match(output, /Talk to \{\$npc_name\}\./)
  assert.match(output, /Mood is \{\$npc_mood\}\./)
  assert.match(output, /<<if \$gold >= 10>>Rich hint\.<<endif>>/)
}

function testInvalidModels() {
  const twineFormatter = new TwineFormatter()
  const inkFormatter = new InkFormatter()
  const csvFormatter = new CsvFormatter()
  const yarnFormatter = new YarnFormatter()

  assert.throws(() => twineFormatter.format(null), /Invalid model/)
  assert.throws(() => inkFormatter.format({}), /Invalid model/)
  assert.equal(
    csvFormatter.format(null),
    'id,speaker,text,choices,model_type,start_node,initial_flags,initial_resources,initial_variables,settings_presentation\n'
  )
  assert.throws(() => yarnFormatter.format(null), /Invalid model/)
  assert.throws(() => yarnFormatter.format({}), /Invalid model/)
}

// --- All-model smoke tests ---
// For every .json model, verify all formatters produce non-empty output
// and that node IDs from the model appear in the output.
import { readdirSync } from 'node:fs'

function testAllModelsAllFormatters() {
  const modelsDir = resolve(__dirname, '../../../models/examples')
  const files = readdirSync(modelsDir).filter(f => f.endsWith('.json'))
  const formatters = [
    { name: 'Twine', inst: new TwineFormatter() },
    { name: 'Ink',   inst: new InkFormatter() },
    { name: 'CSV',   inst: new CsvFormatter() },
    { name: 'Yarn',  inst: new YarnFormatter() },
  ]

  let checks = 0
  for (const f of files) {
    const model = JSON.parse(readFileSync(resolve(modelsDir, f), 'utf8'))
    const nodeIds = Object.keys(model.nodes || {})

    for (const { name, inst } of formatters) {
      const output = inst.format(model)
      assert.ok(output.length > 0, `${name} output for ${f} should be non-empty`)

      // Every node ID should appear somewhere in the output
      for (const id of nodeIds) {
        assert.ok(
          output.includes(id),
          `${name} output for ${f} should contain node ID "${id}"`
        )
      }
      checks++
    }
  }
  console.log(`  all-model smoke: ${checks} checks across ${files.length} models x ${formatters.length} formatters`)
}

testTwineFormatter()
testInkFormatter()
testCsvFormatter()
testCsvFormatterRoundTripShape()
testYarnFormatter()
testYarnFormatterConditions()
testYarnFormatterDynamicTextMinimal()
testYarnFormatterDynamicTextEntityAndComparison()
testInvalidModels()
testAllModelsAllFormatters()

console.log('verify-export-formatters: all checks passed')

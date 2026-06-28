import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyChoice,
  clearSessionCaches,
  createAIProvider,
  getAvailableChoices,
  loadModel,
  resolveNarrativeDisplayText,
  startSession,
} from '@narrativegen/engine-ts'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(appDir, '..', '..')

const sourceModelPath = path.join(repoRoot, 'models', 'examples', 'vertical-slice.json')
const specimenModelPath = path.join(repoRoot, 'docs', 'samples', 'generated-specimen-model.json')
const tracePath = path.join(repoRoot, 'docs', 'samples', 'generated-specimen-route-trace.json')
const readbackPath = path.join(repoRoot, 'docs', 'samples', 'generated-specimen-readback.md')
const reviewPath = path.join(repoRoot, 'docs', 'samples', 'generated-specimen-review-ja.md')

const adoptionNodeId = 'generated_specimen_continuation'
const adoptionChoiceId = 'adopt_generated_specimen'
const connectChoiceId = 'connect_generated_specimen_archive'
const generationRouteToSource = ['open_notebook', 'draft_scene']
const reviewRoute = [
  ...generationRouteToSource,
  adoptionChoiceId,
  connectChoiceId,
  'decode_ledger',
  'publish_with_proof',
]

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/')
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (!value || typeof value !== 'object') return value

  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      result[key] = sortKeys(value[key])
      return result
    }, {})
}

function stableStringify(value) {
  return JSON.stringify(sortKeys(value), null, 2)
}

function modelStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function summarizeChoice(choice) {
  const summary = {
    id: choice.id,
    text: choice.text,
    target: choice.target,
  }

  if (choice.conditions?.length) summary.conditions = choice.conditions
  if (choice.effects?.length) summary.effects = choice.effects
  return summary
}

function captureNode(model, session) {
  const node = model.nodes[session.nodeId]
  if (!node) {
    throw new Error(`Node not found during specimen trace: ${session.nodeId}`)
  }

  const available = getAvailableChoices(session, model)
  const availableIds = new Set(available.map((choice) => choice.id))
  const allChoices = node.choices ?? []

  return {
    nodeId: node.id,
    speaker: node.speaker ?? null,
    rawText: node.text ?? '',
    displayText: resolveNarrativeDisplayText(node.text ?? '', model, session, {
      appendConversationTemplates: false,
    }),
    visibleChoices: available.map(summarizeChoice),
    gatedChoices: allChoices
      .filter((choice) => !availableIds.has(choice.id))
      .map(summarizeChoice),
  }
}

function sameValue(a, b) {
  return stableStringify(a) === stableStringify(b)
}

function diffRecord(before = {}, after = {}) {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  return keys.reduce((changes, key) => {
    if (!sameValue(before[key], after[key])) {
      changes[key] = {
        before: before[key] ?? null,
        after: after[key] ?? null,
      }
    }
    return changes
  }, {})
}

function diffArray(before = [], after = []) {
  return {
    before,
    after,
    added: after.filter((item) => !before.includes(item)),
    removed: before.filter((item) => !after.includes(item)),
  }
}

function diffSession(before, after) {
  const changes = {
    flags: diffRecord(before.flags, after.flags),
    resources: diffRecord(before.resources, after.resources),
    variables: diffRecord(before.variables, after.variables),
    inventory: diffArray(before.inventory, after.inventory),
    events: diffRecord(before.events, after.events),
    time: before.time === after.time ? null : { before: before.time, after: after.time },
  }

  if (changes.inventory.added.length === 0 && changes.inventory.removed.length === 0) {
    delete changes.inventory
  }
  if (Object.keys(changes.events).length === 0) delete changes.events
  if (Object.keys(changes.flags).length === 0) delete changes.flags
  if (Object.keys(changes.resources).length === 0) delete changes.resources
  if (Object.keys(changes.variables).length === 0) delete changes.variables
  if (!changes.time) delete changes.time

  return changes
}

function stateSnapshot(session) {
  return {
    nodeId: session.nodeId,
    flags: session.flags,
    resources: session.resources,
    variables: session.variables,
    inventory: session.inventory,
    time: session.time,
  }
}

function runRoute(model, choiceIds) {
  let session = startSession(model)
  const nodeSequence = [session.nodeId]
  const steps = []

  for (const choiceId of choiceIds) {
    const beforeSession = session
    const fromNode = captureNode(model, beforeSession)
    const selectedChoice = fromNode.visibleChoices.find((choice) => choice.id === choiceId)

    if (!selectedChoice) {
      const visibleIds = fromNode.visibleChoices.map((choice) => choice.id).join(', ') || 'none'
      throw new Error(`Specimen route cannot select ${choiceId} at ${fromNode.nodeId}; visible choices: ${visibleIds}`)
    }

    session = applyChoice(session, model, choiceId)
    nodeSequence.push(session.nodeId)

    steps.push({
      fromNode,
      selectedChoice,
      stateChanges: diffSession(beforeSession, session),
      toNodeId: session.nodeId,
    })
  }

  return {
    choiceIds,
    nodeSequence,
    steps,
    ending: captureNode(model, session),
    finalState: stateSnapshot(session),
  }
}

function buildGenerationContext(model) {
  let session = startSession(model)
  const previousNodes = [captureNode(model, session)]

  for (const choiceId of generationRouteToSource) {
    session = applyChoice(session, model, choiceId)
    previousNodes.push(captureNode(model, session))
  }

  const currentNode = previousNodes.at(-1)
  const leadName = session.variables?.lead_name ?? 'the current lead'

  return {
    sourceNodeId: session.nodeId,
    inputRoute: generationRouteToSource,
    context: {
      previousNodes: previousNodes.slice(0, -1).map((node) => ({
        id: node.nodeId,
        text: node.displayText,
      })),
      currentNodeText: `${currentNode.displayText}\nLead: ${leadName}`,
      choiceText: 'Adopt continuation into the graph',
    },
  }
}

function adoptGeneratedNode(model, generatedText) {
  const specimenModel = clone(model)
  const sourceNode = specimenModel.nodes.drafting
  if (!sourceNode) {
    throw new Error('Expected source node `drafting` to exist in vertical-slice.json')
  }

  sourceNode.choices = [
    ...(sourceNode.choices ?? []),
    {
      id: adoptionChoiceId,
      text: 'Adopt the generated specimen',
      target: adoptionNodeId,
      effects: [
        { type: 'setFlag', key: 'ai_draft_adopted', value: true },
        { type: 'setVariable', key: 'draft_status', value: 'generated specimen adopted' },
      ],
    },
  ]

  specimenModel.nodes[adoptionNodeId] = {
    id: adoptionNodeId,
    text: generatedText,
    choices: [
      {
        id: connectChoiceId,
        text: 'Connect the generated clue to the archive',
        target: 'archive',
        effects: [{ type: 'addResource', key: 'evidence', delta: 2 }],
      },
    ],
  }

  return loadModel(specimenModel)
}

function describeCondition(condition) {
  if (condition.type === 'flag') return `flag ${condition.key}=${condition.value}`
  if (condition.type === 'resource') return `resource ${condition.key} ${condition.op} ${condition.value}`
  if (condition.type === 'variable') return `variable ${condition.key} ${condition.op} ${condition.value}`
  if (condition.type === 'hasItem') return `inventory ${condition.key}=${condition.value}`
  if (condition.type === 'timeWindow') return `time ${condition.start}-${condition.end}`
  if (condition.type === 'property') return `property ${condition.entity}.${condition.key} ${condition.op} ${condition.value}`
  if (condition.type === 'hasEvent') return `event ${condition.key}=${condition.value}`
  if (condition.type === 'and') return `all(${condition.conditions.map(describeCondition).join(', ')})`
  if (condition.type === 'or') return `any(${condition.conditions.map(describeCondition).join(', ')})`
  if (condition.type === 'not') return `not(${describeCondition(condition.condition)})`
  return JSON.stringify(condition)
}

function describeEffect(effect) {
  if (effect.type === 'setFlag') return `set flag ${effect.key}=${effect.value}`
  if (effect.type === 'addResource') return `add resource ${effect.key} ${effect.delta >= 0 ? '+' : ''}${effect.delta}`
  if (effect.type === 'setVariable') return `set variable ${effect.key}=${effect.value}`
  if (effect.type === 'modifyVariable') return `modify variable ${effect.key} ${effect.op} ${effect.value}`
  if (effect.type === 'addItem') return `add item ${effect.key}`
  if (effect.type === 'removeItem') return `remove item ${effect.key}`
  if (effect.type === 'goto') return `goto ${effect.target}`
  if (effect.type === 'createEvent') return `create event ${effect.id}`
  return JSON.stringify(effect)
}

function choiceLine(choice) {
  const conditions = choice.conditions?.length
    ? ` [conditions: ${choice.conditions.map(describeCondition).join('; ')}]`
    : ''
  const effects = choice.effects?.length
    ? ` [effects: ${choice.effects.map(describeEffect).join('; ')}]`
    : ''
  return `\`${choice.id}\` "${choice.text}" -> \`${choice.target}\`${conditions}${effects}`
}

function choiceList(choices) {
  return choices.length ? choices.map(choiceLine).join('; ') : 'none'
}

function stateChangeList(changes) {
  const lines = []
  for (const domain of ['flags', 'resources', 'variables', 'events']) {
    if (!changes[domain]) continue
    for (const [key, change] of Object.entries(changes[domain])) {
      lines.push(`${domain}.${key}: ${JSON.stringify(change.before)} -> ${JSON.stringify(change.after)}`)
    }
  }
  if (changes.inventory) {
    lines.push(`inventory: ${JSON.stringify(changes.inventory.before)} -> ${JSON.stringify(changes.inventory.after)}`)
  }
  if (changes.time) {
    lines.push(`time: ${changes.time.before} -> ${changes.time.after}`)
  }
  return lines.length ? lines.join('; ') : 'none'
}

function quoteText(text) {
  return text
    .split('\n')
    .map((line) => (line.length ? `> ${line.trimEnd()}` : '>'))
    .join('\n')
}

function renderReadback(trace) {
  const lines = [
    '# Generated Specimen Readback',
    '',
    '> Role: detailed technical trace for the generated specimen. For human narrative review, start with `docs/samples/generated-specimen-review-ja.md`.',
    '',
    '## Generator Path',
    '',
    '- Source model: `models/examples/vertical-slice.json`',
    '- Generator: `createAIProvider({ provider: "mock" }).generateNextNode(...)`',
    '- Source node: `drafting` after `open_notebook -> draft_scene`',
    `- Generated node: \`${adoptionNodeId}\``,
    `- Active artifact: \`${trace.artifacts.specimenModelPath}\``,
    '',
    '## Generated Text',
    '',
    quoteText(trace.generatedNode.text),
    '',
    '## Structure Summary',
    '',
    '- The generated node is adopted from `drafting` through `adopt_generated_specimen`.',
    '- The generated node connects back to the existing `archive` route through `connect_generated_specimen_archive`.',
    '- The route then reuses existing proof logic: archive decode, reveal, and proof ending.',
    '',
    '## Detailed Route Trace',
    '',
    `- Choice IDs: ${trace.route.choiceIds.map((id) => `\`${id}\``).join(' -> ')}`,
    `- Node sequence: ${trace.route.nodeSequence.map((id) => `\`${id}\``).join(' -> ')}`,
    `- Ending: \`${trace.route.ending.nodeId}\``,
    '',
    'Ending text:',
    '',
    quoteText(trace.route.ending.displayText),
    '',
  ]

  trace.route.steps.forEach((step, index) => {
    lines.push(
      `${index + 1}. \`${step.fromNode.nodeId}\` (${step.fromNode.speaker ?? 'no speaker'})`,
      '',
      quoteText(step.fromNode.displayText),
      '',
      `   - Visible choices: ${choiceList(step.fromNode.visibleChoices)}`,
      `   - Gated choices: ${choiceList(step.fromNode.gatedChoices)}`,
      `   - Selected: ${choiceLine(step.selectedChoice)}`,
      `   - State changes: ${stateChangeList(step.stateChanges)}`,
      ''
    )
  })

  lines.push(
    '## Assessment Snapshot',
    '',
    '- pass: the generator produces a concrete reachable story node, not only a test assertion.',
    '- warn: the mock prose is formulaic and the structural choice/effect glue is supplied by the specimen builder.',
    '- fix: next bounded slice should make the generator propose richer structure or receive a more explicit story packet.',
    '- defer: OpenAI provider, local LLM, Web Tester redesign, and schema expansion are outside this specimen slice.',
    ''
  )

  return `${lines.join('\n').replace(/\n+$/u, '')}\n`
}

function renderReview(trace) {
  const lines = [
    '# Generated Specimen Japanese Human Review Brief',
    '',
    'この文書が generated specimen の primary human review surface です。生成された最小ストーリー成果物を、人間が「何が生成され、どこが弱いか」を確認できる形で読むための面です。詳細な route trace が必要な場合だけ `docs/samples/generated-specimen-readback.md` を開いてください。',
    '',
    '## Story Brief',
    '',
    '元モデルは `vertical-slice.json` の短い調査物語です。プレイヤーは古いノートを開き、未完成の場面を下書きし、mock generator が作った continuation を graph に採用します。生成されたノードは、時計塔の鐘という手がかりを archive の ledger path に接続し、既存の proof ending まで到達可能にします。',
    '',
    '## 生成された specimen',
    '',
    `- Active artifact: \`${trace.artifacts.specimenModelPath}\``,
    `- Generated node: \`${adoptionNodeId}\``,
    '- Generator path: `MockAIProvider.generateNextNode` from `packages/engine-ts/src/ai-provider.ts`',
    '- Source route: `open_notebook -> draft_scene`',
    '- Review route: `open_notebook -> draft_scene -> adopt_generated_specimen -> connect_generated_specimen_archive -> decode_ledger -> publish_with_proof`',
    '',
    'Generated text:',
    '',
    quoteText(trace.generatedNode.text),
    '',
    '## Route Overview / Structure Summary',
    '',
    '```mermaid',
    'flowchart TD',
    '  desk["desk"] -->|open_notebook| notebook["notebook"]',
    '  notebook -->|draft_scene| drafting["drafting"]',
    `  drafting -->|${adoptionChoiceId}| generated["${adoptionNodeId}"]`,
    `  generated -->|${connectChoiceId}| archive["archive"]`,
    '  archive -->|decode_ledger| reveal["reveal"]',
    '  reveal -->|publish_with_proof| truth["truth_end"]',
    '```',
    '',
    'この構造は、生成ノードが単独の文章で終わらず、既存の playable route に戻れることを示します。`drafting` から生成ノードへ入り、生成された clue が `archive` の証拠ルートに接続されます。',
    '',
    '## 主要登場要素 / 状態変化',
    '',
    '- 主体: 未完成の調査記事を書くプレイヤーと、手がかりを持つ Mira。',
    '- 生成された要素: archive stairs の lantern と、時計塔の鐘を反復する handwriting。',
    '- 接続先: `archive` と ledger decode route。',
    '- `ai_draft_adopted`: generated specimen を採用した時点で `true` になります。',
    '- `draft_status`: `generated specimen adopted` に変わり、下書きが生成ノードとして graph に入ったことを示します。',
    '- `evidence`: generated clue を archive に接続すると `+2` され、既存の proof gate を通れる状態になります。',
    '',
    '## 生成品質メモ',
    '',
    '- pass: 生成例は具体的な node text として存在し、route 上で到達・通過できます。',
    '- pass: 生成結果は既存モデルの proof route に接続され、ending まで読めます。',
    '- warn: mock prose はまだ説明的で、名作品質の本文ではありません。',
    '- warn: node choice/effect は generator ではなく specimen builder が補っています。',
    '- fix: 次の bounded slice では、generator に structured output または story packet を渡し、choice/effect 生成の責務を少しだけ増やす余地があります。',
    '- defer: OpenAI provider、local LLM、Web Tester 大改造、新CSV schema は今回の対象外です。',
    '',
    '## Review-Pack Pattern Note',
    '',
    '- primary review surface: `docs/samples/generated-specimen-review-ja.md`',
    '- detailed trace: `docs/samples/generated-specimen-readback.md`',
    '- machine trace: `docs/samples/generated-specimen-route-trace.json`',
    '- active generated artifact: `docs/samples/generated-specimen-model.json`',
    ''
  ]

  return `${lines.join('\n').replace(/\n+$/u, '')}\n`
}

function buildTrace(sourceModel, specimenModel, generation, generatedText) {
  const route = runRoute(specimenModel, reviewRoute)

  return {
    schemaVersion: 1,
    generatorPath: {
      provider: 'mock',
      entrypoint: 'createAIProvider({ provider: "mock" }).generateNextNode',
      sourceModelPath: toRepoPath(sourceModelPath),
      sourceNodeId: generation.sourceNodeId,
      inputRoute: generation.inputRoute,
      context: generation.context,
    },
    artifacts: {
      specimenModelPath: toRepoPath(specimenModelPath),
      routeTracePath: toRepoPath(tracePath),
      readbackPath: toRepoPath(readbackPath),
      reviewPath: toRepoPath(reviewPath),
    },
    modelDelta: {
      sourceNodeCount: Object.keys(sourceModel.nodes).length,
      specimenNodeCount: Object.keys(specimenModel.nodes).length,
      addedNodeIds: [adoptionNodeId],
      addedChoiceIds: [adoptionChoiceId, connectChoiceId],
    },
    generatedNode: {
      id: adoptionNodeId,
      text: generatedText,
      choices: specimenModel.nodes[adoptionNodeId].choices,
    },
    route,
    assessment: {
      pass: [
        'mock generator output is serialized as a concrete node',
        'generated node is reachable from the existing drafting route',
        'review route reaches the existing proof ending',
      ],
      warn: [
        'mock prose remains formulaic',
        'choice and effect glue is supplied by the specimen builder rather than the provider',
      ],
      fix: [
        'next bounded slice can make generator output structured enough to propose a choice/effect pair',
      ],
      defer: [
        'OpenAI provider, local LLM, schema expansion, and Web Tester redesign',
      ],
    },
  }
}

async function writeIfChanged(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  let existing = null
  try {
    existing = await fs.readFile(filePath, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  if (existing !== content) {
    await fs.writeFile(filePath, content, 'utf8')
    return true
  }
  return false
}

async function checkFile(filePath, expected) {
  let actual
  try {
    actual = await fs.readFile(filePath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`${toRepoPath(filePath)} is missing; run npm run build:generated-specimen -w @narrativegen/web-tester`)
    }
    throw error
  }

  if (actual !== expected) {
    throw new Error(`${toRepoPath(filePath)} is stale; run npm run build:generated-specimen -w @narrativegen/web-tester`)
  }
}

async function main() {
  const checkOnly = process.argv.includes('--check')
  const sourceRaw = JSON.parse(await fs.readFile(sourceModelPath, 'utf8'))
  const sourceModel = loadModel(sourceRaw)
  const generation = buildGenerationContext(sourceModel)
  const provider = createAIProvider({ provider: 'mock' })
  const generatedText = await provider.generateNextNode(generation.context)
  const specimenModel = adoptGeneratedNode(sourceModel, generatedText)
  clearSessionCaches()
  const trace = buildTrace(sourceModel, specimenModel, generation, generatedText)

  const specimenModelContent = modelStringify(specimenModel)
  const traceContent = `${stableStringify(trace)}\n`
  const readbackContent = renderReadback(trace)
  const reviewContent = renderReview(trace)

  if (checkOnly) {
    await checkFile(specimenModelPath, specimenModelContent)
    await checkFile(tracePath, traceContent)
    await checkFile(readbackPath, readbackContent)
    await checkFile(reviewPath, reviewContent)
    console.log('generated specimen artifacts are current')
    return
  }

  const changed = []
  if (await writeIfChanged(specimenModelPath, specimenModelContent)) changed.push(toRepoPath(specimenModelPath))
  if (await writeIfChanged(tracePath, traceContent)) changed.push(toRepoPath(tracePath))
  if (await writeIfChanged(readbackPath, readbackContent)) changed.push(toRepoPath(readbackPath))
  if (await writeIfChanged(reviewPath, reviewContent)) changed.push(toRepoPath(reviewPath))

  if (changed.length) {
    console.log(`updated ${changed.join(', ')}`)
  } else {
    console.log('generated specimen artifacts already current')
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})

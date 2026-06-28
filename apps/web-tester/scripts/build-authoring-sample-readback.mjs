import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyChoice,
  getAvailableChoices,
  loadModel,
  resolveNarrativeDisplayText,
  startSession,
} from '@narrativegen/engine-ts'
import { formatCsvModel } from '../src/utils/model-csv-export.js'
import { parseCsvModel } from '../src/utils/model-csv-import.js'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(appDir, '..', '..')

const fixturePath = path.join(repoRoot, 'models', 'spreadsheets', 'authoring-sample.csv')
const markdownPath = path.join(repoRoot, 'docs', 'samples', 'authoring-sample-readback.md')
const tracePath = path.join(repoRoot, 'docs', 'samples', 'authoring-sample-route-trace.json')

const routes = [
  {
    id: 'launch-proof-route',
    name: 'Launch proof route',
    description: 'Collects invite and poster proof before publishing the launch plan.',
    choiceIds: ['check_mailbox', 'pin_poster', 'invite_mara', 'publish_manifesto', 'open_doors'],
  },
  {
    id: 'quiet-circle-route',
    name: 'Quiet circle route',
    description: 'Starts the meeting without proof and reaches the quiet ending.',
    choiceIds: ['start_without_proof', 'host_quiet_circle'],
  },
  {
    id: 'draft-anyway-route',
    name: 'Draft anyway route',
    description: 'Starts the meeting without proof and reaches the under-evidenced draft ending.',
    choiceIds: ['start_without_proof', 'draft_anyway'],
  },
  {
    id: 'partial-proof-return-route',
    name: 'Partial proof return route',
    description: 'Collects the invite proof, returns before the poster is ready, and shows why publishing stays gated.',
    choiceIds: ['check_mailbox', 'return_to_stage', 'host_quiet_circle'],
  },
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

function sameValue(a, b) {
  return stableStringify(a) === stableStringify(b)
}

function summarizeChoice(choice) {
  const summary = {
    id: choice.id,
    text: choice.text,
    target: choice.target,
  }

  if (choice.conditions?.length) summary.conditions = choice.conditions
  if (choice.effects?.length) summary.effects = choice.effects
  if (choice.outcome) summary.outcome = choice.outcome
  return summary
}

function captureNode(model, session) {
  const node = model.nodes[session.nodeId]
  if (!node) {
    throw new Error(`Node not found during readback: ${session.nodeId}`)
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

function runRoute(model, route) {
  let session = startSession(model)
  const nodeSequence = [session.nodeId]
  const steps = []

  for (const choiceId of route.choiceIds) {
    const beforeSession = session
    const beforeNode = captureNode(model, beforeSession)
    const selectedChoice = beforeNode.visibleChoices.find((choice) => choice.id === choiceId)

    if (!selectedChoice) {
      const visibleIds = beforeNode.visibleChoices.map((choice) => choice.id).join(', ') || 'none'
      throw new Error(`Route ${route.id} cannot select ${choiceId} at ${beforeNode.nodeId}; visible choices: ${visibleIds}`)
    }

    session = applyChoice(session, model, choiceId)
    nodeSequence.push(session.nodeId)

    steps.push({
      fromNode: beforeNode,
      selectedChoice,
      effectsApplied: selectedChoice.effects ?? [],
      stateChanges: diffSession(beforeSession, session),
      toNodeId: session.nodeId,
    })
  }

  const endingNode = captureNode(model, session)
  return {
    id: route.id,
    name: route.name,
    description: route.description,
    choiceIds: route.choiceIds,
    nodeSequence,
    ending: {
      nodeId: session.nodeId,
      speaker: endingNode.speaker,
      displayText: endingNode.displayText,
      rawText: endingNode.rawText,
    },
    finalState: stateSnapshot(session),
    steps,
  }
}

function findChoice(model, nodeId, choiceId) {
  return model.nodes[nodeId]?.choices?.find((choice) => choice.id === choiceId)
}

function buildRoundtripChecks(model, roundTripModel) {
  const frontDeskText = model.nodes.front_desk?.text ?? ''
  const roundTripFrontDeskText = roundTripModel.nodes.front_desk?.text ?? ''
  const publishChoice = findChoice(model, 'stage', 'publish_manifesto')
  const roundTripPublishChoice = findChoice(roundTripModel, 'stage', 'publish_manifesto')
  const pinPosterChoice = findChoice(model, 'mailbox', 'pin_poster')
  const roundTripPinPosterChoice = findChoice(roundTripModel, 'mailbox', 'pin_poster')

  return {
    speakerPreserved: model.nodes.front_desk?.speaker === roundTripModel.nodes.front_desk?.speaker &&
      model.nodes.mailbox?.speaker === roundTripModel.nodes.mailbox?.speaker,
    multilineProsePreserved: frontDeskText === roundTripFrontDeskText && frontDeskText.includes('\n\n'),
    settingsPresentationPreserved: sameValue(model.settings?.presentation, roundTripModel.settings?.presentation),
    publishConditionsPreserved: sameValue(publishChoice?.conditions ?? [], roundTripPublishChoice?.conditions ?? []),
    publishEffectsPreserved: sameValue(publishChoice?.effects ?? [], roundTripPublishChoice?.effects ?? []),
    pinPosterEffectsPreserved: sameValue(pinPosterChoice?.effects ?? [], roundTripPinPosterChoice?.effects ?? []),
  }
}

function assertRoundtripChecks(checks) {
  const failed = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name)

  if (failed.length > 0) {
    throw new Error(`Authoring sample roundtrip checks failed: ${failed.join(', ')}`)
  }
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
  return `\`${choice.id}\` "${choice.text}" -> \`${choice.target}\`${conditions}`
}

function choiceList(choices) {
  return choices.length ? choices.map(choiceLine).join('; ') : 'none'
}

function effectsList(effects) {
  return effects.length ? effects.map(describeEffect).join('; ') : 'none'
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

function checkLine(name, passed) {
  return `- ${name}: ${passed ? 'pass' : 'fail'}`
}

function routeOverview(route) {
  const overview = {
    'launch-proof-route':
      'The player gathers the invite note, pins the poster, spends energy to bring Mara on stage, and can publish because proof, poster readiness, and energy all satisfy the gate. This route demonstrates the intended success path.',
    'quiet-circle-route':
      'The player starts the meeting without proof and chooses a quiet circle. This route demonstrates that the story can continue warmly while the publish choice remains hidden.',
    'draft-anyway-route':
      'The player starts without proof and creates an under-evidenced draft. This route demonstrates a distinct low-proof ending from the same stage pressure.',
    'partial-proof-return-route':
      'The player checks the mailbox, returns before pinning the poster, and still cannot publish. This route demonstrates that partial proof is not enough when poster readiness is missing.',
  }

  return overview[route.id] ?? route.description
}

function renderMarkdown(trace) {
  const lines = [
    '# Authoring Sample Story Readback',
    '',
    '## Story Brief',
    '',
    'This fixture is a small Mara-centered community-room story about trying to make a neighborhood repair plan credible before a meeting begins. The player can gather an invite note, pin a poster, bring Mara to the stage, or begin without enough proof. The main pressure is whether the plan has enough visible evidence, remaining energy, and public readiness to justify publishing it. Player choices change the invite flag, poster readiness, proof count, energy count, and draft status before the final branch. The endings distinguish a witnessed launch, a kind but under-supported quiet circle, and a draft that still reads like an outline.',
    '',
    'Reader note: this artifact is a story/readback bridge for understanding the CSV fixture. It is not final prose acceptance, and the detailed trace exists to make the fixture inspectable after the story meaning is clear.',
    '',
    '## What Appears / What Changes',
    '',
    '- Main actor: Mara, framed by a narrator in a community room just before a neighborhood repair meeting.',
    '- Important objects and concepts: the mailbox note, the invite, the handmade poster, the stage, the launch plan, and public proof that the plan is ready.',
    '- `has_invite`: whether the player found Mara\'s note and has a reason to bring the meeting forward.',
    '- `poster_ready`: whether the visible poster has been pinned, making the plan concrete for the room.',
    '- `proof`: how much evidence or public support the player has gathered. Publishing requires at least 2 proof before the final launch step adds one more.',
    '- `energy`: the remaining effort available to bring Mara on stage. Publishing also requires at least 1 energy, so the resource is consequential rather than decorative.',
    '- `draft_status`: the plan\'s authoring state, moving from `outline` to `poster pinned` to `ready` on the full proof route.',
    '',
    '## Route Overview',
    '',
  ]

  for (const route of trace.routes) {
    lines.push(`- ${route.name}: ${routeOverview(route)}`)
  }

  lines.push(
    '',
    '## Authoring Semantics Shown By This CSV',
    '',
    '- Speaker fields show who is speaking (`Narrator` and `Mara`) and survive export/re-import.',
    '- Multiline prose appears in the opening node, so paragraph breaks are part of the fixture rather than a separate prose-only case.',
    '- Initial values establish the story state before any choice: no invite, no poster, zero proof, two energy, and an outline draft.',
    '- Effects show how choices change flags, resources, and variables: checking the mailbox sets `has_invite`, pinning the poster sets `poster_ready`, and later choices update proof, energy, and `draft_status`.',
    '- Condition-gated choices show why publishing is not always available: `publish_manifesto` needs `poster_ready=true`, `proof >= 2`, and `energy >= 1`.',
    '- Multiple endings show that the same compact CSV can express success, soft failure, and under-evidenced draft outcomes.',
    '- Export/re-import preservation proves the spreadsheet form keeps the same speakers, multiline text, settings, conditions, and effects.',
    '',
    '## Detailed Route Trace',
    '',
    'This section renders the deterministic route trace. Use it after the brief and overview when you need exact choices, visible/gated options, effects, and state changes.',
    ''
  )

  for (const route of trace.routes) {
    lines.push(
      `### ${route.name} (\`${route.id}\`)`,
      '',
      route.description,
      '',
      `- Choice IDs: ${route.choiceIds.map((id) => `\`${id}\``).join(' -> ')}`,
      `- Node sequence: ${route.nodeSequence.map((id) => `\`${id}\``).join(' -> ')}`,
      `- Ending: \`${route.ending.nodeId}\` (${route.ending.speaker ?? 'no speaker'})`,
      '',
      'Ending text:',
      '',
      quoteText(route.ending.displayText),
      ''
    )

    route.steps.forEach((step, index) => {
      lines.push(
        `${index + 1}. \`${step.fromNode.nodeId}\` (${step.fromNode.speaker ?? 'no speaker'})`,
        '',
        quoteText(step.fromNode.displayText),
        '',
        `   - Visible choices: ${choiceList(step.fromNode.visibleChoices)}`,
        `   - Gated choices: ${choiceList(step.fromNode.gatedChoices)}`,
        `   - Selected: ${choiceLine(step.selectedChoice)}`,
        `   - Effects applied: ${effectsList(step.effectsApplied)}`,
        `   - State changes: ${stateChangeList(step.stateChanges)}`,
        ''
      )
    })
  }

  lines.push(
    '## Preservation / Roundtrip Notes',
    '',
    checkLine('speaker fields survive export/re-import', trace.roundtripPreservation.speakerPreserved),
    checkLine('multiline front_desk prose survives export/re-import', trace.roundtripPreservation.multilineProsePreserved),
    checkLine('settings.presentation survives export/re-import', trace.roundtripPreservation.settingsPresentationPreserved),
    checkLine('publish_manifesto conditions survive export/re-import', trace.roundtripPreservation.publishConditionsPreserved),
    checkLine('publish_manifesto effects survive export/re-import', trace.roundtripPreservation.publishEffectsPreserved),
    checkLine('pin_poster effects survive export/re-import', trace.roundtripPreservation.pinPosterEffectsPreserved),
    '',
    '## Model Capsule / Technical Appendix',
    '',
    `- Fixture: \`${trace.fixturePath}\``,
    `- Route trace JSON: \`${trace.routeTracePath}\``,
    `- Generator: \`npm run build:authoring-readback -w @narrativegen/web-tester\``,
    `- Check: \`npm run check:authoring-readback -w @narrativegen/web-tester\``,
    `- Model type: \`${trace.model.modelType}\``,
    `- Start node: \`${trace.model.startNode}\``,
    `- Node count: ${trace.model.nodeCount}`,
    `- Initial flags: \`${JSON.stringify(trace.model.initialState.flags)}\``,
    `- Initial resources: \`${JSON.stringify(trace.model.initialState.resources)}\``,
    `- Initial variables: \`${JSON.stringify(trace.model.initialState.variables)}\``,
    `- Presentation settings: \`${JSON.stringify(trace.model.presentation)}\``,
    ''
  )

  return `${lines.join('\n').replace(/\n+$/u, '')}\n`
}

function buildTrace(model, roundtripPreservation) {
  const routeTraces = routes.map((route) => runRoute(model, route))

  return {
    schemaVersion: 1,
    fixturePath: toRepoPath(fixturePath),
    routeTracePath: toRepoPath(tracePath),
    model: {
      modelType: model.modelType,
      startNode: model.startNode,
      nodeCount: Object.keys(model.nodes).length,
      initialState: {
        flags: model.flags ?? {},
        resources: model.resources ?? {},
        variables: model.variables ?? {},
      },
      presentation: model.settings?.presentation ?? null,
    },
    roundtripPreservation,
    routes: routeTraces,
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
      throw new Error(`${toRepoPath(filePath)} is missing; run npm run build:authoring-readback -w @narrativegen/web-tester`)
    }
    throw error
  }

  if (actual !== expected) {
    throw new Error(`${toRepoPath(filePath)} is stale; run npm run build:authoring-readback -w @narrativegen/web-tester`)
  }
}

async function main() {
  const checkOnly = process.argv.includes('--check')
  const csvText = await fs.readFile(fixturePath, 'utf8')
  const parsedModel = parseCsvModel(csvText, { filename: path.basename(fixturePath) })
  const model = loadModel(parsedModel)
  const roundTripModel = loadModel(parseCsvModel(formatCsvModel(model), { filename: 'authoring-sample-exported.csv' }))
  const roundtripPreservation = buildRoundtripChecks(model, roundTripModel)
  assertRoundtripChecks(roundtripPreservation)

  const trace = buildTrace(model, roundtripPreservation)
  const traceContent = `${stableStringify(trace)}\n`
  const markdownContent = renderMarkdown(trace)

  if (checkOnly) {
    await checkFile(tracePath, traceContent)
    await checkFile(markdownPath, markdownContent)
    console.log('authoring sample readback artifacts are current')
    return
  }

  const changed = []
  if (await writeIfChanged(tracePath, traceContent)) changed.push(toRepoPath(tracePath))
  if (await writeIfChanged(markdownPath, markdownContent)) changed.push(toRepoPath(markdownPath))

  if (changed.length) {
    console.log(`updated ${changed.join(', ')}`)
  } else {
    console.log('authoring sample readback artifacts already current')
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})

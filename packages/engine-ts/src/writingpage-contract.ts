/**
 * NarrativeGen <-> WritingPage (Zen Writer) hand-off, SP-WP-001 version 0.2.
 * 0.2 adds optional `speaker` and `choices` to the 0.1 nodes, so a 0.1 reader that
 * ignores unknown fields still works (minor version rule). A model made from a
 * WritingPage document plays through the screen frame (SP-SCREEN-001) in Studio,
 * the Unity chat and the WritingPage Reader.
 */
import type { Model } from './types.js'

export const WRITINGPAGE_CONTRACT_VERSION = 'wp-ng-0.2'
const SUPPORTED_MAJOR = 0

export interface WritingPageChoice {
  text: string
  /** nodeId of the scene this choice leads to. */
  target: string
}

export interface WritingPageNode {
  nodeId: string
  text: string
  speaker?: string
  choices?: WritingPageChoice[]
  updatedAt?: string
}

/** WritingPage -> NarrativeGen */
export interface WritingPageInput {
  contractVersion: string
  sourceDocumentId: string
  nodes: WritingPageNode[]
}

/** NarrativeGen -> WritingPage */
export interface WritingPageOutput {
  contractVersion: string
  modelId: string
  nodes: WritingPageNode[]
}

export class WritingPageContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WritingPageContractError'
  }
}

/** `wp-ng-0.2` → [0, 2]. Throws on anything else. */
export function parseContractVersion(version: unknown): [number, number] {
  const match = typeof version === 'string' ? /^wp-ng-(\d+)\.(\d+)$/.exec(version) : null
  if (!match) throw new WritingPageContractError(`contractVersion の形式が違います: ${String(version)}（期待 ${WRITINGPAGE_CONTRACT_VERSION}）`)
  const major = Number(match[1])
  if (major !== SUPPORTED_MAJOR) {
    throw new WritingPageContractError(`contractVersion ${String(version)} は互換がありません（期待 ${WRITINGPAGE_CONTRACT_VERSION}、major ${SUPPORTED_MAJOR}）`)
  }
  return [major, Number(match[2])]
}

function requireField(record: Record<string, unknown>, key: string, where: string, type: 'string' | 'array'): void {
  const value = record[key]
  const ok = type === 'array' ? Array.isArray(value) : typeof value === 'string'
  if (!ok) throw new WritingPageContractError(`${where} に必須フィールド ${key} がありません`)
}

function validateNodes(nodes: unknown[], where: string): WritingPageNode[] {
  const seen = new Set<string>()
  return nodes.map((raw, index) => {
    const at = `${where}.nodes[${index}]`
    if (!raw || typeof raw !== 'object') throw new WritingPageContractError(`${at} がオブジェクトではありません`)
    const node = raw as Record<string, unknown>
    requireField(node, 'nodeId', at, 'string')
    requireField(node, 'text', at, 'string')
    const nodeId = node.nodeId as string
    if (!nodeId) throw new WritingPageContractError(`${at}.nodeId が空です`)
    if (seen.has(nodeId)) throw new WritingPageContractError(`nodeId ${nodeId} が重複しています`)
    seen.add(nodeId)
    const choices = node.choices === undefined ? undefined : (node.choices as unknown[])
    if (choices !== undefined && !Array.isArray(choices)) throw new WritingPageContractError(`${at}.choices が配列ではありません`)
    choices?.forEach((c, i) => {
      if (!c || typeof c !== 'object') throw new WritingPageContractError(`${at}.choices[${i}] がオブジェクトではありません`)
      requireField(c as Record<string, unknown>, 'text', `${at}.choices[${i}]`, 'string')
      requireField(c as Record<string, unknown>, 'target', `${at}.choices[${i}]`, 'string')
    })
    return {
      nodeId,
      text: node.text as string,
      ...(typeof node.speaker === 'string' && node.speaker ? { speaker: node.speaker } : {}),
      ...(choices ? { choices: choices as WritingPageChoice[] } : {}),
    }
  })
}

/** Validate a WritingPage input envelope (SP-WP-001 rules: major, required fields, duplicates). */
export function validateWritingPageInput(input: unknown): WritingPageInput {
  if (!input || typeof input !== 'object') throw new WritingPageContractError('入力がオブジェクトではありません')
  const record = input as Record<string, unknown>
  requireField(record, 'contractVersion', '入力', 'string')
  parseContractVersion(record.contractVersion)
  requireField(record, 'sourceDocumentId', '入力', 'string')
  requireField(record, 'nodes', '入力', 'array')
  const nodes = validateNodes(record.nodes as unknown[], '入力')
  if (!nodes.length) throw new WritingPageContractError('入力の nodes が空です')
  const ids = new Set(nodes.map((n) => n.nodeId))
  for (const node of nodes) {
    for (const choice of node.choices ?? []) {
      if (!ids.has(choice.target)) {
        throw new WritingPageContractError(`nodeId ${node.nodeId} の選択肢「${choice.text}」の行き先 ${choice.target} がありません`)
      }
    }
  }
  return { contractVersion: record.contractVersion as string, sourceDocumentId: record.sourceDocumentId as string, nodes }
}

/** Build a playable model from a WritingPage input. The first node is the start. */
export function modelFromWritingPage(input: unknown): Model {
  const valid = validateWritingPageInput(input)
  const nodes: Model['nodes'] = {}
  for (const node of valid.nodes) {
    nodes[node.nodeId] = {
      id: node.nodeId,
      text: node.text,
      ...(node.speaker ? { speaker: node.speaker } : {}),
      choices: (node.choices ?? []).map((choice, index) => ({ id: `c${index + 1}`, text: choice.text, target: choice.target })),
    }
  }
  return {
    modelType: 'adventure-playthrough',
    startNode: valid.nodes[0].nodeId,
    nodes,
  } as Model
}

/** NarrativeGen syntax that WritingPage shows as raw text. */
const ENGINE_SYNTAX = /\{\?!?[^:}]+:|\[[\w\p{L}]+(?:\.[^\]]+|~)?\]|\{[^?|}][^|}]*\}/u

/** Export a model for WritingPage. Warnings list nodes whose text keeps engine syntax. */
export function modelToWritingPage(model: Model, modelId: string): { output: WritingPageOutput; warnings: string[] } {
  const warnings: string[] = []
  const order = [model.startNode, ...Object.keys(model.nodes).filter((id) => id !== model.startNode)]
  const nodes: WritingPageNode[] = order.filter((id) => model.nodes[id]).map((id) => {
    const node = model.nodes[id]
    const text = node.text ?? ''
    if (ENGINE_SYNTAX.test(text)) warnings.push(`${id}: 本文にエンジンの記法があり、WritingPageでは記法のまま表示されます`)
    if (node.choices?.some((c) => c.conditions?.length || c.effects?.length)) {
      warnings.push(`${id}: 選択肢の条件・効果はWritingPageへ渡りません`)
    }
    return {
      nodeId: id,
      text,
      ...(node.speaker ? { speaker: node.speaker } : {}),
      choices: (node.choices ?? []).map((c) => ({ text: c.text, target: c.target })),
    }
  })
  return { output: { contractVersion: WRITINGPAGE_CONTRACT_VERSION, modelId, nodes }, warnings }
}

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadModel, modelFromWritingPage, modelToWritingPage, playScreenFrames, WritingPageContractError } from '../src/index'

const samples = join(__dirname, '../../../docs/samples/writingpage')
const sample = (name: string) => JSON.parse(readFileSync(join(samples, name), 'utf8'))

describe('SP-WP-001 0.2 WritingPage hand-off', () => {
  it('builds a playable model whose screen frames keep speaker, paragraphs, ruby and choices', () => {
    const model = loadModel(modelFromWritingPage(sample('wp-ng-0.2-branching.json')))
    expect(model.startNode).toBe('受付')
    const frames = playScreenFrames(model, ['c1', 'c1'])
    expect(frames[0].layout).toBe('standard')
    expect(frames[0].speaker).toBe('受付係')
    expect(frames[0].paragraphs.map((p) => p.map((s) => s.text).join(''))).toEqual(['ここは試験用の受付です。', '用件を選んでください。'])
    expect(frames[0].choiceGroups[0].choices.map((c) => c.text)).toEqual(['書類を出す', '帰る'])
    expect(frames[1].paragraphs[0][0].text).toBe('|書類《しょるい》を受け取りました。')
    expect(frames[1].choiceText).toBe('書類を出す')
    expect(frames[2].ending).toBe(true)
    expect(frames[2].speaker).toBe('')
  })

  it('accepts a 0.1 envelope and ignores unknown fields', () => {
    const model = loadModel(modelFromWritingPage(sample('wp-ng-0.1-text-only.json')))
    expect(playScreenFrames(model, [])[0].ending).toBe(true)
  })

  it.each([
    ['wp-ng-error-major.json', /wp-ng-1\.0 は互換がありません（期待 wp-ng-0\.2/],
    ['wp-ng-error-duplicate.json', /nodeId a が重複しています/],
    ['wp-ng-error-missing-text.json', /必須フィールド text がありません/],
  ])('stops on %s', (file, message) => {
    expect(() => modelFromWritingPage(sample(file))).toThrow(WritingPageContractError)
    expect(() => modelFromWritingPage(sample(file))).toThrow(message)
  })

  it('rejects a choice whose target is not a node', () => {
    const input = sample('wp-ng-0.2-branching.json')
    input.nodes[0].choices[0].target = 'どこにもない'
    expect(() => modelFromWritingPage(input)).toThrow(/行き先 どこにもない がありません/)
  })

  it('exports a model and reads it back to the same screens', () => {
    const model = loadModel(modelFromWritingPage(sample('wp-ng-0.2-branching.json')))
    const { output, warnings } = modelToWritingPage(model, 'sample')
    expect(warnings).toEqual([])
    const again = loadModel(modelFromWritingPage({ ...output, sourceDocumentId: output.modelId }))
    expect(playScreenFrames(again, ['c2'])).toEqual(playScreenFrames(model, ['c2']))
  })

  it('warns when engine syntax would show as raw text in WritingPage', () => {
    const model = loadModel(JSON.parse(readFileSync(join(__dirname, '../../../models/examples/ebb-stair.json'), 'utf8')))
    const { warnings } = modelToWritingPage(model, 'ebb-stair')
    expect(warnings.some((w) => w.startsWith('lock: 本文にエンジンの記法'))).toBe(true)
  })
})

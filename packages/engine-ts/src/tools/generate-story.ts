import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// eslint-disable-next-line import/no-unresolved
import { loadModel, checkModel, clearSessionCaches } from '../index.js'
// eslint-disable-next-line import/no-unresolved
import { describeDerivation, generateStory } from '../premise-story.js'
import type { StoryPremise } from '../premise-story.js'

/**
 * Build a story model from a premise file (SP-PREMISE-001 prototype).
 *
 *   node dist/tools/generate-story.js models/premises/<name>.json
 *     [--seed <n>] [--out <model.json>] [--report <report.md>] [--no-write]
 *
 * Without --out the model goes to models/generated/<name>.json. The readable
 * account of the derivation is printed and, with --report, also written.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../../..')

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function main() {
  const args = process.argv.slice(2)
  const value = (flag: string) => {
    const i = args.indexOf(flag)
    return i >= 0 ? args[i + 1] : undefined
  }
  const flagsWithValue = new Set(['--seed', '--out', '--report'])
  const premiseArg = args.find((a, i) => !a.startsWith('--') && !flagsWithValue.has(args[i - 1]))
  if (!premiseArg) fail('前提ファイルを指定してください: generate-story <premise.json> [--seed n] [--out file] [--report file] [--no-write]')

  const premisePath = path.resolve(process.cwd(), premiseArg)
  if (!fs.existsSync(premisePath)) fail(`前提ファイルがありません: ${premisePath}`)
  const premise = JSON.parse(fs.readFileSync(premisePath, 'utf-8')) as StoryPremise

  const seedText = value('--seed')
  const seed = seedText === undefined ? undefined : Number(seedText)
  if (seed !== undefined && !Number.isInteger(seed)) fail('--seed は整数で指定してください')

  const { model, derivation } = generateStory(premise, { seed })

  // the generated model must pass the same check as any hand-made one
  clearSessionCaches()
  loadModel(structuredClone(model))
  const check = checkModel(model)

  const report = describeDerivation(premise, derivation)
  console.log(report)
  console.log(
    `点検: 結末 ${check.endings.length}、行き止まり ${check.stuck.length}、一度も開かない選択肢 ${check.neverOpened.length}、解決できない参照 ${check.unresolvedRefs.length}、実行時エラー ${check.errors.length}${check.truncated ? '（打ち切り）' : ''}`,
  )

  if (args.includes('--no-write')) return
  const name = path.basename(premisePath, '.json')
  const outPath = path.resolve(process.cwd(), value('--out') ?? path.join(repoRoot, 'models', 'generated', `${name}.json`))
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, `${JSON.stringify(model, null, 2)}\n`, 'utf-8')
  console.log(`物語を書き出しました: ${path.relative(process.cwd(), outPath)}`)

  const reportArg = value('--report')
  if (reportArg) {
    const reportPath = path.resolve(process.cwd(), reportArg)
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, report, 'utf-8')
    console.log(`導出の記録を書き出しました: ${path.relative(process.cwd(), reportPath)}`)
  }
}

main()

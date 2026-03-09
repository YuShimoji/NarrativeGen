import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sourceDir = resolve(__dirname, '../../../models')
const destinationDir = resolve(__dirname, '../dist/models')

if (!existsSync(sourceDir)) {
  console.error(`[copy:models] Source directory not found: ${sourceDir}`)
  process.exit(1)
}

// Recreate the destination so removed example models do not linger in dist.
rmSync(destinationDir, { recursive: true, force: true })
mkdirSync(destinationDir, { recursive: true })

cpSync(sourceDir, destinationDir, { recursive: true, force: true })
console.log(`[copy:models] Copied models to ${destinationDir}`)

import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = path.resolve(rootDir, '../../')

export default defineConfig({
  root: rootDir,
  base: './',
  resolve: {
    alias: {
      // use the engine source directly so the Studio always shows current semantics
      '@narrativegen/engine-ts/browser': path.resolve(repoRoot, 'packages/engine-ts/src/browser.ts'),
    },
  },
  server: { fs: { allow: [repoRoot] } },
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022' },
  publicDir: false,
})

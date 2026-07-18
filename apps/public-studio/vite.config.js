import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: rootDir,
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    fs: {
      allow: [path.resolve(rootDir, '../../')],
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4174,
  },
  publicDir: false,
})

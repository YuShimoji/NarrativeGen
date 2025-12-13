import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@narrativegen/engine-ts': path.resolve(rootDir, '../../Packages/engine-ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: {
      // allow serving files from repo root (models/, packages/engine-ts, etc.)
      allow: [
        path.resolve(rootDir, '..'),
        path.resolve(rootDir, '../../'),
        path.resolve(rootDir, '../../Packages/engine-ts'),
        path.resolve(rootDir, '../../models'),
      ],
    },
  },
})

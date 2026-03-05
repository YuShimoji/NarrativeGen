import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: rootDir,
  resolve: {
    alias: {
      '@narrativegen/engine-ts': path.resolve(rootDir, '../../packages/engine-ts'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')

          if (
            normalizedId.includes('/packages/engine-ts/') ||
            normalizedId.includes('/Packages/engine-ts/')
          ) {
            return 'engine-runtime'
          }

          if (
            normalizedId.includes('/src/ui/graph-editor/') ||
            normalizedId.includes('/node_modules/d3/') ||
            normalizedId.includes('/node_modules/dagre/')
          ) {
            return 'feature-graph-editor'
          }

          if (normalizedId.includes('/src/ui/mermaid-preview.js')) {
            return 'feature-mermaid'
          }

          if (
            normalizedId.includes('/src/features/export/') ||
            normalizedId.includes('/src/ui/export-modal.js')
          ) {
            return 'feature-export'
          }
        },
      },
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
        path.resolve(rootDir, '../../packages/engine-ts'),
        path.resolve(rootDir, '../../models'),
      ],
    },
  },
  // publicDir disabled - using local models directory instead
  publicDir: false,
})

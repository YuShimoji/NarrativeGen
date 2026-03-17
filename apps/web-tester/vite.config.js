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
    // Mermaid core (~1.27MB) is lazy-loaded via dynamic import.
    // Suppress warning for vendor chunks that don't affect initial load.
    chunkSizeWarningLimit: 1300,
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
            normalizedId.includes('/node_modules/d3/') ||
            normalizedId.includes('/node_modules/d3-sankey/') ||
            normalizedId.includes('/node_modules/dagre/') ||
            normalizedId.includes('/node_modules/dagre-d3-es/')
          ) {
            return 'vendor-diagram-layout'
          }

          if (
            normalizedId.includes('/node_modules/dayjs/') ||
            normalizedId.includes('/node_modules/dompurify/') ||
            normalizedId.includes('/node_modules/khroma/') ||
            normalizedId.includes('/node_modules/lodash-es/') ||
            normalizedId.includes('/node_modules/marked/') ||
            normalizedId.includes('/node_modules/roughjs/') ||
            normalizedId.includes('/node_modules/stylis/') ||
            normalizedId.includes('/node_modules/uuid/') ||
            normalizedId.includes('/node_modules/@mermaid-js/parser/')
          ) {
            return 'vendor-mermaid-deps'
          }

          if (normalizedId.includes('/node_modules/mermaid/')) {
            return 'vendor-mermaid-core'
          }

          if (normalizedId.includes('/node_modules/cytoscape/')) {
            return 'vendor-cytoscape'
          }

          if (normalizedId.includes('/src/ui/graph-editor/')) {
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

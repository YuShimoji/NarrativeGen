import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@narrativegen/engine-ts': path.resolve(rootDir, '../../packages/engine-ts'),
    },
  },
  server: {
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    {
      name: 'copy-models',
      writeBundle() {
        const modelsSrc = path.resolve(rootDir, '../../models')
        const modelsDest = path.resolve(rootDir, 'dist/models')
        
        if (!fs.existsSync(modelsDest)) {
          fs.mkdirSync(modelsDest, { recursive: true })
        }
        
        function copyDir(src, dest) {
          const entries = fs.readdirSync(src, { withFileTypes: true })
          for (const entry of entries) {
            const srcPath = path.join(src, entry.name)
            const destPath = path.join(dest, entry.name)
            if (entry.isDirectory()) {
              if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true })
              }
              copyDir(srcPath, destPath)
            } else {
              fs.copyFileSync(srcPath, destPath)
            }
          }
        }
        
        copyDir(modelsSrc, modelsDest)
      },
    },
  ],
})

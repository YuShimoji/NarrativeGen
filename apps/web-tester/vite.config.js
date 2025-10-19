import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@narrativegen/engine-ts': '../../packages/engine-ts/dist',
    },
  },
})

import { defineConfig, devices } from '@playwright/test';

/** Windows 等で Edge を追加検証するときのみ `PW_EDGE=1` を付与（未導入環境での失敗を避ける） */
const edgeProject =
  process.env.PW_EDGE === '1'
    ? [
        {
          name: 'msedge',
          use: { ...devices['Desktop Edge'], channel: 'msedge' },
        },
      ]
    : []

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // 単一の Vite dev サーバに複数ワーカーが同時セッションを掛けると appState 待機がブロックしフレークするため 1 に固定する
  workers: 1,
  reporter: 'html',
  timeout: 45000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    ...edgeProject,
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

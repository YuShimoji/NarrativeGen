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
  workers: process.env.CI ? 1 : 2,
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

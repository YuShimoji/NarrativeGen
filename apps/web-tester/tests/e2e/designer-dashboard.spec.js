import { test, expect } from '@playwright/test';

async function openPage(page) {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto('/');
  await page.waitForFunction(
    () => typeof window.__NARRATIVEGEN_DEVTOOLS__?.getState === 'function',
    undefined,
    { timeout: 15000 }
  );
}

async function loadVerticalSlice(page) {
  await expect(page.locator('#modelSelect option[value="vertical-slice"]')).toBeAttached({ timeout: 10000 });
  await expect(page.locator('#startBtn')).toBeEnabled({ timeout: 10000 });
  await page.selectOption('#modelSelect', 'vertical-slice');
  await page.locator('#startBtn').click();
  await page.waitForFunction(
    () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'desk',
    undefined,
    { timeout: 15000 }
  );
}

test.describe('Designer Dashboard', () => {
  test('shows vertical-slice model health and updates route state', async ({ page }) => {
    await openPage(page);
    await loadVerticalSlice(page);

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('#designerDashboardPanel')).toHaveClass(/active/);
    await expect(page.locator('.designer-dashboard-header')).toContainText('デザイナーダッシュボード v0');
    await expect(page.locator('[data-dashboard-field="model-name"]')).toContainText('vertical-slice');
    await expect(page.locator('[data-dashboard-field="start-node"]')).toHaveText('desk');
    await expect(page.locator('[data-dashboard-field="node-count"]')).toHaveText('12');
    await expect(page.locator('[data-dashboard-field="choice-count"]')).toHaveText('17');
    await expect(page.locator('[data-dashboard-field="ending-count"]')).toHaveText('3');
    await expect(page.locator('[data-dashboard-field="current-node"]')).toHaveText('desk');
    await expect(page.locator('[data-dashboard-field="available-choice-count"]')).toHaveText('2');
    await expect(page.locator('.designer-dashboard-panel--boundary')).toContainText('OpenAI');
    await expect(page.locator('.designer-dashboard-panel--boundary')).toContainText('deterministic / procedural / rule-based');

    await page.locator('#storyTab').click();
    await page.locator('.play-choice-btn:has-text("Open the old notebook")').click();
    await page.waitForFunction(
      () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'notebook',
      undefined,
      { timeout: 10000 }
    );

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="current-node"]')).toHaveText('notebook');
    await expect(page.locator('[data-dashboard-field="available-choice-count"]')).toHaveText('2');
    await expect(page.locator('[data-dashboard-field="story-log-length"]')).toHaveText('2');
    await expect(page.locator('[data-dashboard-field="flag-keys"]')).toContainText('found_hook');
    await expect(page.locator('[data-dashboard-field="resource-keys"]')).toContainText('evidence');
  });
});

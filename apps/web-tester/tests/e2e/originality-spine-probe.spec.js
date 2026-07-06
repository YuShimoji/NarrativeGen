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

async function loadProbe(page) {
  await expect(page.locator('#modelSelect option[value="originality-spine-probe"]')).toBeAttached({ timeout: 10000 });
  await expect(page.locator('#startBtn')).toBeEnabled({ timeout: 10000 });
  await page.selectOption('#modelSelect', 'originality-spine-probe');
  await page.locator('#startBtn').click();
  await page.waitForFunction(
    () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'desk',
    undefined,
    { timeout: 15000 }
  );
}

test.describe('Originality Spine Probe', () => {
  test('loads, plays the semantic route, and exposes primitive readiness in the dashboard', async ({ page }) => {
    await openPage(page);
    await loadProbe(page);

    await expect(page.locator('#storyView')).toContainText('provenance=clocktower archive desk');
    await expect(page.locator('#storyView')).toContainText("owner=Mira's mentor");

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="model-name"]')).toContainText('originality-spine-probe');
    await expect(page.locator('[data-dashboard-field="originality-dynamic-text-state"]')).toContainText('live_in_route');
    await expect(page.locator('[data-dashboard-field="originality-entity-property-state"]')).toContainText('live_in_route');
    await expect(page.locator('[data-dashboard-field="originality-event-state"]')).toContainText('present_model_only');
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('present_model_only');

    await page.locator('#storyTab').click();
    await page.locator('.play-choice-btn:has-text("Ask Mira to test the receipt")').click();
    await page.waitForFunction(
      () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'memory_reframed',
      undefined,
      { timeout: 10000 }
    );

    await expect(page.locator('#storyView')).toContainText('Mira reframed the receipt');
    await expect(page.locator('#storyView')).toContainText('Template response:');
    await expect(page.locator('#storyView')).toContainText('not as evidence points');

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="originality-event-state"]')).toContainText('live_in_route');
    await expect(page.locator('[data-dashboard-field="originality-conversation-template-state"]')).toContainText('live_in_route');
  });
});

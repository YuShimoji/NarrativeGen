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

test.describe('Originality Spine Probe', () => {
  test('loads, plays the semantic route, and exposes primitive readiness in the dashboard', async ({ page }) => {
    await openPage(page);
    await loadProbe(page);

    await expect(page.locator('#storyView')).toContainText('ミラはレシート片を机に置く');
    await expect(page.locator('#storyView')).toContainText('clocktower archive desk');
    await expect(page.locator('#storyView')).toContainText("持ち主はMira's mentor");

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="model-name"]')).toContainText('originality-spine-probe');
    await expect(page.locator('[data-dashboard-field="originality-dynamic-text-state"]')).toContainText('live_in_route');
    await expect(page.locator('[data-dashboard-field="originality-entity-property-state"]')).toContainText('live_in_route');
    await expect(page.locator('[data-dashboard-field="originality-event-state"]')).toContainText('present_model_only');
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('present_model_only');
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('1 policies');
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('0 direct perceiveEntity');

    await page.locator('#storyTab').click();
    await page.locator('.play-choice-btn:has-text("Ask Mira to test the receipt")').click();
    await page.waitForFunction(
      () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'memory_reframed',
      undefined,
      { timeout: 10000 }
    );

    await expect(page.locator('#storyView')).toContainText('ミラは南書庫の記録と照合し');
    await expect(page.locator('#storyView')).toContainText('ミラの補足:');
    await expect(page.locator('#storyView')).toContainText('証拠点ではなく');
    await expect(page.locator('#storyView')).not.toContainText('perceptionPolicy:mira_receipt_contradiction_policy');
    await expect(page.locator('#storyView')).not.toContainText('noticed=true');
    await expect(page.locator('#storyView')).not.toContainText('trigger=memory_reframed');
    await expect(page.locator('#storyView')).not.toContainText('Template response:');

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="originality-event-state"]')).toContainText('live_in_route');
    await expect(page.locator('[data-dashboard-field="originality-conversation-template-state"]')).toContainText('live_in_route');
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('live_in_route');
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('1 live (1 policy)');
  });

  test('starts cleanly after vertical-slice play and keeps old-ADV branch isolated', async ({ page }) => {
    await openPage(page);
    await loadVerticalSlice(page);

    await page.locator('.play-choice-btn:has-text("Open the old notebook")').click();
    await page.waitForFunction(
      () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'notebook',
      undefined,
      { timeout: 10000 }
    );
    await expect(page.locator('#storyView')).toContainText('Mira heard it first');

    await loadProbe(page);
    await expect(page.locator('#storyView')).toContainText('ミラはレシート片を机に置く');
    await expect(page.locator('#storyView')).not.toContainText('Mira heard it first');
    await expect(page.locator('#storyView')).not.toContainText('ミラは南書庫の記録と照合し');
    await expect(page.locator('#storyView')).not.toContainText('Follow the semantic contradiction');
    await expect(page.locator('#storyView')).not.toContainText('perceptionPolicy:mira_receipt_contradiction_policy');

    await page.locator('.play-choice-btn:has-text("Treat it as a conventional clue")').click();
    await page.waitForFunction(
      () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'old_adv_end',
      undefined,
      { timeout: 10000 }
    );
    await expect(page.locator('#storyView')).toContainText('昔ながらの汎用的な手掛かり');
    await expect(page.locator('#storyView')).not.toContainText('結末は、ミラの書庫知識');

    await loadProbe(page);
    await page.locator('.play-choice-btn:has-text("Ask Mira to test the receipt")').click();
    await page.waitForFunction(
      () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'memory_reframed',
      undefined,
      { timeout: 10000 }
    );
    await expect(page.locator('#storyView')).toContainText('ミラは南書庫の記録と照合し');

    await page.locator('.play-choice-btn:has-text("Follow the semantic contradiction")').click();
    await page.waitForFunction(
      () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'semantic_end',
      undefined,
      { timeout: 10000 }
    );
    await expect(page.locator('#storyView')).toContainText('結末は、ミラの書庫知識');

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('1 live (1 policy)');
  });
});

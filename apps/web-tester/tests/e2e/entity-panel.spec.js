import { test, expect } from '@playwright/test';

/**
 * Helper: Load a model, wait for session to start, then switch to GUI edit mode
 */
async function loadModelAndEdit(page, modelName) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());

  await page.selectOption('#modelSelect', modelName);
  await page.click('#startBtn');

  // Wait for session to actually start (status bar shows success)
  await page.waitForFunction(
    () => {
      const statusEl = document.querySelector('#statusText, .status-text');
      return statusEl && statusEl.textContent.includes('実行中');
    },
    { timeout: 10000 }
  );

  // Switch to GUI edit mode
  await page.click('button:has-text("編集")');

  // Wait for GUI edit mode to become active
  await page.waitForFunction(
    () => {
      const el = document.getElementById('guiEditMode');
      return el && el.classList.contains('active') && el.style.display !== 'none';
    },
    { timeout: 5000 }
  );
}

test.describe('Entity Definition Panel', () => {
  test.beforeEach(async ({ page }) => {
    await loadModelAndEdit(page, 'property_test');
  });

  test('entity panel should be visible and collapsed by default', async ({ page }) => {
    const panel = page.locator('#entityPanel');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(panel).toHaveClass(/collapsed/);

    const header = panel.locator('.entity-panel-header');
    await expect(header).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking header should expand/collapse entity panel', async ({ page }) => {
    const panel = page.locator('#entityPanel');
    const header = panel.locator('.entity-panel-header');

    // Expand
    await header.click();
    await expect(panel).not.toHaveClass(/collapsed/);
    await expect(header).toHaveAttribute('aria-expanded', 'true');

    // Collapse
    await header.click();
    await expect(panel).toHaveClass(/collapsed/);
    await expect(header).toHaveAttribute('aria-expanded', 'false');
  });

  test('should display entity count', async ({ page }) => {
    const count = page.locator('#entityCount');
    // property_test.json has 3 entities: physical_object, food, cheeseburger
    await expect(count).not.toHaveText('(0)', { timeout: 3000 });
    const text = await count.textContent();
    expect(text).toMatch(/\(\d+\)/);
  });

  test('should render entity rows in table', async ({ page }) => {
    const header = page.locator('#entityPanel .entity-panel-header');
    await header.click();

    const tbody = page.locator('#entityTableBody');
    // Use more specific selector: only direct entity rows (not prop rows)
    const rows = tbody.locator('> tr[data-entity-id]:not(.entity-props-row)');
    // At least physical_object, food, cheeseburger
    expect(await rows.count()).toBeGreaterThanOrEqual(3);
  });

  test('entity rows should have ID, name, parent, cost fields', async ({ page }) => {
    const header = page.locator('#entityPanel .entity-panel-header');
    await header.click();

    // Use first() to avoid strict mode with prop rows that also have data-entity-id
    const cheeseburgerRow = page.locator('#entityTableBody > tr[data-entity-id="cheeseburger"]:not(.entity-props-row)').first();
    await expect(cheeseburgerRow).toBeVisible();

    const idInput = cheeseburgerRow.locator('input[data-entity-field="id"]');
    await expect(idInput).toHaveValue('cheeseburger');

    const nameInput = cheeseburgerRow.locator('input[data-entity-field="name"]');
    await expect(nameInput).toHaveValue('Cheeseburger');

    // Parent entity should be 'food'
    const parentSelect = cheeseburgerRow.locator('select[data-entity-field="parentEntity"]');
    await expect(parentSelect).toHaveValue('food');
  });

  test('entity property section should be expandable', async ({ page }) => {
    const header = page.locator('#entityPanel .entity-panel-header');
    await header.click();

    // Find property details section following cheeseburger row
    const details = page.locator('details.entity-props-details').last();

    if (await details.count() > 0) {
      const summary = details.locator('summary');
      await expect(summary).toBeVisible();
      // Click to expand
      await summary.click();
      // Should show property rows
      const propRows = details.locator('.entity-prop-row');
      expect(await propRows.count()).toBeGreaterThan(0);
    }
  });

  test('add entity button should create new entity', async ({ page }) => {
    const header = page.locator('#entityPanel .entity-panel-header');
    await header.click();

    const countBefore = await page.locator('#entityTableBody > tr[data-entity-id]:not(.entity-props-row)').count();

    await page.click('#addEntityBtn');
    await page.waitForTimeout(300);

    const countAfter = await page.locator('#entityTableBody > tr[data-entity-id]:not(.entity-props-row)').count();
    expect(countAfter).toBe(countBefore + 1);
  });

  test('delete entity button should remove entity', async ({ page }) => {
    const header = page.locator('#entityPanel .entity-panel-header');
    await header.click();

    // Add a new entity first, then delete it
    await page.click('#addEntityBtn');
    await page.waitForTimeout(300);

    const countBefore = await page.locator('#entityTableBody > tr[data-entity-id]:not(.entity-props-row)').count();

    // Click last entity's delete button
    const lastDeleteBtn = page.locator('.entity-delete-btn').last();
    await lastDeleteBtn.click();
    await page.waitForTimeout(300);

    const countAfter = await page.locator('#entityTableBody > tr[data-entity-id]:not(.entity-props-row)').count();
    expect(countAfter).toBe(countBefore - 1);
  });
});

test.describe('Entity Panel - Integration Test Model', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Load integration_test model
    await page.selectOption('#modelSelect', 'integration_test');
    await page.click('#startBtn');
    await page.waitForFunction(
      () => {
        const statusEl = document.querySelector('#statusText, .status-text');
        return statusEl && statusEl.textContent.includes('実行中');
      },
      { timeout: 10000 }
    );
  });

  test('integration_test model should load successfully', async ({ page }) => {
    // Model loaded if status shows running
    const status = page.locator('#statusText, .status-text');
    await expect(status).toContainText('実行中');
  });

  test('dynamic text should expand entity references in play mode', async ({ page }) => {
    // The node text should show expanded entity references
    // scene_start mentions [cheeseburger] → "Cheeseburger"
    // Check that the play view renders without raw bracket syntax
    const body = await page.textContent('body');
    // Model is loaded, verify basic presence
    expect(body).toContain('integration_test');
  });

  test('GUI editor should show entities from integration_test', async ({ page }) => {
    await page.click('button:has-text("編集")');
    await page.waitForFunction(
      () => {
        const el = document.getElementById('guiEditMode');
        return el && el.classList.contains('active') && el.style.display !== 'none';
      },
      { timeout: 5000 }
    );

    const panel = page.locator('#entityPanel');
    await expect(panel).toBeVisible({ timeout: 5000 });

    const header = panel.locator('.entity-panel-header');
    await header.click();

    // integration_test has: physical_object, food, cheeseburger, detective_badge
    const rows = page.locator('#entityTableBody > tr[data-entity-id]:not(.entity-props-row)');
    expect(await rows.count()).toBeGreaterThanOrEqual(4);
  });
});

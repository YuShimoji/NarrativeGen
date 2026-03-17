import { test, expect } from '@playwright/test';

/**
 * Helper: Load a model, wait for session, switch to GUI edit mode
 */
async function loadModelAndEdit(page, modelName) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());

  await page.selectOption('#modelSelect', modelName);
  await page.click('#startBtn');

  await page.waitForFunction(
    () => {
      const statusEl = document.querySelector('#statusText, .status-text');
      return statusEl && statusEl.textContent.includes('実行中');
    },
    { timeout: 10000 }
  );

  await page.click('button:has-text("編集")');
  await page.waitForFunction(
    () => {
      const el = document.getElementById('guiEditMode');
      return el && el.classList.contains('active') && el.style.display !== 'none';
    },
    { timeout: 5000 }
  );
}

test.describe('ConversationTemplate Panel', () => {
  test.beforeEach(async ({ page }) => {
    await loadModelAndEdit(page, 'integration_test');
  });

  test('template panel should be visible and collapsed by default', async ({ page }) => {
    const panel = page.locator('#templatePanel');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(panel).toHaveClass(/collapsed/);
  });

  test('should display template count from integration_test', async ({ page }) => {
    const count = page.locator('#templateCount');
    // integration_test.json has 2 conversation templates
    await expect(count).not.toHaveText('(0)', { timeout: 3000 });
    const text = await count.textContent();
    expect(text).toBe('(2)');
  });

  test('clicking header should expand/collapse template panel', async ({ page }) => {
    const panel = page.locator('#templatePanel');
    const header = panel.locator('.entity-panel-header');

    await header.click();
    await expect(panel).not.toHaveClass(/collapsed/);

    await header.click();
    await expect(panel).toHaveClass(/collapsed/);
  });

  test('should render template rows', async ({ page }) => {
    const header = page.locator('#templatePanel .entity-panel-header');
    await header.click();

    const tbody = page.locator('#templateTableBody');
    const rows = tbody.locator('> tr[data-template-idx]');
    expect(await rows.count()).toBeGreaterThanOrEqual(2);
  });

  test('template rows should have ID, text, priority fields', async ({ page }) => {
    const header = page.locator('#templatePanel .entity-panel-header');
    await header.click();

    const firstRow = page.locator('#templateTableBody > tr[data-template-idx="0"]');
    await expect(firstRow).toBeVisible();

    const idInput = firstRow.locator('input[data-template-field="id"]');
    await expect(idInput).toHaveValue('recall_anomaly');

    const textInput = firstRow.locator('input[data-template-field="text"]');
    const textVal = await textInput.inputValue();
    expect(textVal).toContain('Something about');
  });

  test('trigger conditions should be expandable', async ({ page }) => {
    const header = page.locator('#templatePanel .entity-panel-header');
    await header.click();

    const details = page.locator('#templatePanel details.entity-props-details').first();
    const summary = details.locator('summary');
    await expect(summary).toBeVisible();
    await summary.click();

    // recall_anomaly has 1 property check (severity >= 50)
    const checkRows = details.locator('.template-check-row');
    expect(await checkRows.count()).toBeGreaterThan(0);
  });

  test('add template button should create new template', async ({ page }) => {
    const header = page.locator('#templatePanel .entity-panel-header');
    await header.click();

    const countBefore = await page.locator('#templateTableBody > tr[data-template-idx]').count();

    await page.click('#addTemplateBtn');
    await page.waitForTimeout(300);

    const countAfter = await page.locator('#templateTableBody > tr[data-template-idx]').count();
    expect(countAfter).toBe(countBefore + 1);
  });

  test('delete template button should remove template', async ({ page }) => {
    const header = page.locator('#templatePanel .entity-panel-header');
    await header.click();

    // Add a template first then delete it
    await page.click('#addTemplateBtn');
    await page.waitForTimeout(300);

    const countBefore = await page.locator('#templateTableBody > tr[data-template-idx]').count();

    const lastDeleteBtn = page.locator('.template-delete-btn').last();
    await lastDeleteBtn.click();
    await page.waitForTimeout(300);

    const countAfter = await page.locator('#templateTableBody > tr[data-template-idx]').count();
    expect(countAfter).toBe(countBefore - 1);
  });
});

test.describe('ConversationTemplate Panel - No Templates', () => {
  test.beforeEach(async ({ page }) => {
    await loadModelAndEdit(page, 'property_test');
  });

  test('should show (0) for model without templates', async ({ page }) => {
    const count = page.locator('#templateCount');
    const text = await count.textContent();
    expect(text).toBe('(0)');
  });

  test('should show empty hint when no templates', async ({ page }) => {
    const header = page.locator('#templatePanel .entity-panel-header');
    await header.click();

    const hint = page.locator('#templateTableBody .entity-empty-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('テンプレートが定義されていません');
  });
});

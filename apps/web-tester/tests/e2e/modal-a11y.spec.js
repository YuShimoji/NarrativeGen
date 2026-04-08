import { test, expect } from '@playwright/test';

/**
 * モーダル表示時の role / aria-modal / aria-hidden を固定し、Escape で閉じる経路を検証する（#83）。
 */

async function openPageAndSession(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.waitForFunction(() => window.appState != null, { timeout: 15000 });
  await page.selectOption('#modelSelect', 'tutorial');
  await page.click('#startBtn');
  await page.waitForFunction(
    () => {
      const st = window.appState;
      return st?.model != null && st.model.nodes && Object.keys(st.model.nodes).length > 0;
    },
    { timeout: 40000 }
  );
}

test.describe('Modal a11y (aria + Escape)', () => {
  test.describe.configure({ timeout: 90000 });

  test('batch edit modal: visible時は aria-hidden=false、Escape で閉じる', async ({ page }) => {
    await openPageAndSession(page);
    await page.click('#editBtn');
    await page.waitForFunction(
      () => {
        const el = document.getElementById('guiEditMode');
        return el && el.classList.contains('active');
      },
      { timeout: 8000 }
    );

    const batchBtn = page.locator('#batchEditBtn');
    await expect(batchBtn).toBeVisible({ timeout: 5000 });
    await batchBtn.click();

    const modal = page.locator('#batchEditModal');
    await expect(modal).toBeVisible({ timeout: 8000 });
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-hidden', 'false');

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5000 });
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
  });
});

import { test, expect } from '@playwright/test';

// Theme toggle (light/dark) tests are skipped because:
// - utils/theme-manager.js has the implementation but is not wired up to the UI
// - The current UI uses #themeBtn for palette selection (src/ui/theme.js), not light/dark toggle
// - Tests expect #themeToggleBtn, data-theme attribute, and .theme-icon elements that don't exist
// TODO: Re-enable after integrating theme-manager.js into the UI
test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.skip('should display theme toggle button', async ({ page }) => {
    const toggleBtn = page.locator('#themeToggleBtn');
    await expect(toggleBtn).toBeVisible();
  });

  test.skip('should start with system preference (light mode)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    const lightIcon = page.locator('.theme-icon[data-theme="light"]');
    await expect(lightIcon).toBeVisible();
  });

  test.skip('should start with system preference (dark mode)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    const darkIcon = page.locator('.theme-icon[data-theme="dark"]');
    await expect(darkIcon).toBeVisible();
  });

  test.skip('should toggle from light to dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    const toggleBtn = page.locator('#themeToggleBtn');
    await toggleBtn.click();
    await page.waitForTimeout(400);

    await expect(html).toHaveAttribute('data-theme', 'dark');

    const darkIcon = page.locator('.theme-icon[data-theme="dark"]');
    await expect(darkIcon).toBeVisible();
  });

  test.skip('should toggle from dark to light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    const toggleBtn = page.locator('#themeToggleBtn');
    await toggleBtn.click();
    await page.waitForTimeout(400);

    await expect(html).toHaveAttribute('data-theme', 'light');

    const lightIcon = page.locator('.theme-icon[data-theme="light"]');
    await expect(lightIcon).toBeVisible();
  });

  test.skip('should persist theme preference in localStorage', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    const toggleBtn = page.locator('#themeToggleBtn');
    await toggleBtn.click();
    await page.waitForTimeout(400);

    const storedTheme = await page.evaluate(() =>
      localStorage.getItem('narrativeGenTheme')
    );
    expect(storedTheme).toBe('dark');

    await page.reload();
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test.skip('should apply correct background colors in light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    const body = page.locator('body');
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).background
    );

    expect(bgColor).toContain('gradient');
  });

  test.skip('should apply correct background colors in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    const body = page.locator('body');
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).background
    );

    expect(bgColor).toContain('gradient');
  });

  test.skip('should toggle multiple times correctly', async ({ page }) => {
    const html = page.locator('html');
    const toggleBtn = page.locator('#themeToggleBtn');

    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'light');

    await toggleBtn.click();
    await page.waitForTimeout(400);
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await toggleBtn.click();
    await page.waitForTimeout(400);
    await expect(html).toHaveAttribute('data-theme', 'light');

    await toggleBtn.click();
    await page.waitForTimeout(400);
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test.skip('should verify CSS variables are defined', async ({ page }) => {
    const primaryColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary-500')
    );

    expect(primaryColor).toBeTruthy();
    expect(primaryColor.trim()).toMatch(/#[0-9a-fA-F]{6}/);
  });

  test.skip('should verify graph colors update with theme', async ({ page }) => {
    await page.selectOption('#modelSelect', 'tutorial');
    await page.click('#startBtn');
    await page.waitForTimeout(1000);

    await page.click('#graphTab');
    await page.waitForTimeout(500);

    const initialEdgeColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-graph-edge')
    );

    await page.click('#themeToggleBtn');
    await page.waitForTimeout(400);

    const updatedEdgeColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-graph-edge')
    );

    expect(initialEdgeColor.trim()).not.toBe(updatedEdgeColor.trim());
  });
});

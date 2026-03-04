import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
  });

  test('should display theme toggle button', async ({ page }) => {
    const toggleBtn = page.locator('#themeToggleBtn');
    await expect(toggleBtn).toBeVisible();
  });

  test('should start with system preference (light mode)', async ({ page }) => {
    // Emulate light color scheme
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Verify light mode icon is visible
    const lightIcon = page.locator('.theme-icon[data-theme="light"]');
    await expect(lightIcon).toBeVisible();
  });

  test('should start with system preference (dark mode)', async ({ page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Verify dark mode icon is visible
    const darkIcon = page.locator('.theme-icon[data-theme="dark"]');
    await expect(darkIcon).toBeVisible();
  });

  test('should toggle from light to dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Click toggle button
    const toggleBtn = page.locator('#themeToggleBtn');
    await toggleBtn.click();

    // Wait for animation
    await page.waitForTimeout(400);

    // Verify dark mode is applied
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Verify dark icon is visible
    const darkIcon = page.locator('.theme-icon[data-theme="dark"]');
    await expect(darkIcon).toBeVisible();
  });

  test('should toggle from dark to light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Click toggle button
    const toggleBtn = page.locator('#themeToggleBtn');
    await toggleBtn.click();

    // Wait for animation
    await page.waitForTimeout(400);

    // Verify light mode is applied
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Verify light icon is visible
    const lightIcon = page.locator('.theme-icon[data-theme="light"]');
    await expect(lightIcon).toBeVisible();
  });

  test('should persist theme preference in localStorage', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    // Toggle to dark mode
    const toggleBtn = page.locator('#themeToggleBtn');
    await toggleBtn.click();
    await page.waitForTimeout(400);

    // Verify localStorage
    const storedTheme = await page.evaluate(() =>
      localStorage.getItem('narrativeGenTheme')
    );
    expect(storedTheme).toBe('dark');

    // Reload page and verify theme persists
    await page.reload();
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('should apply correct background colors in light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    const body = page.locator('body');
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).background
    );

    // Should contain gradient (purple/indigo)
    expect(bgColor).toContain('gradient');
  });

  test('should apply correct background colors in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    const body = page.locator('body');
    const bgColor = await body.evaluate((el) =>
      window.getComputedStyle(el).background
    );

    // Should contain dark gradient
    expect(bgColor).toContain('gradient');
  });

  test('should toggle multiple times correctly', async ({ page }) => {
    const html = page.locator('html');
    const toggleBtn = page.locator('#themeToggleBtn');

    // Initial state (assume light from system)
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Toggle 1: Light -> Dark
    await toggleBtn.click();
    await page.waitForTimeout(400);
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Toggle 2: Dark -> Light
    await toggleBtn.click();
    await page.waitForTimeout(400);
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Toggle 3: Light -> Dark
    await toggleBtn.click();
    await page.waitForTimeout(400);
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('should verify CSS variables are defined', async ({ page }) => {
    const primaryColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary-500')
    );

    expect(primaryColor).toBeTruthy();
    expect(primaryColor.trim()).toMatch(/#[0-9a-fA-F]{6}/);
  });

  test('should verify graph colors update with theme', async ({ page }) => {
    // Load a sample model first
    await page.selectOption('#modelSelect', 'tutorial');
    await page.click('#startBtn');
    await page.waitForTimeout(1000);

    // Switch to graph tab
    await page.click('#graphTab');
    await page.waitForTimeout(500);

    // Get initial graph color
    const initialEdgeColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-graph-edge')
    );

    // Toggle theme
    await page.click('#themeToggleBtn');
    await page.waitForTimeout(400);

    // Get updated graph color
    const updatedEdgeColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-graph-edge')
    );

    // Colors should be different after theme toggle
    expect(initialEdgeColor.trim()).not.toBe(updatedEdgeColor.trim());
  });
});

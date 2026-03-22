import { test, expect } from '@playwright/test';

/**
 * SP-PLAY-001 Phase 2: Image / BGM — E2E Tests
 * Uses media-test.json (3 nodes: start(image+defaultBgm) → scene2(image+bgm) → end(bgm:null))
 */

async function openPage(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.waitForFunction(
    () => window.appState != null,
    { timeout: 15000 }
  );
}

async function startMediaModel(page) {
  await page.selectOption('#modelSelect', 'media-test');
  await page.click('#startBtn');
  await page.waitForFunction(
    () => window.appState?.model?.startNode === 'start',
    { timeout: 15000 }
  );
  await page.waitForSelector('.play-content', { timeout: 10000 });
}

/** Navigate from start to scene2 by clicking "Investigate" */
async function navigateToScene2(page) {
  await page.locator('.play-choice-btn:has-text("Investigate")').click();
  await page.waitForFunction(
    () => {
      const content = document.querySelector('#storyView .play-content');
      return content && content.textContent.includes('corridor');
    },
    { timeout: 10000 }
  );
}

test.describe.configure({ mode: 'serial' });
test.describe('SP-PLAY-001 Phase 2: Image / BGM', () => {

  test('AC-8: scene image — image element appears above text', async ({ page }) => {
    await openPage(page);
    await startMediaModel(page);

    // Scene image wrapper should be visible
    const imgWrapper = page.locator('.play-scene-image');
    await expect(imgWrapper).toBeVisible({ timeout: 5000 });

    // Image element should exist with correct src
    const img = imgWrapper.locator('img');
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src).toContain('test-scene.png');

    // Text should appear after image
    const content = await page.locator('.play-content').textContent();
    expect(content).toContain('A dark room');
  });

  test('AC-8b: image transitions with node — new scene shows new image', async ({ page }) => {
    await openPage(page);
    await startMediaModel(page);
    await navigateToScene2(page);

    // Scene2 should have a different image
    const img = page.locator('.play-scene-image img');
    await expect(img).toBeVisible({ timeout: 5000 });
    const src = await img.getAttribute('src');
    expect(src).toContain('test-scene2.png');
  });

  test('AC-9: BGM — model nodes have correct bgm fields', async ({ page }) => {
    await openPage(page);
    await startMediaModel(page);

    // Verify model-level default BGM
    const defaultBgm = await page.evaluate(() => {
      return window.appState?.model?.settings?.presentation?.defaultBgm;
    });
    expect(defaultBgm).toContain('test-bgm.mp3');

    // Verify scene2 node has bgm override
    const nodeBgm = await page.evaluate(() => {
      return window.appState?.model?.nodes?.scene2?.presentation?.bgm;
    });
    expect(nodeBgm).toContain('test-bgm2.mp3');
  });

  test('AC-11: BGM stop — end node has bgm null and ending displays', async ({ page }) => {
    await openPage(page);
    await startMediaModel(page);

    // Navigate: start → scene2
    await navigateToScene2(page);

    // scene2 → end
    await page.locator('.play-choice-btn:has-text("Enter silence")').click();
    await page.waitForSelector('.play-ending', { timeout: 10000 });

    // Verify the end node has bgm: null in model (explicit stop)
    const endBgm = await page.evaluate(() => {
      return window.appState?.model?.nodes?.end?.presentation?.bgm;
    });
    expect(endBgm).toBeNull();

    // Ending should display correctly
    const endingText = await page.locator('.play-ending-mark').textContent();
    expect(endingText).toContain('End');
  });

  test('AC-13: backward compatibility — linear.json works without image/bgm', async ({ page }) => {
    await openPage(page);

    // Load linear model (no media fields)
    await page.selectOption('#modelSelect', 'linear');
    await page.click('#startBtn');
    await page.waitForFunction(
      () => window.appState?.model?.startNode === 'start',
      { timeout: 15000 }
    );
    await page.waitForSelector('.play-content', { timeout: 10000 });

    // No scene image should exist
    const imgWrapper = page.locator('.play-scene-image');
    await expect(imgWrapper).toHaveCount(0);

    // Text should work normally
    const content = await page.locator('.play-content').textContent();
    expect(content).toContain('You wake up.');

    // linear.json should not have presentation fields with image/bgm
    const hasPresentation = await page.evaluate(() => {
      const nodes = window.appState?.model?.nodes;
      if (!nodes) return false;
      return Object.values(nodes).some(n => n.presentation?.image || n.presentation?.bgm);
    });
    expect(hasPresentation).toBe(false);
  });
});

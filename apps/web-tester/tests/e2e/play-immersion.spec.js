import { test, expect } from '@playwright/test';

/**
 * SP-PLAY-001: Play Immersion MVP — E2E Tests
 * Uses linear.json (3 nodes: start → scene1 → end)
 */

const STORAGE_KEY = 'narrativegen-play-transition-mode';

async function openPage(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.waitForFunction(
    () => window.appState != null,
    { timeout: 15000 }
  );
}

async function startLinearModel(page) {
  // Select linear model from dropdown
  await page.selectOption('#modelSelect', 'linear');
  await page.click('#startBtn');
  // Wait for session to start
  await page.waitForFunction(
    () => window.appState?.model?.startNode === 'start',
    { timeout: 10000 }
  );
  // Wait for PlayRenderer to render content
  await page.waitForSelector('.play-content', { timeout: 5000 });
}

test.describe.configure({ mode: 'serial' });
test.describe('SP-PLAY-001: Play Immersion MVP', () => {

  test('AC-1: paragraph fade-in — story text appears as .play-paragraph elements', async ({ page }) => {
    await openPage(page);
    await startLinearModel(page);

    // Start node should have play-paragraph elements
    const paragraphs = page.locator('.play-paragraph');
    await expect(paragraphs.first()).toBeVisible({ timeout: 3000 });

    // Text should contain "You wake up."
    const content = await page.locator('.play-content').textContent();
    expect(content).toContain('You wake up.');
  });

  test('AC-2: inline choices — choice buttons appear inside #storyView', async ({ page }) => {
    await openPage(page);
    await startLinearModel(page);

    // Inline choice buttons inside storyView
    const storyView = page.locator('#storyView');
    const choiceBtns = storyView.locator('.play-choice-btn');
    await expect(choiceBtns.first()).toBeVisible({ timeout: 3000 });

    // Should have "Get up" choice
    const btnText = await choiceBtns.first().textContent();
    expect(btnText).toContain('Get up');
  });

  test('AC-3: crossfade transition — clicking choice replaces content', async ({ page }) => {
    await openPage(page);
    await startLinearModel(page);

    // Click "Get up" choice
    await page.locator('.play-choice-btn:has-text("Get up")').click();

    // Wait for new content to appear
    await page.waitForFunction(
      () => {
        const content = document.querySelector('#storyView .play-content');
        return content && content.textContent.includes('You see the door.');
      },
      { timeout: 5000 }
    );

    // New content should have "You see the door."
    const content = await page.locator('#storyView .play-content').last().textContent();
    expect(content).toContain('You see the door.');
  });

  test('AC-5: mode toggle — toggle button exists and switches modes', async ({ page }) => {
    await openPage(page);
    await startLinearModel(page);

    // Toggle button should exist
    const toggle = page.locator('.play-mode-toggle');
    await expect(toggle).toBeVisible({ timeout: 3000 });

    // Default mode is crossfade
    const initialText = await toggle.textContent();
    expect(initialText).toContain('Crossfade');

    // Click toggle
    await toggle.click();

    // Should switch to scroll mode
    const newText = await toggle.textContent();
    expect(newText).toContain('Scroll');

    // localStorage should be updated
    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
    expect(stored).toBe('append-scroll');

    // Toggle back
    await toggle.click();
    const backText = await toggle.textContent();
    expect(backText).toContain('Crossfade');
  });

  test('AC-6: ending display — shows End marker and restart button at terminal node', async ({ page }) => {
    await openPage(page);
    await startLinearModel(page);

    // Navigate to end: start → scene1 → end
    await page.locator('.play-choice-btn:has-text("Get up")').click();
    await page.waitForSelector('.play-choice-btn:has-text("Open door")', { timeout: 5000 });
    await page.locator('.play-choice-btn:has-text("Open door")').click();

    // Wait for ending to appear
    await page.waitForSelector('.play-ending', { timeout: 5000 });

    // Ending mark should contain "End"
    const endingMark = page.locator('.play-ending-mark');
    await expect(endingMark).toBeVisible();
    const markText = await endingMark.textContent();
    expect(markText).toContain('End');

    // Restart button should exist
    const restartBtn = page.locator('.play-ending-btn:has-text("最初から")');
    await expect(restartBtn).toBeVisible();
  });

  test('AC-6b: restart from ending returns to start node', async ({ page }) => {
    await openPage(page);
    await startLinearModel(page);

    // Navigate to end
    await page.locator('.play-choice-btn:has-text("Get up")').click();
    await page.waitForSelector('.play-choice-btn:has-text("Open door")', { timeout: 5000 });
    await page.locator('.play-choice-btn:has-text("Open door")').click();
    await page.waitForSelector('.play-ending', { timeout: 5000 });

    // Click restart
    await page.locator('.play-ending-btn:has-text("最初から")').click();

    // Should be back at start
    await page.waitForFunction(
      () => {
        const content = document.querySelector('#storyView .play-content');
        return content && content.textContent.includes('You wake up.');
      },
      { timeout: 5000 }
    );
  });

  test('AC-4: append-scroll transition — content accumulates', async ({ page }) => {
    await openPage(page);
    await startLinearModel(page);

    // Switch to append-scroll mode
    await page.locator('.play-mode-toggle').click();

    // Click choice
    await page.locator('.play-choice-btn:has-text("Get up")').click();

    // Wait for new content
    await page.waitForFunction(
      () => {
        const contents = document.querySelectorAll('#storyView .play-content');
        return contents.length >= 2;
      },
      { timeout: 5000 }
    );

    // Both old and new content should be visible
    const allText = await page.locator('#storyView').textContent();
    expect(allText).toContain('You wake up.');
    expect(allText).toContain('You see the door.');

    // Separator should exist
    const separator = page.locator('.play-separator');
    await expect(separator.first()).toBeVisible();
  });

  test('sidebar shows choice summary instead of buttons when PlayRenderer is active', async ({ page }) => {
    await openPage(page);
    await startLinearModel(page);

    // Sidebar choices container should show summary text, not buttons
    const sidebar = page.locator('#choices');
    const sidebarText = await sidebar.textContent();
    expect(sidebarText).toContain('ストーリービュー内に表示');
  });
});

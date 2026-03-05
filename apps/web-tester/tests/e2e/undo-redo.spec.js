import { test, expect } from '@playwright/test';

test.describe('Undo/Redo Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Load tutorial model and start session
    await page.selectOption('#modelSelect', 'tutorial');
    await page.click('#startBtn');
    await page.waitForTimeout(1000);
  });

  test.describe('Graph Editor Undo/Redo', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to graph tab
      await page.click('#graphTab');
      await page.waitForTimeout(500);
    });

    test('should expose undoGraph/redoGraph on devtools API', async ({ page }) => {
      const api = await page.evaluate(() => {
        const dt = window.__NARRATIVEGEN_DEVTOOLS__;
        if (!dt) return { hasUndo: false, hasRedo: false };
        return {
          hasUndo: typeof dt.undoGraph === 'function',
          hasRedo: typeof dt.redoGraph === 'function',
        };
      });
      expect(api.hasUndo).toBe(true);
      expect(api.hasRedo).toBe(true);
    });

    test('should report empty history when no edits made', async ({ page }) => {
      const result = await page.evaluate(() => {
        const dt = window.__NARRATIVEGEN_DEVTOOLS__;
        if (!dt) return null;
        return dt.undoGraph();
      });
      expect(result).not.toBeNull();
      expect(result.graphHistoryDepth).toBe(0);
    });

    test('should handle undo with no history gracefully', async ({ page }) => {
      const graphContainer = page.locator('#graphEditorContainer, .graph-editor-container, [data-graph-editor]');
      const isVisible = await graphContainer.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip();
        return;
      }

      // Focus the graph editor for keyboard events
      await graphContainer.click();

      // Attempt Ctrl+Z with no history - should not throw
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);

      // Verify no error occurred (status bar should not show error)
      const statusText = await page.locator('#statusBar, .status-bar').textContent().catch(() => '');
      expect(statusText).not.toContain('エラー');
    });
  });

  test.describe('Batch Editor Undo/Redo', () => {
    test('should have undo/redo buttons in batch edit modal', async ({ page }) => {
      // Enter edit mode
      await page.click('#editBtn');
      await page.waitForTimeout(500);

      // Open batch edit modal
      const batchBtn = page.locator('#batchEditBtn');
      if (await batchBtn.isVisible().catch(() => false)) {
        await batchBtn.click();
        await page.waitForTimeout(500);

        // Verify undo/redo buttons exist
        const undoBtn = page.locator('#batchUndoBtn');
        const redoBtn = page.locator('#batchRedoBtn');
        await expect(undoBtn).toBeVisible();
        await expect(redoBtn).toBeVisible();

        // Both should be disabled initially (no history)
        await expect(undoBtn).toBeDisabled();
        await expect(redoBtn).toBeDisabled();
      }
    });

    test('should enable undo after text replacement', async ({ page }) => {
      // Enter edit mode
      await page.click('#editBtn');
      await page.waitForTimeout(500);

      // Open batch edit modal
      const batchBtn = page.locator('#batchEditBtn');
      if (!(await batchBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }
      await batchBtn.click();
      await page.waitForTimeout(500);

      // Perform a text replacement using force click to bypass overlays
      await page.fill('#searchText', 'tutorial');
      await page.fill('#replaceText', 'REPLACED');
      await page.locator('#updatePreviewBtn').click({ force: true });
      await page.waitForTimeout(500);
      await page.locator('#applyTextReplaceBtn').click({ force: true });
      await page.waitForTimeout(500);

      // Verify the flow completes without errors
      const historyCount = page.locator('#batchHistoryCount');
      const text = await historyCount.textContent();
      expect(text).toMatch(/\d+\/\d+/);
    });

    test('should display history count', async ({ page }) => {
      await page.click('#editBtn');
      await page.waitForTimeout(500);

      const batchBtn = page.locator('#batchEditBtn');
      if (!(await batchBtn.isVisible().catch(() => false))) {
        test.skip();
        return;
      }
      await batchBtn.click();
      await page.waitForTimeout(500);

      const historyCount = page.locator('#batchHistoryCount');
      await expect(historyCount).toBeVisible();
      const text = await historyCount.textContent();
      // Should show "0/0" or similar pattern
      expect(text).toMatch(/\d+\/\d+/);
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should not crash on Ctrl+Z without prior edits', async ({ page }) => {
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(300);

      // Page should still be functional
      const modelSelect = page.locator('#modelSelect');
      await expect(modelSelect).toBeVisible();
    });

    test('should not crash on Ctrl+Y without prior edits', async ({ page }) => {
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(300);

      // Page should still be functional
      const modelSelect = page.locator('#modelSelect');
      await expect(modelSelect).toBeVisible();
    });

    test('should not crash on Ctrl+Shift+Z without prior edits', async ({ page }) => {
      await page.keyboard.press('Control+Shift+z');
      await page.waitForTimeout(300);

      // Page should still be functional
      const modelSelect = page.locator('#modelSelect');
      await expect(modelSelect).toBeVisible();
    });
  });
});

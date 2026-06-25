import path from 'node:path';
import { test, expect } from '@playwright/test';

const csvPath = path.resolve(process.cwd(), 'models/spreadsheets/vertical-slice.csv');

async function openPage(page) {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto('/');
  await page.waitForFunction(
    () => window.appState != null,
    undefined,
    { timeout: 15000 }
  );
  await page.waitForFunction(
    () => typeof window.__NARRATIVEGEN_DEVTOOLS__?.getState === 'function',
    undefined,
    { timeout: 15000 }
  );
}

test.describe('Vertical slice CSV import', () => {
  test('imports canonical vertical-slice.csv and reaches proof ending', async ({ page }) => {
    await openPage(page);

    await page.setInputFiles('#csvFileInput', csvPath);
    await expect(page.locator('#csvPreviewModal')).toHaveClass(/show/, { timeout: 10000 });
    await page.click('#confirmImportBtn');

    await page.waitForFunction(
      () => {
        const state = window.__NARRATIVEGEN_DEVTOOLS__?.getState();
        return state?.currentModelName === 'vertical-slice.csv' &&
          state?.currentNodeId === 'desk' &&
          state?.nodeCount === 12;
      },
      undefined,
      { timeout: 15000 }
    );

    await expect(page.locator('#errorPanel')).not.toHaveClass(/show/);
    await expect(page.locator('#storyView')).toContainText('Midnight is close', { timeout: 10000 });

    const modelShape = await page.evaluate(() => {
      const model = window.appState.model;
      const session = JSON.parse(document.getElementById('stateView').textContent);
      const decodeChoice = model.nodes.archive.choices.find(choice => choice.id === 'decode_ledger');
      return {
        modelType: model.modelType,
        startNode: model.startNode,
        flags: model.flags,
        resources: model.resources,
        variables: model.variables,
        sessionNodeId: session.nodeId,
        sessionResources: session.resources,
        sessionVariables: session.variables,
        decodeConditions: decodeChoice.conditions,
        decodeEffects: decodeChoice.effects,
      };
    });

    expect(modelShape).toMatchObject({
      modelType: 'adventure-playthrough',
      startNode: 'desk',
      flags: {
        found_hook: false,
        trusted_mira: false,
        ai_draft_adopted: false,
      },
      resources: {
        focus: 2,
        evidence: 0,
      },
      variables: {
        lead_name: 'the missing bell',
        draft_status: 'unwritten',
      },
      sessionNodeId: 'desk',
      sessionResources: {
        focus: 2,
        evidence: 0,
      },
      sessionVariables: {
        lead_name: 'the missing bell',
        draft_status: 'unwritten',
      },
    });
    expect(modelShape.decodeConditions).toEqual([
      { type: 'resource', key: 'evidence', op: '>=', value: 2 },
      { type: 'resource', key: 'focus', op: '>=', value: 1 },
    ]);
    expect(modelShape.decodeEffects).toEqual([
      { type: 'addResource', key: 'focus', delta: -1 },
    ]);

    const storyView = page.locator('#storyView');
    await page.locator('.play-choice-btn:has-text("Open the old notebook")').click();
    await expect(storyView).toContainText('The story finally has a spine', { timeout: 10000 });

    await page.locator('.play-choice-btn:has-text("Interview Mira")').click();
    await expect(page.locator('.play-choice-btn:has-text("Ask Mira for the archive key")')).toBeVisible({ timeout: 10000 });

    await page.locator('.play-choice-btn:has-text("Ask Mira for the archive key")').click();
    await expect(page.locator('.play-choice-btn:has-text("Spend focus to decode the ledger")')).toBeVisible({ timeout: 10000 });

    await page.locator('.play-choice-btn:has-text("Spend focus to decode the ledger")').click();
    await expect(storyView).toContainText('You have enough proof to publish', { timeout: 10000 });

    await page.locator('.play-choice-btn:has-text("Publish with proof")').click();
    await expect(storyView).toContainText('Ending: the story runs with receipts', { timeout: 10000 });
    await page.waitForFunction(
      () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'truth_end',
      undefined,
      { timeout: 10000 }
    );
  });
});

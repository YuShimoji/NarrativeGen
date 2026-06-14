import fs from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const ADVANCED_ENABLED_STORAGE_KEY = 'narrativeGenAdvancedEnabled';
const ADOPTED_NODE_ID = 'ai_adopted_drafting_1';
const ADOPTION_CHOICE_ID = 'adopt_ai_drafting_1';
const ADOPTION_CHOICE_TEXT = 'Adopt mock continuation';

async function openPage(page, { advanced = false } = {}) {
  await page.addInitScript(({ storageKey, enabled }) => {
    localStorage.clear();
    if (enabled) {
      localStorage.setItem(storageKey, 'true');
    }
  }, { storageKey: ADVANCED_ENABLED_STORAGE_KEY, enabled: advanced });

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

async function loadVerticalSlice(page) {
  await expect(page.locator('#modelSelect option[value="vertical-slice"]')).toBeAttached({ timeout: 10000 });
  await expect(page.locator('#startBtn')).toBeEnabled({ timeout: 10000 });
  await page.selectOption('#modelSelect', 'vertical-slice');

  let loaded = false;
  for (let attempt = 0; attempt < 3 && !loaded; attempt += 1) {
    await page.locator('#startBtn').click();
    loaded = await page.waitForFunction(
      () => window.appState?.model?.nodes?.desk != null,
      undefined,
      { timeout: 5000 }
    ).then(() => true, () => false);
  }

  expect(loaded).toBe(true);
  await expect(page.locator('#storyView')).toContainText('Midnight is close', { timeout: 10000 });
}

async function navigateToDrafting(page) {
  const storyView = page.locator('#storyView');

  await page.locator('.play-choice-btn:has-text("Open the old notebook")').click();
  await expect(storyView).toContainText('The story finally has a spine', { timeout: 10000 });

  await page.locator('.play-choice-btn:has-text("Draft a brave scene")').click();
  await expect(storyView).toContainText('The scene is still thin', { timeout: 10000 });
  await page.waitForFunction(
    () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'drafting',
    undefined,
    { timeout: 10000 }
  );
}

async function assertAdoptedModelShape(page) {
  const modelShape = await page.evaluate(({ nodeId, choiceId }) => {
    const model = window.appState.model;
    const draftingChoices = model.nodes.drafting.choices;
    const adoptedChoice = draftingChoices.find(choice => choice.id === choiceId);

    return {
      hasAdoptedNode: Boolean(model.nodes[nodeId]),
      adoptedNodeText: model.nodes[nodeId]?.text ?? '',
      adoptedNodeChoices: model.nodes[nodeId]?.choices ?? null,
      adoptedChoice,
      originalChoiceTargets: Object.fromEntries(
        draftingChoices
          .filter(choice => ['use_mock_ai', 'cut_short'].includes(choice.id))
          .map(choice => [choice.id, choice.target])
      ),
    };
  }, { nodeId: ADOPTED_NODE_ID, choiceId: ADOPTION_CHOICE_ID });

  expect(modelShape.hasAdoptedNode).toBe(true);
  expect(modelShape.adoptedNodeText.length).toBeGreaterThan(0);
  expect(modelShape.adoptedNodeChoices).toEqual([]);
  expect(modelShape.adoptedChoice).toMatchObject({
    id: ADOPTION_CHOICE_ID,
    text: ADOPTION_CHOICE_TEXT,
    target: ADOPTED_NODE_ID,
  });
  expect(modelShape.originalChoiceTargets).toEqual({
    use_mock_ai: 'ai_mock_scene',
    cut_short: 'rushed_end',
  });
}

test.describe('Vertical slice AI mock adoption', () => {
  test('vertical-slice proof route still reaches truth_end', async ({ page }) => {
    await openPage(page);
    await loadVerticalSlice(page);

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

  test('mock AI result is adopted into the model and survives JSON reload', async ({ page }, testInfo) => {
    await openPage(page, { advanced: true });
    await loadVerticalSlice(page);
    await navigateToDrafting(page);

    await page.click('#advancedTab');
    await expect(page.locator('#generateNextNodeBtn')).toBeVisible({ timeout: 5000 });
    await page.locator('#generateNextNodeBtn').click();

    await expect(page.locator('#aiOutput')).toContainText(`node: ${ADOPTED_NODE_ID}`, { timeout: 10000 });
    await expect(page.locator('#aiOutput')).toContainText(`choice: ${ADOPTION_CHOICE_ID}`, { timeout: 10000 });
    await assertAdoptedModelShape(page);

    await page.click('#storyTab');
    await expect(page.locator(`.play-choice-btn:has-text("${ADOPTION_CHOICE_TEXT}")`)).toBeVisible({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');
    await page.click('#downloadTopBtn');
    const download = await downloadPromise;
    const exportedPath = path.join(testInfo.outputDir, 'vertical-slice-ai-adopted.json');
    await download.saveAs(exportedPath);

    const exportedModel = JSON.parse(await fs.readFile(exportedPath, 'utf-8'));
    expect(exportedModel.nodes[ADOPTED_NODE_ID]?.text).toBeTruthy();
    expect(exportedModel.nodes.drafting.choices).toContainEqual(expect.objectContaining({
      id: ADOPTION_CHOICE_ID,
      text: ADOPTION_CHOICE_TEXT,
      target: ADOPTED_NODE_ID,
    }));

    await page.reload();
    await page.waitForFunction(
      () => typeof window.__NARRATIVEGEN_DEVTOOLS__?.getState === 'function',
      undefined,
      { timeout: 15000 }
    );
    await page.setInputFiles('#fileInput', exportedPath);
    await page.waitForFunction(
      ({ nodeId, choiceId }) => {
        const model = window.appState?.model;
        return Boolean(
          model?.nodes?.[nodeId] &&
          model.nodes.drafting?.choices?.some(choice => choice.id === choiceId && choice.target === nodeId)
        );
      },
      { nodeId: ADOPTED_NODE_ID, choiceId: ADOPTION_CHOICE_ID },
      { timeout: 15000 }
    );

    await assertAdoptedModelShape(page);
    await navigateToDrafting(page);

    await page.locator(`.play-choice-btn:has-text("${ADOPTION_CHOICE_TEXT}")`).click();
    await expect(page.locator('#storyView')).toContainText(exportedModel.nodes[ADOPTED_NODE_ID].text, { timeout: 10000 });
    await page.waitForFunction(
      nodeId => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === nodeId,
      ADOPTED_NODE_ID,
      { timeout: 10000 }
    );
  });
});

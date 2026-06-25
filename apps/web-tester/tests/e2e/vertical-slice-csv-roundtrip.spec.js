import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const csvPath = path.resolve(process.cwd(), 'models/spreadsheets/vertical-slice.csv');
const multilineDeskText = 'planning board.\n\nFocus: {focus} | Evidence: {evidence}\nLead: {lead_name}';

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

async function openPage(page) {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto('/');
  await waitForApp(page);
}

async function resetPage(page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await waitForApp(page);
}

async function waitForApp(page) {
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

async function importCsv(page, filePath, expectedName) {
  await page.setInputFiles('#csvFileInput', filePath);
  await expect(page.locator('#csvPreviewModal')).toHaveClass(/show/, { timeout: 10000 });
  await page.click('#confirmImportBtn');

  await page.waitForFunction(
    (name) => {
      const state = window.__NARRATIVEGEN_DEVTOOLS__?.getState();
      return state?.currentModelName === name &&
        state?.currentNodeId === 'desk' &&
        state?.nodeCount === 12;
    },
    expectedName,
    { timeout: 15000 }
  );
  await expect(page.locator('#errorPanel')).not.toHaveClass(/show/);
}

async function playProofRoute(page) {
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
}

test.describe('Vertical slice CSV export roundtrip', () => {
  test('exports imported vertical-slice.csv, re-imports it, and reaches proof ending', async ({ page }, testInfo) => {
    await openPage(page);
    await importCsv(page, csvPath, 'vertical-slice.csv');

    const importedParity = await page.evaluate(() => ({
      speaker: window.appState.model.nodes.mira.speaker,
      deskText: window.appState.model.nodes.desk.text,
      presentation: window.appState.model.settings?.presentation,
    }));
    expect(importedParity).toMatchObject({
      speaker: 'Mira',
      presentation: {
        defaultTransition: 'append-scroll',
        paragraphDelay: 60,
        transitionDuration: 180,
      },
    });
    expect(importedParity.deskText).toContain(multilineDeskText);

    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportCsvBtn');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('vertical-slice.csv');

    const exportedPath = path.join(testInfo.outputDir, 'vertical-slice-exported.csv');
    await download.saveAs(exportedPath);

    const exportedCsv = normalizeNewlines(readFileSync(exportedPath, 'utf8'));
    expect(exportedCsv).toContain('id,speaker,text,choices,model_type,start_node,initial_flags,initial_resources,initial_variables,settings_presentation');
    expect(exportedCsv).toContain('"mira","Mira"');
    expect(exportedCsv).toContain('"desk","","Midnight is close. Your editor needs a playable short story, not another planning board.\n\nFocus: {focus} | Evidence: {evidence}\nLead: {lead_name}"');
    expect(exportedCsv).toContain('"adventure-playthrough"');
    expect(exportedCsv).toContain('"desk"');
    expect(exportedCsv).toContain('"found_hook=false;trusted_mira=false;ai_draft_adopted=false"');
    expect(exportedCsv).toContain('"focus=2;evidence=0"');
    expect(exportedCsv).toContain('"lead_name=the missing bell;draft_status=unwritten"');
    expect(exportedCsv).toContain('"{""defaultTransition"":""append-scroll"",""paragraphDelay"":60,""transitionDuration"":180}"');
    expect(exportedCsv).toContain('""id"":""decode_ledger""');
    expect(exportedCsv).toContain('""conditions""');
    expect(exportedCsv).toContain('""effects""');

    await resetPage(page);
    await importCsv(page, exportedPath, 'vertical-slice-exported.csv');

    const roundTrippedShape = await page.evaluate(() => {
      const model = window.appState.model;
      const decodeChoice = model.nodes.archive.choices.find(choice => choice.id === 'decode_ledger');
      return {
        modelType: model.modelType,
        startNode: model.startNode,
        settings: model.settings,
        resources: model.resources,
        variables: model.variables,
        deskText: model.nodes.desk.text,
        miraSpeaker: model.nodes.mira.speaker,
        decodeConditions: decodeChoice.conditions,
        decodeEffects: decodeChoice.effects,
      };
    });

    expect(roundTrippedShape).toMatchObject({
      modelType: 'adventure-playthrough',
      startNode: 'desk',
      settings: {
        presentation: {
          defaultTransition: 'append-scroll',
          paragraphDelay: 60,
          transitionDuration: 180,
        },
      },
      resources: {
        focus: 2,
        evidence: 0,
      },
      variables: {
        lead_name: 'the missing bell',
        draft_status: 'unwritten',
      },
      miraSpeaker: 'Mira',
    });
    expect(roundTrippedShape.decodeConditions).toEqual([
      { type: 'resource', key: 'evidence', op: '>=', value: 2 },
      { type: 'resource', key: 'focus', op: '>=', value: 1 },
    ]);
    expect(roundTrippedShape.decodeEffects).toEqual([
      { type: 'addResource', key: 'focus', delta: -1 },
    ]);
    expect(roundTrippedShape.deskText).toContain(multilineDeskText);

    await playProofRoute(page);
  });
});

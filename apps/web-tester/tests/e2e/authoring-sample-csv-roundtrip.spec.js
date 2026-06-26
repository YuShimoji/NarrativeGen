import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const multilineFrontDeskText = 'room opens in twenty minutes.\n\nGoal: {theme}\nProof: {proof}';

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
        state?.currentNodeId === 'front_desk' &&
        state?.nodeCount === 8;
    },
    expectedName,
    { timeout: 15000 }
  );
  await expect(page.locator('#errorPanel')).not.toHaveClass(/show/);
}

async function loadSampleCsv(page) {
  await expect(page.locator('#sampleCsvBtn')).toBeVisible({ timeout: 10000 });
  await page.click('#sampleCsvBtn');

  await page.waitForFunction(
    () => {
      const state = window.__NARRATIVEGEN_DEVTOOLS__?.getState();
      return state?.currentModelName === 'authoring-sample.csv' &&
        state?.currentNodeId === 'front_desk' &&
        state?.nodeCount === 8;
    },
    undefined,
    { timeout: 15000 }
  );
  await expect(page.locator('#errorPanel')).not.toHaveClass(/show/);
}

async function readAuthoringShape(page) {
  return page.evaluate(() => {
    const model = window.appState.model;
    const publishChoice = model.nodes.stage.choices.find(choice => choice.id === 'publish_manifesto');
    const pinPosterChoice = model.nodes.mailbox.choices.find(choice => choice.id === 'pin_poster');

    return {
      modelType: model.modelType,
      startNode: model.startNode,
      settings: model.settings,
      flags: model.flags,
      resources: model.resources,
      variables: model.variables,
      frontDeskSpeaker: model.nodes.front_desk.speaker,
      mailboxSpeaker: model.nodes.mailbox.speaker,
      frontDeskText: model.nodes.front_desk.text,
      publishConditions: publishChoice.conditions,
      publishEffects: publishChoice.effects,
      pinPosterEffects: pinPosterChoice.effects,
    };
  });
}

function expectAuthoringShape(shape) {
  expect(shape).toMatchObject({
    modelType: 'adventure-playthrough',
    startNode: 'front_desk',
    settings: {
      presentation: {
        defaultTransition: 'append-scroll',
        paragraphDelay: 45,
        transitionDuration: 140,
      },
    },
    flags: {
      has_invite: false,
      poster_ready: false,
    },
    resources: {
      proof: 0,
      energy: 2,
    },
    variables: {
      theme: 'neighborhood repair',
      draft_status: 'outline',
    },
    frontDeskSpeaker: 'Narrator',
    mailboxSpeaker: 'Mara',
  });
  expect(shape.frontDeskText).toContain(multilineFrontDeskText);
  expect(shape.publishConditions).toEqual([
    { type: 'flag', key: 'poster_ready', value: true },
    { type: 'resource', key: 'proof', op: '>=', value: 2 },
  ]);
  expect(shape.publishEffects).toEqual([
    { type: 'setVariable', key: 'draft_status', value: 'ready' },
  ]);
  expect(shape.pinPosterEffects).toEqual([
    { type: 'setFlag', key: 'poster_ready', value: true },
    { type: 'addResource', key: 'proof', delta: 1 },
    { type: 'setVariable', key: 'draft_status', value: 'poster pinned' },
  ]);
}

async function playLaunchRoute(page) {
  const storyView = page.locator('#storyView');

  await expect(storyView).toContainText('The community room opens', { timeout: 10000 });

  await page.locator('.play-choice-btn:has-text("Check the mailbox")').click();
  await expect(storyView).toContainText('Mara has left a folded note', { timeout: 10000 });

  await page.locator('.play-choice-btn:has-text("Pin the poster")').click();
  await expect(storyView).toContainText('The poster looks handmade', { timeout: 10000 });

  await page.locator('.play-choice-btn:has-text("Invite Mara to the stage")').click();
  await expect(storyView).toContainText('Proof: 2 | Energy: 1', { timeout: 10000 });
  await expect(page.locator('.play-choice-btn:has-text("Publish the launch plan")')).toBeVisible({ timeout: 10000 });

  await page.locator('.play-choice-btn:has-text("Publish the launch plan")').click();
  await expect(storyView).toContainText('The room can feel the plan becoming public', { timeout: 10000 });

  await page.locator('.play-choice-btn:has-text("Open the doors")').click();
  await expect(storyView).toContainText('Ending: the launch has witnesses', { timeout: 10000 });
  await page.waitForFunction(
    () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'launch_end',
    undefined,
    { timeout: 10000 }
  );
}

test.describe('Authoring sample CSV export roundtrip', () => {
  test('preserves speaker, multiline text, settings, and gated effects through export and re-import', async ({ page }, testInfo) => {
    await openPage(page);
    await loadSampleCsv(page);

    expectAuthoringShape(await readAuthoringShape(page));
    await playLaunchRoute(page);

    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportCsvBtn');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('authoring-sample.csv');

    const exportedPath = path.join(testInfo.outputDir, 'authoring-sample-exported.csv');
    await download.saveAs(exportedPath);

    const exportedCsv = normalizeNewlines(readFileSync(exportedPath, 'utf8'));
    expect(exportedCsv).toContain('id,speaker,text,choices,model_type,start_node,initial_flags,initial_resources,initial_variables,settings_presentation');
    expect(exportedCsv).toContain('"front_desk","Narrator","The community room opens in twenty minutes.\n\nGoal: {theme}\nProof: {proof}"');
    expect(exportedCsv).toContain('"mailbox","Mara"');
    expect(exportedCsv).toContain('"has_invite=false;poster_ready=false"');
    expect(exportedCsv).toContain('"proof=0;energy=2"');
    expect(exportedCsv).toContain('"theme=neighborhood repair;draft_status=outline"');
    expect(exportedCsv).toContain('"{""defaultTransition"":""append-scroll"",""paragraphDelay"":45,""transitionDuration"":140}"');
    expect(exportedCsv).toContain('""id"":""publish_manifesto""');
    expect(exportedCsv).toContain('""conditions""');
    expect(exportedCsv).toContain('""effects""');

    await resetPage(page);
    await importCsv(page, exportedPath, 'authoring-sample-exported.csv');

    expectAuthoringShape(await readAuthoringShape(page));
    await playLaunchRoute(page);
  });
});

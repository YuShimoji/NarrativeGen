import { test, expect } from '@playwright/test';

const PROCEDURAL_PROBE = 'procedural-choice-spine-probe';
const ORIGINALITY_PROBE = 'originality-spine-probe';
const RULE_ID = 'mira_receipt_contradiction';
const PERCEPTION_EVENT_ID = 'event_mira_perceives_receipt_contradiction';

async function openPage(page) {
  await page.addInitScript(() => {
    localStorage.clear();
  });

  await page.goto('/');
  await page.waitForFunction(
    () => typeof window.__NARRATIVEGEN_DEVTOOLS__?.getState === 'function',
    undefined,
    { timeout: 15000 }
  );
}

async function loadSample(page, sampleId) {
  await page.locator('#storyTab').click();
  await expect(page.locator(`#modelSelect option[value="${sampleId}"]`)).toBeAttached({ timeout: 10000 });
  await expect(page.locator('#startBtn')).toBeEnabled({ timeout: 10000 });
  await page.selectOption('#modelSelect', sampleId);
  await page.locator('#startBtn').click();
  await page.waitForFunction(
    ({ expectedModel }) => {
      const state = window.__NARRATIVEGEN_DEVTOOLS__?.getState();
      return state?.currentModelName === expectedModel && state?.currentNodeId === 'desk';
    },
    { expectedModel: sampleId },
    { timeout: 15000 }
  );
}

async function chooseMiraReframe(page) {
  await page.locator('#storyTab').click();
  await page.locator('.play-choice-btn:has-text("Ask Mira to test the receipt")').click();
  await page.waitForFunction(
    () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'memory_reframed',
    undefined,
    { timeout: 10000 }
  );
}

test.describe('Procedural Choice Spine Probe', () => {
  test('opens the semantic route through a pure knowledge rule and exposes diagnostics only in the dashboard', async ({ page }) => {
    await openPage(page);
    await loadSample(page, PROCEDURAL_PROBE);

    await expect(page.locator('#storyView')).toContainText('ミラはレシート片を机に置く');
    await expect(page.locator('#storyView')).not.toContainText(RULE_ID);
    await expect(page.locator('#storyView')).not.toContainText('archive_records');

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="model-name"]')).toContainText(PROCEDURAL_PROBE);
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('present_model_only');
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('1 rules (0 current)');
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('0 direct perceiveEntity');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-count"]')).toHaveText('1 rules');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-current-use"]')).toContainText('0 uses');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-result"]')).toHaveText('現在ノードでは未評価');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-perception-event"]')).toContainText('0 policy-derived');

    await chooseMiraReframe(page);

    await expect(page.locator('#storyView')).toContainText('ミラは南書庫の記録と照合し');
    await expect(page.locator('#storyView')).toContainText('ミラの補足:');
    await expect(page.locator('.play-choice-btn:has-text("Follow the semantic contradiction")')).toBeVisible();
    for (const diagnosticToken of [
      RULE_ID,
      PERCEPTION_EVENT_ID,
      'archive_records',
      'profileMatch',
      'missingReason',
      'noticed',
    ]) {
      await expect(page.locator('#storyView')).not.toContainText(diagnosticToken);
    }

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('live_in_route');
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('1 rules (1 current)');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-current-use"]')).toContainText(`1 uses: ${RULE_ID}`);
    await expect(page.locator('[data-dashboard-field="knowledge-rule-result"]')).toContainText(`${RULE_ID}: 気づいた (noticed)`);
    await expect(page.locator('[data-dashboard-field="knowledge-rule-domain"]')).toHaveText('archive_records → archive_records');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-profile-match"]')).toHaveText('exact');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-missing-reason"]')).toHaveText('なし');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-choice-attribution"]')).toContainText(`follow_semantic_change ← ${RULE_ID}: 利用可能`);
    await expect(page.locator('[data-dashboard-field="knowledge-rule-perception-event"]')).toContainText('0 policy-derived');

    await page.locator('#storyTab').click();
    await page.locator('.play-choice-btn:has-text("Follow the semantic contradiction")').click();
    await page.waitForFunction(
      () => window.__NARRATIVEGEN_DEVTOOLS__?.getState().currentNodeId === 'semantic_end',
      undefined,
      { timeout: 10000 }
    );
    await expect(page.locator('#storyView')).toContainText('結末は、ミラの書庫知識');
    await expect(page.locator('#storyView')).not.toContainText(RULE_ID);
    await expect(page.locator('#storyView')).not.toContainText(PERCEPTION_EVENT_ID);
  });

  test('switches between the persistent-event and pure-rule probes without leaking route or diagnostic state', async ({ page }) => {
    await openPage(page);
    await loadSample(page, ORIGINALITY_PROBE);
    await chooseMiraReframe(page);

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="originality-character-knowledge-state"]')).toContainText('1 live (1 policy)');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-count"]')).toHaveText('0 rules');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-perception-event"]')).toContainText('1 policy-derived');

    await loadSample(page, PROCEDURAL_PROBE);
    await expect(page.locator('#storyView')).toContainText('ミラはレシート片を机に置く');
    await expect(page.locator('#storyView')).not.toContainText('ミラは南書庫の記録と照合し');
    await expect(page.locator('#storyView')).not.toContainText('Follow the semantic contradiction');

    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="knowledge-rule-count"]')).toHaveText('1 rules');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-current-use"]')).toContainText('0 uses');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-result"]')).toHaveText('現在ノードでは未評価');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-perception-event"]')).toContainText('0 policy-derived');

    await chooseMiraReframe(page);
    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="knowledge-rule-result"]')).toContainText(`${RULE_ID}: 気づいた (noticed)`);
    await expect(page.locator('[data-dashboard-field="knowledge-rule-choice-attribution"]')).toContainText('follow_semantic_change');

    await loadSample(page, ORIGINALITY_PROBE);
    await expect(page.locator('#storyView')).not.toContainText('ミラは南書庫の記録と照合し');
    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="knowledge-rule-count"]')).toHaveText('0 rules');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-result"]')).toHaveText('現在ノードでは未評価');
    await expect(page.locator('[data-dashboard-field="knowledge-rule-perception-event"]')).toContainText('0 policy-derived');

    await loadSample(page, PROCEDURAL_PROBE);
    await chooseMiraReframe(page);
    await expect(page.locator('.play-choice-btn:has-text("Follow the semantic contradiction")')).toBeVisible();
    await page.locator('#designerDashboardTab').click();
    await expect(page.locator('[data-dashboard-field="knowledge-rule-result"]')).toContainText(`${RULE_ID}: 気づいた (noticed)`);
    await expect(page.locator('[data-dashboard-field="knowledge-rule-perception-event"]')).toContainText('0 policy-derived');
  });
});

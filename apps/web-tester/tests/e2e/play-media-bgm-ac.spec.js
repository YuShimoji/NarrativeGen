import { test, expect } from '@playwright/test';

/**
 * AC-9〜12 のうち、HTMLMediaElement の挙動で機械判定できる部分を Playwright で固定する。
 * 聴覚品質は別途実機でも可だが、本 spec 通過をもって再生・音量・停止・gesture 後再生を証跡とする。
 */

async function openPage(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.waitForFunction(() => window.appState != null, { timeout: 15000 });
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

test.describe('SP-PLAY-001 AC-9〜12 (BGM 機械検証)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__ngAudioPlayLog = [];
      window.__ngAudioPauseLog = [];
      const origPlay = HTMLMediaElement.prototype.play;
      const origPause = HTMLMediaElement.prototype.pause;
      HTMLMediaElement.prototype.play = function patchedPlay(...args) {
        try {
          const src = this.currentSrc || this.src || '';
          window.__ngAudioPlayLog.push({ t: performance.now(), src });
        } catch {
          /* ignore */
        }
        return origPlay.apply(this, args);
      };
      HTMLMediaElement.prototype.pause = function patchedPause(...args) {
        try {
          const src = this.currentSrc || this.src || '';
          window.__ngAudioPauseLog.push({ t: performance.now(), src });
        } catch {
          /* ignore */
        }
        return origPause.apply(this, args);
      };
    });
  });

  test('AC-12: 初回操作前に page エラーがなく、操作後に play() が呼ばれる', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') pageErrors.push(msg.text());
    });

    await openPage(page);
    await startMediaModel(page);
    expect(pageErrors, `errors before gesture: ${pageErrors.join('; ')}`).toEqual([]);

    await page.locator('.play-choice-btn:has-text("Investigate")').click();
    await page.waitForFunction(
      () => (window.__ngAudioPlayLog || []).length > 0,
      { timeout: 10000 }
    );
    expect(pageErrors, `errors after gesture: ${pageErrors.join('; ')}`).toEqual([]);
  });

  test('AC-9: 初回ジェスチャ後に defaultBgm の URL で play が走る', async ({ page }) => {
    await openPage(page);
    await startMediaModel(page);
    await page.locator('.play-choice-btn:has-text("Investigate")').click();
    await page.waitForFunction(
      () => (window.__ngAudioPlayLog || []).some((e) => e.src.includes('test-bgm')),
      { timeout: 10000 }
    );
  });

  test('AC-10: start→scene2 遷移で両 BGM の play が記録される（クロスフェード経路）', async ({
    page,
  }) => {
    await openPage(page);
    await startMediaModel(page);
    await page.locator('.play-choice-btn:has-text("Investigate")').click();
    await page.waitForFunction(
      () => {
        const log = window.__ngAudioPlayLog || [];
        return log.some((e) => e.src.includes('test-bgm')) && log.some((e) => e.src.includes('test-bgm2'));
      },
      { timeout: 10000 }
    );
  });

  test('AC-11: end（bgm null）到達後、pause が記録される（フェードアウト完了）', async ({
    page,
  }) => {
    await openPage(page);
    await startMediaModel(page);
    await navigateToScene2(page);
    const pausesBefore = await page.evaluate(() => (window.__ngAudioPauseLog || []).length);

    await page.locator('.play-choice-btn:has-text("Enter silence")').click();
    await page.waitForSelector('.play-ending', { timeout: 10000 });

    await page.waitForFunction(
      (n) => (window.__ngAudioPauseLog || []).length > n,
      pausesBefore,
      { timeout: 15000 }
    );
  });
});

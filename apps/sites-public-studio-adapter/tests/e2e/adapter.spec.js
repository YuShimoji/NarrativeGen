import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/studio\/$/)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('root serves the exact Studio assets and interactive story flow', async ({ page }) => {
  const requests = []
  page.on('request', (request) => requests.push(request.url()))

  await expect(page.locator('#experience-title')).toBeVisible()
  await expect(page.locator('#story-text')).toContainText('ミラはレシート片を机に置く')
  await expect(page.locator('#story-choices').getByRole('button')).toHaveCount(2)

  const assetUrls = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((entry) => entry.name),
  )
  expect(assetUrls.some((url) => /\/studio\/assets\/[^/]+\.css$/.test(url))).toBe(true)
  expect(assetUrls.some((url) => /\/studio\/assets\/[^/]+\.js$/.test(url))).toBe(true)

  const firstChoice = page.locator('[data-choice-index="0"]')
  await firstChoice.locator('[data-field="choice-text"]').fill('台帳の矛盾を直接たしかめる')
  await firstChoice.locator('[data-field="choice-target"]').selectOption('semantic_end')
  await page.locator('#story-choices').getByRole('button', { name: '台帳の矛盾を直接たしかめる' }).click()
  await expect(page.locator('#detail-current-node')).toHaveText('semantic_end')
  await expect(page.locator('#story-text')).toContainText('結末は')

  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4184')).toBe(true)
})

test('editing, reload persistence, JSON export, and import stay functional', async ({ page }) => {
  const editedText = 'Sites adapter上のローカル下書き。\n\n外部送信は行いません。'
  await page.locator('#node-text').fill(editedText)
  await expect(page.locator('#story-text')).toContainText('Sites adapter上のローカル下書き。')
  await expect(page.locator('#draft-status')).toContainText('自動保存済み')

  await page.reload()
  await expect(page.locator('#node-text')).toHaveValue(editedText)
  await expect(page.locator('#draft-status')).toContainText('復元しました')

  const downloadPromise = page.waitForEvent('download')
  await page.locator('#export-json').click()
  const download = await downloadPromise
  const downloadPath = await download.path()
  const exported = JSON.parse(await readFile(downloadPath, 'utf8'))
  expect(exported.nodes.desk.text).toBe(editedText)

  await page.locator('#reset-draft').click()
  await expect(page.locator('#node-text')).not.toHaveValue(editedText)
  await page.locator('#import-json').setInputFiles(downloadPath)
  await expect(page.locator('#transfer-status')).toContainText('読み込み、プレビューを更新しました')
  await expect(page.locator('#node-text')).toHaveValue(editedText)
})

test('forbidden surfaces stay absent on desktop and 390px layouts', async ({ page }, testInfo) => {
  const forbidden = /OpenAI|API[ _-]?Key|AI設定|AI支援機能|\bpayment\b|\bcheckout\b|\bcard\b|\bsubscription\b|\bStripe\b|\bdebug\b/i

  await expect(page.locator('#commercial-contact')).toBeHidden()
  await expect(page.locator('form')).toHaveCount(0)
  expect(await page.locator('body').innerText()).not.toMatch(forbidden)
  expect(await page.locator('script[src^="http"], link[href^="http"]').count()).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('adapter-desktop.png'), fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('#experience-title')).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
  await page.screenshot({ path: testInfo.outputPath('adapter-narrow.png'), fullPage: true })

  await page.reload()
  await expect(page.locator('#experience-title')).toBeVisible()
})

import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'
import { loadModel } from '../../../../packages/engine-ts/dist/index.js'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('sample auto-starts and an edited choice drives the shared engine preview', async ({ page }) => {
  await expect(page.locator('#experience-title')).toBeVisible()
  await expect(page.locator('#story-text')).toContainText('ミラはレシート片を机に置く')
  await expect(page.locator('#story-choices').getByRole('button')).toHaveCount(2)

  const firstChoice = page.locator('[data-choice-index="0"]')
  await firstChoice.locator('[data-field="choice-text"]').fill('台帳の矛盾を直接たしかめる')
  await firstChoice.locator('[data-field="choice-target"]').selectOption('semantic_end')

  const editedChoice = page.locator('#story-choices').getByRole('button', {
    name: '台帳の矛盾を直接たしかめる',
  })
  await expect(editedChoice).toBeVisible()
  await editedChoice.click()
  await expect(page.locator('#detail-current-node')).toHaveText('semantic_end')
  await expect(page.locator('#story-text')).toContainText('結末は')
})

test('node text persists locally and exported JSON imports back as an engine-valid model', async ({ page }) => {
  const editedText = 'ローカル下書きの往復確認。\n\nこの文は外部へ送信されません。'
  await page.locator('#node-text').fill(editedText)
  await expect(page.locator('#draft-status')).toContainText('自動保存済み')

  await page.reload()
  await expect(page.locator('#node-text')).toHaveValue(editedText)
  await expect(page.locator('#draft-status')).toContainText('復元しました')

  const downloadPromise = page.waitForEvent('download')
  await page.locator('#export-json').click()
  const download = await downloadPromise
  const downloadPath = await download.path()
  const exported = JSON.parse(await readFile(downloadPath, 'utf8'))
  expect(() => loadModel(exported)).not.toThrow()
  expect(exported.nodes.desk.text).toBe(editedText)

  await page.locator('#reset-draft').click()
  await expect(page.locator('#node-text')).not.toHaveValue(editedText)
  await page.locator('#import-json').setInputFiles(downloadPath)
  await expect(page.locator('#transfer-status')).toContainText('読み込み、プレビューを更新しました')
  await expect(page.locator('#node-text')).toHaveValue(editedText)
})

test('public surface stays bounded on desktop and narrow viewports', async ({ page }, testInfo) => {
  const forbidden = /OpenAI|API[ _-]?Key|AI設定|AI支援機能|\bpayment\b|\bcheckout\b|\bcard\b|\bsubscription\b|\bStripe\b|\bdebug\b/i

  await expect(page.locator('#commercial-contact')).toBeHidden()
  await expect(page.locator('form')).toHaveCount(0)
  expect(await page.locator('body').innerText()).not.toMatch(forbidden)
  expect(await page.locator('script[src^="http"], link[href^="http"]').count()).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('public-studio-desktop.png'), fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('#experience-title')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.screenshot({ path: testInfo.outputPath('public-studio-narrow.png'), fullPage: true })
})

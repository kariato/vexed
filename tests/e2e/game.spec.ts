import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
const cell = (page: Page, x: number, y: number) => page.locator('#cell-' + x + '-' + y)
async function tap(page: Page, x: number, y: number) {
  await expect(page.getByRole('grid')).toHaveAttribute('aria-busy', 'false')
  const target = cell(page, x, y)
  if (!test.info().project.use.hasTouch) await target.click()
  else await target.tap()
}
test.beforeEach(async ({ page }) => { await page.goto('./'); await expect(page.getByRole('grid')).toBeVisible() })
test('solves the first original puzzle with taps and advances', async ({ page }) => {
  for (const [x, y] of [[4, 2], [3, 5], [3, 2], [4, 2]]) {
    await tap(page, x!, y!); await tap(page, x! + 1, y!)
  }
  await expect(page.getByRole('status')).toHaveText('Puzzle solved in 4 moves!')
  await expect(page.locator('.block')).toHaveCount(0)
  await page.getByRole('button', { name: 'Next puzzle' }).click()
  await expect(page.getByRole('heading', { name: 'Level 2', exact: true })).toBeVisible()
})
test('cross-row tap uses destination column; undo restores original board', async ({ page }) => {
  await tap(page, 4, 2); await tap(page, 5, 4)
  await expect(page.locator('.stats dd').first()).toHaveText('1')
  await expect(cell(page, 4, 2)).toHaveAttribute('aria-label', /empty/)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(cell(page, 4, 2)).toHaveAttribute('aria-label', /block A/)
  await expect(page.locator('.stats dd').first()).toHaveText('0')
})
test('arrow controls and keyboard move without duplicate pointer clicks', async ({ page }) => {
  await tap(page, 4, 2)
  await page.getByRole('button', { name: 'Move selected block right' }).click()
  await expect(page.locator('.stats dd').first()).toHaveText('1')
  await page.getByRole('grid').press('z')
  await expect(page.locator('.stats dd').first()).toHaveText('0')
  await tap(page, 4, 2)
  await page.getByRole('grid').press('ArrowRight')
  await page.getByRole('grid').press('Enter')
  await expect(page.locator('.stats dd').first()).toHaveText('1')
})
test('invalid destinations leave moves unchanged and restart can be cancelled', async ({ page }) => {
  await tap(page, 4, 2); await tap(page, 4, 4)
  await expect(page.getByRole('status')).toContainText('blocked')
  await expect(page.locator('.stats dd').first()).toHaveText('0')
  await tap(page, 4, 2); await tap(page, 5, 2)
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: 'Restart', exact: true }).click()
  await expect(page.locator('.stats dd').first()).toHaveText('1')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Restart', exact: true }).click()
  await expect(page.locator('.stats dd').first()).toHaveText('0')
})
test('responsive board fits without horizontal page scrolling', async ({ page }) => {
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width)
  await expect(page.getByRole('gridcell')).toHaveCount(80)
  await expect(page.getByRole('grid')).toHaveCSS('touch-action', 'none')
  await expect(page.locator('body')).toHaveCSS('touch-action', 'auto')
  const size = await page.getByRole('button', { name: 'Move selected block left' }).boundingBox()
  expect(size!.height).toBeGreaterThanOrEqual(44)
  expect(size!.width).toBeGreaterThanOrEqual(44)
})
test('captured mouse drag commits once; release outside and resize cancel', async ({ page }) => {
  const from = (await cell(page, 4, 2).boundingBox())!
  const to = (await cell(page, 5, 2).boundingBox())!
  const origin = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
  const target = { x: to.x + to.width / 2, y: to.y + to.height / 2 }
  await page.mouse.move(origin.x, origin.y); await page.mouse.down()
  await page.mouse.move(target.x, target.y, { steps: 5 })
  await expect(page.locator('.stats dd').first()).toHaveText('0')
  await page.mouse.up()
  await expect(page.locator('.stats dd').first()).toHaveText('1')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await page.mouse.move(origin.x, origin.y); await page.mouse.down(); await page.mouse.move(0, 0); await page.mouse.up()
  await expect(page.locator('.stats dd').first()).toHaveText('0')
  await page.mouse.move(origin.x, origin.y); await page.mouse.down(); await page.mouse.move(target.x, target.y)
  const viewport = page.viewportSize()!
  await page.setViewportSize({ width: viewport.width + 1, height: viewport.height })
  await page.mouse.up()
  await expect(page.locator('.stats dd').first()).toHaveText('0')
})
test('touch drags commit once and touch cancellation commits nothing', async ({ page }) => {
  test.skip(!test.info().project.use.hasTouch || test.info().project.use.browserName !== 'chromium', 'Chromium touch protocol coverage; all engines have tap/drag coverage')
  const from = (await cell(page, 4, 2).boundingBox())!
  const to = (await cell(page, 5, 2).boundingBox())!
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2, id: 1 }
  const end = { x: to.x + to.width / 2, y: to.y + to.height / 2, id: 1 }
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [end] })
  await expect(page.locator('.stats dd').first()).toHaveText('0')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await expect(page.locator('.stats dd').first()).toHaveText('0')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [end] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.locator('.stats dd').first()).toHaveText('1')
})
test('tablet landscape keeps board and controls in view', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  const controls = (await page.locator('.controls').boundingBox())!
  expect(controls.y + controls.height).toBeLessThanOrEqual(768)
  await expect(page.getByRole('grid')).toBeInViewport({ ratio: 1 })
})
test('a second touch ending does not cancel the primary gesture', async ({ page }) => {
  test.skip(!test.info().project.use.hasTouch || test.info().project.use.browserName !== 'chromium', 'Chromium touch protocol coverage; all engines have tap/drag coverage')
  const from = (await cell(page, 4, 2).boundingBox())!
  const to = (await cell(page, 5, 2).boundingBox())!
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2, id: 1 }
  const end = { x: to.x + to.width / 2, y: to.y + to.height / 2, id: 1 }
  const second = { x: from.x, y: from.y + from.height * 2, id: 2 }
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start, second] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [end, second] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [second] })
  await expect(page.locator('.stats dd').first()).toHaveText('0')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.locator('.stats dd').first()).toHaveText('1')
})
test('a failed pack request offers a working retry', async ({ page }) => {
  await page.route('**/packs/classic.json', route => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Could not load the puzzles' })).toBeVisible()
  await page.unroute('**/packs/classic.json')
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('grid')).toBeVisible()
})

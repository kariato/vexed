import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
async function audit(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()
  expect(results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([])
}
test.beforeEach(async ({page})=>{await page.goto('./');await expect(page.getByRole('grid')).toBeVisible()})
test('Classic, Modern and expanded help/settings pass automated accessibility checks',async({page})=>{
  await audit(page)
  await page.screenshot({ path: test.info().outputPath('classic.png'), fullPage: true })
  await page.getByText('Settings',{exact:true}).click()
  await page.getByLabel('Appearance',{exact:true}).selectOption('modern')
  await page.getByText('How to play & scoring',{exact:true}).click()
  await audit(page)
  await page.screenshot({ path: test.info().outputPath('modern.png'), fullPage: true })
})
test('solution modal passes accessibility checks and returns keyboard focus',async({page})=>{
  const open=page.getByRole('button',{name:'View solution',exact:true})
  page.once('dialog',dialog=>dialog.accept());await open.click()
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible()
  await audit(page)
  await dialog.getByRole('button',{name:'Return to game',exact:true}).click()
  await expect(open).toBeFocused()
})
test('200 percent text remains usable without horizontal page overflow',async({page})=>{
  await page.locator('h1,h1 span,h2,h3,p,button,label,select,summary,dt,dd,small,.block').evaluateAll(elements=>{ const sizes=elements.map(element=>parseFloat(getComputedStyle(element).fontSize)); elements.forEach((element,index)=>{(element as HTMLElement).style.fontSize=sizes[index]! * 2+'px'}) })
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}))
  expect(width.scroll).toBeLessThanOrEqual(width.client)
  await expect(page.getByRole('button',{name:'Restart',exact:true})).toBeVisible()
})

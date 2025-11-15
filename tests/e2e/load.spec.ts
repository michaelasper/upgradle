import { expect, test } from '@playwright/test'

test('app boots from a clean storage state', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Upgradle' })).toBeVisible()
  await expect(page.locator('.board .guess-row')).toHaveCount(6)
})

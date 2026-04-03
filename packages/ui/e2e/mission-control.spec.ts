import { test, expect } from '@playwright/test'

test.describe('Mission Control', () => {
  test('shows ready gate and tab navigation', async ({ page }) => {
    await page.goto('/brains')
    await expect(page.locator('h1')).toContainText('Brains')
  })

  test('tab bar renders all 7 tabs', async ({ page }) => {
    await page.goto('/brains/test-brain?tab=graph')

    const tabs = [
      'Graph + Notes',
      'CEO View',
      'Director View',
      'Product Owner',
      'Tribe View',
      'Mission Control',
      'Agents + Workflow',
    ]

    for (const tab of tabs) {
      await expect(page.getByRole('button', { name: tab })).toBeVisible()
    }
  })

  test('can navigate to Mission Control tab', async ({ page }) => {
    await page.goto('/brains/test-brain?tab=mission-control')
    await expect(page.getByText('Mission Control')).toBeVisible()
    await expect(page.getByText("I'm Ready")).toBeVisible()
  })

  test('ready gate advances to start work phase', async ({ page }) => {
    await page.goto('/brains/test-brain?tab=mission-control')
    await expect(page.getByText("I'm Ready")).toBeVisible()

    await page.getByRole('button', { name: "I'm Ready" }).click()
    await expect(page.getByText('Start Next Work')).toBeVisible()
  })

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('http://localhost:3010/api/health')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.version).toBe('2.0.0')
  })
})

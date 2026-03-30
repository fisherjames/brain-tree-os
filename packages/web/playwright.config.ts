import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.BRIAN_E2E_BASE_URL || 'http://localhost:3010',
    headless: true,
  },
})

import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  outputDir: 'test-results/gameplay', reporter: [['list'], ['json', { outputFile: 'test-results/reports/gameplay.json' }]],
  testDir: './tests/e2e', fullyParallel: true, retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:4175/vexed/', trace: 'retain-on-failure' },
  webServer: { command: 'VITE_BASE_PATH=/vexed/ npm run dev -- --host 127.0.0.1 --port 4175 --strictPort', url: 'http://127.0.0.1:4175/vexed/', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], browserName: 'chromium' } },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'], browserName: 'chromium' } },
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true } },
    { name: 'safari-tablet', use: { ...devices['iPad (gen 7)'], browserName: 'webkit' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], browserName: 'firefox' } },
  ],
})

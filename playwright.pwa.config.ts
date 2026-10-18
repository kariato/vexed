import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  outputDir: 'test-results/pwa', reporter: [['list'], ['json', { outputFile: 'test-results/reports/pwa.json' }]],
  testDir: './tests/pwa', fullyParallel: false, workers: 1, retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:4176/vexed/', trace: 'retain-on-failure', ...devices['Desktop Chrome'] },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }, { name: 'webkit', use: { browserName: 'webkit' } }, { name: 'firefox', use: { browserName: 'firefox' } }],
  webServer: { command: 'VITE_BASE_PATH=/vexed/ npm run build && VITE_BASE_PATH=/vexed/ npm run preview -- --host 127.0.0.1 --port 4176 --strictPort', url: 'http://127.0.0.1:4176/vexed/', reuseExistingServer: false },
})

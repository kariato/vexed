import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests', outputDir: './test-results', workers: 2,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4177', trace: 'retain-on-failure' },
  webServer: { command: 'npm run package && python3 server.py', url: 'http://127.0.0.1:4177/embed.html', reuseExistingServer: false },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true } },
    { name: 'webkit-tablet', use: { ...devices['iPad (gen 7)'], browserName: 'webkit' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
})

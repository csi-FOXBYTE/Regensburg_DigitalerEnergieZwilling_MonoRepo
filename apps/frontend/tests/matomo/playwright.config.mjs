import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: '/results/artifacts',
  reporter: [['list']],
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    baseURL: 'http://localhost:4321',
    // Corporate TLS inspection replaces some upstream certificates (map tiles).
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});

import { defineConfig, devices } from '@playwright/test';

/** Run browser journeys against local backend and frontend development servers. */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } }
  ],
  webServer: {
    command: "sh -c 'cd ..; rm -f /tmp/bookmyshow-playwright.db*; (cd backend && node node_modules/typescript/bin/tsc && PORT=4000 CORS_ORIGIN=http://127.0.0.1:3000 DATABASE_PATH=/tmp/bookmyshow-playwright.db TEST_CATALOG_DELAY_MS=750 TEST_EMPTY_THEATRES_MOVIE_ID=2 node dist/index.js) & (cd frontend && API_SERVER_URL=http://127.0.0.1:4000 node node_modules/next/dist/bin/next dev)'", 
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});

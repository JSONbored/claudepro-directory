import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: path.resolve(__dirname, '../../apps/web/src/app'),
  testMatch: '**/*.spec.{ts,tsx}',
  timeout: 30 * 1000,
  expect: {
    timeout: 10000, // Increased timeout for screenshot stability
    toHaveScreenshot: {
      threshold: 0.2,
      // Use maxDiffPixelRatio instead of maxDiffPixels for better scaling across screen sizes
      maxDiffPixelRatio: 0.01, // 1% pixel difference allowed
    },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Optimize workers: Use sharding for better CI performance, auto for local
  // Sharding splits tests across workers more efficiently than simple worker count
  // For CI: Use 2 workers (better resource utilization)
  // For local: Use auto (detects CPU cores automatically)
  workers: process.env.CI ? 2 : undefined,
  // Maximum number of test failures before stopping (0 = run all tests)
  maxFailures: process.env.CI ? 10 : 0,
  // Enable test result caching for faster re-runs (caches based on test file content)
  // Cache is invalidated when test files or dependencies change
  // Note: Playwright doesn't have built-in caching like Vitest, but we can use sharding
  reporter: [
    // Enhanced HTML reporter with better visualization
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    [
      'json',
      {
        outputFile: 'test-results/results.json',
        // Enhanced JSON structure for better CI integration
      },
    ],
    // GitHub Actions reporter for CI
    process.env.CI ? ['github'] : ['list'],
    // JUnit reporter for CI integration (if needed)
    ...(process.env.CI ? [['junit', { outputFile: 'test-results/junit.xml' }]] : []),
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Keep traces for all failures (better debugging than on-first-retry)
    trace: 'retain-on-failure',
  },
  // Global setup for accessibility testing with @axe-core/playwright
  globalSetup: path.resolve(__dirname, './playwright-global-setup.ts'),
  // Playwright test coverage configuration
  // Note: playwright-test-coverage requires additional setup in test files
  // See: https://github.com/anishkny/playwright-test-coverage
  // For now, coverage is handled by Vitest for unit tests
  // Playwright coverage can be enabled per-test using playwright-test-coverage
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter web dev',
    cwd: path.resolve(__dirname, '../..'),
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

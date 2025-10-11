/**
 * Playwright E2E Testing Configuration
 *
 * Production-ready end-to-end testing configuration for claudepro-directory.
 * Tests critical user flows, authentication, search, and core functionality.
 *
 * **Security:**
 * - No production secrets in config
 * - Test environment isolation
 * - Safe test data management
 *
 * **Performance:**
 * - Parallel execution
 * - Smart retries (2x in CI)
 * - Optimized timeouts
 *
 * **Accessibility:**
 * - Integrated axe-core testing
 * - WCAG 2.1 AA compliance checks
 * - Keyboard navigation testing
 *
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Determine if running in CI environment
 */
const IS_CI = !!process.env.CI;

/**
 * Base URL for testing
 * - Local: http://localhost:3000
 * - CI: Set via environment variable or fallback
 */
const BASE_URL =
  process.env.BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

/**
 * Playwright Test Configuration
 */
export default defineConfig({
  /**
   * Test directory
   * E2E tests located in tests/e2e/ directory
   */
  testDir: '../../tests/e2e',

  /**
   * Test file patterns
   * Matches: *.spec.ts, *.e2e.ts, *.test.ts
   */
  testMatch: /.*\.(spec|e2e|test)\.ts$/,

  /**
   * Parallel execution
   * Run tests in parallel for faster execution
   */
  fullyParallel: true,

  /**
   * Fail on .only() in CI
   * Prevents accidentally committing focused tests
   */
  forbidOnly: IS_CI,

  /**
   * Retries
   * - CI: 2 retries (flaky test tolerance)
   * - Local: 0 retries (fast feedback)
   */
  retries: IS_CI ? 2 : 0,

  /**
   * Workers
   * - CI: 1 worker (GitHub Actions has limited resources)
   * - Local: Use 50% of CPU cores (undefined = auto)
   */
  workers: IS_CI ? 1 : undefined,

  /**
   * Reporters
   * - list: Simple console output
   * - html: HTML report for debugging (opens automatically on failure)
   * - json: Machine-readable results for CI
   * - github: GitHub Actions annotations (CI only)
   */
  reporter: IS_CI
    ? [
        ['list'],
        ['html', { outputFolder: '../../playwright-report', open: 'never' }],
        ['json', { outputFile: '../../test-results/results.json' }],
        ['github'],
      ]
    : [['list'], ['html', { outputFolder: '../../playwright-report', open: 'on-failure' }]],

  /**
   * Shared settings for all tests
   */
  use: {
    /**
     * Base URL for navigation
     * All page.goto('/') calls use this as prefix
     */
    baseURL: BASE_URL,

    /**
     * Trace recording
     * - on-first-retry: Only record traces for retried tests (saves space)
     * - Include screenshots, DOM snapshots, network logs
     */
    trace: 'on-first-retry',

    /**
     * Screenshot capture
     * - only-on-failure: Capture screenshots when tests fail
     * - Helps debugging in CI where you can't inspect visually
     */
    screenshot: 'only-on-failure',

    /**
     * Video recording
     * - retain-on-failure: Keep videos only for failed tests
     * - Saves disk space while preserving debugging info
     */
    video: 'retain-on-failure',

    /**
     * Viewport size
     * Default desktop viewport (1280x720)
     */
    viewport: { width: 1280, height: 720 },

    /**
     * User agent
     * Use default Playwright user agent
     */
    // userAgent: 'Playwright E2E Tests',

    /**
     * Action timeout
     * Maximum time for each action (click, fill, etc.)
     */
    actionTimeout: 15000, // 15 seconds

    /**
     * Navigation timeout
     * Maximum time for page.goto() and navigation
     */
    navigationTimeout: 30000, // 30 seconds

    /**
     * Test timeout
     * Maximum time for entire test
     */
    // Set via expect.timeout() or test.setTimeout() per test
  },

  /**
   * Global timeout
   * Maximum time for entire test suite (prevents hanging)
   */
  globalTimeout: IS_CI ? 600000 : 0, // 10 minutes in CI, unlimited locally

  /**
   * Test timeout
   * Maximum time per test (prevents hanging tests)
   */
  timeout: 60000, // 60 seconds per test

  /**
   * Expect timeout
   * Maximum time for expect() assertions
   */
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  /**
   * Output directory for test artifacts
   */
  outputDir: '../../test-results',

  /**
   * Browser Projects
   * Test on multiple browsers for cross-browser compatibility
   */
  projects: [
    /**
     * Chromium (Chrome, Edge)
     * Primary browser for most tests
     */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable Chrome DevTools Protocol for performance metrics
        launchOptions: {
          args: ['--enable-features=NetworkService,NetworkServiceInProcess'],
        },
      },
    },

    /**
     * Firefox
     * Test on Firefox for compatibility
     * Disabled by default (enable in CI for full coverage)
     */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    /**
     * WebKit (Safari)
     * Test on Safari engine for compatibility
     * Disabled by default (enable in CI for full coverage)
     */
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /**
     * Mobile Chrome
     * Test mobile experience
     */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    /**
     * Mobile Safari
     * Test iOS experience
     * Disabled by default (enable for iOS-specific testing)
     */
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 13'] },
    // },

    /**
     * Accessibility Tests
     * Runs axe-core accessibility checks
     * Uses same browser as chromium but separate project for reporting
     */
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: /.*\.a11y\.(spec|test)\.ts$/,
    },
  ],

  /**
   * Web Server Configuration
   * Automatically starts Next.js dev server before tests
   */
  webServer: {
    /**
     * Command to start server
     * - Build content first (required for tests)
     * - Use Turbopack for faster startup
     */
    command: 'npm run build:content && npm run dev',

    /**
     * Server URL
     * Playwright waits for this URL to respond before running tests
     */
    url: BASE_URL,

    /**
     * Reuse existing server
     * - Local: Reuse if already running (faster iteration)
     * - CI: Always start fresh server
     */
    reuseExistingServer: !IS_CI,

    /**
     * Timeout for server startup
     * Give Next.js time to build and start
     */
    timeout: 120000, // 2 minutes

    /**
     * Standard output handling
     * - pipe: Show server logs in console
     */
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

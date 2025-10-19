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
import { BREAKPOINTS, VIEWPORT_PRESETS } from '@/src/lib/ui-constants';

// Inline constants to avoid Knip path resolution issues
const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultra: 1920,
};

const VIEWPORT_PRESETS = {
  ipadPortrait: { width: 768, height: 1024 },
  laptop: { width: 1280, height: 800 },
  desktop1080p: { width: 1920, height: 1080 },
};

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
   * Test on multiple browsers and viewports for comprehensive coverage
   *
   * =============================================================================
   * RESPONSIVE VIEWPORT PROJECTS (2025 Architecture)
   * =============================================================================
   *
   * Systematic multi-viewport testing using BREAKPOINTS from ui-constants.ts.
   * Ensures responsive design works perfectly at all standard breakpoints.
   *
   * Viewport Strategy:
   * 1. mobile-viewport (320px) - Smallest phones (iPhone SE)
   * 2. tablet-viewport (768px) - Tablets (iPad portrait)
   * 3. desktop-viewport (1024px) - Laptops
   * 4. wide-viewport (1280px) - Large desktops
   * 5. ultra-viewport (1920px) - 1080p+ monitors
   *
   * Visual Regression Testing:
   * - Each viewport project can capture screenshots for comparison
   * - Use page.screenshot() in tests for baseline/comparison
   * - Pair with Percy/Chromatic for automated visual regression
   *
   * @see src/lib/ui-constants.ts - Single source of truth for breakpoints
   */
  projects: [
    /**
     * ===========================================================================
     * VIEWPORT-BASED PROJECTS (Responsive Testing)
     * ===========================================================================
     */

    /**
     * Mobile Viewport (320px)
     * Smallest modern phones - iPhone SE, compact Android phones
     * Tests mobile-first experience at minimum supported width
     */
    {
      name: 'mobile-viewport',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: BREAKPOINTS.mobile, height: 568 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
      // Run visual snapshot tests in this project
      testMatch: /.*\.(spec|e2e|visual)\.ts$/,
    },

    /**
     * Tablet Viewport (768px)
     * iPad portrait, medium screens
     * Critical breakpoint - where most layouts switch from mobile to tablet
     */
    {
      name: 'tablet-viewport',
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORT_PRESETS.ipadPortrait,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
      testMatch: /.*\.(spec|e2e|visual)\.ts$/,
    },

    /**
     * Desktop Viewport (1024px)
     * Laptop screens, small desktops
     * Where desktop layouts fully activate (lg: breakpoint)
     */
    {
      name: 'desktop-viewport',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: BREAKPOINTS.desktop, height: 768 },
        deviceScaleFactor: 1,
      },
      testMatch: /.*\.(spec|e2e|visual)\.ts$/,
    },

    /**
     * Wide Viewport (1280px)
     * Large desktops, external monitors
     * Standard 720p+ desktop experience
     */
    {
      name: 'wide-viewport',
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORT_PRESETS.laptop,
        deviceScaleFactor: 1,
      },
      testMatch: /.*\.(spec|e2e|visual)\.ts$/,
    },

    /**
     * Ultra Viewport (1920px)
     * 1080p monitors, 4K displays
     * Maximum layout width testing
     */
    {
      name: 'ultra-viewport',
      use: {
        ...devices['Desktop Chrome'],
        viewport: VIEWPORT_PRESETS.desktop1080p,
        deviceScaleFactor: 1,
      },
      testMatch: /.*\.(spec|e2e|visual)\.ts$/,
    },

    /**
     * ===========================================================================
     * BROWSER COMPATIBILITY PROJECTS
     * ===========================================================================
     */

    /**
     * Chromium (Chrome, Edge)
     * Primary browser for general E2E tests (non-visual)
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
      // Exclude visual tests (handled by viewport projects)
      testMatch: /.*\.(spec|e2e)\.ts$/,
      testIgnore: /.*\.visual\.(spec|test)\.ts$/,
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
     * ===========================================================================
     * DEVICE-SPECIFIC PROJECTS
     * ===========================================================================
     */

    /**
     * Mobile Chrome (Real Device Emulation)
     * Pixel 5 emulation - tests real device quirks
     * Use for device-specific testing (touch, mobile Chrome features)
     */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      // Exclude visual tests (handled by mobile-viewport)
      testMatch: /.*\.(spec|e2e)\.ts$/,
      testIgnore: /.*\.visual\.(spec|test)\.ts$/,
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
     * ===========================================================================
     * SPECIALIZED PROJECTS
     * ===========================================================================
     */

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

import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Configures accessibility testing with @axe-core/playwright
 *
 * Note: axe-core is injected per-test via fixtures (playwright-fixtures.ts)
 * This global setup can be used for other global configurations if needed
 */
async function globalSetup(config: FullConfig) {
  // Global setup runs once before all tests
  // This is where we can configure global test environment
  // For now, axe-core is injected per-test via fixtures for better isolation
}

export default globalSetup;

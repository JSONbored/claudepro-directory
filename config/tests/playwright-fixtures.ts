import { test as base, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import {
  checkAccessibility,
  getAccessibilityViolations,
  checkElementAccessibility,
} from './playwright-accessibility-helpers';

/**
 * Custom Playwright fixtures with accessibility testing
 * Usage: import { test } from '@/config/tests/playwright-fixtures'
 *
 * Provides:
 * - axeBuilder: Direct AxeBuilder instance for custom accessibility checks
 * - checkA11y: Convenience function using existing accessibility helpers
 * - getA11yViolations: Get violations without failing test
 * - checkElementA11y: Check specific element accessibility
 */

type AxeFixture = {
  axeBuilder: AxeBuilder;
  checkA11y: typeof checkAccessibility;
  getA11yViolations: typeof getAccessibilityViolations;
  checkElementA11y: typeof checkElementAccessibility;
};

export const test = base.extend<AxeFixture>({
  // Create AxeBuilder instance for accessibility testing
  axeBuilder: async ({ page }, use) => {
    const axeBuilder = new AxeBuilder({ page });
    await use(axeBuilder);
  },

  // Convenience function using existing accessibility helpers
  checkA11y: async ({ page }, use) => {
    await use(async (config, context) => {
      await checkAccessibility(page, config, context);
    });
  },

  // Get violations without failing
  getA11yViolations: async ({ page }, use) => {
    await use(async (config, context) => {
      return await getAccessibilityViolations(page, config, context);
    });
  },

  // Check specific element
  checkElementA11y: async ({ page }, use) => {
    await use(async (selector, config) => {
      await checkElementAccessibility(page, selector, config);
    });
  },
});

export { expect };

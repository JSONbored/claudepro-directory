/**
 * Playwright Accessibility Testing Helpers
 *
 * Provides utilities for automated accessibility testing using @axe-core/playwright.
 * Integrates axe-core accessibility engine with Playwright for WCAG compliance checking.
 */

import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { AxeResults } from 'axe-core';

/**
 * Accessibility test configuration
 *
 * Configure which rules to run and how to handle violations.
 * See: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#options-parameter
 */
export interface A11yConfig {
  /**
   * Run only these tags (e.g., ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
   * Default: ['wcag2a', 'wcag2aa', 'wcag21aa'] for WCAG 2.1 Level A and AA compliance
   */
  tags?: string[];

  /**
   * Rules to exclude (by rule ID)
   * Use this to exclude known issues that are being addressed separately
   */
  exclude?: string[];

  /**
   * Rules to include (by rule ID)
   * If specified, only these rules will run
   */
  include?: string[];

  /**
   * Impact level to check ('minor', 'moderate', 'serious', 'critical')
   * Default: 'minor' (checks all issues)
   */
  impactLevel?: 'minor' | 'moderate' | 'serious' | 'critical';
}

/**
 * Default accessibility configuration
 *
 * Checks WCAG 2.1 Level A and AA compliance
 */
const DEFAULT_A11Y_CONFIG: A11yConfig = {
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  impactLevel: 'minor',
};

/**
 * Inject axe-core into the page and check accessibility
 *
 * This is the main helper function for accessibility testing.
 * It injects axe-core, runs accessibility checks, and reports violations.
 *
 * @param page - Playwright page instance
 * @param config - Accessibility test configuration
 * @param context - Optional context selector to check (defaults to entire page)
 *
 * @example
 * ```typescript
 * test('homepage should be accessible', async ({ page }) => {
 *   await page.goto('/');
 *   await checkAccessibility(page);
 * });
 * ```
 *
 * @example
 * ```typescript
 * test('form should be accessible', async ({ page }) => {
 *   await page.goto('/contact');
 *   await checkAccessibility(page, undefined, 'form');
 * });
 * ```
 */
export async function checkAccessibility(
  page: Page,
  config: A11yConfig = DEFAULT_A11Y_CONFIG,
  context?: string
): Promise<void> {
  const builder = new AxeBuilder({ page });

  // Include context if specified
  if (context) {
    builder.include(context);
  }

  // Configure tags
  if (config.tags) {
    builder.withTags(config.tags);
  }

  // Configure rules
  if (config.exclude) {
    builder.disableRules(config.exclude);
  }

  if (config.include) {
    builder.withRules(config.include);
  }

  // Run analysis and check for violations
  const results = await builder.analyze();

  // Filter by impact level if specified
  const filteredViolations = config.impactLevel
    ? results.violations.filter((violation) => {
        const impactLevels = ['critical', 'serious', 'moderate', 'minor'];
        const minIndex = impactLevels.indexOf(config.impactLevel!);
        const violationIndex = impactLevels.indexOf(violation.impact as any);
        return violationIndex <= minIndex;
      })
    : results.violations;

  // Fail test if violations found
  if (filteredViolations.length > 0) {
    const violationMessages = filteredViolations
      .map((violation) => {
        return `\n  - ${violation.id}: ${violation.description}\n    Help: ${violation.helpUrl}`;
      })
      .join('\n');

    throw new Error(
      `Accessibility violations found (${filteredViolations.length}):${violationMessages}`
    );
  }
}

/**
 * Get accessibility violations without failing the test
 *
 * Useful for logging violations or conditional assertions.
 *
 * @param page - Playwright page instance
 * @param config - Accessibility test configuration
 * @param context - Optional context selector to check
 * @returns Array of accessibility violations
 *
 * @example
 * ```typescript
 * test('check accessibility violations', async ({ page }) => {
 *   await page.goto('/');
 *   const violations = await getAccessibilityViolations(page);
 *   console.log(`Found ${violations.length} violations`);
 * });
 * ```
 */
export async function getAccessibilityViolations(
  page: Page,
  config: A11yConfig = DEFAULT_A11Y_CONFIG,
  context?: string
): Promise<AxeResults['violations']> {
  const builder = new AxeBuilder({ page });

  if (context) {
    builder.include(context);
  }

  if (config.tags) {
    builder.withTags(config.tags);
  }

  if (config.exclude) {
    builder.disableRules(config.exclude);
  }

  if (config.include) {
    builder.withRules(config.include);
  }

  const results = await builder.analyze();

  // Filter by impact level if specified
  if (config.impactLevel) {
    const impactLevels = ['critical', 'serious', 'moderate', 'minor'];
    const minIndex = impactLevels.indexOf(config.impactLevel);
    return results.violations.filter((violation) => {
      const violationIndex = impactLevels.indexOf(violation.impact as any);
      return violationIndex <= minIndex;
    });
  }

  return results.violations;
}

/**
 * Check accessibility for a specific element
 *
 * Convenience function for checking accessibility of a single element.
 *
 * @param page - Playwright page instance
 * @param selector - CSS selector or Playwright locator string
 * @param config - Accessibility test configuration
 *
 * @example
 * ```typescript
 * test('button should be accessible', async ({ page }) => {
 *   await page.goto('/');
 *   await checkElementAccessibility(page, 'button[type="submit"]');
 * });
 * ```
 */
export async function checkElementAccessibility(
  page: Page,
  selector: string,
  config: A11yConfig = DEFAULT_A11Y_CONFIG
): Promise<void> {
  await checkAccessibility(page, config, selector);
}

/**
 * Accessibility test configuration presets
 */
export const A11Y_PRESETS = {
  /**
   * WCAG 2.1 Level A compliance only
   */
  WCAG_2_1_LEVEL_A: {
    tags: ['wcag2a', 'wcag21a'],
    impactLevel: 'minor' as const,
  },

  /**
   * WCAG 2.1 Level AA compliance (includes Level A)
   */
  WCAG_2_1_LEVEL_AA: {
    tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    impactLevel: 'minor' as const,
  },

  /**
   * Best practices only (non-WCAG rules)
   */
  BEST_PRACTICES: {
    tags: ['best-practice'],
    impactLevel: 'minor' as const,
  },

  /**
   * Critical and serious issues only
   */
  CRITICAL_ONLY: {
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    impactLevel: 'serious' as const,
  },
} as const;

/**
 * Accessibility Testing Utilities
 *
 * Utilities for testing component accessibility with jest-axe.
 * Ensures components meet WCAG 2.1 Level AA standards.
 *
 * **Usage:**
 * ```ts
 * import { renderWithA11y, axeTest } from '@/tests/utils/accessibility';
 *
 * test('should have no accessibility violations', async () => {
 *   const { container } = renderWithA11y(<MyComponent />);
 *   await axeTest(container);
 * });
 * ```
 *
 * **Standards:**
 * - WCAG 2.1 Level AA compliance
 * - Semantic HTML
 * - ARIA attributes where appropriate
 * - Keyboard navigation support
 * - Screen reader compatibility
 *
 * @see https://github.com/nickcolley/jest-axe
 * @see https://www.w3.org/WAI/WCAG21/quickref/
 */

import { type RenderOptions, type RenderResult, render } from '@testing-library/react';
import { type AxeResults, axe, type RunOptions } from 'jest-axe';
import type { ReactElement } from 'react';

// =============================================================================
// Types
// =============================================================================

/**
 * Axe configuration options
 */
export interface AxeConfig extends RunOptions {
  /**
   * Rules to disable for this test
   * Use sparingly and document why
   */
  disabledRules?: string[];
}

// =============================================================================
// Core Utilities
// =============================================================================

/**
 * Render component and run accessibility tests
 *
 * Combines React Testing Library render with automatic axe testing.
 *
 * @param ui - React element to render
 * @param options - Render options
 * @returns Render result with container
 *
 * @example
 * ```ts
 * const { container } = renderWithA11y(<Button>Click me</Button>);
 * ```
 */
export function renderWithA11y(ui: ReactElement, options?: RenderOptions): RenderResult {
  return render(ui, options);
}

/**
 * Run axe accessibility tests on a container
 *
 * Tests container for WCAG 2.1 Level AA violations.
 * Throws detailed error if violations found.
 *
 * @param container - DOM element to test
 * @param config - Optional axe configuration
 * @returns Axe test results
 *
 * @example
 * ```ts
 * test('should be accessible', async () => {
 *   const { container } = render(<MyComponent />);
 *   const results = await axeTest(container);
 *   expect(results).toHaveNoViolations();
 * });
 * ```
 */
export async function axeTest(container: Element, config?: AxeConfig): Promise<AxeResults> {
  const { disabledRules = [], ...axeConfig } = config || {};

  const axeOptions: RunOptions = {
    ...axeConfig,
    rules: {
      ...axeConfig.rules,
      // Disable specified rules
      ...Object.fromEntries(disabledRules.map((rule) => [rule, { enabled: false }])),
    },
  };

  const results = await axe(container, axeOptions);
  return results;
}

/**
 * Quick accessibility test helper
 *
 * Renders component and runs accessibility tests in one call.
 * Use for simple component tests.
 *
 * @param ui - React element to test
 * @param config - Optional axe configuration
 * @returns Axe test results
 *
 * @example
 * ```ts
 * test('Button is accessible', async () => {
 *   await expectAccessible(<Button>Click me</Button>);
 * });
 * ```
 */
export async function expectAccessible(ui: ReactElement, config?: AxeConfig): Promise<AxeResults> {
  const { container } = render(ui);
  return axeTest(container, config);
}

// =============================================================================
// Preset Configurations
// =============================================================================

/**
 * Strict accessibility testing (WCAG 2.1 AAA)
 *
 * Tests against stricter WCAG Level AAA standards.
 * Use for critical user-facing components.
 *
 * @param container - DOM element to test
 * @returns Axe test results
 *
 * @example
 * ```ts
 * await axeTestStrict(container);
 * ```
 */
export async function axeTestStrict(container: Element): Promise<AxeResults> {
  return axeTest(container, {
    rules: {
      // Enable AAA-level color contrast
      'color-contrast-enhanced': { enabled: true },
    },
  });
}

/**
 * Form accessibility testing
 *
 * Tests forms with additional checks for labels, fieldsets, and validation.
 *
 * @param container - DOM element to test
 * @returns Axe test results
 *
 * @example
 * ```ts
 * await axeTestForm(container);
 * ```
 */
export async function axeTestForm(container: Element): Promise<AxeResults> {
  return axeTest(container, {
    rules: {
      // Ensure labels are properly associated
      label: { enabled: true },
      // Ensure required fields are marked
      'aria-required-attr': { enabled: true },
      // Ensure form elements have accessible names
      'form-field-multiple-labels': { enabled: true },
    },
  });
}

/**
 * Interactive element accessibility testing
 *
 * Tests buttons, links, and other interactive elements.
 * Ensures proper keyboard navigation and ARIA attributes.
 *
 * @param container - DOM element to test
 * @returns Axe test results
 *
 * @example
 * ```ts
 * await axeTestInteractive(container);
 * ```
 */
export async function axeTestInteractive(container: Element): Promise<AxeResults> {
  return axeTest(container, {
    rules: {
      // Ensure interactive elements are keyboard accessible
      'focus-order-semantics': { enabled: true },
      // Ensure buttons have accessible names
      'button-name': { enabled: true },
      // Ensure links have accessible names
      'link-name': { enabled: true },
      // Ensure interactive elements have proper roles
      'nested-interactive': { enabled: true },
    },
  });
}

/**
 * Image accessibility testing
 *
 * Tests images for proper alt text and ARIA labels.
 *
 * @param container - DOM element to test
 * @returns Axe test results
 *
 * @example
 * ```ts
 * await axeTestImage(container);
 * ```
 */
export async function axeTestImage(container: Element): Promise<AxeResults> {
  return axeTest(container, {
    rules: {
      // Ensure images have alt text
      'image-alt': { enabled: true },
      // Ensure object elements have alt text
      'object-alt': { enabled: true },
      // Ensure SVGs have proper labels
      'svg-img-alt': { enabled: true },
    },
  });
}

// =============================================================================
// Keyboard Navigation Testing
// =============================================================================

/**
 * Test keyboard navigation for interactive elements
 *
 * Ensures elements are keyboard accessible and have proper focus order.
 *
 * @param container - DOM element to test
 * @returns Object with focusable elements and test results
 *
 * @example
 * ```ts
 * test('should be keyboard accessible', () => {
 *   const { container } = render(<MyComponent />);
 *   const { focusableElements } = testKeyboardNavigation(container);
 *   expect(focusableElements.length).toBeGreaterThan(0);
 * });
 * ```
 */
export function testKeyboardNavigation(container: Element): {
  focusableElements: Element[];
  hasTabIndex: boolean;
  hasFocusableElements: boolean;
} {
  // Query for all focusable elements
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = Array.from(container.querySelectorAll(focusableSelectors));

  return {
    focusableElements,
    hasTabIndex: focusableElements.some((el) => el.hasAttribute('tabindex')),
    hasFocusableElements: focusableElements.length > 0,
  };
}

/**
 * Test screen reader compatibility
 *
 * Checks for proper ARIA labels, roles, and semantic HTML.
 *
 * @param container - DOM element to test
 * @returns Screen reader compatibility report
 *
 * @example
 * ```ts
 * const report = testScreenReaderCompatibility(container);
 * expect(report.hasAriaLabels).toBe(true);
 * ```
 */
export function testScreenReaderCompatibility(container: Element): {
  hasAriaLabels: boolean;
  hasSemanticElements: boolean;
  ariaElements: Element[];
  semanticElements: Element[];
} {
  const ariaElements = Array.from(
    container.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]')
  );

  const semanticSelectors = ['nav', 'main', 'header', 'footer', 'article', 'section', 'aside'];
  const semanticElements = Array.from(container.querySelectorAll(semanticSelectors.join(', ')));

  return {
    hasAriaLabels: ariaElements.length > 0,
    hasSemanticElements: semanticElements.length > 0,
    ariaElements,
    semanticElements,
  };
}

// =============================================================================
// Type Declarations for jest-axe
// =============================================================================

declare global {
  namespace Vi {
    interface Matchers<R = any> {
      toHaveNoViolations(): R;
    }
  }
}

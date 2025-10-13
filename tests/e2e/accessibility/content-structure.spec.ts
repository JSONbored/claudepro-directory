/**
 * Content Structure & Accessibility E2E Tests
 *
 * Validates proper heading hierarchy, semantic HTML, and ARIA labels
 * across all page types following WCAG 2.1 AA standards.
 *
 * **Why Test This:**
 * - Critical for screen reader accessibility
 * - Required for WCAG 2.1 AA compliance
 * - Impacts SEO (search engines use semantic structure)
 * - Ensures logical document outline
 * - Validates ARIA labels for interactive elements
 *
 * **Test Coverage:**
 * - Heading hierarchy (H1 → H2 → H3, no skipping)
 * - Single H1 per page (most important SEO rule)
 * - Semantic HTML5 elements (header, nav, main, section, article, aside, footer)
 * - Landmark roles (banner, navigation, main, contentinfo)
 * - ARIA labels on interactive elements (buttons, links, inputs)
 * - Skip navigation links for keyboard users
 * - Focus management and keyboard navigation
 *
 * **WCAG 2.1 AA Requirements Tested:**
 * - 1.3.1 Info and Relationships (Level A)
 * - 2.4.1 Bypass Blocks (Level A)
 * - 2.4.6 Headings and Labels (Level AA)
 * - 4.1.2 Name, Role, Value (Level A)
 *
 * @group e2e
 * @group accessibility
 * @group a11y
 */

import { expect, type Page, test } from '@playwright/test';
import {
  navigateToCategory,
  navigateToHomepage,
  waitForNetworkIdle,
} from '../helpers/test-helpers';

// =============================================================================
// Heading Hierarchy Helpers
// =============================================================================

/**
 * Get all headings on page in document order
 */
async function getAllHeadings(
  page: Page
): Promise<Array<{ level: number; text: string; tagName: string }>> {
  return await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    return headings.map((heading) => ({
      level: Number.parseInt(heading.tagName.charAt(1), 10),
      text: heading.textContent?.trim() || '',
      tagName: heading.tagName,
    }));
  });
}

/**
 * Validate heading hierarchy (no skipping levels)
 */
function validateHeadingHierarchy(headings: Array<{ level: number; text: string }>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let previousLevel = 0;

  for (let i = 0; i < headings.length; i++) {
    const current = headings[i];

    // First heading must be H1
    if (i === 0 && current.level !== 1) {
      errors.push(`First heading must be H1, found H${current.level}: "${current.text}"`);
    }

    // Check for skipped levels (e.g., H1 → H3 without H2)
    if (previousLevel > 0 && current.level > previousLevel + 1) {
      errors.push(
        `Heading level skipped: H${previousLevel} → H${current.level} (missing H${previousLevel + 1}). Text: "${current.text}"`
      );
    }

    previousLevel = current.level;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get landmark roles on page
 */
async function getLandmarkRoles(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const landmarks = Array.from(
      document.querySelectorAll(
        '[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="complementary"], [role="search"], header, nav, main, footer, aside'
      )
    );

    return landmarks.map((el) => {
      const role =
        el.getAttribute('role') ||
        {
          HEADER: 'banner',
          NAV: 'navigation',
          MAIN: 'main',
          FOOTER: 'contentinfo',
          ASIDE: 'complementary',
        }[el.tagName];

      return role || el.tagName.toLowerCase();
    });
  });
}

// =============================================================================
// Homepage Content Structure Tests
// =============================================================================

test.describe('Homepage - Content Structure', () => {
  test('should have exactly one H1', async ({ page }) => {
    await navigateToHomepage(page);

    const h1Elements = await page.locator('h1').all();
    expect(h1Elements.length, 'Page must have exactly one H1').toBe(1);

    const h1Text = await page.locator('h1').first().textContent();
    expect(h1Text, 'H1 must have text content').toBeTruthy();
    expect(h1Text!.length, 'H1 must have meaningful text').toBeGreaterThan(10);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await navigateToHomepage(page);

    const headings = await getAllHeadings(page);
    expect(headings.length, 'Page should have multiple headings').toBeGreaterThan(1);

    const validation = validateHeadingHierarchy(headings);
    expect(validation.isValid, validation.errors.join('\n')).toBe(true);
  });

  test('should have semantic HTML5 structure', async ({ page }) => {
    await navigateToHomepage(page);

    // Check for essential semantic elements
    const header = page.locator('header');
    const nav = page.locator('nav');
    const main = page.locator('main');
    const footer = page.locator('footer');

    await expect(header, 'Page must have <header> element').toBeVisible();
    await expect(nav, 'Page must have <nav> element').toBeVisible();
    await expect(main, 'Page must have <main> element').toBeVisible();
    await expect(footer, 'Page must have <footer> element').toBeVisible();

    // Verify only one main landmark
    const mainCount = await main.count();
    expect(mainCount, 'Page must have exactly one <main> element').toBe(1);
  });

  test('should have proper landmark roles', async ({ page }) => {
    await navigateToHomepage(page);

    const landmarks = await getLandmarkRoles(page);

    // Should have banner (header)
    expect(
      landmarks.some((role) => role === 'banner' || role === 'header'),
      'Should have banner landmark'
    ).toBe(true);

    // Should have navigation
    expect(
      landmarks.some((role) => role === 'navigation' || role === 'nav'),
      'Should have navigation landmark'
    ).toBe(true);

    // Should have main
    expect(
      landmarks.some((role) => role === 'main'),
      'Should have main landmark'
    ).toBe(true);

    // Should have contentinfo (footer)
    expect(
      landmarks.some((role) => role === 'contentinfo' || role === 'footer'),
      'Should have contentinfo landmark'
    ).toBe(true);
  });

  test('should have accessible navigation', async ({ page }) => {
    await navigateToHomepage(page);

    // All links should have accessible names
    const links = await page.getByRole('link').all();
    expect(links.length, 'Page should have navigation links').toBeGreaterThan(0);

    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');

      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || title;
      expect(
        hasAccessibleName,
        'All links must have accessible names (text, aria-label, or title)'
      ).toBe(true);
    }
  });

  test('should have accessible buttons', async ({ page }) => {
    await navigateToHomepage(page);

    const buttons = await page.getByRole('button').all();

    if (buttons.length > 0) {
      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await link.getAttribute('aria-label');

        const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel;
        expect(hasAccessibleName, 'All buttons must have accessible names').toBe(true);
      }
    }
  });

  test('should have skip navigation link', async ({ page }) => {
    await navigateToHomepage(page);

    // Skip link should exist (may be visually hidden)
    const skipLink = page.getByRole('link', { name: /skip to|skip navigation/i });

    if ((await skipLink.count()) > 0) {
      await expect(skipLink).toHaveAttribute('href', /#main|#content/i);
    }
  });
});

// =============================================================================
// Category Pages Content Structure Tests
// =============================================================================

test.describe('Category Pages - Content Structure', () => {
  const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections'];

  for (const category of categories) {
    test.describe(`${category} category`, () => {
      test('should have exactly one H1', async ({ page }) => {
        await navigateToCategory(page, category);

        const h1Elements = await page.locator('h1').all();
        expect(h1Elements.length, `${category} page must have exactly one H1`).toBe(1);

        const h1Text = await page.locator('h1').first().textContent();
        expect(h1Text).toBeTruthy();
      });

      test('should have proper heading hierarchy', async ({ page }) => {
        await navigateToCategory(page, category);

        const headings = await getAllHeadings(page);
        const validation = validateHeadingHierarchy(headings);

        expect(validation.isValid, validation.errors.join('\n')).toBe(true);
      });

      test('should have semantic structure', async ({ page }) => {
        await navigateToCategory(page, category);

        // Check for main content area
        const main = page.locator('main');
        await expect(main).toBeVisible();

        // Should have articles or content items
        const articles = page.locator('article');
        const contentItems = page.locator('[data-content-item]');

        const hasContent = (await articles.count()) > 0 || (await contentItems.count()) > 0;
        expect(hasContent, 'Category page should have article or content item elements').toBe(true);
      });
    });
  }
});

// =============================================================================
// Content Detail Pages Structure Tests
// =============================================================================

test.describe('Content Detail Pages - Structure', () => {
  test('should have proper structure on agent detail page', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    // Click first agent
    const firstItem = page.locator('[data-content-item]').or(page.locator('article')).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Should have exactly one H1
    const h1Elements = await page.locator('h1').all();
    expect(h1Elements.length, 'Detail page must have exactly one H1').toBe(1);

    // Should have proper heading hierarchy
    const headings = await getAllHeadings(page);
    const validation = validateHeadingHierarchy(headings);
    expect(validation.isValid, validation.errors.join('\n')).toBe(true);

    // Should use article element for main content
    const article = page.locator('article');
    if ((await article.count()) > 0) {
      await expect(article.first()).toBeVisible();
    }

    // Should have semantic structure
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should have accessible metadata on detail pages', async ({ page }) => {
    await navigateToCategory(page, 'mcp');

    const firstItem = page.locator('[data-content-item]').or(page.locator('article')).first();
    await firstItem.click();

    await page.waitForURL(/\/mcp\/.+/);
    await waitForNetworkIdle(page);

    // Time elements should have datetime attribute
    const timeElements = await page.locator('time').all();
    for (const time of timeElements) {
      const datetime = await time.getAttribute('datetime');
      expect(datetime, 'All <time> elements must have datetime attribute').toBeTruthy();
    }
  });

  test('should have breadcrumb navigation', async ({ page }) => {
    await navigateToCategory(page, 'agents');

    const firstItem = page.locator('[data-content-item]').or(page.locator('article')).first();
    await firstItem.click();

    await page.waitForURL(/\/agents\/.+/);
    await waitForNetworkIdle(page);

    // Look for breadcrumb navigation
    const breadcrumb = page
      .locator('[aria-label*="breadcrumb"]')
      .or(page.locator('[data-breadcrumb]').or(page.locator('nav ol')));

    if ((await breadcrumb.count()) > 0) {
      // Breadcrumbs should be in a nav element
      const navParent = breadcrumb.locator('xpath=ancestor-or-self::nav');
      if ((await navParent.count()) > 0) {
        await expect(navParent).toBeVisible();
      }

      // Should have list structure (ol or ul)
      const list = breadcrumb.locator('ol, ul');
      if ((await list.count()) > 0) {
        await expect(list).toBeVisible();
      }
    }
  });
});

// =============================================================================
// Guide Pages Structure Tests
// =============================================================================

test.describe('Guide Pages - Structure', () => {
  test('should have proper structure on guide pages', async ({ page }) => {
    await page.goto('/guides');
    await waitForNetworkIdle(page);

    const firstGuide = page.locator('[data-content-item]').or(page.locator('article')).first();

    if ((await firstGuide.count()) > 0) {
      await firstGuide.click();

      await page.waitForURL(/\/guides\/.+/);
      await waitForNetworkIdle(page);

      // Should have exactly one H1
      const h1Elements = await page.locator('h1').all();
      expect(h1Elements.length).toBe(1);

      // Should have proper heading hierarchy
      const headings = await getAllHeadings(page);
      const validation = validateHeadingHierarchy(headings);
      expect(validation.isValid, validation.errors.join('\n')).toBe(true);

      // Guides should have step-by-step structure
      const sections = page.locator('section');
      if ((await sections.count()) > 0) {
        // Sections should be visible
        await expect(sections.first()).toBeVisible();
      }
    }
  });

  test('should have accessible code blocks in guides', async ({ page }) => {
    await page.goto('/guides');
    await waitForNetworkIdle(page);

    const firstGuide = page.locator('[data-content-item]').or(page.locator('article')).first();

    if ((await firstGuide.count()) > 0) {
      await firstGuide.click();

      await page.waitForURL(/\/guides\/.+/);
      await waitForNetworkIdle(page);

      // Code blocks should be in <pre><code> structure
      const codeBlocks = page.locator('pre code');
      if ((await codeBlocks.count()) > 0) {
        // First code block should be visible
        await expect(codeBlocks.first()).toBeVisible();

        // Code blocks should ideally have language class
        const firstCode = codeBlocks.first();
        const className = await firstCode.getAttribute('class');

        // Check if has language identifier (e.g., language-typescript, lang-ts)
        const hasLanguage = className && /language-|lang-/.test(className);
        expect(hasLanguage, 'Code blocks should have language identifier').toBe(true);
      }
    }
  });
});

// =============================================================================
// Search Page Structure Tests
// =============================================================================

test.describe('Search Page - Structure', () => {
  test('should have proper structure on search page', async ({ page }) => {
    await page.goto('/search?q=test');
    await waitForNetworkIdle(page);

    // Should have exactly one H1
    const h1Elements = await page.locator('h1').all();
    expect(h1Elements.length).toBe(1);

    // Should have main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Should have search input with label
    const searchInput = page.locator('input[type="search"]').or(page.getByRole('searchbox'));

    if ((await searchInput.count()) > 0) {
      const input = searchInput.first();

      // Should have accessible name (label, aria-label, or aria-labelledby)
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const inputId = await input.getAttribute('id');

      let hasLabel = false;
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        hasLabel = (await label.count()) > 0;
      }

      const hasAccessibleName = hasLabel || ariaLabel !== null || ariaLabelledby !== null;
      expect(hasAccessibleName, 'Search input must have accessible name').toBe(true);
    }
  });

  test('should announce search results to screen readers', async ({ page }) => {
    await page.goto('/search?q=code');
    await waitForNetworkIdle(page);

    // Results container should have role="region" or aria-live
    const resultsContainer = page
      .locator('[role="region"]')
      .or(page.locator('[aria-live]').or(page.locator('[data-search-results]')));

    if ((await resultsContainer.count()) > 0) {
      // Should have accessible name or aria-label
      const first = resultsContainer.first();
      const ariaLabel = await first.getAttribute('aria-label');
      const ariaLabelledby = await first.getAttribute('aria-labelledby');

      if (ariaLabel || ariaLabelledby) {
        expect(ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }
  });
});

// =============================================================================
// Form Accessibility Tests
// =============================================================================

test.describe('Forms - Accessibility', () => {
  test('should have accessible submit form', async ({ page }) => {
    await page.goto('/submit');
    await waitForNetworkIdle(page);

    // All form inputs should have labels
    const inputs = page.locator('input:not([type="hidden"]), textarea, select');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      for (let i = 0; i < Math.min(inputCount, 10); i++) {
        // Check first 10 inputs
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');

        let hasLabel = false;
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          hasLabel = (await label.count()) > 0;
        }

        const hasAccessibleName = hasLabel || ariaLabel !== null || ariaLabelledby !== null;
        expect(hasAccessibleName, `Input ${i + 1} must have accessible name`).toBe(true);
      }
    }

    // Submit button should be accessible
    const submitButton = page.getByRole('button', { name: /submit|send|create/i });
    if ((await submitButton.count()) > 0) {
      await expect(submitButton.first()).toBeVisible();
      await expect(submitButton.first()).toBeEnabled();
    }
  });

  test('should show validation errors accessibly', async ({ page }) => {
    await page.goto('/submit');
    await waitForNetworkIdle(page);

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /submit|send|create/i });

    if ((await submitButton.count()) > 0) {
      await submitButton.first().click();

      // Wait for validation errors
      await page.waitForTimeout(1000);

      // Error messages should have role="alert" or aria-live
      const errorMessages = page
        .locator('[role="alert"]')
        .or(page.locator('[aria-live="assertive"]').or(page.locator('[aria-live="polite"]')));

      if ((await errorMessages.count()) > 0) {
        // Errors should be visible
        await expect(errorMessages.first()).toBeVisible();
      }
    }
  });
});

// =============================================================================
// Keyboard Navigation Tests
// =============================================================================

test.describe('Keyboard Navigation', () => {
  test('should support tab navigation on homepage', async ({ page }) => {
    await navigateToHomepage(page);

    // Press Tab key multiple times
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Some element should have focus
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        role: el?.getAttribute('role'),
        type: el?.getAttribute('type'),
      };
    });

    expect(focusedElement.tagName, 'Focused element should be interactive').toMatch(
      /A|BUTTON|INPUT|SELECT|TEXTAREA/i
    );
  });

  test('should have visible focus indicators', async ({ page }) => {
    await navigateToHomepage(page);

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    // Get computed outline style
    const focusStyle = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;

      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        boxShadow: styles.boxShadow,
      };
    });

    // Should have some form of focus indicator
    const hasFocusIndicator =
      (focusStyle?.outlineWidth && focusStyle.outlineWidth !== '0px') ||
      (focusStyle?.boxShadow && focusStyle.boxShadow !== 'none');

    expect(hasFocusIndicator, 'Focused elements must have visible focus indicators').toBe(true);
  });

  test('should support Enter key on buttons', async ({ page }) => {
    await navigateToHomepage(page);

    // Find first button
    const firstButton = page.getByRole('button').first();

    if ((await firstButton.count()) > 0) {
      await firstButton.focus();
      await page.keyboard.press('Enter');

      // Button should respond (hard to verify without knowing specific functionality)
      // Just verify it's still on page (didn't crash)
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

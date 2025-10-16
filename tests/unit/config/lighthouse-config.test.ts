/**
 * Lighthouse CI Configuration Tests
 *
 * Validates Lighthouse CI configuration for accessibility, performance, and SEO auditing.
 * Tests configuration correctness, assertion thresholds, and URL coverage.
 *
 * **Standards:**
 * - WCAG 2.0/2.1 compliance (via axe-core)
 * - Core Web Vitals monitoring
 * - SEO best practices
 * - Modern web standards (Best Practices)
 *
 * @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 * @see config/tools/lighthouserc.cjs
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

// Load the Lighthouse CI configuration
const loadLighthouseConfig = () => {
  const configPath = join(process.cwd(), 'config/tools/lighthouserc.cjs');
  // Read file content and execute in isolated context
  const configContent = readFileSync(configPath, 'utf-8');

  // Create a minimal module context
  const module = { exports: {} };
  const _exports = module.exports;

  // Execute the config file
  // biome-ignore lint/security/noGlobalEval: Required for loading CJS config in ESM test
  eval(configContent);

  return module.exports;
};

describe('Lighthouse CI Configuration', () => {
  const config = loadLighthouseConfig();

  describe('Configuration Structure', () => {
    test('should have valid configuration structure', () => {
      expect(config).toBeDefined();
      expect(config.ci).toBeDefined();
      expect(config.ci.collect).toBeDefined();
      expect(config.ci.assert).toBeDefined();
      expect(config.ci.upload).toBeDefined();
    });

    test('should have output directory configured', () => {
      expect(config.ci.outputDir).toBe('./config/reports/lighthouse');
    });
  });

  describe('URL Collection', () => {
    test('should use standard port 3000', () => {
      const urls = config.ci.collect.url;

      for (const url of urls) {
        expect(url).toContain('localhost:3000');
      }
    });

    test('should audit critical pages', () => {
      const urls = config.ci.collect.url;

      // Critical pages that MUST be audited
      const criticalPaths = [
        '/', // Homepage (base URL)
        '/agents',
        '/mcp',
        '/commands',
        '/submit',
      ];

      for (const path of criticalPaths) {
        const found = urls.some(
          (url: string) =>
            url === `http://localhost:3000${path === '/' ? '' : path}` ||
            url === `http://localhost:3000${path}`
        );
        expect(found).toBe(true);
      }
    });

    test('should audit at least 5 pages for comprehensive coverage', () => {
      const urls = config.ci.collect.url;
      expect(urls.length).toBeGreaterThanOrEqual(5);
    });

    test('should run multiple audits to reduce variance', () => {
      expect(config.ci.collect.numberOfRuns).toBeGreaterThanOrEqual(3);
    });

    test('should use desktop preset by default', () => {
      expect(config.ci.collect.settings.preset).toBe('desktop');
    });
  });

  describe('Accessibility Assertions (WCAG 2.0/2.1)', () => {
    test('should enforce accessibility score >= 90%', () => {
      const accessibilityAssertion = config.ci.assert.assertions['categories:accessibility'];

      expect(accessibilityAssertion).toBeDefined();
      expect(accessibilityAssertion[0]).toBe('error'); // Fail on violations
      expect(accessibilityAssertion[1].minScore).toBeGreaterThanOrEqual(0.9);
    });

    test('should enforce critical ARIA rules', () => {
      const { assertions } = config.ci.assert;

      const criticalAriaRules = ['aria-allowed-attr', 'aria-required-attr', 'aria-valid-attr'];

      for (const rule of criticalAriaRules) {
        expect(assertions[rule]).toBe('error');
      }
    });

    test('should enforce interactive element accessibility', () => {
      const { assertions } = config.ci.assert;

      expect(assertions['button-name']).toBe('error');
      expect(assertions['link-name']).toBe('error');
      expect(assertions.label).toBe('error');
    });

    test('should enforce color contrast (WCAG AA)', () => {
      const { assertions } = config.ci.assert;
      expect(assertions['color-contrast']).toBe('error');
    });

    test('should enforce image accessibility', () => {
      const { assertions } = config.ci.assert;

      expect(assertions['image-alt']).toBe('error');
      expect(assertions['input-image-alt']).toBe('error');
    });

    test('should enforce semantic HTML structure', () => {
      const { assertions } = config.ci.assert;

      expect(assertions.list).toBe('error');
      expect(assertions.listitem).toBe('error');
      expect(assertions['th-has-data-cells']).toBe('error');
    });

    test('should enforce proper form labeling', () => {
      const { assertions } = config.ci.assert;

      expect(assertions.label).toBe('error');
      expect(assertions['form-field-multiple-labels']).toBe('error');
    });

    test('should prevent duplicate IDs in accessibility tree', () => {
      const { assertions } = config.ci.assert;
      expect(assertions['duplicate-id-aria']).toBe('error');
    });
  });

  describe('SEO Assertions', () => {
    test('should enforce SEO score >= 90%', () => {
      const seoAssertion = config.ci.assert.assertions['categories:seo'];

      expect(seoAssertion).toBeDefined();
      expect(seoAssertion[0]).toBe('warn'); // Warn on violations
      expect(seoAssertion[1].minScore).toBeGreaterThanOrEqual(0.9);
    });

    test('should enforce meta viewport configuration', () => {
      const { assertions } = config.ci.assert;
      expect(assertions['meta-viewport']).toBe('error');
    });

    test('should enforce valid lang attribute', () => {
      const { assertions } = config.ci.assert;
      expect(assertions['valid-lang']).toBe('error');
    });
  });

  describe('Best Practices Assertions', () => {
    test('should enforce best practices score >= 90%', () => {
      const bestPracticesAssertion = config.ci.assert.assertions['categories:best-practices'];

      expect(bestPracticesAssertion).toBeDefined();
      expect(bestPracticesAssertion[0]).toBe('warn');
      expect(bestPracticesAssertion[1].minScore).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('Performance Assertions', () => {
    test('should enforce performance score >= 80%', () => {
      const performanceAssertion = config.ci.assert.assertions['categories:performance'];

      expect(performanceAssertion).toBeDefined();
      expect(performanceAssertion[0]).toBe('warn');
      expect(performanceAssertion[1].minScore).toBeGreaterThanOrEqual(0.8);
    });

    test('should have lower threshold for performance (80% vs 90%)', () => {
      const performanceScore = config.ci.assert.assertions['categories:performance'][1].minScore;
      const accessibilityScore =
        config.ci.assert.assertions['categories:accessibility'][1].minScore;

      // Performance can be harder to achieve, so 80% is acceptable
      expect(performanceScore).toBeLessThanOrEqual(accessibilityScore);
    });
  });

  describe('Upload Configuration', () => {
    test('should use filesystem storage by default', () => {
      expect(config.ci.upload.target).toBe('filesystem');
    });

    test('should document temporary-public-storage option', () => {
      // Read config file to check for commented documentation
      const configPath = join(process.cwd(), 'config/tools/lighthouserc.cjs');
      const configContent = readFileSync(configPath, 'utf-8');

      expect(configContent).toContain('temporary-public-storage');
    });
  });

  describe('Error Severity Levels', () => {
    test('should fail CI on accessibility violations', () => {
      const { assertions } = config.ci.assert;

      // These should all be 'error' level (fail CI)
      const errorLevelRules = [
        'categories:accessibility',
        'aria-allowed-attr',
        'button-name',
        'color-contrast',
        'image-alt',
        'label',
      ];

      for (const rule of errorLevelRules) {
        const assertion = assertions[rule];
        const level = Array.isArray(assertion) ? assertion[0] : assertion;
        expect(level).toBe('error');
      }
    });

    test('should warn but not fail on SEO/performance issues', () => {
      const { assertions } = config.ci.assert;

      const warnLevelCategories = [
        'categories:seo',
        'categories:performance',
        'categories:best-practices',
      ];

      for (const category of warnLevelCategories) {
        const assertion = assertions[category];
        expect(assertion[0]).toBe('warn');
      }
    });
  });

  describe('Configuration Documentation', () => {
    test('should have comments explaining configuration', () => {
      const configPath = join(process.cwd(), 'config/tools/lighthouserc.cjs');
      const configContent = readFileSync(configPath, 'utf-8');

      // Check for key documentation
      expect(configContent).toContain('WCAG 2.0/2.1');
      expect(configContent).toContain('axe-core');
      expect(configContent).toContain('GoogleChrome/lighthouse-ci');
    });
  });

  describe('Critical Page Coverage', () => {
    test('should include user-facing critical paths', () => {
      const urls = config.ci.collect.url;
      const urlPaths = urls.map((url: string) => new URL(url).pathname);

      // User-facing pages
      expect(urlPaths).toContain('/'); // Homepage
      expect(urlPaths).toContain('/agents');
      expect(urlPaths).toContain('/mcp');
      expect(urlPaths).toContain('/commands');
    });

    test('should include submission flow', () => {
      const urls = config.ci.collect.url;
      const urlPaths = urls.map((url: string) => new URL(url).pathname);

      expect(urlPaths).toContain('/submit');
    });

    test('should include discovery features', () => {
      const urls = config.ci.collect.url;
      const urlPaths = urls.map((url: string) => new URL(url).pathname);

      const discoveryPaths = ['/collections', '/trending', '/for-you'];
      const hasDiscoveryPaths = discoveryPaths.some((path) => urlPaths.includes(path));

      expect(hasDiscoveryPaths).toBe(true);
    });
  });

  describe('Tabindex and Focus Management', () => {
    test('should enforce proper tabindex usage', () => {
      const { assertions } = config.ci.assert;
      expect(assertions.tabindex).toBe('error');
    });
  });

  describe('Frame and Table Accessibility', () => {
    test('should enforce frame titles', () => {
      const { assertions } = config.ci.assert;
      expect(assertions['frame-title']).toBe('error');
    });

    test('should enforce table header associations', () => {
      const { assertions } = config.ci.assert;

      expect(assertions['td-headers-attr']).toBe('error');
      expect(assertions['th-has-data-cells']).toBe('error');
    });
  });

  describe('Configuration Completeness', () => {
    test('should have at least 15 accessibility rules enforced', () => {
      const { assertions } = config.ci.assert;

      // Count accessibility-specific rules (not categories)
      const accessibilityRules = Object.entries(assertions)
        .filter(([key]) => !key.startsWith('categories:'))
        .filter(([_, value]) => value === 'error');

      expect(accessibilityRules.length).toBeGreaterThanOrEqual(15);
    });

    test('should enforce all 4 Lighthouse categories', () => {
      const { assertions } = config.ci.assert;

      expect(assertions['categories:accessibility']).toBeDefined();
      expect(assertions['categories:performance']).toBeDefined();
      expect(assertions['categories:seo']).toBeDefined();
      expect(assertions['categories:best-practices']).toBeDefined();
    });
  });
});

/**
 * Lighthouse CI Configuration
 *
 * Automated accessibility, performance, SEO, and best practices auditing
 * Uses axe-core internally for WCAG 2.0/2.1 compliance testing
 *
 * @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 */

module.exports = {
  ci: {
    // Store lighthouse reports in config directory
    outputDir: './config/reports/lighthouse',

    collect: {
      // URLs to audit - add more critical pages as needed
      url: [
        'http://localhost:3024', // Homepage
        'http://localhost:3024/agents', // Agents category
        'http://localhost:3024/mcp', // MCP Servers category
        'http://localhost:3024/commands', // Commands category
        'http://localhost:3024/submit', // Submit page
        'http://localhost:3024/collections', // Collections
        'http://localhost:3024/jobs', // Job board
        'http://localhost:3024/community', // Community page
        'http://localhost:3024/trending', // Trending
        'http://localhost:3024/for-you', // Personalization
      ],

      // Run multiple times and take median to reduce variance
      numberOfRuns: 3,

      // Use Chromium for consistent results
      chromePath: undefined, // Will use system Chrome/Chromium

      // Lighthouse settings
      settings: {
        preset: 'desktop',
        // Can also use 'mobile' preset for mobile-first audits
      },
    },

    assert: {
      // Assertion levels: 'off' | 'warn' | 'error'
      // Scores are 0-1 (e.g., 0.9 = 90%)

      assertions: {
        // Accessibility - WCAG 2.0/2.1 compliance (uses axe-core)
        'categories:accessibility': ['error', { minScore: 0.9 }],

        // SEO - Search engine optimization
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Best Practices - Modern web standards
        'categories:best-practices': ['warn', { minScore: 0.9 }],

        // Performance - Core Web Vitals and metrics
        'categories:performance': ['warn', { minScore: 0.8 }],

        // Specific accessibility audits (axe-core rules)
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'color-contrast': 'error',
        'duplicate-id-aria': 'error',
        'form-field-multiple-labels': 'error',
        'frame-title': 'error',
        'image-alt': 'error',
        'input-image-alt': 'error',
        label: 'error',
        'link-name': 'error',
        list: 'error',
        listitem: 'error',
        'meta-viewport': 'error',
        tabindex: 'error',
        'td-headers-attr': 'error',
        'th-has-data-cells': 'error',
        'valid-lang': 'error',
      },
    },

    upload: {
      // Store reports as local files (already configured via outputDir above)
      target: 'filesystem',

      // Alternative: Upload to Google's FREE temporary storage (7-day retention, shareable URLs)
      // Uncomment for PR reviews and collaboration:
      // target: 'temporary-public-storage',

      // Alternative: Self-hosted LHCI server (requires setup, see docs)
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },
  },
};

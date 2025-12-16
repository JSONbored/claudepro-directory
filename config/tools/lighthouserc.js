/**
 * Lighthouse CI Configuration
 * 
 * Automated performance testing in CI/CD to prevent performance regressions.
 * 
 * Usage:
 * ```bash
 * pnpm lighthouse
 * ```
 * 
 * This will run Lighthouse audits and fail if performance score drops below 90.
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3, // Run 3 times and average results
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready on',
      startServerReadyTimeout: 30000, // 30 seconds
    },
    assert: {
      assertions: {
        // PERFORMANCE TARGET: 100/100 (as per user requirement)
        'categories:performance': ['error', { minScore: 1.0 }],
        
        // Accessibility score must be at least 90
        'categories:accessibility': ['error', { minScore: 0.9 }],
        
        // Best practices score must be at least 90
        'categories:best-practices': ['error', { minScore: 0.9 }],
        
        // SEO score must be 100
        'categories:seo': ['error', { minScore: 1.0 }],
        
        // Core Web Vitals thresholds (optimized for 100/100 performance)
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }], // 1.8s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'total-blocking-time': ['error', { maxNumericValue: 200 }], // 200ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1
        
        // Additional performance metrics (optimized thresholds)
        'speed-index': ['error', { maxNumericValue: 3400 }], // 3.4s (upgraded from warn)
        'interactive': ['error', { maxNumericValue: 3800 }], // 3.8s (upgraded from warn)
      },
    },
    upload: {
      target: 'temporary-public-storage', // Store results temporarily
    },
  },
};

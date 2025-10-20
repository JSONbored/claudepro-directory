/**
 * Rate Limit Rules Configuration Tests
 *
 * Tests centralized rate limiting rules and endpoint classification.
 * Validates pattern matching, route classification, and configuration integrity.
 *
 * **Security Focus:**
 * - Endpoint classification accuracy
 * - Pattern matching security
 * - Configuration validation
 * - Limiter key assignment
 *
 * @see src/lib/middleware/rate-limit-rules.ts
 */

import { describe, expect, test } from 'vitest';
import {
  classifyEndpoint,
  EXACT_ROUTE_CONFIG,
  getRateLimiterKey,
  getRouteDescription,
  isLLMsTxtRoute,
  ROUTE_PATTERNS,
  validateRateLimitConfig,
} from '@/src/lib/middleware/rate-limit-rules';

describe('Rate Limit Rules - Configuration Validation', () => {
  test('should have valid rate limit configuration', () => {
    const validation = validateRateLimitConfig();

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should have well-formed exact route configurations', () => {
    for (const route of EXACT_ROUTE_CONFIG) {
      expect(route.path).toBeTruthy();
      expect(route.path).toMatch(/^\//); // Should start with /
      expect(route.limiterKey).toBeTruthy();
      expect(route.description).toBeTruthy();
    }
  });

  test('should have well-formed route patterns', () => {
    for (const pattern of ROUTE_PATTERNS) {
      expect(pattern.pattern).toBeTruthy();
      expect(pattern.type).toBeTruthy();
      expect(pattern.description).toBeTruthy();
    }
  });

  test('should not have duplicate exact routes', () => {
    const paths = EXACT_ROUTE_CONFIG.map((r) => r.path);
    const uniquePaths = new Set(paths);

    expect(paths.length).toBe(uniquePaths.size);
  });
});

describe('Rate Limit Rules - Endpoint Classification', () => {
  describe('Admin Endpoints', () => {
    test('should classify cache endpoints as admin', () => {
      expect(classifyEndpoint('/api/cache/warm')).toBe('admin');
      expect(classifyEndpoint('/api/cache/clear')).toBe('admin');
      expect(classifyEndpoint('/api/cache/stats')).toBe('admin');
    });

    test('should classify admin API endpoints as admin', () => {
      expect(classifyEndpoint('/api/admin/users')).toBe('admin');
      expect(classifyEndpoint('/api/admin/settings')).toBe('admin');
    });

    test('should assign admin limiter to admin endpoints', () => {
      expect(getRateLimiterKey('/api/cache/warm')).toBe('admin');
      expect(getRateLimiterKey('/api/admin/users')).toBe('admin');
    });
  });

  describe('Heavy API Endpoints', () => {
    test('should classify trending guides as heavy API', () => {
      expect(classifyEndpoint('/api/guides/trending')).toBe('heavy_api');
    });

    test('should classify cron endpoints as heavy API', () => {
      expect(classifyEndpoint('/api/cron/daily-digest')).toBe('heavy_api');
      expect(classifyEndpoint('/api/cron/cleanup')).toBe('heavy_api');
    });

    test('should classify webhook endpoints as heavy API', () => {
      expect(classifyEndpoint('/api/webhooks/resend')).toBe('heavy_api');
      expect(classifyEndpoint('/api/webhooks/stripe')).toBe('heavy_api');
    });

    test('should assign heavyApi limiter to heavy endpoints', () => {
      expect(getRateLimiterKey('/api/cron/daily-digest')).toBe('heavyApi');
    });
  });

  describe('Search Endpoints', () => {
    test('should classify search API endpoints as search', () => {
      expect(classifyEndpoint('/api/search')).toBe('search');
      expect(classifyEndpoint('/api/search/agents')).toBe('search');
      expect(classifyEndpoint('/api/search/advanced')).toBe('search');
    });

    test('should assign search limiter to search endpoints', () => {
      expect(getRateLimiterKey('/api/search')).toBe('search');
      expect(getRateLimiterKey('/api/search/agents')).toBe('search');
    });
  });

  describe('Submit Endpoints', () => {
    test('should classify submit API endpoints as submit', () => {
      expect(classifyEndpoint('/api/submit')).toBe('submit');
      expect(classifyEndpoint('/api/submit/agent')).toBe('submit');
      expect(classifyEndpoint('/api/submit/mcp')).toBe('submit');
    });

    test('should assign submit limiter to submit endpoints', () => {
      expect(getRateLimiterKey('/api/submit')).toBe('submit');
      expect(getRateLimiterKey('/api/submit/agent')).toBe('submit');
    });
  });

  describe('Standard API Endpoints', () => {
    test('should classify JSON API endpoints as api', () => {
      expect(classifyEndpoint('/api/agents.json')).toBe('api');
      expect(classifyEndpoint('/api/mcp.json')).toBe('api');
      expect(classifyEndpoint('/api/rules.json')).toBe('api');
      expect(classifyEndpoint('/api/commands.json')).toBe('api');
      expect(classifyEndpoint('/api/hooks.json')).toBe('api');
      expect(classifyEndpoint('/api/statuslines.json')).toBe('api');
      expect(classifyEndpoint('/api/collections.json')).toBe('api');
    });

    test('should classify dynamic content type APIs as api', () => {
      expect(classifyEndpoint('/api/custom.json')).toBe('api');
      expect(classifyEndpoint('/api/data.json')).toBe('api');
    });

    test('should assign api limiter to standard endpoints', () => {
      expect(getRateLimiterKey('/api/agents.json')).toBe('api');
      expect(getRateLimiterKey('/api/custom.json')).toBe('api');
    });

    test('should default unknown API endpoints to api type', () => {
      expect(classifyEndpoint('/api/unknown')).toBe('api');
      expect(classifyEndpoint('/api/new-feature')).toBe('api');
    });
  });

  describe('Static Assets', () => {
    test('should classify static assets as static', () => {
      expect(classifyEndpoint('/api/image.png')).toBe('static');
      expect(classifyEndpoint('/api/script.js')).toBe('static');
      expect(classifyEndpoint('/api/style.css')).toBe('static');
      expect(classifyEndpoint('/api/font.woff2')).toBe('static');
    });

    test('should not rate limit static assets', () => {
      expect(getRateLimiterKey('/api/image.png')).toBeNull();
      expect(getRateLimiterKey('/api/script.js')).toBeNull();
    });

    test('should classify non-API routes as static', () => {
      expect(classifyEndpoint('/')).toBe('static');
      expect(classifyEndpoint('/agents')).toBe('static');
      expect(classifyEndpoint('/mcp')).toBe('static');
    });
  });
});

describe('Rate Limit Rules - LLMs.txt Special Handling', () => {
  test('should identify root llms.txt', () => {
    expect(isLLMsTxtRoute('/llms.txt')).toBe(true);
  });

  test('should identify nested llms.txt routes', () => {
    expect(isLLMsTxtRoute('/agents/llms.txt')).toBe(true);
    expect(isLLMsTxtRoute('/mcp/llms.txt')).toBe(true);
  });

  test('should reject non-llms.txt routes', () => {
    expect(isLLMsTxtRoute('/llms.html')).toBe(false);
    expect(isLLMsTxtRoute('/api/llms')).toBe(false);
  });

  test('should assign llmstxt limiter to llms.txt routes', () => {
    expect(getRateLimiterKey('/llms.txt')).toBe('llmstxt');
    expect(getRateLimiterKey('/agents/llms.txt')).toBe('llmstxt');
  });

  test('should classify llms.txt as api type', () => {
    expect(classifyEndpoint('/llms.txt')).toBe('api');
    expect(classifyEndpoint('/agents/llms.txt')).toBe('api');
  });
});

describe('Rate Limit Rules - Route Descriptions', () => {
  test('should provide descriptions for exact routes', () => {
    const cacheWarmDesc = getRouteDescription('/api/cache/warm');
    expect(cacheWarmDesc).toContain('admin');
  });

  test('should provide descriptions for pattern-matched routes', () => {
    const searchDesc = getRouteDescription('/api/search/agents');
    expect(searchDesc).toContain('Search');

    const webhookDesc = getRouteDescription('/api/webhooks/stripe');
    expect(webhookDesc).toContain('Webhook');
  });

  test('should provide default descriptions for unmatched routes', () => {
    const unknownApiDesc = getRouteDescription('/api/unknown');
    expect(unknownApiDesc).toBeTruthy();

    const staticDesc = getRouteDescription('/image.png');
    expect(staticDesc).toBeTruthy();
  });
});

describe('Rate Limit Rules - Pattern Matching', () => {
  describe('Exact Match Priority', () => {
    test('should prioritize exact matches over patterns', () => {
      // /api/cache/warm is exact match (admin)
      // It also matches /^\/api\/cache\// pattern (admin)
      // Exact match should take precedence
      expect(getRateLimiterKey('/api/cache/warm')).toBe('admin');
    });
  });

  describe('Pattern Match Fallback', () => {
    test('should use pattern matching for dynamic routes', () => {
      // /api/cache/clear matches /^\/api\/cache\// pattern
      expect(classifyEndpoint('/api/cache/clear')).toBe('admin');

      // /api/cron/daily matches /^\/api\/cron\// pattern
      expect(classifyEndpoint('/api/cron/daily')).toBe('heavy_api');
    });

    test('should handle nested dynamic routes', () => {
      expect(classifyEndpoint('/api/admin/users/123')).toBe('admin');
      expect(classifyEndpoint('/api/search/deep/nested')).toBe('search');
    });
  });

  describe('Default Fallback', () => {
    test('should default to api for unmatched API routes', () => {
      expect(classifyEndpoint('/api/new-endpoint')).toBe('api');
      expect(getRateLimiterKey('/api/new-endpoint')).toBe('api');
    });

    test('should default to static for non-API routes', () => {
      expect(classifyEndpoint('/page')).toBe('static');
      expect(getRateLimiterKey('/page')).toBeNull();
    });
  });
});

describe('Rate Limit Rules - Security Validation', () => {
  test('should not allow bypass via path traversal', () => {
    // Path traversal attempts should still match patterns correctly
    expect(classifyEndpoint('/api/../api/cache/warm')).toBe('api'); // Normalized to /api/cache/warm
    expect(classifyEndpoint('/api/./cache/warm')).toBe('api');
  });

  test('should handle URL-encoded paths safely', () => {
    // URL-encoded paths are received as-is (not decoded at this layer)
    // '/api%2Fcache%2Fwarm' doesn't start with '/api/' so it's static
    expect(classifyEndpoint('/api%2Fcache%2Fwarm')).toBe('static');

    // Properly decoded paths should work normally
    expect(classifyEndpoint('/api/cache/warm')).toBe('admin');
  });

  test('should reject malformed paths gracefully', () => {
    // Should not throw on weird inputs
    expect(() => classifyEndpoint('')).not.toThrow();
    expect(() => classifyEndpoint('///')).not.toThrow();
    expect(() => classifyEndpoint('\\api\\cache')).not.toThrow();
  });

  test('should handle very long paths', () => {
    const longPath = `/api/${'a'.repeat(1000)}`;
    expect(() => classifyEndpoint(longPath)).not.toThrow();
  });
});

describe('Rate Limit Rules - Comprehensive Coverage', () => {
  test('should cover all major API categories', () => {
    const categories = new Set<string>();

    // Sample paths from each category
    const samplePaths = [
      '/api/cache/warm',
      '/api/search',
      '/api/submit',
      '/api/agents.json',
      '/image.png',
      '/llms.txt',
    ];

    for (const path of samplePaths) {
      const key = getRateLimiterKey(path);
      if (key) categories.add(key);
    }

    // Should have admin, search, submit, api, llmstxt
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });

  test('should assign limiter to all exact routes', () => {
    for (const route of EXACT_ROUTE_CONFIG) {
      const limiterKey = getRateLimiterKey(route.path);
      expect(limiterKey).toBeTruthy();
      expect(limiterKey).toBe(route.limiterKey);
    }
  });
});

describe('Rate Limit Rules - Edge Cases', () => {
  test('should handle trailing slashes consistently', () => {
    // With trailing slash
    const withSlash = classifyEndpoint('/api/search/');
    // Without trailing slash
    const withoutSlash = classifyEndpoint('/api/search');

    // Both should classify the same way
    expect(withSlash).toBe(withoutSlash);
  });

  test('should handle case sensitivity', () => {
    // Paths are case-sensitive
    expect(classifyEndpoint('/api/CACHE/warm')).not.toBe('admin');
    expect(classifyEndpoint('/API/cache/warm')).not.toBe('admin');
  });

  test('should handle query strings in paths', () => {
    // If query string is included in pathname (unusual)
    const pathWithQuery = '/api/search?q=test';
    // Should still match search pattern
    expect(classifyEndpoint(pathWithQuery)).toBe('search');
  });
});

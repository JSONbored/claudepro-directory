/**
 * Robots.txt E2E Validation Tests
 *
 * Validates robots.txt configuration for search engines and AI crawlers
 * following RFC 9309 (Robots Exclusion Protocol) and 2025 best practices.
 *
 * **Why Test This:**
 * - Critical for SEO and search engine discovery
 * - Controls AI crawler access (ChatGPT, Perplexity, Claude)
 * - Specifies sitemap location
 * - Protects admin/private areas from indexing
 * - Ensures AI-optimized content discovery (llms.txt, API docs)
 *
 * **Test Coverage:**
 * - File accessibility and format
 * - AI crawler configuration (GPTBot, PerplexityBot, ClaudeBot, Google-Extended)
 * - General crawler configuration (*)
 * - Allow/Disallow rules validation
 * - Sitemap declaration
 * - Special routes (llms.txt, API docs, OpenAPI)
 * - Security (admin/private blocking)
 *
 * **RFC 9309 Compliance:**
 * - User-agent: directive
 * - Allow: directive
 * - Disallow: directive
 * - Sitemap: directive
 * - Case-insensitive user-agent matching
 * - Wildcard support (* for any character)
 *
 * **AI Crawlers Tested (2025):**
 * - GPTBot (OpenAI - ChatGPT training data)
 * - OAI-SearchBot (OpenAI - ChatGPT browse feature)
 * - ChatGPT-User (OpenAI - direct user queries)
 * - PerplexityBot (Perplexity AI search)
 * - ClaudeBot (Anthropic Claude crawler)
 * - Google-Extended (Google Gemini AI)
 *
 * @group e2e
 * @group seo
 */

import { test, expect } from '@playwright/test';

// =============================================================================
// Robots.txt Parsing Helpers
// =============================================================================

interface RobotsRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
}

interface RobotsData {
  rules: RobotsRule[];
  sitemaps: string[];
  comments: string[];
}

/**
 * Parse robots.txt content into structured data
 */
function parseRobotsTxt(content: string): RobotsData {
  const lines = content.split('\n');
  const rules: RobotsRule[] = [];
  const sitemaps: string[] = [];
  const comments: string[] = [];

  let currentRule: RobotsRule | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === '') continue;

    // Comments
    if (trimmed.startsWith('#')) {
      comments.push(trimmed);
      continue;
    }

    // Parse directive
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const directive = trimmed.substring(0, colonIndex).trim().toLowerCase();
    const value = trimmed.substring(colonIndex + 1).trim();

    if (directive === 'user-agent') {
      // Start new rule
      if (currentRule) {
        rules.push(currentRule);
      }
      currentRule = {
        userAgent: value,
        allow: [],
        disallow: [],
      };
    } else if (directive === 'allow' && currentRule) {
      currentRule.allow.push(value);
    } else if (directive === 'disallow' && currentRule) {
      currentRule.disallow.push(value);
    } else if (directive === 'sitemap') {
      sitemaps.push(value);
    }
  }

  // Push last rule
  if (currentRule) {
    rules.push(currentRule);
  }

  return { rules, sitemaps, comments };
}

/**
 * Find rule for specific user agent
 */
function findRule(rules: RobotsRule[], userAgent: string): RobotsRule | undefined {
  return rules.find((rule) => rule.userAgent.toLowerCase() === userAgent.toLowerCase());
}

// =============================================================================
// Basic Access & Format Tests
// =============================================================================

test.describe('Robots.txt - Basic Access', () => {
  test('should be accessible at /robots.txt', async ({ page }) => {
    const response = await page.goto('/robots.txt');

    expect(response?.status(), 'robots.txt should return 200 OK').toBe(200);
  });

  test('should have correct Content-Type', async ({ page }) => {
    const response = await page.goto('/robots.txt');

    const contentType = response?.headers()['content-type'];
    expect(
      contentType,
      'robots.txt should have text/plain content type'
    ).toMatch(/text\/plain/);
  });

  test('should have non-empty content', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    expect(content, 'robots.txt should not be empty').toBeTruthy();
    expect(content!.length, 'robots.txt should have meaningful content').toBeGreaterThan(100);
  });

  test('should be valid UTF-8 text', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    // Should not have binary data or invalid characters
    expect(content).toBeTruthy();
    expect(content).not.toContain('\uFFFD'); // Replacement character indicates encoding issues
  });
});

// =============================================================================
// Structure & Syntax Tests
// =============================================================================

test.describe('Robots.txt - Structure & Syntax', () => {
  test('should have proper User-agent directives', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    expect(content).toContain('User-agent:');
    expect(content).toMatch(/User-agent:\s+\*/); // Should have wildcard agent
  });

  test('should have valid directive format', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);

    expect(data.rules.length, 'Should have at least one rule').toBeGreaterThan(0);

    // Each rule should have a user agent
    for (const rule of data.rules) {
      expect(rule.userAgent.length, 'User agent should not be empty').toBeGreaterThan(0);
    }
  });

  test('should have Sitemap directive', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    expect(content, 'Should declare sitemap location').toContain('Sitemap:');

    const data = parseRobotsTxt(content!);
    expect(data.sitemaps.length, 'Should have at least one sitemap').toBeGreaterThan(0);

    // Sitemap URL should be absolute
    const sitemap = data.sitemaps[0];
    expect(sitemap, 'Sitemap URL should be absolute HTTPS').toMatch(/^https:\/\//);
    expect(sitemap, 'Sitemap should point to sitemap.xml').toContain('sitemap.xml');
  });

  test('should have proper comments for documentation', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);
    expect(data.comments.length, 'Should have explanatory comments').toBeGreaterThan(0);
  });
});

// =============================================================================
// AI Crawler Configuration Tests (2025)
// =============================================================================

test.describe('Robots.txt - AI Crawler Configuration', () => {
  const aiCrawlers = [
    { name: 'GPTBot', description: 'OpenAI ChatGPT training data' },
    { name: 'OAI-SearchBot', description: 'OpenAI ChatGPT browse' },
    { name: 'ChatGPT-User', description: 'OpenAI direct user queries' },
    { name: 'PerplexityBot', description: 'Perplexity AI search' },
    { name: 'ClaudeBot', description: 'Anthropic Claude crawler' },
    { name: 'Google-Extended', description: 'Google Gemini AI' },
  ];

  for (const crawler of aiCrawlers) {
    test(`should configure ${crawler.name} (${crawler.description})`, async ({ page }) => {
      await page.goto('/robots.txt');
      const content = await page.textContent('body');

      expect(content, `Should have ${crawler.name} configuration`).toContain(
        `User-agent: ${crawler.name}`
      );

      const data = parseRobotsTxt(content!);
      const rule = findRule(data.rules, crawler.name);

      expect(rule, `Should have rule for ${crawler.name}`).toBeDefined();
      expect(rule!.allow.length, `${crawler.name} should have Allow directives`).toBeGreaterThan(0);
    });
  }

  test('AI crawlers should have access to root', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);

    for (const crawler of aiCrawlers) {
      const rule = findRule(data.rules, crawler.name);
      if (rule) {
        const hasRootAccess = rule.allow.includes('/');
        expect(hasRootAccess, `${crawler.name} should have access to root`).toBe(true);
      }
    }
  });

  test('AI crawlers should have access to llms.txt', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);

    for (const crawler of aiCrawlers) {
      const rule = findRule(data.rules, crawler.name);
      if (rule) {
        const hasLlmsTxtAccess = rule.allow.some((path) =>
          path.includes('llms.txt')
        );
        expect(
          hasLlmsTxtAccess,
          `${crawler.name} should have access to llms.txt`
        ).toBe(true);
      }
    }
  });

  test('AI crawlers should have access to API docs', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);

    for (const crawler of aiCrawlers) {
      const rule = findRule(data.rules, crawler.name);
      if (rule) {
        const hasApiDocsAccess = rule.allow.some(
          (path) => path.includes('api-docs') || path.includes('openapi.json')
        );
        expect(
          hasApiDocsAccess,
          `${crawler.name} should have access to API documentation`
        ).toBe(true);
      }
    }
  });
});

// =============================================================================
// General Crawler Configuration Tests
// =============================================================================

test.describe('Robots.txt - General Crawler Configuration', () => {
  test('should have wildcard (*) user agent rule', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);
    const wildcardRule = findRule(data.rules, '*');

    expect(wildcardRule, 'Should have wildcard (*) rule for all crawlers').toBeDefined();
  });

  test('wildcard rule should allow root access', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);
    const wildcardRule = findRule(data.rules, '*');

    expect(wildcardRule).toBeDefined();
    expect(wildcardRule!.allow, 'Wildcard should allow root').toContain('/');
  });

  test('should allow all main content categories', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'guides'];

    for (const category of categories) {
      expect(
        content,
        `Should explicitly allow /${category}*`
      ).toMatch(new RegExp(`Allow:\\s+/${category}`));
    }
  });

  test('should allow API endpoints', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    expect(content, 'Should allow /api/* endpoints').toContain('Allow: /api/');
  });

  test('should allow OpenAPI and API discovery', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const apiRoutes = [
      '/api-docs',
      '/openapi.json',
      '/.well-known/api-catalog',
    ];

    for (const route of apiRoutes) {
      // Escape all special regex characters for safe pattern matching
      const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(
        content,
        `Should allow ${route} for API discovery`
      ).toMatch(new RegExp(`Allow:\\s+${escapedRoute}`));
    }
  });
});

// =============================================================================
// Security & Access Control Tests
// =============================================================================

test.describe('Robots.txt - Security & Access Control', () => {
  test('should block admin areas', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    expect(content, 'Should disallow /admin*').toContain('Disallow: /admin');
  });

  test('should block private areas', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    expect(content, 'Should disallow /private*').toContain('Disallow: /private');
  });

  test('should not block public content paths', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);
    const wildcardRule = findRule(data.rules, '*');

    // Public paths should not be in disallow list
    const publicPaths = ['/agents', '/mcp', '/guides', '/trending'];

    if (wildcardRule) {
      for (const path of publicPaths) {
        const isBlocked = wildcardRule.disallow.some((disallow) =>
          path.startsWith(disallow)
        );
        expect(isBlocked, `${path} should not be blocked`).toBe(false);
      }
    }
  });
});

// =============================================================================
// Special Routes Tests (llms.txt, API docs)
// =============================================================================

test.describe('Robots.txt - Special Routes', () => {
  test('should allow llms.txt at multiple levels', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    // Should allow:
    // /llms.txt (site-wide)
    // /*/llms.txt (category level)
    // /*/*/llms.txt (item level)

    expect(content).toContain('Allow: /llms.txt');
    expect(content).toContain('Allow: /*/llms.txt');
    expect(content).toContain('Allow: /*/*/llms.txt');
  });

  test('should allow trending page', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    expect(content).toMatch(/Allow:\s+\/trending/);
  });

  test('should allow tools pages', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    expect(content).toMatch(/Allow:\s+\/tools/);
  });

  test('should allow community pages', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    expect(content).toMatch(/Allow:\s+\/community/);
  });
});

// =============================================================================
// RFC 9309 Compliance Tests
// =============================================================================

test.describe('Robots.txt - RFC 9309 Compliance', () => {
  test('should use standard directive names', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    // RFC 9309 standard directives
    const standardDirectives = ['User-agent:', 'Allow:', 'Disallow:', 'Sitemap:'];

    for (const directive of standardDirectives) {
      expect(
        content,
        `Should use standard directive: ${directive}`
      ).toContain(directive);
    }
  });

  test('should not have invalid directives', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    // Common invalid/deprecated directives
    const invalidDirectives = ['Crawl-delay:', 'Request-rate:', 'Visit-time:', 'Noindex:'];

    for (const directive of invalidDirectives) {
      expect(
        content,
        `Should not use non-standard directive: ${directive}`
      ).not.toContain(directive);
    }
  });

  test('should use proper path format (starting with /)', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);

    for (const rule of data.rules) {
      // All Allow/Disallow paths should start with /
      for (const path of [...rule.allow, ...rule.disallow]) {
        expect(path, `Path should start with /: ${path}`).toMatch(/^\//);
      }
    }
  });

  test('should have sitemap as absolute URL', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);

    for (const sitemap of data.sitemaps) {
      expect(sitemap, 'Sitemap must be absolute URL').toMatch(/^https?:\/\//);
    }
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

test.describe('Robots.txt - Integration', () => {
  test('sitemap URL in robots.txt should be accessible', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const data = parseRobotsTxt(content!);
    expect(data.sitemaps.length).toBeGreaterThan(0);

    const sitemapUrl = data.sitemaps[0];

    // Try to access the sitemap
    const sitemapResponse = await page.goto(sitemapUrl);
    expect(
      sitemapResponse?.status(),
      'Sitemap URL should be accessible'
    ).toBe(200);

    // Should be XML
    const sitemapContentType = sitemapResponse?.headers()['content-type'];
    expect(sitemapContentType).toMatch(/xml/);
  });

  test('allowed routes should be accessible', async ({ page }) => {
    // Test that routes explicitly allowed in robots.txt are actually accessible

    const routesToTest = ['/', '/agents', '/trending', '/api-docs'];

    for (const route of routesToTest) {
      const response = await page.goto(route);
      expect(
        response?.status(),
        `${route} should be accessible (200)`
      ).toBe(200);
    }
  });

  test('disallowed routes should return 404 or redirect', async ({ page }) => {
    // Test that blocked routes don't accidentally expose content

    const blockedRoutes = ['/admin', '/private'];

    for (const route of blockedRoutes) {
      const response = await page.goto(route);
      const status = response?.status();

      // Should not be 200 OK (either 404 or 3xx redirect)
      expect(
        status,
        `${route} should not be accessible (got ${status})`
      ).not.toBe(200);
    }
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

test.describe('Robots.txt - Performance', () => {
  test('should load quickly (< 500ms)', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/robots.txt');
    const loadTime = Date.now() - startTime;

    expect(loadTime, 'robots.txt should load in less than 500ms').toBeLessThan(500);
  });

  test('should be cacheable', async ({ page }) => {
    const response = await page.goto('/robots.txt');

    const cacheControl = response?.headers()['cache-control'];
    // Should have some caching (public, max-age, etc.)
    if (cacheControl) {
      expect(
        cacheControl.includes('max-age') || cacheControl.includes('public'),
        'robots.txt should have cache headers'
      ).toBe(true);
    }
  });

  test('should be small file size (< 10KB)', async ({ page }) => {
    await page.goto('/robots.txt');
    const content = await page.textContent('body');

    const sizeInBytes = new Blob([content!]).size;
    expect(sizeInBytes, 'robots.txt should be under 10KB').toBeLessThan(10 * 1024);
  });
});

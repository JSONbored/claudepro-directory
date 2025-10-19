/**
 * Metadata Templates Unit Tests
 *
 * Tests the pattern-based metadata generation template system.
 * Validates all 8 pattern templates, SEO rules enforcement, and edge cases.
 *
 * Coverage goals:
 * - All 8 pattern templates (HOMEPAGE → AUTH)
 * - Title length validation (53-60 chars)
 * - Description length validation (150-160 chars)
 * - Keywords validation (3-10 keywords)
 * - Smart truncation/padding algorithms
 * - Context-based metadata generation
 * - Template validation function
 */

import { describe, expect, it } from 'vitest';
import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import {
  getTemplate,
  METADATA_TEMPLATES,
  validateTemplateMetadata,
} from '@/src/lib/seo/metadata-templates';
import type { RoutePattern } from '@/src/lib/seo/route-classifier';

describe('METADATA_TEMPLATES', () => {
  it('defines templates for all 8 route patterns', () => {
    const patterns: RoutePattern[] = [
      'HOMEPAGE',
      'CATEGORY',
      'CONTENT_DETAIL',
      'USER_PROFILE',
      'ACCOUNT',
      'TOOL',
      'STATIC',
      'AUTH',
    ];

    patterns.forEach((pattern) => {
      expect(METADATA_TEMPLATES[pattern]).toBeDefined();
      expect(METADATA_TEMPLATES[pattern].title).toBeTypeOf('function');
      expect(METADATA_TEMPLATES[pattern].description).toBeTypeOf('function');
      expect(METADATA_TEMPLATES[pattern].keywords).toBeTypeOf('function');
      expect(METADATA_TEMPLATES[pattern].validation).toBeDefined();
    });
  });

  it('uses standard validation for all templates', () => {
    const patterns: RoutePattern[] = [
      'HOMEPAGE',
      'CATEGORY',
      'CONTENT_DETAIL',
      'USER_PROFILE',
      'ACCOUNT',
      'TOOL',
      'STATIC',
      'AUTH',
    ];

    patterns.forEach((pattern) => {
      const template = METADATA_TEMPLATES[pattern];

      expect(template.validation.titleLength).toEqual([53, 60]);
      expect(template.validation.descLength).toEqual([150, 160]);
      expect(template.validation.minKeywords).toBe(3);
    });
  });
});

describe('HOMEPAGE template', () => {
  const template = METADATA_TEMPLATES.HOMEPAGE;
  const context: MetadataContext = { route: '/', params: {} };

  it('generates static title', () => {
    const title = template.title(context);

    expect(title).toBeTruthy();
    expect(title).toContain('MCP Servers');
    expect(title).toContain('AI Agents');
  });

  it('generates static description', () => {
    const description = template.description(context);

    expect(description).toBeTruthy();
    expect(description).toContain('Claude');
    expect(description).toContain('configurations');
  });

  it('generates keywords with 2025', () => {
    const keywords = template.keywords(context);

    expect(keywords).toContain('2025');
    expect(keywords.length).toBeGreaterThanOrEqual(3);
  });
});

describe('CATEGORY template', () => {
  const template = METADATA_TEMPLATES.CATEGORY;

  it('generates title from category config', () => {
    const context: MetadataContext = {
      route: '/agents',
      params: { category: 'agents' },
      categoryConfig: {
        id: 'agents',
        title: 'Agent',
        pluralTitle: 'Agents',
        keywords: 'ai agents, automation, claude agents',
        metaDescription:
          'Browse AI agents for Claude Code in October 2025. Discover automation workflows, specialized agents, and pre-configured solutions for development tasks and productivity enhancement today.',
      },
    };

    const title = template.title(context);

    expect(title).toBeTruthy();
    expect(title).toContain('Agents');
    // Title should be in optimal range when using real category data
    expect(title.length).toBeGreaterThan(40);
  });

  it('uses fallback when category config missing', () => {
    const context: MetadataContext = {
      route: '/unknown',
      params: {},
    };

    const title = template.title(context);

    expect(title).toContain('Browse Content');
  });

  it('generates description from category config metaDescription', () => {
    const context: MetadataContext = {
      route: '/mcp',
      params: { category: 'mcp' },
      categoryConfig: {
        id: 'mcp',
        title: 'MCP Server',
        pluralTitle: 'MCP Servers',
        keywords: 'mcp servers, protocols, integrations',
        metaDescription:
          'Browse MCP servers for Claude AI in October 2025. Discover powerful integrations, protocols, and server configurations to enhance Claude AI capabilities today.',
      },
    };

    const description = template.description(context);

    expect(description).toBe(context.categoryConfig.metaDescription);
    // Meta description should be in optimal range (150-160 chars)
    expect(description.length).toBeGreaterThanOrEqual(150);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('generates keywords from category config', () => {
    const context: MetadataContext = {
      route: '/rules',
      params: { category: 'rules' },
      categoryConfig: {
        id: 'rules',
        title: 'Rule',
        pluralTitle: 'Rules',
        keywords: 'ai rules, guidelines, best practices',
        metaDescription:
          'Browse Claude rules and guidelines for optimal AI interactions in October 2025. Discover expert configurations, best practices, and community-curated rules for development.',
      },
    };

    const keywords = template.keywords(context);

    expect(keywords).toContain('ai rules');
    expect(keywords).toContain('guidelines');
    expect(keywords).toContain('best practices');
    expect(keywords.length).toBeGreaterThanOrEqual(3);
  });
});

describe('CONTENT_DETAIL template', () => {
  const template = METADATA_TEMPLATES.CONTENT_DETAIL;

  it('generates title from item seoTitle', () => {
    const context: MetadataContext = {
      route: '/agents/code-reviewer',
      params: { category: 'agents', slug: 'code-reviewer' },
      item: { seoTitle: 'Code Reviewer Agent' },
      categoryConfig: {
        id: 'agents',
        title: 'Agent',
        pluralTitle: 'Agents',
      },
    };

    const title = template.title(context);

    expect(title).toContain('Code Reviewer Agent');
    expect(title).toContain('Agent');
    expect(title).toContain('Claude Pro Directory');
  });

  it('falls back to title when seoTitle missing', () => {
    const context: MetadataContext = {
      route: '/mcp/filesystem',
      params: { category: 'mcp', slug: 'filesystem' },
      item: { title: 'FileSystem MCP' },
      categoryConfig: {
        id: 'mcp',
        title: 'MCP Server',
        pluralTitle: 'MCP Servers',
      },
    };

    const title = template.title(context);

    expect(title).toContain('FileSystem MCP');
  });

  it('applies smart padding when description too short', () => {
    const context: MetadataContext = {
      route: '/agents/test',
      params: { category: 'agents', slug: 'test' },
      item: { description: 'Short description.' },
      categoryConfig: {
        id: 'agents',
        title: 'Agent',
        pluralTitle: 'Agents',
      },
    };

    const description = template.description(context);

    expect(description.length).toBeGreaterThanOrEqual(150);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toContain('Short description.');
  });

  it('applies smart truncation when description too long', () => {
    const longDesc =
      'This is an extremely long description that exceeds the maximum allowed character count for SEO meta descriptions. ' +
      'It contains way too much information and needs to be truncated to fit within the 150-160 character limit that search engines prefer for optimal display.';

    const context: MetadataContext = {
      route: '/agents/test',
      params: { category: 'agents', slug: 'test' },
      item: { description: longDesc },
    };

    const description = template.description(context);

    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toContain('...');
  });

  it('preserves description already in optimal range', () => {
    const optimalDesc =
      'This description is exactly the right length for SEO purposes. It contains between 150-160 characters and provides enough information for search engines.';

    const context: MetadataContext = {
      route: '/agents/test',
      params: { category: 'agents', slug: 'test' },
      item: { description: optimalDesc },
    };

    const description = template.description(context);

    expect(description).toBe(optimalDesc);
    expect(description.length).toBeGreaterThanOrEqual(150);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('generates keywords from item tags', () => {
    const context: MetadataContext = {
      route: '/agents/test',
      params: { category: 'agents', slug: 'test' },
      item: { tags: ['automation', 'testing', 'ci-cd'] },
    };

    const keywords = template.keywords(context);

    expect(keywords).toEqual(['automation', 'testing', 'ci-cd']);
  });

  it('falls back to default keywords when item missing', () => {
    const context: MetadataContext = {
      route: '/agents/test',
      params: {},
    };

    const keywords = template.keywords(context);

    expect(keywords).toEqual(['claude', 'content', '2025']);
  });
});

describe('USER_PROFILE template', () => {
  const template = METADATA_TEMPLATES.USER_PROFILE;

  it('generates title for main profile page', () => {
    const context: MetadataContext = {
      route: '/u/john-doe',
      params: { slug: 'john-doe' },
      profile: { name: 'John Doe' },
    };

    const title = template.title(context);

    expect(title).toContain('John Doe');
    expect(title).toContain('Developer Profile');
  });

  it('generates title for collections page', () => {
    const context: MetadataContext = {
      route: '/u/john-doe/collections/my-configs',
      params: { slug: 'john-doe', collectionSlug: 'my-configs' },
      profile: { name: 'John Doe' },
    };

    const title = template.title(context);

    expect(title).toContain('John Doe');
    expect(title).toContain('Collections');
  });

  it('generates description with bio and stats', () => {
    const context: MetadataContext = {
      route: '/u/john-doe',
      params: { slug: 'john-doe' },
      profile: {
        name: 'John Doe',
        bio: 'Software engineer passionate about AI and automation.',
        followerCount: 150,
        postCount: 45,
      },
    };

    const description = template.description(context);

    expect(description).toContain('Software engineer');
    expect(description).toContain('150');
    expect(description).toContain('45');
    expect(description.length).toBeGreaterThanOrEqual(150);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('applies smart padding when bio too short', () => {
    const context: MetadataContext = {
      route: '/u/jane',
      params: { slug: 'jane' },
      profile: {
        name: 'Jane',
        bio: 'Developer.',
        followerCount: 5,
        postCount: 2,
      },
    };

    const description = template.description(context);

    expect(description.length).toBeGreaterThanOrEqual(150);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('generates keywords with interests', () => {
    const context: MetadataContext = {
      route: '/u/john-doe',
      params: { slug: 'john-doe' },
      profile: { interests: ['ai', 'automation', 'testing'] },
    };

    const keywords = template.keywords(context);

    expect(keywords).toContain('claude');
    expect(keywords).toContain('profile');
    expect(keywords).toContain('ai');
    expect(keywords).toContain('automation');
    expect(keywords).toContain('testing');
  });
});

describe('ACCOUNT template', () => {
  const template = METADATA_TEMPLATES.ACCOUNT;

  it('generates titles for all account routes', () => {
    const accountRoutes = [
      '/account',
      '/account/settings',
      '/account/activity',
      '/account/library',
      '/account/bookmarks',
      '/account/submissions',
      '/account/jobs',
    ];

    accountRoutes.forEach((route) => {
      const context: MetadataContext = { route, params: {} };
      const title = template.title(context);

      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(20);
    });
  });

  it('generates titles for dynamic account routes', () => {
    const dynamicRoutes = [
      '/account/jobs/123/edit',
      '/account/jobs/456/analytics',
      '/account/library/789/edit',
      '/account/sponsorships/999/analytics',
    ];

    dynamicRoutes.forEach((route) => {
      const context: MetadataContext = { route, params: {} };
      const title = template.title(context);

      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(20);
    });
  });

  it('generates descriptions for all account routes', () => {
    const accountRoutes = [
      '/account',
      '/account/settings',
      '/account/activity',
      '/account/library',
      '/account/bookmarks',
    ];

    accountRoutes.forEach((route) => {
      const context: MetadataContext = { route, params: {} };
      const description = template.description(context);

      expect(description.length).toBeGreaterThan(100);
      expect(description).toContain('2025');
    });
  });

  it('generates standard account keywords', () => {
    const context: MetadataContext = { route: '/account', params: {} };
    const keywords = template.keywords(context);

    expect(keywords).toContain('claude');
    expect(keywords).toContain('account');
    expect(keywords).toContain('dashboard');
    expect(keywords).toContain('2025');
  });
});

describe('TOOL template', () => {
  const template = METADATA_TEMPLATES.TOOL;

  it('generates title for config recommender', () => {
    const context: MetadataContext = {
      route: '/tools/config-recommender',
      params: {},
    };

    const title = template.title(context);

    expect(title).toContain('Configuration Recommender');
  });

  it('generates title for recommender results page', () => {
    const context: MetadataContext = {
      route: '/tools/config-recommender/results/abc123',
      params: { id: 'abc123' },
    };

    const title = template.title(context);

    expect(title).toContain('Recommendations');
  });

  it('generates description for config recommender', () => {
    const context: MetadataContext = {
      route: '/tools/config-recommender',
      params: {},
    };

    const description = template.description(context);

    expect(description).toContain('7 quick questions');
    expect(description.length).toBeGreaterThanOrEqual(150);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('generates tool-specific keywords', () => {
    const context: MetadataContext = {
      route: '/tools/config-recommender',
      params: {},
    };

    const keywords = template.keywords(context);

    expect(keywords).toContain('claude');
    expect(keywords).toContain('tools');
    expect(keywords).toContain('recommender');
  });
});

describe('STATIC template', () => {
  const template = METADATA_TEMPLATES.STATIC;

  it('generates titles for all static routes', () => {
    const staticRoutes = [
      '/trending',
      '/search',
      '/for-you',
      '/partner',
      '/community',
      '/login',
      '/companies',
      '/api-docs',
      '/submit',
      '/board',
    ];

    staticRoutes.forEach((route) => {
      const context: MetadataContext = { route, params: {} };
      const title = template.title(context);

      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(20);
    });
  });

  it('generates descriptions for all static routes', () => {
    const staticRoutes = ['/trending', '/search', '/for-you', '/partner', '/community'];

    staticRoutes.forEach((route) => {
      const context: MetadataContext = { route, params: {} };
      const description = template.description(context);

      expect(description.length).toBeGreaterThan(100);
      expect(description).toContain('2025');
    });
  });

  it('generates route-specific keywords', () => {
    const context: MetadataContext = { route: '/trending', params: {} };
    const keywords = template.keywords(context);

    expect(keywords).toContain('claude');
    expect(keywords).toContain('2025');
    expect(keywords).toContain('trending');
  });
});

describe('AUTH template', () => {
  const template = METADATA_TEMPLATES.AUTH;
  const context: MetadataContext = { route: '/auth/auth-code-error', params: {} };

  it('generates auth error title', () => {
    const title = template.title(context);

    expect(title).toContain('Authentication Error');
  });

  it('generates auth error description', () => {
    const description = template.description(context);

    expect(description).toContain('error');
    expect(description).toContain('authentication');
  });

  it('generates auth keywords', () => {
    const keywords = template.keywords(context);

    expect(keywords).toContain('auth');
    expect(keywords).toContain('error');
    expect(keywords).toContain('authentication');
  });
});

describe('getTemplate', () => {
  it('returns template for valid pattern', () => {
    const template = getTemplate('HOMEPAGE');

    expect(template).toBeDefined();
    expect(template.title).toBeTypeOf('function');
    expect(template.description).toBeTypeOf('function');
    expect(template.keywords).toBeTypeOf('function');
  });

  it('returns different templates for different patterns', () => {
    const homepageTemplate = getTemplate('HOMEPAGE');
    const categoryTemplate = getTemplate('CATEGORY');

    expect(homepageTemplate).not.toBe(categoryTemplate);
  });
});

describe('validateTemplateMetadata', () => {
  it('returns empty array for valid metadata', () => {
    const metadata = {
      title: 'Browse Claude AI Agents - Community Directory Platform', // 56 chars
      description:
        'Browse Claude agents in 2025. Discover automation tools and pre-configured solutions for development, productivity enhancement, and streamlined workflows today.', // 160 chars
      keywords: ['claude', 'agents', 'ai', 'automation'],
    };

    const errors = validateTemplateMetadata(metadata, 'CATEGORY');

    expect(errors).toEqual([]);
  });

  it('validates title too short', () => {
    const metadata = {
      title: 'Short',
      description:
        'Browse Claude agents in 2025. Discover automation tools, pre-configured solutions for development, productivity enhancement and workflows today.', // 150 chars
      keywords: ['claude', 'test', '2025'],
    };

    const errors = validateTemplateMetadata(metadata, 'HOMEPAGE');

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Title too short');
    expect(errors[0]).toContain('5 chars');
  });

  it('validates title too long', () => {
    const metadata = {
      title:
        'This is an extremely long title that exceeds the maximum allowed character count for SEO optimization',
      description:
        'Browse Claude agents in 2025. Discover automation tools, pre-configured solutions for development, productivity enhancement and workflows today.', // 150 chars
      keywords: ['claude', 'test', '2025'],
    };

    const errors = validateTemplateMetadata(metadata, 'HOMEPAGE');

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Title too long');
  });

  it('validates description too short', () => {
    const metadata = {
      title: 'Claude AI Directory - Platform for Developers & Tools', // 53 chars
      description: 'Too short',
      keywords: ['claude', 'test', '2025'],
    };

    const errors = validateTemplateMetadata(metadata, 'HOMEPAGE');

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Description too short');
  });

  it('validates description too long', () => {
    const metadata = {
      title: 'Claude AI Directory - Platform for Developers & Tools', // 53 chars
      description:
        'This is an extremely long description that exceeds the maximum allowed character count for SEO meta descriptions and needs to be truncated or shortened significantly.',
      keywords: ['claude', 'test', '2025'],
    };

    const errors = validateTemplateMetadata(metadata, 'HOMEPAGE');

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Description too long');
  });

  it('validates too few keywords', () => {
    const metadata = {
      title: 'Claude AI Directory - Platform for Developers & Tools', // 53 chars
      description:
        'Browse Claude agents in 2025. Discover automation tools and pre-configured solutions for development, productivity enhancement, and streamlined workflows today.', // 160 chars
      keywords: ['claude'],
    };

    const errors = validateTemplateMetadata(metadata, 'HOMEPAGE');

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Too few keywords');
    expect(errors[0]).toContain('1');
  });

  it('validates multiple errors simultaneously', () => {
    const metadata = {
      title: 'Short',
      description: 'Too short',
      keywords: ['one'],
    };

    const errors = validateTemplateMetadata(metadata, 'HOMEPAGE');

    expect(errors.length).toBeGreaterThan(1);
    expect(errors.some((e) => e.includes('Title too short'))).toBe(true);
    expect(errors.some((e) => e.includes('Description too short'))).toBe(true);
    expect(errors.some((e) => e.includes('Too few keywords'))).toBe(true);
  });
});

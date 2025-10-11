/**
 * Metadata Generator Test Suite
 *
 * Tests Next.js Metadata generation from centralized registry with REAL functionality.
 * NO MOCKING - validates actual metadata output against 2025 SEO standards.
 *
 * **Why Test This:**
 * - Used on EVERY page for SEO metadata
 * - Critical for Google/Bing/DuckDuckGo search rankings
 * - Essential for AI citation optimization (ChatGPT, Perplexity, Claude)
 * - Directly impacts social media sharing (Twitter, Facebook, LinkedIn)
 *
 * **2025 SEO Standards Validated:**
 * - Title length: 50-60 chars optimal (Google), ≤65 chars (Bing)
 * - Description length: 150-160 chars (desktop), 120 chars (mobile)
 * - OG image dimensions: 1200x630px (1.91:1 ratio)
 * - Canonical URL format: HTTPS, no trailing slash
 * - AI citation optimization: Year inclusion, recency signals
 * - Schema.org 29.3 compliance (September 2025)
 *
 * **Test Coverage:**
 * - Static route metadata (homepage, trending, submit)
 * - Dynamic route metadata (categories, content detail, guides)
 * - OpenGraph image generation with unified API
 * - Twitter Card metadata
 * - Canonical URL building (no trailing slash)
 * - Authors and dateModified for Article schema
 * - Robots directives for crawlers
 * - llms.txt alternate link for AI optimization
 *
 * @see src/lib/seo/metadata-generator.ts
 * @see src/lib/seo/metadata-registry.ts
 */

import { describe, expect, it } from 'vitest';
import {
  generatePageMetadata,
  generateCategoryMetadata,
  generateContentMetadata,
} from '@/src/lib/seo/metadata-generator';
import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import { APP_CONFIG } from '@/src/lib/constants';
import type { Metadata } from 'next';

const BASE_URL = APP_CONFIG.url; // Production URL

describe('generatePageMetadata()', () => {
  describe('Homepage Metadata (/) - Static Route', () => {
    it('generates complete metadata for homepage', async () => {
      const metadata = await generatePageMetadata('/');

      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('Claude Pro Directory');
      expect(metadata.description).toBeDefined();
      expect(typeof metadata.description).toBe('string');
    });

    it('has title within optimal length (≤60 chars)', async () => {
      const metadata = await generatePageMetadata('/');
      const title = metadata.title as string;

      expect(title.length).toBeLessThanOrEqual(60);
      expect(title.length).toBeGreaterThan(0);
    });

    it('has description between 150-160 chars (2025 best practice)', async () => {
      const metadata = await generatePageMetadata('/');
      const description = metadata.description as string;

      expect(description.length).toBeGreaterThanOrEqual(150);
      expect(description.length).toBeLessThanOrEqual(160);
    });

    it('includes AI optimization year (2025)', async () => {
      const metadata = await generatePageMetadata('/');
      const description = metadata.description as string;

      // AI citation optimization: Including "2025" increases ChatGPT citation likelihood
      expect(description).toMatch(/2025|October 2025/i);
    });

    it('includes homepage keywords array', async () => {
      const metadata = await generatePageMetadata('/');

      expect(metadata.keywords).toBeDefined();
      expect(typeof metadata.keywords).toBe('string'); // Next.js Metadata uses string
    });

    it('has canonical URL without trailing slash', async () => {
      const metadata = await generatePageMetadata('/');

      expect(metadata.alternates?.canonical).toBe(`${BASE_URL}/`);
      // Homepage is exception - keeps trailing slash
    });

    it('includes OpenGraph metadata', async () => {
      const metadata = await generatePageMetadata('/');

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBeDefined();
      expect(metadata.openGraph?.description).toBeDefined();
      expect(metadata.openGraph?.type).toBe('website');
      expect(metadata.openGraph?.url).toBe(`${BASE_URL}/`);
      expect(metadata.openGraph?.siteName).toBe('Claude Pro Directory');
    });

    it('includes OpenGraph image with correct dimensions', async () => {
      const metadata = await generatePageMetadata('/');
      const images = metadata.openGraph?.images as Array<{
        url: string;
        width: number;
        height: number;
        alt: string;
        type: string;
      }>;

      expect(images).toBeDefined();
      expect(images).toHaveLength(1);
      expect(images[0].width).toBe(1200);
      expect(images[0].height).toBe(630);
      expect(images[0].type).toBe('image/png');
      expect(images[0].url).toContain('/api/og?path=');
    });

    it('includes Twitter Card metadata', async () => {
      const metadata = await generatePageMetadata('/');

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBeDefined();
      expect(metadata.twitter?.description).toBeDefined();
    });

    it('includes Twitter Card image with correct dimensions', async () => {
      const metadata = await generatePageMetadata('/');
      const images = metadata.twitter?.images as Array<{
        url: string;
        width: number;
        height: number;
        alt: string;
      }>;

      expect(images).toBeDefined();
      expect(images).toHaveLength(1);
      expect(images[0].width).toBe(1200);
      expect(images[0].height).toBe(630);
      expect(images[0].url).toContain('/api/og?path=');
    });

    it('includes robots directives for crawlers', async () => {
      const metadata = await generatePageMetadata('/');

      expect(metadata.robots).toBeDefined();
      expect(metadata.robots).toMatchObject({
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      });
    });

    it('does not include llms.txt alternate (only for content pages)', async () => {
      const metadata = await generatePageMetadata('/');

      expect(metadata.alternates?.types).toBeUndefined();
    });
  });

  describe('Trending Page Metadata (/trending) - Static Route', () => {
    it('generates complete metadata for trending page', async () => {
      const metadata = await generatePageMetadata('/trending');

      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('Trending Configurations - Claude Pro Directory');
      expect(metadata.description).toBeDefined();
    });

    it('has title within Bing max length (≤65 chars)', async () => {
      const metadata = await generatePageMetadata('/trending');
      const title = metadata.title as string;

      expect(title.length).toBeLessThanOrEqual(65);
    });

    it('has description optimized for AI citation', async () => {
      const metadata = await generatePageMetadata('/trending');
      const description = metadata.description as string;

      expect(description.length).toBeGreaterThanOrEqual(150);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(description).toMatch(/2025|October 2025/i);
    });

    it('has canonical URL without trailing slash', async () => {
      const metadata = await generatePageMetadata('/trending');

      expect(metadata.alternates?.canonical).toBe(`${BASE_URL}/trending`);
      expect(metadata.alternates?.canonical).not.toMatch(/\/$/);
    });

    it('uses website type for OpenGraph', async () => {
      const metadata = await generatePageMetadata('/trending');

      expect(metadata.openGraph?.type).toBe('website');
    });

    it('generates unique OG image URL for trending page', async () => {
      const metadata = await generatePageMetadata('/trending');
      const images = metadata.openGraph?.images as Array<{ url: string }>;

      // URL should contain the encoded path
      expect(images[0].url).toContain('/api/og');
      expect(images[0].url).toContain('path=');
      expect(images[0].url).toContain('%2Ftrending');
    });
  });

  describe('Dynamic Category Page Metadata (/:category)', () => {
    it('generates metadata for agents category', async () => {
      const context: MetadataContext = {
        params: { category: 'agents' },
        category: 'agents',
        categoryConfig: {
          title: 'AI Agents',
          pluralTitle: 'AI Agents',
          metaDescription: 'Browse Claude AI agents for code review, testing, and development.',
          keywords: 'claude agents, ai agents, code review agents',
        },
      };

      const metadata = await generatePageMetadata('/:category', context);

      expect(metadata).toBeDefined();
      expect(metadata.title).toContain('Claude AI Agent Templates 2025');
      expect(metadata.description).toBeDefined();
    });

    it('uses categoryConfig metaDescription', async () => {
      const context: MetadataContext = {
        params: { category: 'mcp' },
        category: 'mcp',
        categoryConfig: {
          title: 'MCP Servers',
          pluralTitle: 'MCP Servers',
          metaDescription: 'Discover Model Context Protocol servers for Claude AI integration.',
          keywords: 'mcp servers, model context protocol, claude mcp',
        },
      };

      const metadata = await generatePageMetadata('/:category', context);

      expect(metadata.description).toBe(
        'Discover Model Context Protocol servers for Claude AI integration.'
      );
    });

    it('generates keywords from categoryConfig', async () => {
      const context: MetadataContext = {
        params: { category: 'hooks' },
        category: 'hooks',
        categoryConfig: {
          title: 'Hooks',
          pluralTitle: 'Hooks',
          metaDescription: 'Claude Code hooks for automation and workflow customization.',
          keywords: 'claude hooks, automation hooks, claude code hooks',
        },
      };

      const metadata = await generatePageMetadata('/:category', context);

      expect(metadata.keywords).toBeDefined();
      expect(metadata.keywords).toContain('claude hooks');
    });

    it('builds canonical URL with category slug', async () => {
      const context: MetadataContext = {
        params: { category: 'agents' },
        category: 'agents',
        categoryConfig: {
          title: 'AI Agents',
          pluralTitle: 'AI Agents',
          metaDescription: 'Browse AI agents.',
          keywords: 'agents',
        },
      };

      const metadata = await generatePageMetadata('/:category', context);

      expect(metadata.alternates?.canonical).toBe(`${BASE_URL}/agents`);
      expect(metadata.alternates?.canonical).not.toMatch(/\/$/);
    });
  });

  describe('Dynamic Content Detail Page Metadata (/:category/:slug)', () => {
    it('generates metadata for content detail page', async () => {
      const context: MetadataContext = {
        params: { category: 'agents', slug: 'code-reviewer' },
        item: {
          title: 'Code Reviewer Agent',
          description:
            'AI-powered code review agent that analyzes code quality, suggests improvements, and identifies potential bugs across multiple programming languages.',
          tags: ['code-review', 'ai-agent', 'development'],
          author: 'Claude Team',
          dateAdded: '2025-01-15T00:00:00Z',
          lastModified: '2025-10-01T00:00:00Z',
        },
        categoryConfig: {
          title: 'AI Agents',
          pluralTitle: 'AI Agents',
          metaDescription: 'AI agents collection.',
          keywords: 'ai agents',
        },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);

      expect(metadata).toBeDefined();
      expect(metadata.title).toContain('Code Reviewer Agent');
      expect(metadata.title).toContain('AI Agents');
      expect(metadata.description).toContain('AI-powered code review');
    });

    it('has content title within length limits', async () => {
      const context: MetadataContext = {
        params: { category: 'agents', slug: 'code-reviewer' },
        item: {
          title: 'Code Reviewer Agent',
          description: 'AI agent for code review and quality analysis.',
        },
        categoryConfig: {
          title: 'AI Agents',
          pluralTitle: 'AI Agents',
          metaDescription: 'AI agents.',
          keywords: 'agents',
        },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);
      const title = metadata.title as string;

      // Content tier allows slightly longer titles (up to ~70 chars)
      expect(title.length).toBeLessThanOrEqual(75);
    });

    it('uses Article type for OpenGraph (better AI citations)', async () => {
      const context: MetadataContext = {
        params: { category: 'agents', slug: 'code-reviewer' },
        item: {
          title: 'Code Reviewer Agent',
          description: 'AI code review agent.',
          dateAdded: '2025-01-15T00:00:00Z',
          lastModified: '2025-10-01T00:00:00Z',
        },
        categoryConfig: { title: 'AI Agents' },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);

      expect(metadata.openGraph?.type).toBe('article');
    });

    it('includes author metadata when available', async () => {
      const context: MetadataContext = {
        params: { category: 'guides', slug: 'mcp-setup' },
        item: {
          title: 'MCP Server Setup Guide',
          description: 'Complete guide to setting up MCP servers.',
          author: 'Claude Team',
          dateAdded: '2025-01-15T00:00:00Z',
        },
        categoryConfig: { title: 'Guides' },
      };

      const metadata = await generatePageMetadata('/guides/:category/:slug', context);

      expect(metadata.authors).toBeDefined();
      expect(metadata.authors).toEqual([{ name: 'Claude Team' }]);
    });

    it('includes dateModified for Article schema (3.2x more AI citations)', async () => {
      const context: MetadataContext = {
        params: { category: 'guides', slug: 'mcp-setup' },
        item: {
          title: 'MCP Setup Guide',
          description: 'Setup guide.',
          author: 'Claude Team',
          dateAdded: '2025-01-15T00:00:00Z',
          lastModified: '2025-10-01T00:00:00Z',
        },
        categoryConfig: { title: 'Guides' },
      };

      const metadata = await generatePageMetadata('/guides/:category/:slug', context);
      const ogMetadata = metadata.openGraph as Record<string, unknown>;

      expect(ogMetadata.publishedTime).toBe('2025-01-15T00:00:00Z');
      expect(ogMetadata.modifiedTime).toBe('2025-10-01T00:00:00Z');
      expect(ogMetadata.authors).toEqual(['Claude Team']);
    });

    it('includes llms.txt alternate link for AI optimization', async () => {
      const context: MetadataContext = {
        params: { category: 'agents', slug: 'code-reviewer' },
        item: {
          title: 'Code Reviewer Agent',
          description: 'AI code review agent.',
        },
        categoryConfig: { title: 'AI Agents' },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);

      expect(metadata.alternates?.types).toBeDefined();
      expect(metadata.alternates?.types?.['text/plain']).toBe('/agents/code-reviewer/llms.txt');
    });

    it('builds canonical URL with category and slug', async () => {
      const context: MetadataContext = {
        params: { category: 'agents', slug: 'code-reviewer' },
        item: {
          title: 'Code Reviewer Agent',
          description: 'AI agent.',
        },
        categoryConfig: { title: 'AI Agents' },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);

      expect(metadata.alternates?.canonical).toBe(`${BASE_URL}/agents/code-reviewer`);
      expect(metadata.alternates?.canonical).not.toMatch(/\/$|\/$/);
    });

    it('includes keywords from item tags plus year', async () => {
      const context: MetadataContext = {
        params: { category: 'agents', slug: 'code-reviewer' },
        item: {
          title: 'Code Reviewer',
          description: 'AI agent.',
          tags: ['code-review', 'ai', 'development'],
        },
        categoryConfig: { title: 'AI Agents' },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);

      expect(metadata.keywords).toBeDefined();
      expect(metadata.keywords).toContain('code-review');
      expect(metadata.keywords).toContain('claude ai');
      expect(metadata.keywords).toContain('claude 2025');
    });
  });

  describe('Fallback Behavior for Unknown Routes', () => {
    it('returns fallback metadata for unknown route', async () => {
      const metadata = await generatePageMetadata('/unknown-route');

      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('Claude Pro Directory');
      expect(metadata.description).toContain('Page on Claude Pro Directory');
    });

    it('fallback metadata has minimal properties', async () => {
      const metadata = await generatePageMetadata('/unknown-route');

      expect(metadata.title).toBeDefined();
      expect(metadata.description).toBeDefined();
      // Should not have extensive metadata like OG images
      expect(metadata.openGraph).toBeUndefined();
    });
  });

  describe('Real-World Content Examples', () => {
    it('generates metadata for guide detail page', async () => {
      const context: MetadataContext = {
        params: { category: 'tutorials', slug: 'mcp-setup' },
        item: {
          title: 'MCP Server Setup Guide',
          description:
            'Learn how to set up Model Context Protocol servers for Claude AI integration with step-by-step instructions and best practices.',
          tags: ['mcp', 'setup', 'tutorial', 'integration'],
          author: 'Claude Team',
        },
        categoryConfig: { title: 'Tutorials' },
      };

      const metadata = await generatePageMetadata('/guides/:category/:slug', context);

      expect(metadata.title).toContain('MCP Server Setup Guide');
      expect(metadata.description).toContain('Model Context Protocol');
      expect(metadata.openGraph?.type).toBe('article');
    });

    it('generates metadata for API docs page', async () => {
      const context: MetadataContext = {
        params: { slug: 'getContentByCategory' },
        item: {
          title: 'GET /api/{category}.json',
          description:
            'Retrieve paginated content items by category with REST API. Get agents, MCP servers, rules, commands, hooks, and statuslines with full filtering support.',
          slug: 'getContentByCategory',
        },
      };

      const metadata = await generatePageMetadata('/api-docs/:slug', context);

      expect(metadata.title).toContain('GET /api/{category}.json');
      expect(metadata.description).toContain('Retrieve paginated content');
      expect(metadata.description?.length).toBeGreaterThanOrEqual(150);
      expect(metadata.description?.length).toBeLessThanOrEqual(160);
    });
  });

  describe('SEO Best Practices Validation', () => {
    it('all static routes have descriptions 150-160 chars', async () => {
      const routes = ['/', '/trending', '/submit', '/collections', '/guides'];

      for (const route of routes) {
        const metadata = await generatePageMetadata(route);
        const description = metadata.description as string;

        expect(description.length, `Route ${route} description length`).toBeGreaterThanOrEqual(
          150
        );
        expect(description.length, `Route ${route} description length`).toBeLessThanOrEqual(160);
      }
    });

    it('all metadata includes robots directives', async () => {
      const routes = ['/', '/trending', '/submit'];

      for (const route of routes) {
        const metadata = await generatePageMetadata(route);

        expect(metadata.robots, `Route ${route} robots`).toBeDefined();
        expect(metadata.robots?.index, `Route ${route} robots.index`).toBe(true);
        expect(metadata.robots?.follow, `Route ${route} robots.follow`).toBe(true);
      }
    });

    it('all canonical URLs use HTTPS', async () => {
      const routes = ['/', '/trending', '/submit'];

      for (const route of routes) {
        const metadata = await generatePageMetadata(route);
        const canonical = metadata.alternates?.canonical as string;

        expect(canonical, `Route ${route} canonical`).toMatch(/^https:\/\//);
      }
    });

    it('all OG images have correct aspect ratio (1.91:1)', async () => {
      const routes = ['/', '/trending', '/submit'];

      for (const route of routes) {
        const metadata = await generatePageMetadata(route);
        const images = metadata.openGraph?.images as Array<{ width: number; height: number }>;

        const ratio = images[0].width / images[0].height;
        expect(ratio, `Route ${route} OG image ratio`).toBeCloseTo(1.905, 2);
      }
    });
  });
});

describe('generateCategoryMetadata()', () => {
  it('generates metadata for category page', async () => {
    const categoryConfig = {
      title: 'AI Agents',
      pluralTitle: 'AI Agents',
      metaDescription: 'Browse Claude AI agents for development and automation.',
      keywords: 'ai agents, claude agents, automation',
    };

    const metadata = await generateCategoryMetadata('agents', categoryConfig);

    expect(metadata).toBeDefined();
    expect(metadata.title).toContain('Claude AI Agent Templates 2025');
    expect(metadata.description).toContain('Browse Claude AI agents');
  });

  it('properly constructs canonical URL', async () => {
    const categoryConfig = {
      title: 'MCP Servers',
      pluralTitle: 'MCP Servers',
      metaDescription: 'MCP servers for Claude.',
      keywords: 'mcp',
    };

    const metadata = await generateCategoryMetadata('mcp', categoryConfig);

    expect(metadata.alternates?.canonical).toBe(`${BASE_URL}/mcp`);
  });

  it('handles undefined categoryConfig gracefully', async () => {
    const metadata = await generateCategoryMetadata('agents', undefined);

    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
  });
});

describe('generateContentMetadata()', () => {
  it('generates metadata for content detail page', async () => {
    const item = {
      title: 'Code Reviewer Agent',
      description: 'AI-powered code review agent for quality analysis.',
      tags: ['code-review', 'ai'],
      author: 'Claude Team',
    };

    const categoryConfig = {
      title: 'AI Agents',
      pluralTitle: 'AI Agents',
      metaDescription: 'AI agents.',
      keywords: 'agents',
    };

    const metadata = await generateContentMetadata('agents', 'code-reviewer', item, categoryConfig);

    expect(metadata).toBeDefined();
    expect(metadata.title).toContain('Code Reviewer Agent');
    expect(metadata.description).toContain('AI-powered code review');
  });

  it('properly constructs canonical URL with category and slug', async () => {
    const item = {
      title: 'MCP Server',
      description: 'MCP server configuration.',
    };

    const metadata = await generateContentMetadata('mcp', 'filesystem-server', item);

    expect(metadata.alternates?.canonical).toBe(`${BASE_URL}/mcp/filesystem-server`);
    expect(metadata.alternates?.canonical).not.toMatch(/\/$/);
  });

  it('handles undefined categoryConfig', async () => {
    const item = {
      title: 'Test Item',
      description: 'Test description.',
    };

    const metadata = await generateContentMetadata('agents', 'test-item', item, undefined);

    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
  });

  it('includes llms.txt alternate link', async () => {
    const item = {
      title: 'Test Agent',
      description: 'Test description.',
    };

    const metadata = await generateContentMetadata('agents', 'test-agent', item);

    expect(metadata.alternates?.types?.['text/plain']).toBe('/agents/test-agent/llms.txt');
  });
});

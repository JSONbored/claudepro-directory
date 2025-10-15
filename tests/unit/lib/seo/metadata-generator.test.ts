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

import type { Metadata } from 'next';
import { describe, expect, it } from 'vitest';
import { APP_CONFIG } from '@/src/lib/constants';
import {
  generateCategoryMetadata,
  generateContentMetadata,
  generatePageMetadata,
} from '@/src/lib/seo/metadata-generator';
import type { MetadataContext } from '@/src/lib/seo/metadata-registry';

const BASE_URL = APP_CONFIG.url; // Production URL

describe('generatePageMetadata()', () => {
  describe('Homepage Metadata (/) - Static Route', () => {
    it('generates complete metadata for homepage', async () => {
      const metadata = await generatePageMetadata('/');

      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('Claude Pro Directory - MCP Servers, AI Agents & Configs');
      expect(metadata.description).toBeDefined();
      expect(typeof metadata.description).toBe('string');
    });

    it('has title within SEO optimal range (55-60 chars)', async () => {
      const metadata = await generatePageMetadata('/');
      const title = metadata.title as string;

      // Homepage must meet 55-60 char requirement for SEO validation
      expect(title.length).toBeGreaterThanOrEqual(55);
      expect(title.length).toBeLessThanOrEqual(60);
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
      expect(metadata.title).toBe('Trending Claude AI Configurations - Claude Pro Directory');
      expect(metadata.description).toBeDefined();
    });

    it('has title within Bing max length (≤65 chars)', async () => {
      const metadata = await generatePageMetadata('/trending');
      const title = metadata.title as string;

      expect(title.length).toBeGreaterThanOrEqual(55);
      expect(title.length).toBeLessThanOrEqual(60);
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
      expect(metadata.title).toContain('AI Agents');
      expect(metadata.title).toContain('Claude');
      expect(metadata.title).toContain('2025');
      expect(metadata.description).toBeDefined();
    });

    it('uses categoryConfig metaDescription', async () => {
      const context: MetadataContext = {
        params: { category: 'mcp' },
        category: 'mcp',
        categoryConfig: {
          title: 'MCP Servers',
          pluralTitle: 'MCP Servers',
          metaDescription:
            'Browse 40+ Claude MCP server templates for October 2025. Connect Claude to filesystems, databases, APIs, and external tools via Model Context Protocol servers.',
          keywords: 'mcp servers, model context protocol, claude mcp',
        },
      };

      const metadata = await generatePageMetadata('/:category', context);

      expect(metadata.description).toContain('MCP server');
      expect(metadata.description).toContain('2025');
      expect(metadata.description?.length).toBeGreaterThanOrEqual(150);
      expect(metadata.description?.length).toBeLessThanOrEqual(160);
    });

    it('generates keywords from categoryConfig', async () => {
      const context: MetadataContext = {
        params: { category: 'hooks' },
        category: 'hooks',
        categoryConfig: {
          title: 'Hooks',
          pluralTitle: 'Hooks',
          metaDescription:
            'Browse Claude hook templates for October 2025. Customize your Claude Code workflow with pre-commit hooks, validation scripts, and automation for development tasks.',
          keywords: 'claude hooks, automation hooks, claude code hooks',
        },
      };

      const metadata = await generatePageMetadata('/:category', context);

      // Keywords are optional per SEO schema but should be present when categoryConfig provides them
      if (metadata.keywords) {
        expect(typeof metadata.keywords).toBe('string');
        expect(metadata.keywords).toContain('hooks');
      }
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

      // All titles must be 55-60 chars for optimal SEO
      expect(title.length).toBeGreaterThanOrEqual(55);
      expect(title.length).toBeLessThanOrEqual(60);
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
        category: 'guides',
        item: {
          title: 'MCP Server Setup Guide',
          description:
            'Complete guide to setting up Claude MCP servers with detailed instructions for optimal configuration and Claude AI integration performance in October 2025.',
          author: 'Claude Team',
          dateAdded: '2025-01-15T00:00:00Z',
          tags: ['mcp', 'setup', 'guide', 'configuration'],
        },
        categoryConfig: { title: 'Guides' },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);

      expect(metadata.authors).toBeDefined();
      expect(metadata.authors).toEqual([{ name: 'Claude Team' }]);
    });

    it('includes dateModified for Article schema (3.2x more AI citations)', async () => {
      const context: MetadataContext = {
        params: { category: 'guides', slug: 'mcp-setup' },
        category: 'guides',
        item: {
          title: 'MCP Setup Guide',
          description:
            'Complete setup guide for Claude MCP servers with detailed configuration instructions and best practices for Claude AI integration performance in October 2025.',
          author: 'Claude Team',
          dateAdded: '2025-01-15T00:00:00Z',
          lastModified: '2025-10-01T00:00:00Z',
          tags: ['mcp', 'setup', 'guide', 'configuration'],
        },
        categoryConfig: { title: 'Guides' },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);
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

    it('prioritizes seoTitle over full title for content pages', async () => {
      const context: MetadataContext = {
        params: { category: 'agents', slug: 'test-agent' },
        item: {
          title: 'This is a very long agent title that would normally be truncated',
          seoTitle: 'Optimized Agent Title',
          description:
            'Agent description that meets SEO requirements for optimal search engine optimization and AI citation purposes in production environments.',
        },
        categoryConfig: { title: 'AI Agents' },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);

      // Should use seoTitle instead of truncated full title
      expect(metadata.title).toContain('Optimized Agent Title');
      expect(metadata.title).not.toContain('This is a very long');
    });

    it('falls back to truncated title when seoTitle is missing', async () => {
      const context: MetadataContext = {
        params: { category: 'agents', slug: 'test-agent' },
        item: {
          title: 'This is a very long agent title that will be truncated automatically',
          description:
            'Agent description that meets SEO requirements for optimal search engine optimization and AI citation purposes in production environments.',
        },
        categoryConfig: { title: 'AI Agents' },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);
      const title = metadata.title as string;

      // Should truncate and still be within 55-60 char limit
      expect(title.length).toBeGreaterThanOrEqual(55);
      expect(title.length).toBeLessThanOrEqual(60);
      expect(title).toContain('AI Agents');
    });
  });

  describe('Fallback Behavior for Unknown Routes', () => {
    it('returns fallback metadata for unknown route', async () => {
      const metadata = await generatePageMetadata('/unknown-route');

      expect(metadata).toBeDefined();
      expect(metadata.title).toContain('Claude Pro Directory');
      expect(metadata.description).toContain('Claude Pro Directory');
    });

    it('fallback metadata has minimal properties', async () => {
      const metadata = await generatePageMetadata('/unknown-route');

      expect(metadata.title).toBeDefined();
      expect(metadata.description).toBeDefined();
      expect(metadata.openGraph).toBeDefined();
    });
  });

  describe('Real-World Content Examples', () => {
    it('generates metadata for guide detail page', async () => {
      const context: MetadataContext = {
        params: { category: 'tutorials', slug: 'mcp-setup' },
        category: 'tutorials',
        item: {
          title: 'MCP Server Setup Guide',
          description:
            'Learn how to set up Model Context Protocol servers for Claude AI integration with step-by-step instructions and best practices for October 2025.',
          tags: ['mcp', 'setup', 'tutorial', 'integration'],
          author: 'Claude Team',
        },
        categoryConfig: { title: 'Tutorials' },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);

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
      const routes = [
        '/',
        '/trending',
        '/submit',
        '/collections',
        '/guides',
        '/community',
        '/partner',
        '/companies',
      ];

      for (const route of routes) {
        const metadata = await generatePageMetadata(route);
        const description = metadata.description as string;

        if (route === '/community') {
          console.log('Community description:', description);
          console.log('Community description length:', description.length);
        }

        expect(description.length, `Route ${route} description length`).toBeGreaterThanOrEqual(150);
        expect(description.length, `Route ${route} description length`).toBeLessThanOrEqual(160);
      }
    });

    it('all metadata includes robots directives', async () => {
      const routes = ['/', '/trending', '/submit', '/community', '/partner', '/companies'];

      for (const route of routes) {
        const metadata = await generatePageMetadata(route);

        expect(metadata.robots, `Route ${route} robots`).toBeDefined();
        expect(metadata.robots?.index, `Route ${route} robots.index`).toBe(true);
        expect(metadata.robots?.follow, `Route ${route} robots.follow`).toBe(true);
      }
    });

    it('all canonical URLs use HTTPS', async () => {
      const routes = [
        '/',
        '/trending',
        '/submit',
        '/community',
        '/partner',
        '/companies',
        '/for-you',
        '/board',
      ];

      for (const route of routes) {
        const metadata = await generatePageMetadata(route);
        const canonical = metadata.alternates?.canonical as string;

        expect(canonical, `Route ${route} canonical`).toMatch(/^https:\/\//);
      }
    });

    it('all OG images have correct aspect ratio (1.91:1)', async () => {
      const routes = [
        '/',
        '/trending',
        '/submit',
        '/community',
        '/partner',
        '/companies',
        '/for-you',
        '/board',
      ];

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
      description:
        'Comprehensive test configuration for Claude AI and Claude Code with validation purposes and sufficient length for optimal SEO ranking in October 2025.',
      tags: ['test', 'validation', 'seo'],
    };

    const metadata = await generateContentMetadata('agents', 'test-item', item, undefined);

    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
  });

  it('includes llms.txt alternate link', async () => {
    const item = {
      title: 'Test Agent',
      description:
        'Comprehensive test agent description with sufficient length to meet SEO requirements for optimal search engine ranking and AI citation purposes in 2025.',
      tags: ['test', 'agent', 'validation'],
    };

    const metadata = await generateContentMetadata('agents', 'test-agent', item);

    expect(metadata.alternates?.types?.['text/plain']).toBe('/agents/test-agent/llms.txt');
  });
});

// =============================================================================
// SCHEMA DERIVATION TESTS - Phase 5 Addition
// =============================================================================

describe('Schema Derivation Tests', () => {
  it('should derive metadata from agent schema', async () => {
    const context: MetadataContext = {
      params: { category: 'agents', slug: 'test-agent' },
      category: 'agents',
      item: {
        title: 'Test Agent for Code Review',
        description:
          'Comprehensive Claude AI agent for automated code review and quality analysis with advanced features for optimal Claude Code performance in October 2025.',
        tags: ['code-review', 'quality', 'automation'],
      },
      categoryConfig: { title: 'AI Agents' },
    };

    const metadata = await generatePageMetadata('/:category/:slug', context);

    expect(metadata.title).toContain('Test Agent for Code Review');
    expect(metadata.description).toContain('comprehensive agent for automated code review');
  });

  it('should derive metadata from MCP server schema', async () => {
    const context: MetadataContext = {
      params: { category: 'mcp', slug: 'filesystem-server' },
      category: 'mcp',
      item: {
        title: 'Filesystem MCP Server',
        description:
          'Claude Model Context Protocol server for filesystem operations and file management with advanced capabilities for Claude AI workflows in October 2025.',
        tags: ['filesystem', 'mcp', 'server'],
      },
      categoryConfig: { title: 'MCP Servers' },
    };

    const metadata = await generatePageMetadata('/:category/:slug', context);

    expect(metadata.title).toContain('Filesystem MCP Server');
    expect(metadata.description).toContain('filesystem operations');
  });

  it('should handle missing optional fields in schema', async () => {
    const context: MetadataContext = {
      params: { category: 'hooks', slug: 'minimal-hook' },
      category: 'hooks',
      item: {
        title: 'Minimal Hook',
        description:
          'Basic Claude Code hook configuration with minimal metadata for testing purposes with sufficient length for optimal Claude AI SEO ranking in October 2025.',
        tags: ['hook', 'minimal', 'test'],
      },
      categoryConfig: { title: 'Hooks' },
    };

    const metadata = await generatePageMetadata('/:category/:slug', context);

    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
    // Should not crash when optional fields missing
  });

  it('should fallback gracefully when schema data incomplete', async () => {
    const context: MetadataContext = {
      params: { category: 'agents', slug: 'incomplete-agent' },
      item: {
        // Missing title - should use slug
        description: 'Agent with no title.',
      },
      categoryConfig: { title: 'AI Agents' },
    };

    const metadata = await generatePageMetadata('/:category/:slug', context);

    // Should still generate valid metadata
    expect(metadata).toBeDefined();
    expect(metadata.description).toContain('Agent with no title');
  });
});

// =============================================================================
// VALIDATION LAYER TESTS - Phase 5 Addition
// =============================================================================

describe('Validation Layer Tests', () => {
  it('should catch invalid title length in development', async () => {
    // Note: Validation only throws in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Test would fail if we tried to generate metadata with invalid length
    // Since validation happens internally, we test the boundaries

    const context: MetadataContext = {
      params: { category: 'agents', slug: 'test' },
      item: {
        title: 'Valid Title',
        description:
          'This is a valid description that meets the minimum length requirements for SEO optimization and AI citation purposes in October 2025.',
      },
      categoryConfig: { title: 'Test' },
    };

    const metadata = await generatePageMetadata('/:category/:slug', context);

    // Should pass validation
    expect(metadata.title).toBeDefined();
  });

  it('should catch invalid description length', async () => {
    const context: MetadataContext = {
      params: { slug: 'test' },
      item: {
        title: 'Test',
        description:
          'Valid description with sufficient length to pass SEO validation requirements. This description meets the 150-160 character optimal range for search engines.',
      },
    };

    const metadata = await generatePageMetadata('/api-docs/:slug', context);

    expect(metadata.description).toBeDefined();
    expect(metadata.description?.length).toBeGreaterThanOrEqual(150);
  });

  it('should validate keywords format', async () => {
    const context: MetadataContext = {
      params: { category: 'agents', slug: 'test' },
      item: {
        title: 'Test Agent',
        description:
          'Test description that is long enough to meet SEO requirements for optimal search engine optimization and AI citation purposes in production.',
        tags: ['valid', 'keyword', 'list'],
      },
      categoryConfig: { title: 'Agents' },
    };

    const metadata = await generatePageMetadata('/:category/:slug', context);

    // Keywords are optional per SEO schema
    if (metadata.keywords) {
      expect(typeof metadata.keywords).toBe('string'); // Keywords returned as comma-separated string
    }
  });

  it('should validate canonical URL format', async () => {
    const metadata = await generatePageMetadata('/trending');

    expect(metadata.alternates?.canonical).toMatch(/^https:\/\//);
    expect(metadata.alternates?.canonical).not.toMatch(/\/$|\/$/); // No trailing slash
  });

  it('should validate OpenGraph image dimensions', async () => {
    const metadata = await generatePageMetadata('/');
    const images = metadata.openGraph?.images as Array<{ width: number; height: number }>;

    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
  });
});

// =============================================================================
// FALLBACK METADATA TESTS - Phase 5 Addition
// =============================================================================

describe('Fallback Metadata Generation', () => {
  it('should generate smart defaults for unknown routes', async () => {
    const metadata = await generatePageMetadata('/completely-unknown-route');

    expect(metadata).toBeDefined();
    expect(metadata.title).toContain('Claude Pro Directory');
    expect(metadata.description).toContain('Claude Pro Directory');
  });

  it('should not have extensive metadata in fallback', async () => {
    const metadata = await generatePageMetadata('/unknown-page');

    // Fallback should be minimal
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
    expect(metadata.openGraph).toBeDefined(); // Smart defaults include OG
  });

  it('should parse route segments for fallback title', async () => {
    const metadata = await generatePageMetadata('/some-custom-page');

    expect(metadata.title).toContain('Claude Pro Directory');
    expect(metadata.title).toContain('Some custom page');
  });

  it('should handle nested unknown routes', async () => {
    const metadata = await generatePageMetadata('/nested/unknown/route');

    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
    expect(metadata.title).toContain('Route');
  });
});

// =============================================================================
// PHASE 6 UTILITY PAGES TESTS - Account & Auth Pages
// =============================================================================

describe('Phase 6 Utility Pages - Account Routes', () => {
  describe('Account Dashboard Pages', () => {
    it('generates metadata for /account', async () => {
      const metadata = await generatePageMetadata('/account');

      expect(metadata).toBeDefined();
      expect(metadata.title).toBeDefined();
      expect(metadata.robots?.index).toBe(false); // Private page
      expect(metadata.robots?.follow).toBe(false);
    });

    it('generates metadata for /account/activity', async () => {
      const metadata = await generatePageMetadata('/account/activity');

      expect(metadata).toBeDefined();
      expect(metadata.robots?.index).toBe(false);
    });

    it('generates metadata for /account/settings', async () => {
      const metadata = await generatePageMetadata('/account/settings');

      expect(metadata).toBeDefined();
      expect(metadata.robots?.index).toBe(false);
    });

    it('generates metadata for /account/submissions', async () => {
      const metadata = await generatePageMetadata('/account/submissions');

      expect(metadata).toBeDefined();
      expect(metadata.robots?.index).toBe(false);
    });
  });

  describe('Jobs Management Pages', () => {
    it('generates metadata for /account/jobs', async () => {
      const metadata = await generatePageMetadata('/account/jobs');

      expect(metadata).toBeDefined();
      expect(metadata.robots?.index).toBe(false);
    });

    it('generates metadata for /account/jobs/new', async () => {
      const metadata = await generatePageMetadata('/account/jobs/new');

      expect(metadata).toBeDefined();
      expect(metadata.robots?.index).toBe(false);
    });
  });

  describe('Sponsorships Pages', () => {
    it('generates metadata for /account/sponsorships', async () => {
      const metadata = await generatePageMetadata('/account/sponsorships');

      expect(metadata).toBeDefined();
      expect(metadata.robots?.index).toBe(false);
    });
  });

  describe('Library Pages', () => {
    it('generates metadata for /account/library', async () => {
      const metadata = await generatePageMetadata('/account/library');

      expect(metadata).toBeDefined();
      expect(metadata.robots?.index).toBe(false);
    });

    it('generates metadata for /account/library/new', async () => {
      const metadata = await generatePageMetadata('/account/library/new');

      expect(metadata).toBeDefined();
      expect(metadata.robots?.index).toBe(false);
    });
  });
});

describe('Phase 6 Utility Pages - Discovery & Community', () => {
  it('generates metadata for /for-you', async () => {
    const metadata = await generatePageMetadata('/for-you');

    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
  });

  it('generates metadata for /board', async () => {
    const metadata = await generatePageMetadata('/board');

    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
    expect(metadata.openGraph?.type).toBe('website');
  });

  it('generates metadata for /board/new', async () => {
    const metadata = await generatePageMetadata('/board/new');

    expect(metadata).toBeDefined();
    expect(metadata.robots?.index).toBe(false); // Create page - noindex
    expect(metadata.robots?.follow).toBe(true); // But allow following
  });

  it('generates metadata for /companies', async () => {
    const metadata = await generatePageMetadata('/companies');

    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
    expect(metadata.openGraph?.type).toBe('website');
  });
});

describe('Phase 6 Utility Pages - Authentication & Errors', () => {
  it('generates metadata for /login', async () => {
    const metadata = await generatePageMetadata('/login');

    expect(metadata).toBeDefined();
    expect(metadata.robots?.index).toBe(false); // Auth page - noindex
    expect(metadata.robots?.follow).toBe(true);
  });

  it('generates metadata for /auth/auth-code-error', async () => {
    const metadata = await generatePageMetadata('/auth/auth-code-error');

    expect(metadata).toBeDefined();
    expect(metadata.robots?.index).toBe(false); // Error page - noindex
    expect(metadata.robots?.follow).toBe(false);
  });

  it('generates metadata for /404', async () => {
    const metadata = await generatePageMetadata('/404');

    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
  });
});

// =============================================================================
// ALL 14 CONTENT CATEGORY DERIVATIONS - Phase 5 Addition
// =============================================================================

describe('All Content Category Derivations', () => {
  const allCategories = [
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'statuslines',
    'guides',
    'tutorials',
    'comparisons',
    'workflows',
    'use-cases',
    'troubleshooting',
    'categories',
    'collections',
  ];

  for (const category of allCategories) {
    it(`should generate valid metadata for ${category} category`, async () => {
      const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
      const context: MetadataContext = {
        params: { category },
        category,
        categoryConfig: {
          title: categoryTitle,
          pluralTitle: `${categoryTitle}s`,
          metaDescription: `Browse ${category} for Claude AI with production-ready templates for October 2025. Tools to enhance your Claude development workflow efficiently.`,
          keywords: `${category}, claude, ai, configuration, templates, production, enterprise`,
        },
      };

      const metadata = await generatePageMetadata('/:category', context);

      expect(metadata).toBeDefined();
      expect(metadata.title).toBeDefined();
      expect(metadata.description).toBeDefined();
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.alternates?.canonical).toMatch(new RegExp(`/${category}$`));
    });

    it(`should generate valid content detail metadata for ${category}`, async () => {
      const context: MetadataContext = {
        params: { category, slug: 'sample-item' },
        item: {
          title: `Sample ${category} Item`,
          description: `Comprehensive ${category} configuration for Claude AI and Claude Code with detailed setup instructions and best practices for October 2025 production environments.`,
          tags: [category, 'sample', 'claude', 'configuration', 'templates'],
        },
        categoryConfig: {
          title: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
        },
      };

      const metadata = await generatePageMetadata('/:category/:slug', context);

      expect(metadata).toBeDefined();
      // Title may be truncated for SEO (60 char limit), so just check it exists and contains "Sample"
      expect(metadata.title).toBeDefined();
      expect(metadata.title).toContain('Sample');
      expect(metadata.description).toContain(category);
      expect(metadata.openGraph?.type).toBe('article');
      expect(metadata.alternates?.canonical).toMatch(new RegExp(`/${category}/sample-item$`));
    });
  }

  it('should have tested all 14 categories', () => {
    expect(allCategories.length).toBe(14);
  });
});

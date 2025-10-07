import { existsSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
// Import directly from metadata files for build-time usage (not runtime lazy loaders)
import { agentsMetadata } from '../generated/agents-metadata.js';
import { collectionsMetadata } from '../generated/collections-metadata.js';
import { commandsMetadata } from '../generated/commands-metadata.js';
import { hooksMetadata } from '../generated/hooks-metadata.js';
import { mcpMetadata } from '../generated/mcp-metadata.js';
import { rulesMetadata } from '../generated/rules-metadata.js';
import { statuslinesMetadata } from '../generated/statuslines-metadata.js';
import { parseChangelog } from '../src/lib/changelog/parser.js';
import { APP_CONFIG, CONTENT_PATHS, MAIN_CONTENT_CATEGORIES } from '../src/lib/constants';
import { logger } from '../src/lib/logger.js';
import type { ContentItem } from '../src/lib/schemas/content/content-item-union.schema';

// Define SitemapUrl type locally
interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

// Always use production URL for sitemap
const baseUrl = APP_CONFIG.url;

async function generateSitemap(): Promise<string> {
  // Use generated content directly instead of static API files

  const urls: SitemapUrl[] = [];

  // Homepage
  urls.push({
    loc: baseUrl || '',
    lastmod: new Date().toISOString().split('T')[0] || '',
    changefreq: 'daily',
    priority: 1.0,
  });

  // Category pages
  const categories = [...MAIN_CONTENT_CATEGORIES];
  categories.forEach((category) => {
    urls.push({
      loc: `${baseUrl || ''}/${category}`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'daily',
      priority: 0.8,
    });
  });

  // Static pages
  const staticPages = [
    'jobs',
    'community',
    'trending',
    'submit',
    'partner',
    'guides',
    'api-docs',
    'changelog',
  ];
  staticPages.forEach((page) => {
    urls.push({
      loc: `${baseUrl || ''}/${page}`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: page === 'changelog' ? 'daily' : 'weekly',
      priority: page === 'api-docs' ? 0.9 : page === 'changelog' ? 0.85 : 0.6, // High priority for changelog (recency signals)
    });
  });

  // Tools pages - Interactive tools for community value
  const toolPages = ['tools/config-recommender'];
  toolPages.forEach((page) => {
    urls.push({
      loc: `${baseUrl || ''}/${page}`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'monthly', // Static tool landing page
      priority: 0.8, // High priority - valuable interactive feature
    });
  });

  // Static page llms.txt routes (api-docs, guides, and tools)
  const staticPagesWithLlmsTxt = ['api-docs', 'guides', 'tools/config-recommender'];
  staticPagesWithLlmsTxt.forEach((page) => {
    urls.push({
      loc: `${baseUrl || ''}/${page}/llms.txt`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'daily',
      priority: 0.85, // High priority for AI discovery
    });
  });

  // Guide pages from content/guides/ directory
  const seoCategories = [
    'use-cases',
    'tutorials',
    'collections',
    'categories',
    'workflows',
    'comparisons',
    'troubleshooting',
  ] as const;
  seoCategories.forEach((category) => {
    const seoDir = join(CONTENT_PATHS.guides, category);
    if (existsSync(seoDir)) {
      try {
        const files = readdirSync(seoDir).filter((f) => f.endsWith('.mdx'));
        files.forEach((file) => {
          const slug = file.replace('.mdx', '');
          urls.push({
            loc: `${baseUrl || ''}/guides/${category}/${slug}`,
            lastmod: new Date().toISOString().split('T')[0] || '',
            changefreq: 'monthly',
            priority: 0.65,
          });
        });
      } catch {
        // Directory doesn't exist yet
      }
    }
  });

  // Changelog entries
  try {
    const changelog = await parseChangelog();
    changelog.entries.forEach((entry) => {
      urls.push({
        loc: `${baseUrl}/changelog/${entry.slug}`,
        lastmod: entry.date,
        changefreq: 'monthly', // Changelog entries rarely change after publication
        priority: 0.7, // High priority for recent updates
      });
    });

    // Changelog RSS/Atom feeds (for feed aggregators)
    urls.push(
      {
        loc: `${baseUrl}/changelog/rss.xml`,
        lastmod: changelog.entries[0]?.date || new Date().toISOString().split('T')[0] || '',
        changefreq: 'daily',
        priority: 0.8,
      },
      {
        loc: `${baseUrl}/changelog/atom.xml`,
        lastmod: changelog.entries[0]?.date || new Date().toISOString().split('T')[0] || '',
        changefreq: 'daily',
        priority: 0.8,
      }
    );
  } catch {
    logger.warn('Failed to parse changelog for sitemap, skipping changelog entries');
  }

  // Individual content pages (excluding collections - they're added separately)
  const allContent: ContentItem[] = [
    ...rulesMetadata,
    ...mcpMetadata,
    ...agentsMetadata,
    ...commandsMetadata,
    ...hooksMetadata,
    ...statuslinesMetadata,
  ];

  // Add non-collection content items (139 items)
  allContent.forEach((item) => {
    urls.push({
      loc: `${baseUrl}/${item.category}/${item.slug}`,
      lastmod: (item.dateAdded || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // Add collection pages separately (9 collections)
  collectionsMetadata.forEach((collection) => {
    urls.push({
      loc: `${baseUrl}/collections/${collection.slug}`,
      lastmod: (collection.dateAdded || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // ============================================================================
  // LLMs.txt Routes - AI-Optimized Plain Text Content (185 URLs)
  // ============================================================================

  // Site-wide llms.txt index
  urls.push({
    loc: `${baseUrl}/llms.txt`,
    lastmod: new Date().toISOString().split('T')[0] || '',
    changefreq: 'daily',
    priority: 0.9, // High priority for AI discovery
  });

  // Category llms.txt indexes (7 categories)
  categories.forEach((category) => {
    urls.push({
      loc: `${baseUrl}/${category}/llms.txt`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'daily',
      priority: 0.85,
    });
  });

  // Individual item llms.txt pages (139 non-collection items)
  allContent.forEach((item) => {
    urls.push({
      loc: `${baseUrl}/${item.category}/${item.slug}/llms.txt`,
      lastmod: (item.dateAdded || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'daily',
      priority: 0.75,
    });
  });

  // Guide llms.txt pages
  seoCategories.forEach((category) => {
    const seoDir = join(CONTENT_PATHS.guides, category);
    if (existsSync(seoDir)) {
      try {
        const files = readdirSync(seoDir).filter((f) => f.endsWith('.mdx'));
        files.forEach((file) => {
          const slug = file.replace('.mdx', '');
          urls.push({
            loc: `${baseUrl}/guides/${category}/${slug}/llms.txt`,
            lastmod: new Date().toISOString().split('T')[0] || '',
            changefreq: 'weekly',
            priority: 0.7,
          });
        });
      } catch {
        // Directory doesn't exist yet
      }
    }
  });

  // Collection llms.txt pages (9 collections)
  collectionsMetadata.forEach((collection) => {
    urls.push({
      loc: `${baseUrl}/collections/${collection.slug}/llms.txt`,
      lastmod: (collection.dateAdded || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.75,
    });
  });

  // Changelog llms.txt routes (for AI discovery)
  try {
    const changelog = await parseChangelog();

    // Main changelog llms.txt index
    urls.push({
      loc: `${baseUrl}/changelog/llms.txt`,
      lastmod: changelog.entries[0]?.date || new Date().toISOString().split('T')[0] || '',
      changefreq: 'daily',
      priority: 0.85, // High priority for AI discovery
    });

    // Individual changelog entry llms.txt pages
    changelog.entries.forEach((entry) => {
      urls.push({
        loc: `${baseUrl}/changelog/${entry.slug}/llms.txt`,
        lastmod: entry.date,
        changefreq: 'weekly',
        priority: 0.75,
      });
    });
  } catch {
    logger.warn('Failed to parse changelog for llms.txt routes, skipping');
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return xml;
}

/**
 * Generate production-optimized robots.txt with AI crawler support
 *
 * Modern 2025 Implementation:
 * - Explicit allowlists for AI crawlers (GPTBot, PerplexityBot, ClaudeBot)
 * - RFC 9727 api-catalog discovery enabled
 * - OpenAPI 3.1.0 spec indexed
 * - Respects crawler best practices (crawl-delay, clear directives)
 *
 * AI Crawler Strategy:
 * - GPTBot (OpenAI): No JavaScript execution, needs static HTML
 * - PerplexityBot: Own index, follows robots.txt strictly
 * - ClaudeBot (Anthropic): Similar to GPTBot, static content only
 *
 * @returns Production-ready robots.txt content
 */
function generateRobotsTxt(): string {
  const robotsTxt = `# Robots.txt for ${APP_CONFIG.name}
# ${APP_CONFIG.url}/robots.txt

# ============================================================================
# AI CRAWLER CONFIGURATION (OpenAI GPTBot, Perplexity, Claude, etc.)
# ============================================================================

# OpenAI GPTBot - ChatGPT Search & Training Data Collection
User-agent: GPTBot
Allow: /
Allow: /api-docs
Allow: /openapi.json
Allow: /.well-known/api-catalog
Allow: /llms.txt
Allow: /*/llms.txt
Allow: /*/*/llms.txt

# OpenAI SearchBot - ChatGPT Browse Feature
User-agent: OAI-SearchBot
Allow: /
Allow: /api-docs
Allow: /openapi.json
Allow: /llms.txt
Allow: /*/llms.txt
Allow: /*/*/llms.txt

# ChatGPT User - Direct ChatGPT User Queries
User-agent: ChatGPT-User
Allow: /
Allow: /api-docs
Allow: /openapi.json
Allow: /llms.txt
Allow: /*/llms.txt
Allow: /*/*/llms.txt

# Perplexity AI - Perplexity Search Engine
User-agent: PerplexityBot
Allow: /
Allow: /api-docs
Allow: /openapi.json
Allow: /.well-known/api-catalog
Allow: /changelog
Allow: /changelog/*
Allow: /changelog/rss.xml
Allow: /changelog/atom.xml
Allow: /llms.txt
Allow: /*/llms.txt
Allow: /*/*/llms.txt

# Anthropic Claude - ClaudeBot Crawler
User-agent: ClaudeBot
Allow: /
Allow: /api-docs
Allow: /openapi.json
Allow: /.well-known/api-catalog
Allow: /llms.txt
Allow: /*/llms.txt
Allow: /*/*/llms.txt

# Google Gemini - Google AI Crawler
User-agent: Google-Extended
Allow: /
Allow: /api-docs
Allow: /openapi.json
Allow: /llms.txt
Allow: /*/llms.txt
Allow: /*/*/llms.txt

# ============================================================================
# GENERAL CRAWLERS (Search Engines, Social Media, etc.)
# ============================================================================

User-agent: *
Allow: /

# Important content pages
Allow: /agents*
Allow: /mcp*
Allow: /rules*
Allow: /commands*
Allow: /hooks*
Allow: /statuslines*
Allow: /guides*
Allow: /trending*
Allow: /community*
Allow: /jobs*
Allow: /tools*

# API Documentation & Discovery (RFC 9727, OpenAPI 3.1)
Allow: /api-docs*
Allow: /api-docs-static.html
Allow: /openapi.json
Allow: /.well-known/api-catalog

# API endpoints (allow for better indexing of JSON-LD structured data)
Allow: /api/*

# LLMs.txt AI-optimized plain text content (185 endpoints)
Allow: /llms.txt
Allow: /*/llms.txt
Allow: /*/*/llms.txt

# Block admin areas if they exist
Disallow: /admin*
Disallow: /private*

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml`;

  return robotsTxt;
}

async function main() {
  try {
    logger.progress('Generating sitemap...');
    const sitemap = await generateSitemap();
    writeFileSync('public/sitemap.xml', sitemap, 'utf-8');
    logger.success('Sitemap generated successfully');

    logger.progress('Generating robots.txt...');
    const robotsTxt = generateRobotsTxt();
    writeFileSync('public/robots.txt', robotsTxt, 'utf-8');
    logger.success('Robots.txt generated successfully');

    logger.log(`Generated ${sitemap.match(/<url>/g)?.length || 0} URLs in sitemap`);
  } catch (error) {
    logger.failure(
      `Failed to generate sitemap/robots.txt: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

// Run if this file is executed directly
main().catch((error: unknown) => {
  console.error('Failed to generate sitemap:', error);
  process.exit(1);
});

export { generateSitemap };

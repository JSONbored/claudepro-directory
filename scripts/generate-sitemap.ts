import { writeFileSync } from 'fs';
// Import directly from metadata files for build-time usage (not runtime lazy loaders)
import { agentsMetadata } from '../generated/agents-metadata.js';
import { collectionsMetadata } from '../generated/collections-metadata.js';
import { commandsMetadata } from '../generated/commands-metadata.js';
import { hooksMetadata } from '../generated/hooks-metadata.js';
import { mcpMetadata } from '../generated/mcp-metadata.js';
import { rulesMetadata } from '../generated/rules-metadata.js';
import { statuslinesMetadata } from '../generated/statuslines-metadata.js';
import {
  generateAllSiteUrls,
  logUrlStatistics,
  type SitemapUrl,
} from '../src/lib/build/url-generator.js';
import { APP_CONFIG } from '../src/lib/constants';
import { logger } from '../src/lib/logger.js';

// Always use production URL for sitemap
const baseUrl = APP_CONFIG.url;

async function generateSitemap(): Promise<string> {
  // Use centralized URL generator
  const urls: SitemapUrl[] = await generateAllSiteUrls(
    {
      agentsMetadata,
      collectionsMetadata,
      commandsMetadata,
      hooksMetadata,
      mcpMetadata,
      rulesMetadata,
      statuslinesMetadata,
    },
    {
      baseUrl,
      includeGuides: true,
      includeChangelog: true,
      includeLlmsTxt: true,
      includeTools: true,
    }
  );

  // Log statistics for monitoring
  logUrlStatistics(urls);

  // Sort URLs alphabetically for better organization and git diffs
  const sortedUrls = urls.sort((a, b) => a.loc.localeCompare(b.loc));

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sortedUrls
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
  logger.failure(
    `Failed to generate sitemap: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});

export { generateSitemap };

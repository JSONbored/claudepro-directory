/**
 * Centralized URL Generation Module
 *
 * Single source of truth for generating all site URLs used in:
 * - Sitemap generation (sitemap.xml)
 * - IndexNow submission
 * - Any future URL-dependent features
 *
 * Benefits:
 * - Eliminates 220 lines of duplication between sitemap/indexnow scripts
 * - Ensures URL consistency across all SEO-related features
 * - Single place to update when adding/removing routes
 * - Type-safe URL generation with full validation
 *
 * @module lib/build/url-generator
 */

// Using pre-generated metadata only - no file system operations
import type { ChangelogMetadata } from '@/generated/changelog-metadata';
import type { GuideMetadata } from '@/generated/guides-metadata';
import { guidesMetadata } from '@/generated/guides-metadata';
import type { JobMetadata } from '@/generated/jobs-metadata';
import { APP_CONFIG, MAIN_CONTENT_CATEGORIES } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
// Supabase not needed - removed runtime queries for build performance
// import { createClient as createAdminClient } from '@/src/lib/supabase/admin-client';

/**
 * Sitemap URL interface matching sitemap.xml specification
 */
export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

/**
 * Metadata required for URL generation
 *
 * NOTE: Uses minimal metadata types from generated files (Pick<> subsets for performance)
 * All metadata exports include: slug (required), category/dateAdded (optional, varies by type)
 *
 * Updated: Now includes all 11 categories (agents, changelog, collections, commands,
 * guides, hooks, jobs, mcp, rules, skills, statuslines)
 *
 * Field variations:
 * - Standard content (agents, mcp, etc.): slug, category, dateAdded
 * - Changelog: slug, dateAdded (no category - uses special routing)
 * - Guides: slug, category, subcategory, dateAdded
 * - Jobs: slug, posted_at (no category or dateAdded - from Supabase)
 */
export interface UrlGeneratorMetadata {
  agentsMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  changelogMetadata: ChangelogMetadata[]; // Uses generated type (slug, title, description, dateAdded)
  collectionsMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  commandsMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  guidesMetadata: GuideMetadata[]; // Uses generated type (includes subcategory)
  hooksMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  jobsMetadata: JobMetadata[]; // Uses generated type (Supabase schema with id, posted_at, etc.)
  mcpMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  rulesMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  skillsMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  statuslinesMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
}

/**
 * Configuration for URL generation
 */
export interface UrlGeneratorConfig {
  baseUrl?: string;
  includeGuides?: boolean;
  includeChangelog?: boolean;
  includeLlmsTxt?: boolean;
  includeTools?: boolean;
}

/**
 * Generate all site URLs for sitemap/indexnow
 *
 * @param metadata - Content metadata from generated files
 * @param config - Optional configuration to control URL generation
 * @returns Array of sitemap URLs with metadata
 */
export async function generateAllSiteUrls(
  metadata: UrlGeneratorMetadata,
  config: UrlGeneratorConfig = {}
): Promise<SitemapUrl[]> {
  const {
    baseUrl = APP_CONFIG.url,
    includeGuides = true,
    includeChangelog = true,
    includeLlmsTxt = true,
    includeTools = true,
  } = config;

  const urls: SitemapUrl[] = [];
  const currentDate = new Date().toISOString().split('T')[0] || '';

  // ============================================================================
  // CORE PAGES
  // ============================================================================

  // Homepage (highest priority)
  urls.push({
    loc: baseUrl || '',
    lastmod: currentDate,
    changefreq: 'daily',
    priority: 1.0,
  });

  // ============================================================================
  // CATEGORY PAGES
  // ============================================================================

  const categories = [...MAIN_CONTENT_CATEGORIES];
  categories.forEach((category) => {
    urls.push({
      loc: `${baseUrl || ''}/${category}`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8,
    });
  });

  // ============================================================================
  // STATIC PAGES
  // ============================================================================

  const staticPages = [
    { path: 'jobs', priority: 0.6, changefreq: 'weekly' as const },
    { path: 'community', priority: 0.6, changefreq: 'weekly' as const },
    { path: 'trending', priority: 0.6, changefreq: 'weekly' as const },
    { path: 'submit', priority: 0.6, changefreq: 'weekly' as const },
    { path: 'partner', priority: 0.6, changefreq: 'weekly' as const },
    { path: 'guides', priority: 0.6, changefreq: 'weekly' as const },
    { path: 'companies', priority: 0.6, changefreq: 'weekly' as const },
    { path: 'board', priority: 0.5, changefreq: 'daily' as const },
    { path: 'changelog', priority: 0.85, changefreq: 'daily' as const }, // High priority for recency signals
  ];

  staticPages.forEach((page) => {
    urls.push({
      loc: `${baseUrl || ''}/${page.path}`,
      lastmod: currentDate,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  // ============================================================================
  // TOOLS PAGES (Interactive Features)
  // ============================================================================

  if (includeTools) {
    const toolPages = ['tools/config-recommender'];
    toolPages.forEach((page) => {
      urls.push({
        loc: `${baseUrl || ''}/${page}`,
        lastmod: currentDate,
        changefreq: 'monthly', // Static tool landing page
        priority: 0.8, // High priority - valuable interactive feature
      });
    });
  }

  // ============================================================================
  // LLMS.TXT ROUTES (AI Discovery)
  // ============================================================================

  if (includeLlmsTxt) {
    // Static page llms.txt routes
    const staticPagesWithLlmsTxt = ['guides', 'tools/config-recommender'];
    staticPagesWithLlmsTxt.forEach((page) => {
      urls.push({
        loc: `${baseUrl || ''}/${page}/llms.txt`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.85, // High priority for AI discovery
      });
    });

    // Site-wide llms.txt index
    urls.push({
      loc: `${baseUrl}/llms.txt`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.9, // Highest priority for AI discovery
    });

    // Category llms.txt indexes
    categories.forEach((category) => {
      urls.push({
        loc: `${baseUrl}/${category}/llms.txt`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.85,
      });
    });
  }

  // ============================================================================
  // GUIDE PAGES (SEO Content)
  // ============================================================================

  if (includeGuides) {
    // Use pre-generated metadata instead of file system scanning
    guidesMetadata.forEach((guide) => {
      // Guide page
      urls.push({
        loc: `${baseUrl || ''}/guides/${guide.subcategory}/${guide.slug}`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: 0.65,
      });

      // Guide llms.txt (if enabled)
      if (includeLlmsTxt) {
        urls.push({
          loc: `${baseUrl || ''}/guides/${guide.subcategory}/${guide.slug}/llms.txt`,
          lastmod: currentDate,
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
    });
  }

  // ============================================================================
  // CHANGELOG ENTRIES
  // ============================================================================

  if (includeChangelog) {
    try {
      // Use pre-generated metadata instead of parsing at runtime
      metadata.changelogMetadata.forEach((entry: ChangelogMetadata) => {
        urls.push({
          loc: `${baseUrl}/changelog/${entry.slug}`,
          lastmod: entry.dateAdded?.split('T')[0] || currentDate,
          changefreq: 'monthly', // Changelog entries rarely change after publication
          priority: 0.7, // High priority for recent updates
        });
      });

      // Changelog RSS/Atom feeds (for feed aggregators)
      const latestEntryDate =
        metadata.changelogMetadata[0]?.dateAdded?.split('T')[0] || currentDate;
      urls.push(
        {
          loc: `${baseUrl}/changelog/rss.xml`,
          lastmod: latestEntryDate,
          changefreq: 'daily',
          priority: 0.8,
        },
        {
          loc: `${baseUrl}/changelog/atom.xml`,
          lastmod: latestEntryDate,
          changefreq: 'daily',
          priority: 0.8,
        }
      );

      // Changelog llms.txt routes (if enabled)
      if (includeLlmsTxt) {
        // Main changelog llms.txt index
        urls.push({
          loc: `${baseUrl}/changelog/llms.txt`,
          lastmod: latestEntryDate,
          changefreq: 'daily',
          priority: 0.85, // High priority for AI discovery
        });

        // Individual changelog entry llms.txt pages
        metadata.changelogMetadata.forEach((entry: ChangelogMetadata) => {
          urls.push({
            loc: `${baseUrl}/changelog/${entry.slug}/llms.txt`,
            lastmod: entry.dateAdded?.split('T')[0] || currentDate,
            changefreq: 'weekly',
            priority: 0.75,
          });
        });
      }
    } catch (error) {
      logger.warn('Failed to parse changelog for URL generation, skipping changelog entries', {
        error: error instanceof Error ? error.message : String(error),
        type: 'url_generation',
      });
    }
  }

  // ============================================================================
  // CONTENT ITEMS (Agents, MCP, Rules, Commands, Hooks, Statuslines)
  // ============================================================================

  const allContent = [
    ...metadata.rulesMetadata,
    ...metadata.mcpMetadata,
    ...metadata.agentsMetadata,
    ...metadata.commandsMetadata,
    ...metadata.hooksMetadata,
    ...metadata.statuslinesMetadata,
    ...metadata.skillsMetadata,
  ];

  // Add non-collection content items
  allContent.forEach((item) => {
    urls.push({
      loc: `${baseUrl}/${item.category}/${item.slug}`,
      lastmod: (item.dateAdded || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // Individual item llms.txt pages (if enabled)
  if (includeLlmsTxt) {
    allContent.forEach((item) => {
      urls.push({
        loc: `${baseUrl}/${item.category}/${item.slug}/llms.txt`,
        lastmod: (item.dateAdded || new Date().toISOString()).split('T')[0] || '',
        changefreq: 'daily',
        priority: 0.75,
      });
    });
  }

  // ============================================================================
  // COLLECTION PAGES
  // ============================================================================

  // Add collection pages separately
  metadata.collectionsMetadata.forEach((collection) => {
    urls.push({
      loc: `${baseUrl}/collections/${collection.slug}`,
      lastmod: (collection.dateAdded || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // Collection llms.txt pages (if enabled)
  if (includeLlmsTxt) {
    metadata.collectionsMetadata.forEach((collection) => {
      urls.push({
        loc: `${baseUrl}/collections/${collection.slug}/llms.txt`,
        lastmod: (collection.dateAdded || new Date().toISOString()).split('T')[0] || '',
        changefreq: 'weekly',
        priority: 0.75,
      });
    });
  }

  // ============================================================================
  // COMPARISON PAGES (SEO Content)
  // ============================================================================

  if (includeGuides) {
    // Use pre-generated metadata for comparison guides
    const comparisonGuides = guidesMetadata.filter((guide) => guide.subcategory === 'comparisons');

    comparisonGuides.forEach((guide) => {
      urls.push({
        loc: `${baseUrl}/compare/${guide.slug}`,
        lastmod: currentDate,
        changefreq: 'monthly', // SEO content - stable after publication
        priority: 0.7, // High priority - valuable comparison content
      });
    });
  }

  // ============================================================================
  // JOB LISTINGS (Dynamic Content)
  // ============================================================================

  try {
    // Use pre-generated metadata instead of fetching from Supabase at runtime
    metadata.jobsMetadata.forEach((job) => {
      urls.push({
        loc: `${baseUrl}/jobs/${job.slug}`,
        lastmod: job.posted_at?.split('T')[0] || currentDate,
        changefreq: 'weekly', // Job listings may update (remote/salary changes)
        priority: 0.65,
      });
    });
  } catch (error) {
    logger.warn('Failed to fetch jobs for sitemap generation, skipping job pages', {
      error: error instanceof Error ? error.message : String(error),
      type: 'url_generation',
    });
  }

  // ============================================================================
  // PUBLIC USER PROFILES (Community Content)
  // ============================================================================

  // Skip Supabase queries during build - mock client causes timeouts
  // User profiles are dynamic and don't need to be in build-time sitemap

  // ============================================================================
  // PUBLIC USER COLLECTIONS (User-Curated Content)
  // ============================================================================

  // Skip Supabase queries during build - mock client causes timeouts
  // User collections are dynamic and don't need to be in build-time sitemap

  return urls;
}

/**
 * Extract just the URL strings from sitemap URLs
 * Useful for IndexNow submission which only needs the URLs
 *
 * @param sitemapUrls - Array of sitemap URLs
 * @returns Array of URL strings
 */
export function extractUrlStrings(sitemapUrls: SitemapUrl[]): string[] {
  return sitemapUrls.map((url) => url.loc);
}

/**
 * Log URL generation statistics
 *
 * @param urls - Generated URLs
 */
export function logUrlStatistics(urls: SitemapUrl[]): void {
  const criticalCount = urls.filter((u) => u.priority >= 0.9).length;
  const highCount = urls.filter((u) => u.priority >= 0.7 && u.priority < 0.9).length;
  const mediumCount = urls.filter((u) => u.priority >= 0.5 && u.priority < 0.7).length;
  const lowCount = urls.filter((u) => u.priority < 0.5).length;
  const dailyCount = urls.filter((u) => u.changefreq === 'daily').length;
  const weeklyCount = urls.filter((u) => u.changefreq === 'weekly').length;
  const monthlyCount = urls.filter((u) => u.changefreq === 'monthly').length;
  const llmsTxtCount = urls.filter((u) => u.loc.endsWith('/llms.txt')).length;

  logger.info('URL generation complete', {
    total: urls.length,
    critical: criticalCount,
    high: highCount,
    medium: mediumCount,
    low: lowCount,
    daily: dailyCount,
    weekly: weeklyCount,
    monthly: monthlyCount,
    llmsTxt: llmsTxtCount,
  });
}

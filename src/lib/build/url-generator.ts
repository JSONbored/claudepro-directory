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

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseChangelog } from '@/src/lib/changelog/parser';
import { APP_CONFIG, CONTENT_PATHS, MAIN_CONTENT_CATEGORIES } from '@/src/lib/constants';
import { getJobs } from '@/src/lib/data/jobs';
import { logger } from '@/src/lib/logger';
import { createClient as createAdminClient } from '@/src/lib/supabase/admin-client';

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
 * All metadata exports include: slug, category, dateAdded (at minimum)
 */
export interface UrlGeneratorMetadata {
  agentsMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  collectionsMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  commandsMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  hooksMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  mcpMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  rulesMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  statuslinesMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
  skillsMetadata: Array<{ slug: string; category: string; dateAdded?: string }>;
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
    { path: 'api-docs', priority: 0.9, changefreq: 'weekly' as const }, // High priority for developer docs
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
    const staticPagesWithLlmsTxt = ['api-docs', 'guides', 'tools/config-recommender'];
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

            // Guide page
            urls.push({
              loc: `${baseUrl || ''}/guides/${category}/${slug}`,
              lastmod: currentDate,
              changefreq: 'monthly',
              priority: 0.65,
            });

            // Guide llms.txt (if enabled)
            if (includeLlmsTxt) {
              urls.push({
                loc: `${baseUrl || ''}/guides/${category}/${slug}/llms.txt`,
                lastmod: currentDate,
                changefreq: 'weekly',
                priority: 0.7,
              });
            }
          });
        } catch {
          // Directory doesn't exist yet - this is expected for new installations
          logger.debug(`Guide category directory not found: ${category}`, {
            path: seoDir,
            type: 'url_generation',
          });
        }
      }
    });
  }

  // ============================================================================
  // CHANGELOG ENTRIES
  // ============================================================================

  if (includeChangelog) {
    try {
      const changelog = await parseChangelog();

      // Individual changelog entries
      changelog.entries.forEach((entry) => {
        urls.push({
          loc: `${baseUrl}/changelog/${entry.slug}`,
          lastmod: entry.date,
          changefreq: 'monthly', // Changelog entries rarely change after publication
          priority: 0.7, // High priority for recent updates
        });
      });

      // Changelog RSS/Atom feeds (for feed aggregators)
      const latestEntryDate = changelog.entries[0]?.date || currentDate;
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
        changelog.entries.forEach((entry) => {
          urls.push({
            loc: `${baseUrl}/changelog/${entry.slug}/llms.txt`,
            lastmod: entry.date,
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
    const comparisonsDir = join(CONTENT_PATHS.guides, 'comparisons');
    if (existsSync(comparisonsDir)) {
      try {
        const files = readdirSync(comparisonsDir).filter((f) => f.endsWith('.mdx'));
        files.forEach((file) => {
          const slug = file.replace('.mdx', '');

          urls.push({
            loc: `${baseUrl}/compare/${slug}`,
            lastmod: currentDate,
            changefreq: 'monthly', // SEO content - stable after publication
            priority: 0.7, // High priority - valuable comparison content
          });
        });
      } catch {
        // Directory doesn't exist yet - no comparisons to add
        logger.debug('Comparisons directory not found, skipping comparison pages', {
          path: comparisonsDir,
          type: 'url_generation',
        });
      }
    }
  }

  // ============================================================================
  // JOB LISTINGS (Dynamic Content)
  // ============================================================================

  try {
    const jobs = await getJobs();
    jobs.forEach((job) => {
      urls.push({
        loc: `${baseUrl}/jobs/${job.slug}`,
        lastmod: job.postedAt?.split('T')[0] || job.dateAdded,
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

  try {
    const supabase = await createAdminClient();
    const { data: publicUsers } = await supabase
      .from('users')
      .select('slug, updated_at')
      .eq('public', true);

    (publicUsers || []).forEach((user) => {
      urls.push({
        loc: `${baseUrl}/u/${user.slug}`,
        lastmod: user.updated_at?.split('T')[0] || currentDate,
        changefreq: 'weekly',
        priority: 0.5,
      });
    });
  } catch (error) {
    logger.warn('Failed to fetch public users for sitemap generation, skipping user profiles', {
      error: error instanceof Error ? error.message : String(error),
      type: 'url_generation',
    });
  }

  // ============================================================================
  // PUBLIC USER COLLECTIONS (User-Curated Content)
  // ============================================================================

  try {
    const supabase = await createAdminClient();
    const { data: publicCollections } = await supabase
      .from('user_collections')
      .select('slug, updated_at, users!inner(slug)')
      .eq('is_public', true);

    (publicCollections || []).forEach((collection) => {
      // Type assertion: Supabase join returns nested object
      const userSlug = (collection.users as { slug: string } | null)?.slug;
      if (userSlug) {
        urls.push({
          loc: `${baseUrl}/u/${userSlug}/collections/${collection.slug}`,
          lastmod: collection.updated_at?.split('T')[0] || currentDate,
          changefreq: 'weekly',
          priority: 0.5,
        });
      }
    });
  } catch (error) {
    logger.warn(
      'Failed to fetch public collections for sitemap generation, skipping user collections',
      {
        error: error instanceof Error ? error.message : String(error),
        type: 'url_generation',
      }
    );
  }

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

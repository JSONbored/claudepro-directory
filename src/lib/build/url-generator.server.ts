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
import {
  APP_CONFIG,
  CONTENT_PATHS,
  MAIN_CONTENT_CATEGORIES,
  SITEMAP_CONFIG,
} from '@/src/lib/constants';
import { getAllContent } from '@/src/lib/content/supabase-content-loader';
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
 * Metadata fields required for URL generation
 *
 * NOTE: Now uses Supabase content_items directly via getAllContent()
 * All content items have: slug, category, dateAdded (from JSONB data field)
 *
 * Replaced: UrlGeneratorMetadata interface (11 metadata arrays)
 * With: Direct database queries via getAllContent() - Single source of truth
 */

/**
 * Configuration for URL generation
 */
export interface UrlGeneratorConfig {
  baseUrl?: string;
  includeGuides?: boolean;
  includeChangelog?: boolean;
  includeLlmsTxt?: boolean;
  includeTools?: boolean;
  includeAutodiscoveredRoutes?: boolean; // NEW: Enable automated route discovery
}

// ============================================================================
// AUTOMATED ROUTE DISCOVERY
// ============================================================================

/**
 * Check if route matches any exclusion pattern
 *
 * Supports wildcards (*) and exact matches.
 * Patterns like "/account/*" match "/account/settings", "/account/library", etc.
 */
function matchesExclusionPattern(route: string, pattern: string): boolean {
  // Remove route groups from route (e.g., "(auth)/login" -> "/login")
  const cleanRoute = route.replace(/\([^)]+\)\//g, '');

  // Exact match
  if (pattern === cleanRoute) return true;

  // Wildcard matching
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/\*/g, '.*') // * becomes .*
      .replace(/\//g, '\\/'); // Escape forward slashes
    return new RegExp(`^${regexPattern}$`).test(cleanRoute);
  }

  return false;
}

/**
 * Discover all routes from app directory
 *
 * Scans for page.tsx files and extracts route paths.
 * Excludes route groups (folders with parentheses).
 *
 * @returns Array of discovered route paths (e.g., ["/", "/trending", "/ph-bundle"])
 */
function discoverAppRoutes(): string[] {
  const appDir = join(process.cwd(), 'src', 'app');
  const routes: string[] = [];

  function scanDirectory(dir: string, routePath = ''): void {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip route groups (folders with parentheses)
          if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
            // Scan inside route group but don't add to path
            scanDirectory(fullPath, routePath);
            continue;
          }

          // Skip dynamic segments for now (handled separately)
          if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
            continue;
          }

          // Recursively scan subdirectory
          const newPath = `${routePath}/${entry.name}`;
          scanDirectory(fullPath, newPath);
        } else if (entry.name === 'page.tsx') {
          // Found a page route
          const route = routePath || '/';
          routes.push(route);
        }
      }
    } catch (error) {
      logger.warn(`Failed to scan directory ${dir}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  scanDirectory(appDir);
  return routes.sort();
}

/**
 * Generate URLs for user profiles
 *
 * Queries Supabase for public user profiles.
 */
async function generateUserProfileUrls(
  baseUrl: string,
  priority: number,
  changefreq: SitemapUrl['changefreq']
): Promise<SitemapUrl[]> {
  try {
    const supabase = await createAdminClient();

    const { data: users, error } = await supabase
      .from('users')
      .select('slug, updated_at')
      .eq('public', true)
      .not('slug', 'is', null);

    if (error) {
      logger.error('Failed to fetch user profiles for sitemap', error);
      return [];
    }

    if (!users || users.length === 0) {
      logger.info('No public user profiles found for sitemap');
      return [];
    }

    const urls = users.map((user) => ({
      loc: `${baseUrl}/u/${user.slug}`,
      lastmod: user.updated_at || new Date().toISOString(),
      changefreq,
      priority,
    }));

    logger.info(`Generated ${urls.length} user profile URLs`);
    return urls;
  } catch (error) {
    logger.error(
      'Error generating user profile URLs',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Generate URLs for comparison pages
 *
 * Reads comparison JSON files from content/guides/comparisons/
 */
async function generateComparisonUrls(
  baseUrl: string,
  priority: number,
  changefreq: SitemapUrl['changefreq']
): Promise<SitemapUrl[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const comparisonsDir = path.join(process.cwd(), 'content', 'guides', 'comparisons');

    // Check if directory exists
    try {
      await fs.access(comparisonsDir);
    } catch {
      return []; // Directory doesn't exist yet
    }

    const files = await fs.readdir(comparisonsDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    return jsonFiles.map((file) => ({
      loc: `${baseUrl}/compare/${file.replace('.json', '')}`,
      lastmod: new Date().toISOString(),
      changefreq,
      priority,
    }));
  } catch (error) {
    logger.error(
      'Error generating comparison URLs',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get priority for route based on configuration
 */
function getRoutePriority(route: string): number {
  for (const [pattern, priority] of Object.entries(SITEMAP_CONFIG.priorityOverrides)) {
    if (pattern === route || matchesExclusionPattern(route, pattern)) {
      return priority;
    }
  }
  return 0.5; // Default priority
}

/**
 * Get changefreq for route based on configuration
 */
function getRouteChangefreq(route: string): SitemapUrl['changefreq'] {
  for (const [pattern, changefreq] of Object.entries(SITEMAP_CONFIG.changefreqOverrides)) {
    if (pattern === route || matchesExclusionPattern(route, pattern)) {
      return changefreq;
    }
  }
  return 'weekly'; // Default changefreq
}

/**
 * Generate all site URLs for sitemap/indexnow
 *
 * @param config - Optional configuration to control URL generation
 * @returns Array of sitemap URLs with metadata
 *
 * NOTE: Now fetches content directly from Supabase instead of generated metadata files
 */
export async function generateAllSiteUrls(config: UrlGeneratorConfig = {}): Promise<SitemapUrl[]> {
  const {
    baseUrl = APP_CONFIG.url,
    includeGuides = true,
    includeChangelog = true,
    includeLlmsTxt = true,
    includeAutodiscoveredRoutes = true, // Enable by default
  } = config;

  const urls: SitemapUrl[] = [];
  const currentDate = new Date().toISOString().split('T')[0] || '';

  // ============================================================================
  // AUTOMATED ROUTE DISCOVERY (NEW - Configuration-Driven)
  // ============================================================================

  if (includeAutodiscoveredRoutes) {
    logger.info('Starting automated route discovery...');

    // Discover all routes from app directory
    const discoveredRoutes = discoverAppRoutes();
    logger.info(`Discovered ${discoveredRoutes.length} routes from app directory`);

    // Filter out excluded routes
    const includedRoutes = discoveredRoutes.filter((route) => {
      const isExcluded = SITEMAP_CONFIG.excludePatterns.some((pattern) =>
        matchesExclusionPattern(route, pattern)
      );
      return !isExcluded;
    });

    logger.info(
      `Included ${includedRoutes.length} routes after exclusion filtering (excluded ${discoveredRoutes.length - includedRoutes.length})`
    );

    // Add all included routes with configuration-based priority/changefreq
    includedRoutes.forEach((route) => {
      urls.push({
        loc: `${baseUrl || ''}${route}`,
        lastmod: currentDate,
        changefreq: getRouteChangefreq(route),
        priority: getRoutePriority(route),
      });
    });

    // Add dynamic routes (user profiles, comparisons)
    try {
      const [userProfiles, comparisons] = await Promise.all([
        generateUserProfileUrls(
          baseUrl || APP_CONFIG.url,
          getRoutePriority('/u/*'),
          getRouteChangefreq('/u/*')
        ),
        generateComparisonUrls(
          baseUrl || APP_CONFIG.url,
          getRoutePriority('/compare/*'),
          getRouteChangefreq('/compare/*')
        ),
      ]);

      urls.push(...userProfiles, ...comparisons);
      logger.info(
        `Added ${userProfiles.length} user profiles and ${comparisons.length} comparison pages`
      );
    } catch (error) {
      logger.error(
        'Failed to generate dynamic routes',
        error instanceof Error ? error : new Error(String(error))
      );
    }

    logger.info(`Total URLs from automated discovery: ${urls.length}`);
  }

  // ============================================================================
  // LEGACY CONTENT GENERATION (Keep for content detail pages)
  // ============================================================================

  const categories = [...MAIN_CONTENT_CATEGORIES];
  // Note: Static pages (homepage, categories, legal, contact, etc.)
  // are now handled by automated route discovery above.
  // This section only handles content detail pages (agents/slug, mcp/slug, etc.)

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
  // CONTENT ITEMS (All Categories from Supabase)
  // ============================================================================

  // Fetch all content from Supabase (single query with ISR cache)
  const allContent = await getAllContent();

  // Add all content item pages
  allContent.forEach((item) => {
    urls.push({
      loc: `${baseUrl}/${item.category}/${item.slug}`,
      lastmod: (item.date_added || new Date().toISOString()).split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // Individual item llms.txt pages (if enabled)
  if (includeLlmsTxt) {
    allContent.forEach((item) => {
      urls.push({
        loc: `${baseUrl}/${item.category}/${item.slug}/llms.txt`,
        lastmod: (item.date_added || new Date().toISOString()).split('T')[0] || '',
        changefreq: 'daily',
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
        lastmod: job.posted_at?.split('T')[0] || job.date_added,
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

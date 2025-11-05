import { unstable_cache } from 'next/cache';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
/**
 * Database-first sitemap/llms URL generation.
 * Pulls canonical routes from `mv_site_urls` materialized view via RPC.
 */

import { createClient as createAdminClient } from '@/src/lib/supabase/admin-client';

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const SITE_URL_CACHE_TAG = 'site-urls';
const SITE_URL_CACHE_SECONDS = 60 * 60; // 1 hour (2025 best practice - faster updates)

interface SiteUrlRow {
  path: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}

// Stale cache fallback - serves last good data if database unavailable
let _staleCache: SiteUrlRow[] | null = null;

const fetchSiteUrls = unstable_cache(
  async (): Promise<SiteUrlRow[]> => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.rpc('get_site_urls');

    if (error) {
      logger.error('Failed to fetch site URLs from Supabase', error);

      // Return stale cache if available (graceful degradation)
      if (_staleCache && _staleCache.length > 0) {
        logger.warn('Returning stale cache due to database error', {
          cachedUrlCount: _staleCache.length,
        });
        return _staleCache;
      }

      throw new Error(`Failed to fetch site URLs: ${error.message}`);
    }

    const urls = (data ?? []) as SiteUrlRow[];

    // Update stale cache on successful fetch
    _staleCache = urls;

    return urls;
  },
  ['get-site-urls'],
  {
    revalidate: SITE_URL_CACHE_SECONDS,
    tags: [SITE_URL_CACHE_TAG],
  }
);

export async function generateAllSiteUrls(
  config: { baseUrl?: string } = {}
): Promise<SitemapUrl[]> {
  try {
    const rows = await fetchSiteUrls();
    const baseUrl = config.baseUrl ?? APP_CONFIG.url;

    return rows.map((row) => {
      const normalizedPath = row.path.startsWith('/') ? row.path : `/${row.path}`;
      const parsedDate = new Date(row.lastmod ?? Date.now());
      const lastmodIso = Number.isNaN(parsedDate.getTime())
        ? new Date().toISOString()
        : parsedDate.toISOString();

      return {
        loc: `${baseUrl}${normalizedPath}`,
        lastmod: lastmodIso,
        changefreq: (row.changefreq as SitemapUrl['changefreq']) ?? 'weekly',
        priority: Number(row.priority ?? 0.5),
      } satisfies SitemapUrl;
    });
  } catch (error) {
    logger.error(
      'Failed to generate site URLs from mv_site_urls, falling back to []',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

export function extractUrlStrings(sitemapUrls: SitemapUrl[]): string[] {
  return sitemapUrls.map((url) => url.loc);
}

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

export { SITE_URL_CACHE_TAG, SITE_URL_CACHE_SECONDS };

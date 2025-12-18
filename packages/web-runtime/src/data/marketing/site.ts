'use server';

import { env } from '@heyclaude/shared-runtime/schemas/env';

import { logger } from '../../logger.ts';
import { getContentCount } from '../content/index.ts';
import { generateResourceTags } from '../cached-data-factory.ts';

const DESCRIPTION_FALLBACK =
  'Open-source directory of Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.';

const HERO_DEFAULTS = {
  monthlyPageViews: 16_000,
  monthlyVisitors: 3000,
};

const VERCEL_ANALYTICS_TOKEN = (env as Record<string, unknown>)['VERCEL_WEB_ANALYTICS_TOKEN'] as
  | string
  | undefined;
const VERCEL_PROJECT_ID =
  ((env as Record<string, unknown>)['VERCEL_PROJECT_ID'] as string | undefined) ??
  ((env as Record<string, unknown>)['NEXT_PUBLIC_VERCEL_PROJECT_ID'] as string | undefined);

interface VisitorStats {
  monthlyPageViews: number;
  monthlyVisitors: number;
}

interface VercelAnalyticsResponse {
  pageViews?: {
    value?: number | string;
  };
  visitors?: {
    value?: number | string;
  };
}

/**
 * Get visitor stats from Vercel Analytics
 *
 * Uses 'use cache' to cache visitor statistics.
 * This data is public and same for all users, so it can be cached at build time.
 * Visitor stats change hourly, so we use the 'hours' cacheLife profile.
 
 * @returns {unknown} Description of return value*/
async function getVisitorStats(): Promise<VisitorStats> {
  'use cache';
  const { cacheLife, cacheTag } = await import('next/cache');
  cacheLife('long'); // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  const tags = generateResourceTags('marketing', undefined, ['visitor-stats']);
  for (const tag of tags) {
    cacheTag(tag);
  }

  // Create request-scoped child logger - do not mutate shared logger in cached function
  const requestLogger = logger.child({
    module: 'data/marketing/site',
    operation: 'getVisitorStats',
  });

  if (!VERCEL_ANALYTICS_TOKEN || !VERCEL_PROJECT_ID) {
    return HERO_DEFAULTS;
  }

  const now = Date.now();
  const to = new Date(now);
  const from = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const url = new URL(`https://api.vercel.com/v2/insights/${VERCEL_PROJECT_ID}/analytics`);
  url.searchParams.set('from', from.toISOString());
  url.searchParams.set('to', to.toISOString());

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${VERCEL_ANALYTICS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel analytics error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as VercelAnalyticsResponse;
    return {
      monthlyPageViews: Number(data.pageViews?.value ?? HERO_DEFAULTS.monthlyPageViews),
      monthlyVisitors: Number(data.visitors?.value ?? HERO_DEFAULTS.monthlyVisitors),
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    requestLogger.warn(
      {
        err: errorForLogging,
        fallbackStrategy: 'defaults',
        source: 'vercel-analytics-api',
      },
      'Visitor stats fetch failed, using defaults'
    );
    return HERO_DEFAULTS;
  }
}

/**
 * Get content description copy with count
 * Uses 'use cache' to cache the description. This data is public and same for all users.
 * Content description changes periodically, so we use the 'half' cacheLife profile.
 */
export async function getContentDescriptionCopy(): Promise<string> {
  'use cache';

  const { cacheLife } = await import('next/cache');

  // Configure cache - use 'static' profile for optimal SEO (1 day stale, 6hr revalidate, 30 days expire)
  const { cacheTag } = await import('next/cache');
  cacheLife('long'); // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  const tags = generateResourceTags('marketing', undefined, ['content-description']);
  for (const tag of tags) {
    cacheTag(tag);
  }

  // Create request-scoped child logger to avoid race conditions
  const requestLogger = logger.child({
    module: 'data/marketing/site',
    operation: 'getContentDescriptionCopy',
  });

  try {
    const count = await getContentCount(undefined);
    return `Open-source directory of ${count}+ Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.`;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    requestLogger.error(
      { err: errorForLogging },
      'MarketingSite: failed to build content description'
    );
    return DESCRIPTION_FALLBACK;
  }
}

export interface PartnerHeroStats {
  configurationCount: number;
  monthlyPageViews: number;
  monthlyVisitors: number;
}

/**
 * Get partner hero stats (configuration count and visitor stats)
 * Uses 'use cache' to cache hero stats. This data is public and same for all users.
 * Hero stats change periodically, so we use the 'half' cacheLife profile.
 */
export async function getPartnerHeroStats(): Promise<PartnerHeroStats> {
  'use cache';

  const { cacheLife } = await import('next/cache');

  // Configure cache - use 'stable' profile for optimal SEO (6hr stale, 1hr revalidate, 7 days expire)
  const { cacheTag } = await import('next/cache');
  cacheLife('long'); // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  const tags = generateResourceTags('marketing', undefined, ['partner-hero-stats']);
  for (const tag of tags) {
    cacheTag(tag);
  }

  // Create request-scoped child logger to avoid race conditions
  const requestLogger = logger.child({
    module: 'data/marketing/site',
    operation: 'getPartnerHeroStats',
  });

  try {
    const configurationCount = (await getContentCount(undefined)) ?? 0;
    const visitorStats = await getVisitorStats();
    return {
      configurationCount,
      ...visitorStats,
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    requestLogger.error({ err: errorForLogging }, 'MarketingSite: failed to load hero stats');
    return {
      configurationCount: 0,
      ...HERO_DEFAULTS,
    };
  }
}

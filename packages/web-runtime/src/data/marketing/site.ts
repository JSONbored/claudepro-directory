'use server';

import { env } from '@heyclaude/shared-runtime/schemas/env';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../../logger.ts';
import { getContentCount } from '../content/index.ts';

const DESCRIPTION_FALLBACK =
  'Open-source directory of Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.';

const HERO_DEFAULTS = {
  monthlyVisitors: 3000,
  monthlyPageViews: 16_000,
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
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag('marketing-visitor-stats');

  // Create request-scoped child logger - do not mutate shared logger in cached function
  const requestLogger = logger.child({
    operation: 'getVisitorStats',
    module: 'data/marketing/site',
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
      monthlyVisitors: Number(data.visitors?.value ?? HERO_DEFAULTS.monthlyVisitors),
      monthlyPageViews: Number(data.pageViews?.value ?? HERO_DEFAULTS.monthlyPageViews),
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    requestLogger.warn('Visitor stats fetch failed, using defaults', {
      err: errorForLogging,
      source: 'vercel-analytics-api',
      fallbackStrategy: 'defaults',
    });
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

  const { cacheLife, cacheTag } = await import('next/cache');

  // Configure cache - use 'half' profile for content description (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('marketing');
  cacheTag('content-description');

  // Create request-scoped child logger to avoid race conditions
  const requestLogger = logger.child({
    operation: 'getContentDescriptionCopy',
    module: 'data/marketing/site',
  });

  try {
    const count = await getContentCount();
    return `Open-source directory of ${count}+ Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.`;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    requestLogger.error('MarketingSite: failed to build content description', errorForLogging);
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

  const { cacheLife, cacheTag } = await import('next/cache');

  // Configure cache - use 'half' profile for partner hero stats (changes every 30 minutes)
  cacheLife('half'); // 30min stale, 10min revalidate, 3 hours expire
  cacheTag('marketing');
  cacheTag('partner-hero-stats');

  // Create request-scoped child logger to avoid race conditions
  const requestLogger = logger.child({
    operation: 'getPartnerHeroStats',
    module: 'data/marketing/site',
  });

  try {
    const configurationCount = await getContentCount();
    const visitorStats = await getVisitorStats();
    return {
      configurationCount,
      ...visitorStats,
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    requestLogger.error('MarketingSite: failed to load hero stats', errorForLogging);
    return {
      configurationCount: 0,
      ...HERO_DEFAULTS,
    };
  }
}

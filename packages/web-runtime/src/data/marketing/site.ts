'use server';

import { env } from '@heyclaude/shared-runtime/schemas/env';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { generateRequestId } from '../../utils/request-id.ts';
import { getContentCount } from '../content/index.ts';

const DESCRIPTION_FALLBACK =
  'Open-source directory of Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.';

const HERO_DEFAULTS: VisitorStats = {
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
 * Custom error class to signal that we should NOT cache this result.
 * By throwing inside unstable_cache, Next.js won't cache the error state.
 */
class VisitorStatsError extends Error {
  constructor(
    message: string,
    public readonly originalError: unknown
  ) {
    super(message);
    this.name = 'VisitorStatsError';
  }
}

/**
 * Get visitor stats from Vercel Analytics API.
 *
 * CRITICAL: This uses a throw-outside-cache pattern to prevent caching of error states.
 * - Success: Data is cached for 1 hour
 * - Error: Throws VisitorStatsError which is caught OUTSIDE the cache, returning defaults without caching
 * - Missing credentials: Returns defaults (this IS cached, which is intentional since credentials won't appear mid-request)
 */
async function getVisitorStats(): Promise<VisitorStats> {
  try {
    return await unstable_cache(
      async (): Promise<VisitorStats> => {
        // Create request-scoped child logger - do not mutate shared logger in cached function
        const requestId = generateRequestId();
        const requestLogger = logger.child({
          requestId,
          operation: 'getVisitorStats',
          module: 'data/marketing/site',
        });

        const { trackPerformance } = await import('../../utils/performance-metrics.ts');

        // Missing credentials is a config issue, not a transient error - safe to cache defaults
        if (!(VERCEL_ANALYTICS_TOKEN && VERCEL_PROJECT_ID)) {
          requestLogger.debug('Vercel Analytics credentials not configured, using defaults');
          return HERO_DEFAULTS;
        }

        const now = Date.now();
        const to = new Date(now);
        const from = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const url = new URL(`https://api.vercel.com/v2/insights/${VERCEL_PROJECT_ID}/analytics`);
        url.searchParams.set('from', from.toISOString());
        url.searchParams.set('to', to.toISOString());

        try {
          const { result } = await trackPerformance(
            async () => {
              const response = await fetch(url.toString(), {
                headers: {
                  Authorization: `Bearer ${VERCEL_ANALYTICS_TOKEN}`,
                },
                next: { revalidate: 3600 },
              });

              if (!response.ok) {
                throw new Error(
                  `Vercel analytics error: ${response.status} ${response.statusText}`
                );
              }

              const data = (await response.json()) as VercelAnalyticsResponse;
              return {
                monthlyVisitors: Number(data.visitors?.value ?? HERO_DEFAULTS.monthlyVisitors),
                monthlyPageViews: Number(data.pageViews?.value ?? HERO_DEFAULTS.monthlyPageViews),
              };
            },
            {
              operation: 'getVisitorStats',
              logger: requestLogger,
              requestId,
              logMeta: { source: 'vercel-analytics-api' },
              logLevel: 'info',
            }
          );

          return result;
        } catch (error) {
          // CRITICAL: Throw error instead of returning fallback to prevent caching
          const normalized = normalizeError(error, 'Visitor stats fetch failed');
          requestLogger.warn('Visitor stats fetch failed, will use defaults (not cached)', {
            err: normalized,
            source: 'vercel-analytics-api',
          });
          throw new VisitorStatsError('Visitor stats fetch failed', error);
        }
      },
      ['marketing-visitor-stats'],
      { revalidate: 3600, tags: ['marketing-visitor-stats'] }
    )();
  } catch (error) {
    // Handle errors OUTSIDE the cache - return fallback without caching it
    if (error instanceof VisitorStatsError) {
      // Already logged inside, just return fallback (not cached)
      return HERO_DEFAULTS;
    }
    // Unexpected error - log and return fallback
    logger.error(
      'Unexpected visitor stats error',
      normalizeError(error, 'Unexpected visitor stats error'),
      {
        operation: 'getVisitorStats',
        module: 'data/marketing/site',
      }
    );
    return HERO_DEFAULTS;
  }
}

const getConfigurationCountCached = cache(async () => getContentCount());

export async function getContentDescriptionCopy(): Promise<string> {
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'getContentDescriptionCopy',
    module: 'data/marketing/site',
  });

  try {
    const count = await getConfigurationCountCached();
    return `Open-source directory of ${count}+ Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.`;
  } catch (error) {
    // Log error with normalized error object
    const normalized = normalizeError(error, 'MarketingSite: failed to build content description');
    requestLogger.error('MarketingSite: failed to build content description', normalized);
    return DESCRIPTION_FALLBACK;
  }
}

export interface PartnerHeroStats {
  configurationCount: number;
  monthlyPageViews: number;
  monthlyVisitors: number;
}

export async function getPartnerHeroStats(): Promise<PartnerHeroStats> {
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const requestLogger = logger.child({
    requestId,
    operation: 'getPartnerHeroStats',
    module: 'data/marketing/site',
  });

  try {
    const configurationCount = await getConfigurationCountCached();
    const visitorStats = await getVisitorStats();
    return {
      configurationCount,
      ...visitorStats,
    };
  } catch (error) {
    // Log error with normalized error object
    const normalized = normalizeError(error, 'MarketingSite: failed to load hero stats');
    requestLogger.error('MarketingSite: failed to load hero stats', normalized);
    return {
      configurationCount: 0,
      ...HERO_DEFAULTS,
    };
  }
}

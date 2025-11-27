'use server';

import { unstable_cache } from 'next/cache';
import { cache } from 'react';

import { getContentCount } from '../../data/content/index.ts';
import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { generateRequestId } from '../../utils/request-id.ts';

const DESCRIPTION_FALLBACK =
  'Open-source directory of Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.';

const HERO_DEFAULTS = {
  monthlyVisitors: 3000,
  monthlyPageViews: 16_000,
};

const VERCEL_ANALYTICS_TOKEN = process.env['VERCEL_WEB_ANALYTICS_TOKEN'];
const VERCEL_PROJECT_ID =
  process.env['VERCEL_PROJECT_ID'] ?? process.env['NEXT_PUBLIC_VERCEL_PROJECT_ID'];

interface VisitorStats {
  monthlyVisitors: number;
  monthlyPageViews: number;
}

interface VercelAnalyticsResponse {
  visitors?: {
    value?: number | string;
  };
  pageViews?: {
    value?: number | string;
  };
}

const getVisitorStats = unstable_cache(
  async (): Promise<VisitorStats> => {
    // Create request-scoped child logger - do not mutate shared logger in cached function
    const requestId = generateRequestId();
    const requestLogger = logger.child({
      requestId,
      operation: 'getVisitorStats',
      module: 'data/marketing/site',
    });

    const { trackPerformance } = await import('../../utils/performance-metrics.ts');
    
    if (!(VERCEL_ANALYTICS_TOKEN && VERCEL_PROJECT_ID)) {
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
            throw new Error(`Vercel analytics error: ${response.status} ${response.statusText}`);
          }

          const data = (await response.json()) as VercelAnalyticsResponse;
          return {
            monthlyVisitors: Number(data.visitors?.value ?? HERO_DEFAULTS.monthlyVisitors),
            monthlyPageViews: Number(data.pageViews?.value ?? HERO_DEFAULTS.monthlyPageViews),
          };
        },
        {
          operation: 'getVisitorStats',
          logMeta: { source: 'vercel-analytics-api' },
          logLevel: 'info',
        }
      );
      
      return result;
    } catch (error) {
      // trackPerformance logs performance metrics, but we need explicit error logging
      const normalized = normalizeError(error, 'Visitor stats fetch failed, using defaults');
      requestLogger.warn('Visitor stats fetch failed, using defaults', {
        err: normalized,
        source: 'vercel-analytics-api',
        fallbackStrategy: 'defaults',
      });
      return HERO_DEFAULTS;
    }
  },
  ['marketing-visitor-stats'],
  { revalidate: 3600, tags: ['marketing-visitor-stats'] }
);

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
  monthlyVisitors: number;
  monthlyPageViews: number;
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

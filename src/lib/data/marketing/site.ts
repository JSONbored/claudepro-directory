import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { getContentCount } from '@/src/lib/data/content';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

const DESCRIPTION_FALLBACK =
  'Open-source directory of Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.';

const HERO_DEFAULTS = {
  monthlyVisitors: 3000,
  monthlyPageViews: 16000,
};

const VERCEL_ANALYTICS_TOKEN = process.env['VERCEL_WEB_ANALYTICS_TOKEN'];
const VERCEL_PROJECT_ID =
  process.env['VERCEL_PROJECT_ID'] ?? process.env['NEXT_PUBLIC_VERCEL_PROJECT_ID'];

type VisitorStats = {
  monthlyVisitors: number;
  monthlyPageViews: number;
};

const getVisitorStats = unstable_cache(
  async (): Promise<VisitorStats> => {
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
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${VERCEL_ANALYTICS_TOKEN}`,
        },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error(`Vercel analytics error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        monthlyVisitors: Number(data?.visitors?.value ?? HERO_DEFAULTS.monthlyVisitors),
        monthlyPageViews: Number(data?.pageViews?.value ?? HERO_DEFAULTS.monthlyPageViews),
      };
    } catch (error) {
      logger.error('MarketingSite: failed to load Vercel analytics', normalizeError(error));
      return HERO_DEFAULTS;
    }
  },
  ['marketing-visitor-stats'],
  { revalidate: 3600, tags: ['marketing-visitor-stats'] }
);

export const getConfigurationCount = cache(async () => getContentCount());

export async function getContentDescriptionCopy(): Promise<string> {
  try {
    const count = await getConfigurationCount();
    return `Open-source directory of ${count}+ Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.`;
  } catch (error) {
    logger.error('MarketingSite: failed to build content description', normalizeError(error));
    return DESCRIPTION_FALLBACK;
  }
}

export interface PartnerHeroStats {
  configurationCount: number;
  monthlyVisitors: number;
  monthlyPageViews: number;
}

export async function getPartnerHeroStats(): Promise<PartnerHeroStats> {
  try {
    const configurationCount = await getConfigurationCount();
    const visitorStats = await getVisitorStats();
    return {
      configurationCount,
      ...visitorStats,
    };
  } catch (error) {
    logger.error('MarketingSite: failed to load hero stats', normalizeError(error));
    return {
      configurationCount: 0,
      ...HERO_DEFAULTS,
    };
  }
}

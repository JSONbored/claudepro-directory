import 'server-only';

import { logger } from '../../logger.ts';
import { getContentCount } from '../content/index.ts';

const DESCRIPTION_FALLBACK =
  'Open-source directory of Claude AI configurations. Community-driven collection of MCP servers, automation hooks, custom commands, agents, and rules.';

const HERO_DEFAULTS = {
  monthlyPageViews: 16_000,
  monthlyVisitors: 3000,
};

interface VisitorStats {
  monthlyPageViews: number;
  monthlyVisitors: number;
}

/**
 * Get visitor stats (marketing defaults)
 *
 * Returns hardcoded marketing statistics for the partner page.
 * These are static marketing numbers that can be updated in code as needed.
 *
 * @returns Visitor statistics (monthly page views and visitors)
 */
function getVisitorStats(): VisitorStats {
  return HERO_DEFAULTS;
}

/**
 * Get content description copy with count
 * Uses 'use cache' to cache the description. This data is public and same for all users.
 * Content description changes periodically, so we use the 'half' cacheLife profile.
 */
export async function getContentDescriptionCopy(): Promise<string> {
  // Simple data fetching function - pages control caching with 'use cache' directive

  // Create request-scoped child logger to avoid race conditions
  const requestLogger = logger.child({
    module: 'data/marketing/site',
    operation: 'getContentDescriptionCopy',
  });

  try {
    const count = await getContentCount();
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
  // Simple data fetching function - pages control caching with 'use cache' directive

  // Create request-scoped child logger to avoid race conditions
  const requestLogger = logger.child({
    module: 'data/marketing/site',
    operation: 'getPartnerHeroStats',
  });

  try {
    const configurationCount = (await getContentCount()) ?? 0;
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

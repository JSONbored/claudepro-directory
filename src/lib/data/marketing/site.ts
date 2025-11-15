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
    return {
      configurationCount,
      ...HERO_DEFAULTS,
    };
  } catch (error) {
    logger.error('MarketingSite: failed to load hero stats', normalizeError(error));
    return {
      configurationCount: 0,
      ...HERO_DEFAULTS,
    };
  }
}

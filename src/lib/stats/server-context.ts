import { cache } from 'react';

import { statsRedis } from '@/src/lib/cache.server';
import type { StatsHydrationPayload } from '@/src/lib/stats/main';
import type { StatsBatchItem, StatsBatchMode, StatsBatchResult } from '@/src/lib/stats/types';

interface StatsServerContext {
  readonly mode: StatsBatchMode;
  readonly items: Set<string>;
  register: (item: StatsBatchItem) => void;
  preload: () => Promise<void>;
  get: (item: StatsBatchItem) => Promise<{ viewCount: number; copyCount: number } | null>;
  serialize: () => StatsHydrationPayload | null;
}

const createContext = cache((): StatsServerContext => {
  const items = new Set<string>();
  let cachedResult: StatsBatchResult | null = null;

  const register = (item: StatsBatchItem) => {
    items.add(`${item.category}:${item.slug}`);
  };

  const fetch = async () => {
    if (cachedResult) return cachedResult;
    const parsedItems = Array.from(items)
      .map((key) => {
        const [category, slug] = key.split(':');
        return { category, slug };
      })
      .filter(
        (item): item is { category: string; slug: string } =>
          typeof item.category === 'string' && typeof item.slug === 'string'
      );

    const [views, copies] = await Promise.all([
      statsRedis.getViewCounts(parsedItems),
      statsRedis.getCopyCounts(parsedItems),
    ]);

    cachedResult = parsedItems.reduce<StatsBatchResult>((acc, item) => {
      const key = `${item.category}:${item.slug}`;
      acc[key] = {
        viewCount: views[key] ?? 0,
        copyCount: copies[key] ?? 0,
      };
      return acc;
    }, {});

    return cachedResult;
  };

  const preload = async () => {
    if (!items.size) return;
    await fetch();
  };

  const get = async (item: StatsBatchItem) => {
    if (!items.size) return null;
    const result = await fetch();
    const key = `${item.category}:${item.slug}`;
    return result[key] ?? null;
  };

  const serialize = (): StatsHydrationPayload | null => {
    if (!cachedResult) {
      return null;
    }
    const resultItems = Array.from(items)
      .map((key) => {
        const [category, slug] = key.split(':');
        return { category, slug, type: 'both' as const };
      })
      .filter(
        (item): item is { category: string; slug: string; type: 'both' } =>
          Boolean(item.category) && Boolean(item.slug)
      );
    return {
      items: resultItems,
      results: cachedResult,
    };
  };

  return {
    mode: 'cached',
    items,
    register,
    preload,
    get,
    serialize,
  };
});

export function getStatsServerContext(): StatsServerContext {
  return createContext();
}

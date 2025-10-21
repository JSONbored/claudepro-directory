import type { StatsBatchItem, StatsBatchResult } from '@/src/lib/stats/types';

export interface StatsHydrationPayload {
  readonly items: StatsBatchItem[];
  readonly results: StatsBatchResult;
}

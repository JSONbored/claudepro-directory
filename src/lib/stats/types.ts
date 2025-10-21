/**
 * Shared stats batching types reused across server utilities and clients.
 */

export type StatsBatchMode = 'cached' | 'realtime';

export interface StatsBatchItem {
  readonly category: string;
  readonly slug: string;
  readonly type: 'views' | 'copies' | 'both';
}

export interface StatsBatchRequestBody {
  readonly items: StatsBatchItem[];
  readonly mode?: StatsBatchMode;
}

export interface StatsBatchResponse {
  readonly success: boolean;
  readonly data: Record<string, { viewCount?: number; copyCount?: number }>;
  readonly cached?: boolean;
  readonly cacheAge?: number;
  readonly error?: string;
}

export type StatsBatchResult = Record<string, { viewCount: number; copyCount: number }>;

export interface StatsHydrationPayload {
  readonly items: StatsBatchItem[];
  readonly results: StatsBatchResult;
}

export interface StatsHydrationScript {
  readonly id: string;
  readonly payload: StatsHydrationPayload;
}

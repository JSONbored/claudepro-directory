'use server';

import { type GetQuizConfigurationReturns } from '@heyclaude/database-types/postgres-types';

import { createCachedDataFunction, generateResourceTags } from './cached-data-factory.ts';

export type QuizConfigurationResult = GetQuizConfigurationReturns;

/**
 * Get quiz configuration
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Not prerendered (runs at request time)
 */
export const getQuizConfiguration = createCachedDataFunction<void, QuizConfigurationResult | null>({
  serviceKey: 'misc', // Consolidated: QuizService methods moved to MiscService
  methodName: 'getQuizConfiguration',
  cacheMode: 'private',
  cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
  cacheTags: () => generateResourceTags('quiz-configuration'),
  module: 'data/quiz',
  operation: 'getQuizConfiguration',
});

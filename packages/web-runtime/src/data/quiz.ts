'use server';

import { QuizService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../errors.ts';
import { logger } from '../index.ts';

export type QuizConfigurationResult =
  Database['public']['Functions']['get_quiz_configuration']['Returns'];

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
 * @returns Quiz configuration result or null if error occurs
 */
export async function getQuizConfiguration(): Promise<null | QuizConfigurationResult> {
  'use cache: private';

  // Configure cache
  cacheLife({ expire: 1800, revalidate: 300, stale: 60 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag('quiz-configuration');

  const reqLogger = logger.child({
    module: 'data/quiz',
    operation: 'getQuizConfiguration',
  });

  try {
    const service = new QuizService();
    const result = await service.getQuizConfiguration();

    reqLogger.info({ hasResult: Boolean(result) }, 'getQuizConfiguration: fetched successfully');

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getQuizConfiguration failed');
    reqLogger.error({ err: normalized }, 'getQuizConfiguration: unexpected error');
    return null;
  }
}

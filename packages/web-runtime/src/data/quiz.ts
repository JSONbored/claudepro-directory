'use server';

import { QuizService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';
import { generateRequestId } from '../utils/request-id.ts';

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
 */
export async function getQuizConfiguration(): Promise<null | QuizConfigurationResult> {
  'use cache: private';

  // Configure cache
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag('quiz-configuration');

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getQuizConfiguration',
    module: 'data/quiz',
  });

  try {
    // Can use cookies() inside 'use cache: private'
    const client = await createSupabaseServerClient();
    const service = new QuizService(client);

    const result = await service.getQuizConfiguration();

    reqLogger.info('getQuizConfiguration: fetched successfully', {
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getQuizConfiguration: unexpected error', errorForLogging);
    return null;
  }
}

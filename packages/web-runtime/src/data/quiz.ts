'use server';

import { QuizService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cache } from 'react';

import { logger, normalizeError } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';
import { generateRequestId } from '../utils/request-id.ts';

export type QuizConfigurationResult =
  Database['public']['Functions']['get_quiz_configuration']['Returns'];

/**
 * Get quiz configuration
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because:
 * 1. Quiz configuration requires cookies() for auth
 * 2. cookies() cannot be called inside unstable_cache() (Next.js restriction)
 *
 * React.cache() provides request-level deduplication within the same React Server Component tree,
 * which is safe and appropriate for user-specific data.
 */
export const getQuizConfiguration = cache(async (): Promise<null | QuizConfigurationResult> => {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getQuizConfiguration',
    module: 'data/quiz',
  });

  try {
    // Create authenticated client OUTSIDE of any cache scope
    const client = await createSupabaseServerClient();
    const service = new QuizService(client);

    const result = await service.getQuizConfiguration();

    reqLogger.info('getQuizConfiguration: fetched successfully', {
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getQuizConfiguration failed');
    reqLogger.error('getQuizConfiguration: unexpected error', normalized);
    return null;
  }
});

'use server';

/**
 * Quiz Actions - Database-First Architecture
 * Calls get_quiz_configuration RPC.
 */

import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

type QuizConfigResult = Database['public']['Functions']['get_quiz_configuration']['Returns'];

export async function getQuizConfiguration(): Promise<QuizConfigResult> {
  try {
    const data = await cachedRPCWithDedupe<QuizConfigResult>(
      'get_quiz_configuration',
      {},
      {
        tags: ['quiz'],
        ttlConfigKey: 'cache.quiz.ttl_seconds',
        keySuffix: 'quiz-config',
        useAuthClient: true,
      }
    );

    if (!data) {
      logger.warn('getQuizConfiguration: RPC returned null');
      throw new Error('Quiz configuration unavailable');
    }

    return data;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load quiz configuration');
    logger.error('getQuizConfiguration: RPC failed', normalized);
    throw normalized;
  }
}

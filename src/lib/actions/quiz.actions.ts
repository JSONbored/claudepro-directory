'use server';

/**
 * Quiz Actions - Database-First Architecture
 * Calls get_quiz_configuration RPC.
 */

import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import type { Database } from '@/src/types/database.types';

type QuizConfigResult = Database['public']['Functions']['get_quiz_configuration']['Returns'];

export async function getQuizConfiguration(): Promise<QuizConfigResult> {
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
    throw new Error('Failed to load quiz configuration');
  }

  return data;
}

'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database } from '@/src/types/database.types';

// Use generated type directly from database.types.ts
type QuizConfigurationResult = Database['public']['Functions']['get_quiz_configuration']['Returns'];

export async function fetchQuizConfiguration(): Promise<QuizConfigurationResult | null> {
  return fetchCachedRpc<'get_quiz_configuration', QuizConfigurationResult | null>(
    {} as Database['public']['Functions']['get_quiz_configuration']['Args'],
    {
      rpcName: 'get_quiz_configuration',
      tags: ['quiz'],
      ttlKey: 'cache.quiz.ttl_seconds',
      keySuffix: 'quiz-config',
      useAuthClient: true,
      fallback: null,
      logMeta: { source: 'quiz.actions' },
    }
  );
}

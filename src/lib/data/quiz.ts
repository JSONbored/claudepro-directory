'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database } from '@/src/types/database.types';

type QuizConfigResult = Database['public']['Functions']['get_quiz_configuration']['Returns'];

export async function fetchQuizConfiguration(): Promise<QuizConfigResult | null> {
  return fetchCachedRpc<QuizConfigResult | null>(
    {},
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

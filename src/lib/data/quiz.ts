'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GetGetQuizConfigurationReturn } from '@/src/types/database-overrides';

export async function fetchQuizConfiguration(): Promise<GetGetQuizConfigurationReturn | null> {
  return fetchCachedRpc<'get_quiz_configuration', GetGetQuizConfigurationReturn | null>(
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

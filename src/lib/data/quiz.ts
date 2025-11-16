'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GetQuizConfigurationReturn } from '@/src/types/database-overrides';

export async function fetchQuizConfiguration(): Promise<GetQuizConfigurationReturn | null> {
  return fetchCachedRpc<GetQuizConfigurationReturn | null>(
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

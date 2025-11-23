'use server';

import type { Database } from '@heyclaude/database-types';
import { fetchCached } from '../cache/fetch-cached.ts';
import { QuizService } from '@heyclaude/data-layer';

export type QuizConfigurationResult =
  Database['public']['Functions']['get_quiz_configuration']['Returns'];

export async function getQuizConfiguration(): Promise<QuizConfigurationResult | null> {
  return fetchCached(
    (client) => new QuizService(client).getQuizConfiguration(),
    {
      key: 'quiz-config',
      tags: ['quiz'],
      ttlKey: 'cache.quiz.ttl_seconds',
      useAuth: true,
      fallback: null,
      logMeta: { source: 'quiz.actions' },
    }
  );
}

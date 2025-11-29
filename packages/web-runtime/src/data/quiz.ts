'use server';

import { QuizService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';

import { fetchCached } from '../cache/fetch-cached.ts';

export type QuizConfigurationResult =
  Database['public']['Functions']['get_quiz_configuration']['Returns'];

export async function getQuizConfiguration(): Promise<null | QuizConfigurationResult> {
  return fetchCached(
    (client) => new QuizService(client).getQuizConfiguration(),
    {
      keyParts: ['quiz-config'],
      tags: ['quiz'],
      ttlKey: 'cache.quiz.ttl_seconds',
      useAuth: true,
      fallback: null,
      logMeta: { source: 'quiz.actions' },
    }
  );
}

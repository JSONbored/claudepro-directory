'use server';

import { z } from 'zod';
import { rateLimitedAction } from './safe-action.ts';
import type { QuizConfigurationResult } from '../data/quiz.ts';

export { type QuizConfigurationResult };

export const getQuizConfigurationAction = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'quiz.getQuizConfiguration', category: 'content' })
  .action(async () => {
    try {
      const { getQuizConfiguration: fetchQuizConfig } = await import('../data/quiz.ts');
      const data = await fetchQuizConfig();
      return (data ?? []) as QuizConfigurationResult;
    } catch {
      return [] as QuizConfigurationResult;
    }
  });

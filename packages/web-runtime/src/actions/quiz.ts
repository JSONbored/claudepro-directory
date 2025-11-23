'use server';

import { z } from 'zod';
import { rateLimitedAction } from './safe-action.ts';
import { getQuizConfiguration as fetchQuizConfig, type QuizConfigurationResult } from '../data/quiz.ts';

export const getQuizConfigurationAction = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'quiz.getQuizConfiguration', category: 'content' })
  .action(async () => {
    try {
      const data = await fetchQuizConfig();
      return (data ?? []) as QuizConfigurationResult;
    } catch {
      return [] as QuizConfigurationResult;
    }
  });

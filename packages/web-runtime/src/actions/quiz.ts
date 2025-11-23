'use server';

import { z } from 'zod';
import { rateLimitedAction } from './safe-action.ts';
import { fetchQuizConfiguration, type QuizConfigurationResult } from '../data/quiz.ts';

export const getQuizConfiguration = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'quiz.getQuizConfiguration', category: 'content' })
  .action(async () => {
    try {
      const data = await fetchQuizConfiguration();
      return (data ?? []) as QuizConfigurationResult;
    } catch {
      return [] as QuizConfigurationResult;
    }
  });

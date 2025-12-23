'use server';

import { z } from 'zod';
import { rateLimitedAction } from './safe-action.ts';
import { getQuizConfiguration } from '../data/quiz.ts';
import type { QuizConfigurationResult } from '../data/quiz.ts';

export { type QuizConfigurationResult };

/**
 * Get Quiz Configuration Action
 *
 * Fetches quiz configuration data (questions and options) for the quiz form.
 * Uses rate limiting to prevent abuse.
 *
 * @returns Array of quiz questions with nested options, or null if no configuration found
 */
export const getQuizConfigurationAction = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'quiz.getQuizConfiguration', category: 'content' })
  .action(async () => {
    // GetQuizConfigurationReturns is QuizConfigurationQuestion[] (array of questions)
    const data = await getQuizConfiguration();
    return data;
  });

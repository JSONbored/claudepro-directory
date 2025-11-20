'use server';

/**
 * Quiz Actions - Database-First Architecture
 * Calls get_quiz_configuration RPC.
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { fetchQuizConfiguration } from '@/src/lib/data/quiz';
import type { Database } from '@/src/types/database.types';

// Use generated type directly from database.types.ts
type QuizConfigurationResult = Database['public']['Functions']['get_quiz_configuration']['Returns'];

/**
 * Get quiz configuration
 * Public action - no authentication required
 */
export const getQuizConfiguration = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'quiz.getQuizConfiguration', category: 'content' })
  .action(async () => {
    try {
      const data = await fetchQuizConfiguration();
      // Return empty array if data is null (graceful fallback)
      return (data ?? []) as QuizConfigurationResult;
    } catch {
      // Fallback to empty array on error (safe-action middleware handles logging)
      return [] as QuizConfigurationResult;
    }
  });

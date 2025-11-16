'use server';

/**
 * Quiz Actions - Database-First Architecture
 * Calls get_quiz_configuration RPC.
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { fetchQuizConfiguration } from '@/src/lib/data/quiz';
import type { GetQuizConfigurationReturn } from '@/src/types/database-overrides';

/**
 * Get quiz configuration
 * Public action - no authentication required
 */
export const getQuizConfiguration = rateLimitedAction
  .schema(z.object({}))
  .metadata({ actionName: 'quiz.getQuizConfiguration', category: 'content' })
  .action(async () => {
    try {
      const data = await fetchQuizConfiguration();
      // Return empty questions structure if data is null (graceful fallback)
      return (data ?? { questions: [] }) as GetQuizConfigurationReturn;
    } catch {
      // Fallback to empty questions on error (safe-action middleware handles logging)
      return { questions: [] } as GetQuizConfigurationReturn;
    }
  });

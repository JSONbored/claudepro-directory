'use server';

/**
 * Quiz Actions - Database-First Architecture
 * Calls get_quiz_configuration RPC.
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { fetchQuizConfiguration } from '@/src/lib/data/quiz';
import type { GetGetQuizConfigurationReturn } from '@/src/types/database-overrides';

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
      return (data ?? []) as GetGetQuizConfigurationReturn;
    } catch {
      // Fallback to empty array on error (safe-action middleware handles logging)
      return [] as GetGetQuizConfigurationReturn;
    }
  });

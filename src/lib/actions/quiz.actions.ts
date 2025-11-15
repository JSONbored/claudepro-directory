'use server';

/**
 * Quiz Actions - Database-First Architecture
 * Calls get_quiz_configuration RPC.
 */

import { fetchQuizConfiguration } from '@/src/lib/data/quiz';
import { logActionFailure } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

type QuizConfigResult = Database['public']['Functions']['get_quiz_configuration']['Returns'];

export async function getQuizConfiguration(): Promise<QuizConfigResult> {
  try {
    const data = await fetchQuizConfiguration();
    if (!data) {
      throw new Error('Quiz configuration unavailable');
    }
    return data;
  } catch (error) {
    throw logActionFailure('quiz.getQuizConfiguration', error);
  }
}

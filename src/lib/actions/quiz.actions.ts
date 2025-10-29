'use server';

/**
 * Quiz Actions - Database-First Architecture
 * Calls get_quiz_configuration RPC.
 */

import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

type QuizConfigResult = Database['public']['Functions']['get_quiz_configuration']['Returns'];

export async function getQuizConfiguration(): Promise<QuizConfigResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_quiz_configuration');

  if (error) throw new Error(`Failed to load quiz: ${error.message}`);

  return data;
}

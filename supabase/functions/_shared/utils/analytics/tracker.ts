import { supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database } from '../../database.types.ts';
import { getAuthUserFromHeader } from '../auth.ts';
import { runWithRetry } from '../integrations/http-client.ts';

type SearchQueryInsert = Database['public']['Tables']['search_queries']['Insert'];

const RETRY_OPTIONS = {
  attempts: 2,
  baseDelayMs: 150,
};

async function executeWithRetry<T>(fn: () => Promise<T>, context: string): Promise<T | null> {
  try {
    return await runWithRetry(fn, RETRY_OPTIONS);
  } catch (error) {
    console.warn(`[analytics] ${context} failed`, {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export interface TrackSearchQueryEdgeParams {
  query: string;
  filters?: SearchQueryInsert['filters'];
  resultCount: number;
  authorizationHeader?: string | null;
  sessionId?: SearchQueryInsert['session_id'];
  userId?: SearchQueryInsert['user_id'];
}

export async function trackSearchQueryEdge({
  query,
  filters,
  resultCount,
  authorizationHeader,
  sessionId,
  userId,
}: TrackSearchQueryEdgeParams): Promise<void> {
  if (!query) {
    return;
  }

  let resolvedUserId = userId ?? null;
  if (!resolvedUserId && authorizationHeader) {
    const auth = await getAuthUserFromHeader(authorizationHeader);
    if (auth?.user?.id) {
      resolvedUserId = auth.user.id;
    }
  }

  const payload: SearchQueryInsert = {
    query,
    filters: filters ?? null,
    result_count: resultCount,
    user_id: resolvedUserId,
    session_id: sessionId ?? null,
  };

  await executeWithRetry(
    () => supabaseServiceRole.from('search_queries').insert(payload),
    'trackSearchQueryEdge'
  );
}

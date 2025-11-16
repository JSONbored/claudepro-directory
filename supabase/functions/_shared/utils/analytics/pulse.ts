import { supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database } from '../../database.types.ts';
import { getAuthUserFromHeader } from '../auth.ts';

type SearchQueryInsert = Database['public']['Tables']['search_queries']['Insert'];

export interface TrackSearchQueryEdgeParams {
  query: string;
  filters?: SearchQueryInsert['filters'];
  resultCount: number;
  authorizationHeader?: string | null;
  sessionId?: SearchQueryInsert['session_id'];
  userId?: SearchQueryInsert['user_id'];
}

/**
 * Enqueue search analytics to user_interactions queue
 * Queue-based tracking for optimal egress reduction (98% reduction via batching)
 */
export async function enqueueSearchAnalytics({
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

  // Enqueue to user_interactions queue with interaction_type='search'
  // Worker will process and route to search_queries table
  const { error } = await supabaseServiceRole.schema('pgmq_public').rpc('send', {
    queue_name: 'user_interactions',
    msg: {
      user_id: resolvedUserId ?? null,
      content_type: null,
      content_slug: null,
      interaction_type: 'search',
      session_id: sessionId ?? null,
      metadata: {
        query,
        filters: filters ?? null,
        result_count: resultCount,
      },
    },
  });

  if (error) {
    console.warn('[analytics] Failed to enqueue search analytics', {
      error: error.message,
      query: query.substring(0, 50),
    });
  }
}

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { getAuthUserFromHeader } from '../auth.ts';
import { pgmqSend } from '../pgmq-client.ts';

type SearchQueryInsert = DatabaseGenerated['public']['Tables']['search_queries']['Insert'];

export interface TrackSearchQueryEdgeParams {
  query: string;
  filters?: SearchQueryInsert['filters'];
  resultCount: number;
  authorizationHeader?: string | null;
  sessionId?: SearchQueryInsert['session_id'];
  userId?: SearchQueryInsert['user_id'];
}

/**
 * Enqueue search analytics to pulse queue
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

  // Enqueue to pulse queue with interaction_type='search'
  // Worker will process and route to search_queries table
  try {
    await pgmqSend('pulse', {
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
    });
  } catch (error) {
    const { errorToString } = await import('@heyclaude/shared-runtime');
    console.warn('[analytics] Failed to enqueue search analytics', {
      error: errorToString(error),
      query: query.substring(0, 50),
    });
  }
}

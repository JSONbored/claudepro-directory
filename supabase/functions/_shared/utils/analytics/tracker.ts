import { supabaseServiceRole } from '../../clients/supabase.ts';
import type { Database } from '../../database.types.ts';
import { getAuthUserFromHeader } from '../auth.ts';
import { runWithRetry } from '../integrations/http-client.ts';

type InteractionInsert = Database['public']['Tables']['user_interactions']['Insert'];
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

export interface TrackInteractionEdgeParams {
  contentType?: InteractionInsert['content_type'];
  contentSlug?: InteractionInsert['content_slug'];
  interactionType: InteractionInsert['interaction_type'];
  sessionId?: InteractionInsert['session_id'];
  metadata?: InteractionInsert['metadata'];
  userId?: InteractionInsert['user_id'];
  authorizationHeader?: string | null;
}

export async function trackInteractionEdge({
  contentType,
  contentSlug,
  interactionType,
  sessionId,
  metadata,
  userId,
  authorizationHeader,
}: TrackInteractionEdgeParams): Promise<void> {
  let resolvedUserId = userId ?? null;
  if (!resolvedUserId && authorizationHeader) {
    const auth = await getAuthUserFromHeader(authorizationHeader);
    if (auth?.user?.id) {
      resolvedUserId = auth.user.id;
    }
  }

  const payload: InteractionInsert = {
    content_type: contentType ?? null,
    content_slug: contentSlug ?? null,
    interaction_type: interactionType,
    session_id: sessionId ?? null,
    metadata: metadata ?? null,
    user_id: resolvedUserId,
  };

  await executeWithRetry(
    () => supabaseServiceRole.from('user_interactions').insert(payload),
    'trackInteractionEdge'
  );
}

export async function trackNewsletterEventEdge(
  eventType: string,
  metadata?: Record<string, unknown>,
  overrides?: Omit<TrackInteractionEdgeParams, 'interactionType'>
): Promise<void> {
  await trackInteractionEdge({
    contentType: overrides?.contentType ?? 'newsletter',
    contentSlug: overrides?.contentSlug ?? 'newsletter_cta',
    interactionType: overrides?.interactionType ?? 'click',
    sessionId: overrides?.sessionId,
    userId: overrides?.userId,
    authorizationHeader: overrides?.authorizationHeader,
    metadata: {
      ...(metadata ?? {}),
      event_type: eventType,
    } as InteractionInsert['metadata'],
  });
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

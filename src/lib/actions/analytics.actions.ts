'use server';

/**
 * Analytics Server Actions
 * Moves all analytics-related Supabase RPC calls off the client bundle.
 */

import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { createClient } from '@/src/lib/supabase/server';
import type { Database, Json } from '@/src/types/database.types';

export type TrackInteractionParams = Omit<
  Database['public']['Tables']['user_interactions']['Insert'],
  'id' | 'created_at' | 'user_id'
>;

export async function trackInteractionAction(params: TrackInteractionParams) {
  const supabase = await createClient();
  const contentType = params.content_type ?? 'unknown';
  const contentSlug = params.content_slug ?? 'unknown';

  const { error } = await supabase.rpc('track_user_interaction', {
    p_content_type: contentType,
    p_content_slug: contentSlug,
    p_interaction_type: params.interaction_type,
    ...(params.session_id ? { p_session_id: params.session_id } : {}),
    ...(params.metadata ? { p_metadata: params.metadata as Json } : {}),
  });

  if (error) {
    logger.error('trackInteractionAction failed', error, {
      contentType,
      contentSlug,
      interactionType: params.interaction_type,
    });
    throw new Error(error.message);
  }
}

export async function trackNewsletterEventAction(
  eventType: string,
  metadata?: Record<string, unknown>
) {
  const metadataPayload: Record<string, unknown> = {
    event_type: eventType,
    ...(metadata ?? {}),
  };

  return trackInteractionAction({
    content_type: 'newsletter',
    content_slug: 'newsletter_cta',
    interaction_type: 'click',
    metadata: metadataPayload as Json,
  });
}

interface SimilarItem {
  slug: string;
  title: string;
  description?: string;
  category: string;
  score?: number;
  tags?: string[];
  similarity_factors?: Json;
  calculated_at?: string;
  url?: string;
}

interface SimilarContentResult {
  similar_items: SimilarItem[];
  source_item: {
    slug: string;
    category: string;
  };
  algorithm_version?: string;
}

export async function getSimilarConfigsAction(params: {
  content_type: string;
  content_slug: string;
  limit?: number;
}) {
  const data = await cachedRPCWithDedupe<SimilarContentResult>(
    'get_similar_content',
    {
      p_content_type: params.content_type,
      p_content_slug: params.content_slug,
      p_limit: params.limit ?? 6,
    },
    {
      tags: ['content', `content-${params.content_slug}`],
      ttlConfigKey: 'cache.content_detail.ttl_seconds',
      keySuffix: `${params.content_type}-${params.content_slug}-${params.limit ?? 6}`,
    }
  );

  return data;
}

interface RecommendationsSummary {
  topCategory?: string | null;
  avgMatchScore?: number | null;
  diversityScore?: number | null;
}

interface RecommendationItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags?: string[] | null;
  author?: string | null;
  match_score?: number | null;
  match_percentage?: number | null;
  primary_reason?: string | null;
  rank?: number | null;
  reasons?: Json;
}

interface RecommendationsPayload {
  results: RecommendationItem[];
  totalMatches: number;
  algorithm: string;
  summary: RecommendationsSummary | null;
}

export interface ConfigRecommendationsResponse {
  success: boolean;
  recommendations: RecommendationsPayload & {
    id: string;
    generatedAt: string;
    answers: {
      useCase: string;
      experienceLevel: string;
      toolPreferences: string[];
      integrations: string[];
      focusAreas: string[];
    };
  };
}

export async function generateConfigRecommendationsAction(answers: {
  useCase: string;
  experienceLevel: string;
  toolPreferences: string[];
  integrations?: string[];
  focusAreas?: string[];
}): Promise<ConfigRecommendationsResponse> {
  const keySuffix = [
    answers.useCase,
    answers.experienceLevel,
    answers.toolPreferences.join(','),
    (answers.integrations ?? []).join(','),
    (answers.focusAreas ?? []).join(','),
  ].join('|');

  const data = await cachedRPCWithDedupe<RecommendationsPayload>(
    'get_recommendations',
    {
      p_use_case: answers.useCase,
      p_experience_level: answers.experienceLevel,
      p_tool_preferences: answers.toolPreferences,
      p_integrations: answers.integrations ?? [],
      p_focus_areas: answers.focusAreas ?? [],
      p_limit: 20,
    },
    {
      tags: ['recommendations'],
      ttlConfigKey: 'cache.recommendations.ttl_seconds',
      keySuffix,
    }
  );

  const responseId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return {
    success: true,
    recommendations: {
      ...(data ?? { results: [], summary: null, algorithm: 'unknown', totalMatches: 0 }),
      answers: {
        useCase: answers.useCase,
        experienceLevel: answers.experienceLevel,
        toolPreferences: answers.toolPreferences,
        integrations: answers.integrations ?? [],
        focusAreas: answers.focusAreas ?? [],
      },
      id: responseId,
      generatedAt: new Date().toISOString(),
    },
  };
}

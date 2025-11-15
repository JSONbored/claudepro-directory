'use server';

/**
 * Analytics Server Actions
 * Moves all analytics-related Supabase RPC calls off the client bundle.
 */

import { runRpc } from '@/src/lib/actions/action-helpers';
import { getSimilarContent, type SimilarContentResult } from '@/src/lib/data/content/similar';
import {
  getConfigRecommendations,
  type RecommendationsResult,
} from '@/src/lib/data/tools/recommendations';
import type { Database, Json } from '@/src/types/database.types';

export type TrackInteractionParams = Omit<
  Database['public']['Tables']['user_interactions']['Insert'],
  'id' | 'created_at' | 'user_id'
>;

export async function trackInteractionAction(params: TrackInteractionParams) {
  const contentType = params.content_type ?? 'unknown';
  const contentSlug = params.content_slug ?? 'unknown';

  await runRpc<void>(
    'track_user_interaction',
    {
      p_content_type: contentType,
      p_content_slug: contentSlug,
      p_interaction_type: params.interaction_type,
      ...(params.session_id ? { p_session_id: params.session_id } : {}),
      ...(params.metadata ? { p_metadata: params.metadata as Json } : {}),
    },
    {
      action: 'analytics.trackInteraction',
      meta: {
        contentType,
        contentSlug,
        interactionType: params.interaction_type,
      },
    }
  );
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

export async function getSimilarConfigsAction(params: {
  content_type: string;
  content_slug: string;
  limit?: number;
}): Promise<SimilarContentResult | null> {
  return getSimilarContent({
    contentType: params.content_type,
    contentSlug: params.content_slug,
    ...(params.limit ? { limit: params.limit } : {}),
  });
}

interface RecommendationSummary {
  topCategory: string;
  avgMatchScore: number;
  diversityScore: number;
}

interface RecommendationItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  match_score: number;
  match_percentage: number;
  primary_reason: string;
  rank: number;
  reasons: Array<{ type: string; message: string }>;
}

interface RecommendationsPayload {
  results: RecommendationItem[];
  totalMatches: number;
  algorithm: string;
  summary: RecommendationSummary;
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
  const data = await getConfigRecommendations({
    useCase: answers.useCase,
    experienceLevel: answers.experienceLevel,
    toolPreferences: answers.toolPreferences,
    integrations: answers.integrations ?? [],
    focusAreas: answers.focusAreas ?? [],
  });

  const responseId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const fallback: RecommendationsResult = {
    results: [],
    totalMatches: 0,
    algorithm: 'unknown',
    summary: {
      topCategory: '',
      avgMatchScore: 0,
      diversityScore: 0,
      topTags: [],
    },
  };

  const source = data ?? fallback;
  const normalizedResults: RecommendationItem[] = source.results.map((item) => {
    const tags: string[] = Array.isArray(item.tags) ? item.tags : [];
    const reasons = Array.isArray(item.reasons)
      ? (item.reasons as Array<{ type: string; message: string }>)
      : [];
    return {
      slug: item.slug,
      title: item.title,
      description: item.description,
      category: item.category,
      tags,
      author: item.author ?? 'Unknown',
      match_score: item.match_score ?? 0,
      match_percentage: item.match_percentage ?? 0,
      primary_reason: item.primary_reason ?? 'Recommendation',
      rank: item.rank ?? 0,
      reasons,
    };
  });
  const normalizedSummary: RecommendationSummary = {
    topCategory: source.summary?.topCategory ?? '',
    avgMatchScore: source.summary?.avgMatchScore ?? 0,
    diversityScore: source.summary?.diversityScore ?? 0,
  };
  const payload: RecommendationsPayload = {
    results: normalizedResults,
    totalMatches: source.totalMatches,
    algorithm: source.algorithm,
    summary: normalizedSummary,
  };

  return {
    success: true,
    recommendations: {
      ...payload,
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

/**
 * Track terminal command execution
 * Used by interactive contact terminal
 */
export async function trackTerminalCommandAction(params: {
  command_id: string;
  action_type: string;
  success: boolean;
  error_reason?: string;
  execution_time_ms?: number;
}) {
  return trackInteractionAction({
    content_type: 'terminal',
    content_slug: 'contact-terminal',
    interaction_type: 'command',
    metadata: {
      command_id: params.command_id,
      action_type: params.action_type,
      success: params.success,
      error_reason: params.error_reason,
      execution_time_ms: params.execution_time_ms,
    } as Json,
  });
}

/**
 * Track terminal form submission
 * Used when contact form is submitted via terminal
 */
export async function trackTerminalFormSubmissionAction(params: {
  category: string;
  success: boolean;
  error?: string;
}) {
  return trackInteractionAction({
    content_type: 'terminal',
    content_slug: 'contact-form',
    interaction_type: 'submit',
    metadata: {
      category: params.category,
      success: params.success,
      error: params.error,
    } as Json,
  });
}

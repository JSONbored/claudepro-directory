/**
 * Edge Function Client - Generic client for all Supabase Edge Functions
 * Consolidated pattern for analytics, reputation, and future Edge calls (SHA-4198)
 */

import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import type { Database, Json } from '@/src/types/database.types';

const EDGE_BASE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://claudepro.directory';

interface EdgeCallOptions {
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  requireAuth?: boolean;
}

/**
 * Generic Edge Function caller - Use this for all Edge Function calls
 * Handles authentication, error handling, and response parsing
 */
export async function callEdgeFunction<T = unknown>(
  functionName: string,
  options: EdgeCallOptions = {}
): Promise<T> {
  const { method = 'POST', body, requireAuth = false } = options;

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Use session token if available, otherwise anon key (if auth not required)
  const token =
    session?.access_token || (requireAuth ? null : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!token && requireAuth) {
    logger.error(
      'No auth token available for Edge function',
      new Error('Authentication required'),
      { functionName }
    );
    throw new Error('Authentication required');
  }

  const response = await fetch(`${EDGE_BASE_URL}/${functionName}`, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Edge function error', errorText, {
      functionName,
      status: response.status,
      method,
    });

    try {
      const error = JSON.parse(errorText);
      throw new Error(error.message || `Edge function ${functionName} failed`);
    } catch {
      throw new Error(`Edge function ${functionName} failed: ${response.status}`);
    }
  }

  return response.json();
}

type TrackInteractionResult = Database['public']['Functions']['track_user_interaction']['Returns'];

interface TrackInteractionParams
  extends Omit<
    Database['public']['Tables']['user_interactions']['Insert'],
    'id' | 'created_at' | 'user_id'
  > {}

async function invokeTrackInteractionRpc(params: TrackInteractionParams) {
  const supabase = createClient();
  const contentType = params.content_type ?? 'unknown';
  const contentSlug = params.content_slug ?? 'unknown';

  const { data, error } = await supabase.rpc('track_user_interaction', {
    p_content_type: contentType,
    p_content_slug: contentSlug,
    p_interaction_type: params.interaction_type,
    ...(params.session_id ? { p_session_id: params.session_id } : {}),
    ...(params.metadata ? { p_metadata: params.metadata as Json } : {}),
  });

  if (error) {
    const message = typeof error.message === 'string' ? error.message : 'Unknown Supabase error';
    logger.error('Failed to track interaction', error, {
      contentType,
      contentSlug,
      interactionType: params.interaction_type,
    });
    throw new Error(message);
  }

  const typedData = (data as TrackInteractionResult | null) ?? {
    success: true,
  };

  return typedData;
}

export async function trackInteraction(params: TrackInteractionParams) {
  return invokeTrackInteractionRpc(params);
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

export async function getSimilarConfigs(params: {
  content_type: string;
  content_slug: string;
  limit?: number;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_similar_content', {
    p_content_type: params.content_type,
    p_content_slug: params.content_slug,
    p_limit: params.limit ?? 6,
  });

  if (error) {
    logger.error('Failed to load similar configs', error, params);
    throw new Error(error.message);
  }

  const typedData = (data as unknown as SimilarContentResult | null) ?? {
    similar_items: [],
    source_item: { slug: params.content_slug, category: params.content_type },
    algorithm_version: 'unknown',
  };

  return {
    ...typedData,
    similar_items: (typedData.similar_items || []).map((item) => ({
      ...item,
      url: `${SITE_URL}/${item.category}/${item.slug}`,
    })),
  };
}

// Config recommendations response (analytics Edge function wrapper)
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

export async function generateConfigRecommendations(answers: {
  useCase: string;
  experienceLevel: string;
  toolPreferences: string[];
  integrations?: string[];
  focusAreas?: string[];
}): Promise<ConfigRecommendationsResponse> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_recommendations', {
    p_use_case: answers.useCase,
    p_experience_level: answers.experienceLevel,
    p_tool_preferences: answers.toolPreferences,
    p_integrations: answers.integrations ?? [],
    p_focus_areas: answers.focusAreas ?? [],
    p_limit: 20,
  });

  if (error) {
    logger.error('Failed to generate config recommendations', error, {
      useCase: answers.useCase,
      experienceLevel: answers.experienceLevel,
    });
    throw new Error(error.message);
  }

  const typedData = (data as unknown as RecommendationsPayload | null) ?? {
    results: [],
    summary: null,
    algorithm: 'unknown',
    totalMatches: 0,
  };

  const responseId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return {
    success: true,
    recommendations: {
      ...typedData,
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

// Newsletter analytics
export type NewsletterEventType =
  | 'modal_shown'
  | 'modal_dismissed'
  | 'signup_success'
  | 'signup_error'
  | 'scroll_trigger_shown'
  | 'exit_intent_shown'
  | 'footer_cta_shown';

export async function trackNewsletterEvent(
  eventType: NewsletterEventType,
  metadata?: {
    source?: string;
    error?: string;
    ctaVariant?: string;
    copyTrigger?: string;
    [key: string]: unknown;
  }
) {
  return invokeTrackInteractionRpc({
    content_type: 'newsletter',
    content_slug: 'newsletter_cta',
    interaction_type: 'click',
    session_id: null,
    metadata: {
      event_type: eventType,
      source: metadata?.source,
      ...metadata,
    },
  });
}

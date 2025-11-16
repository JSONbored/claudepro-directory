/**
 * Edge Function Client - Generic client for all Supabase Edge Functions
 * Consolidated pattern for analytics, reputation, and future Edge calls (SHA-4198)
 */

import {
  generateConfigRecommendationsAction,
  getSimilarConfigsAction,
  type TrackInteractionParams,
  trackInteractionAction,
  trackNewsletterEventAction,
  trackUsageAction,
} from '@/src/lib/actions/pulse.actions';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import type { Json } from '@/src/types/database.types';
import type { ContentCategory } from '@/src/types/database-overrides';

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

export async function trackInteraction(params: TrackInteractionParams): Promise<void> {
  const result = await trackInteractionAction(params);
  if (result?.serverError) {
    logger.warn('trackInteraction failed', { error: result.serverError });
  }
}

export async function getSimilarConfigs(params: {
  content_type: ContentCategory;
  content_slug: string;
  limit?: number;
}) {
  const result = await getSimilarConfigsAction(params);
  const data = result?.data;

  if (!data) {
    return {
      similar_items: [],
      source_item: { slug: params.content_slug, category: params.content_type },
      algorithm_version: 'unknown',
    };
  }

  return {
    ...data,
    similar_items: (data.similar_items || []).map((item) => ({
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
  const result = await generateConfigRecommendationsAction(answers);
  const payload = result?.data;

  if (!payload) {
    // Return error response if action failed
    return {
      success: false,
      recommendations: {
        results: [],
        totalMatches: 0,
        algorithm: 'unknown',
        summary: {},
        answers: {
          useCase: answers.useCase,
          experienceLevel: answers.experienceLevel,
          toolPreferences: answers.toolPreferences,
          integrations: answers.integrations ?? [],
          focusAreas: answers.focusAreas ?? [],
        },
        id: `error_${Date.now()}`,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  return {
    success: payload.success,
    recommendations: {
      ...payload.recommendations,
      results:
        payload.recommendations.results?.map((item) => ({
          ...item,
          url: `${SITE_URL}/${item.category}/${item.slug}`,
        })) ?? [],
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
  const result = await trackNewsletterEventAction({ eventType, metadata });
  if (result?.serverError) {
    logger.warn('trackNewsletterEvent failed', { error: result.serverError, eventType });
  }
}

/**
 * Track content usage (copy, download) - Queue-Based
 * Enqueues to user_interactions queue for batched processing
 */
export async function trackUsage(params: {
  content_type: ContentCategory;
  content_slug: string;
  action_type: 'copy' | 'download_zip' | 'download_markdown' | 'llmstxt';
}): Promise<void> {
  const result = await trackUsageAction(params);
  if (result?.serverError) {
    logger.warn('trackUsage failed', { error: result.serverError });
  }
}

/**
 * Edge Function Client - Generic client for all Supabase Edge Functions
 * Consolidated pattern for analytics, reputation, and future Edge calls (SHA-4198)
 */

import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import type { Database } from '@/src/types/database.types';

const EDGE_BASE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

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

// Analytics-specific wrapper (maintains backwards compatibility)
async function callAnalyticsAction(action: string, data: Record<string, unknown> = {}) {
  return callEdgeFunction('analytics', {
    method: 'POST',
    body: { action, ...data },
    requireAuth: false,
  });
}

export async function trackInteraction(
  params: Omit<
    Database['public']['Tables']['user_interactions']['Insert'],
    'id' | 'created_at' | 'user_id'
  >
) {
  return callAnalyticsAction('trackInteraction', params);
}

export async function getSimilarConfigs(params: {
  content_type: string;
  content_slug: string;
  limit?: number;
}) {
  return callAnalyticsAction('getSimilarConfigs', params);
}

// Config recommendations response (analytics Edge function wrapper)
export interface ConfigRecommendationsResponse {
  success: boolean;
  recommendations: {
    id: string;
    results: Array<{
      category: string;
      slug: string;
      title: string;
      description: string;
    }>;
    answers: {
      useCase: string;
      experienceLevel: string;
      toolPreferences: string[];
      integrations: string[];
      focusAreas: string[];
    };
    generatedAt: string;
  };
}

export async function generateConfigRecommendations(answers: {
  useCase: string;
  experienceLevel: string;
  toolPreferences: string[];
  integrations?: string[];
  focusAreas?: string[];
}): Promise<ConfigRecommendationsResponse> {
  return callAnalyticsAction(
    'generateConfigRecommendations',
    answers
  ) as Promise<ConfigRecommendationsResponse>;
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
  return callAnalyticsAction('trackNewsletterEvent', {
    event_type: eventType,
    source: metadata?.source,
    metadata,
  });
}

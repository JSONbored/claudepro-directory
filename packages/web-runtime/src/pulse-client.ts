'use client';

import type { Database } from '@heyclaude/database-types';
import { getEnvVar } from '@heyclaude/shared-runtime';
import { logger } from './logger.ts';

// Lazy import server actions to avoid client/server boundary issues during HMR
// These are server actions that can be called from client components
// Type matches the server action return type
type ConfigRecommendationsResponse = {
  success: boolean;
  recommendations: {
    results: Database['public']['CompositeTypes']['recommendation_item'][] | null;
    total_matches: number | null;
    algorithm: string | null;
    summary: {
      top_category: string | null;
      avg_match_score: number | null;
      diversity_score: number | null;
    } | null;
    answers: {
      useCase: Database['public']['Enums']['use_case_type'];
      experienceLevel: Database['public']['Enums']['experience_level'];
      toolPreferences: string[];
      integrations: Database['public']['Enums']['integration_type'][];
      focusAreas: Database['public']['Enums']['focus_area_type'][];
    };
    id: string;
    generatedAt: string;
  };
};

const SITE_URL = getEnvVar('NEXT_PUBLIC_SITE_URL') ?? 'https://claudepro.directory';

export type NewsletterEventType =
  | 'modal_shown'
  | 'modal_dismissed'
  | 'signup_success'
  | 'signup_error'
  | 'scroll_trigger_shown'
  | 'exit_intent_shown'
  | 'footer_cta_shown';

export async function trackInteraction(params: {
  interaction_type: Database['public']['Enums']['interaction_type'];
  content_type: Database['public']['Enums']['content_category'] | null;
  content_slug: string | null;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  // Lazy import to avoid HMR issues with server actions
  const { trackInteractionAction } = await import('./actions/pulse.ts');
  const result = await trackInteractionAction({
    interaction_type: params.interaction_type,
    content_type: params.content_type ?? null,
    content_slug: params.content_slug ?? null,
    session_id: params.session_id ?? null,
    metadata: params.metadata ?? null,
  });

  if (result?.serverError) {
    logger.warn('trackInteraction failed', { error: result.serverError });
  }
}

export async function getSimilarConfigs(params: {
  content_type: Database['public']['Enums']['content_category'];
  content_slug: string;
  limit?: number;
}) {
  // Lazy import to avoid HMR issues with server actions
  const { getSimilarConfigsAction } = await import('./actions/pulse.ts');
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
      url: `${SITE_URL}/${item.category ?? 'agents'}/${item.slug ?? ''}`,
    })),
  };
}

export async function generateConfigRecommendations(answers: {
  useCase: Database['public']['Enums']['use_case_type'];
  experienceLevel: Database['public']['Enums']['experience_level'];
  toolPreferences: string[];
  integrations?: Database['public']['Enums']['integration_type'][];
  focusAreas?: Database['public']['Enums']['focus_area_type'][];
}): Promise<ConfigRecommendationsResponse> {
  // Lazy import to avoid HMR issues with server actions
  const { generateConfigRecommendationsAction } = await import('./actions/pulse.ts');
  const result = await generateConfigRecommendationsAction(answers);
  const payload = result?.data;

  if (!payload) {
    // Return error response matching the expected type structure
    return {
      success: false,
      recommendations: {
        results: null,
        total_matches: 0,
        algorithm: 'unknown',
        summary: {
          top_category: null,
          avg_match_score: 0,
          diversity_score: 0,
        },
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

  // The payload from the server action matches the expected type
  // Cast to ensure type compatibility (server action returns the correct shape)
  return payload as ConfigRecommendationsResponse;
}

export async function trackNewsletterEvent(
  eventType: NewsletterEventType,
  metadata?: Record<string, unknown>
) {
  // Lazy import to avoid HMR issues with server actions
  const { trackNewsletterEventAction } = await import('./actions/pulse.ts');
  const result = await trackNewsletterEventAction({ eventType, metadata });
  if (result?.serverError) {
    logger.warn('trackNewsletterEvent failed', undefined, { error: result.serverError, eventType });
  }
}

export async function trackUsage(params: {
  content_type: Database['public']['Enums']['content_category'];
  content_slug: string;
  action_type: 'copy' | 'download_zip' | 'download_markdown' | 'llmstxt' | 'download_mcpb' | 'download_code';
}): Promise<void> {
  // Lazy import to avoid HMR issues with server actions
  const { trackUsageAction } = await import('./actions/pulse.ts');
  const result = await trackUsageAction(params);
  if (result?.serverError) {
    logger.warn('trackUsage failed', { error: result.serverError });
  }
}

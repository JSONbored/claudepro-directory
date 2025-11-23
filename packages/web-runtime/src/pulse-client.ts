import type { Database } from '@heyclaude/database-types';
import { getEnvVar } from '@heyclaude/shared-runtime';
import { logger } from './logger.ts';
import {
  generateConfigRecommendationsAction,
  getSimilarConfigsAction,
  trackInteractionAction,
  trackNewsletterEventAction,
  trackUsageAction,
  type ConfigRecommendationsResponse,
} from './actions/pulse.ts';

const SITE_URL = getEnvVar('NEXT_PUBLIC_SITE_URL') ?? 'https://claudepro.directory';

export type NewsletterEventType =
  | 'modal_shown'
  | 'modal_dismissed'
  | 'signup_success'
  | 'signup_error'
  | 'scroll_trigger_shown'
  | 'exit_intent_shown'
  | 'footer_cta_shown';

type RecommendationsPayload = Database['public']['Functions']['get_recommendations']['Returns'];

export async function trackInteraction(params: {
  interaction_type: Database['public']['Enums']['interaction_type'];
  content_type: Database['public']['Enums']['content_category'] | null;
  content_slug: string | null;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const result = await trackInteractionAction({
    interaction_type: params.interaction_type,
    content_type: params.content_type ?? null,
    content_slug: params.content_slug ?? null,
    session_id: params.session_id ?? null,
    metadata: params.metadata ?? null,
  });

  if (result?.serverError) {
    logger.warn('trackInteraction failed', undefined, { error: result.serverError });
  }
}

export async function getSimilarConfigs(params: {
  content_type: Database['public']['Enums']['content_category'];
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
  const result = await generateConfigRecommendationsAction(answers);
  const payload = result?.data as ConfigRecommendationsResponse | undefined;

  if (!payload) {
    return {
      success: false,
      recommendations: {
        results: [],
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

  const recommendations: RecommendationsPayload = {
    results: payload.recommendations.results ?? null,
    total_matches: payload.recommendations.total_matches ?? 0,
    algorithm: payload.recommendations.algorithm ?? 'unknown',
    summary:
      payload.recommendations.summary ?? {
        top_category: null,
        avg_match_score: 0,
        diversity_score: 0,
      },
  };

  return {
    success: payload.success,
    recommendations: {
      ...recommendations,
      answers: payload.recommendations.answers,
      id: payload.recommendations.id,
      generatedAt: payload.recommendations.generatedAt,
    },
  };
}

export async function trackNewsletterEvent(
  eventType: NewsletterEventType,
  metadata?: Record<string, unknown>
) {
  const result = await trackNewsletterEventAction({ eventType, metadata });
  if (result?.serverError) {
    logger.warn('trackNewsletterEvent failed', undefined, { error: result.serverError, eventType });
  }
}

export async function trackUsage(params: {
  content_type: Database['public']['Enums']['content_category'];
  content_slug: string;
  action_type: 'copy' | 'download_zip' | 'download_markdown' | 'llmstxt' | 'download_mcpb';
}): Promise<void> {
  const result = await trackUsageAction(params);
  if (result?.serverError) {
    logger.warn('trackUsage failed', undefined, { error: result.serverError });
  }
}

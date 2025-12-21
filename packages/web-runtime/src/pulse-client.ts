'use client';

import type {
  use_case_type,
  experience_level,
  integration_type,
  focus_area_type,
  interaction_type,
  content_category,
} from './types/client-safe-enums';
import { logger } from './logger.ts';

// Lazy import server actions to avoid client/server boundary issues during HMR
// These are server actions that can be called from client components
// Import the type from the types file to avoid Next.js serialization issues
// This prevents Next.js from analyzing pulse.ts when only types are needed
import type { ConfigRecommendationsResponse } from './actions/pulse-types.ts';

export type NewsletterEventType =
  | 'modal_shown'
  | 'modal_dismissed'
  | 'signup_success'
  | 'signup_error'
  | 'scroll_trigger_shown'
  | 'exit_intent_shown'
  | 'footer_cta_shown';

export async function trackInteraction(params: {
  interaction_type: interaction_type;
  content_type: content_category | null;
  content_slug: string | null;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  // Lazy import to avoid HMR issues with server actions
  const { trackInteractionAction } = await import('./actions/pulse.ts');

  // Automatically populate session_id if not provided (for better analytics tracking)
  let sessionId = params.session_id;
  if (!sessionId && typeof window !== 'undefined') {
    try {
      const { getOrCreateSessionId } = await import('./logging/client.ts');
      sessionId = getOrCreateSessionId();
    } catch {
      // Silently fail if session ID generation fails (non-critical)
    }
  }

  const result = await trackInteractionAction({
    interaction_type: params.interaction_type,
    content_type: params.content_type ?? null,
    content_slug: params.content_slug ?? null,
    session_id: sessionId ?? null,
    metadata: params.metadata ?? null,
  });

  if (result?.serverError) {
    logger.warn({ error: result.serverError }, 'trackInteraction failed');
  }
}

// getSimilarConfigs removed - embedding generation system has been deleted
// This function was never called in the UI

export async function generateConfigRecommendations(answers: {
  useCase: use_case_type;
  experienceLevel: experience_level;
  toolPreferences: string[];
  integrations?: integration_type[];
  focusAreas?: focus_area_type[];
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
    logger.warn({ error: result.serverError, eventType }, 'trackNewsletterEvent failed');
  }
}

export async function trackUsage(params: {
  content_type: content_category;
  content_slug: string;
  action_type:
    | 'copy'
    | 'download_zip'
    | 'download_markdown'
    | 'llmstxt'
    | 'download_mcpb'
    | 'download_code';
}): Promise<void> {
  // Lazy import to avoid HMR issues with server actions
  const { trackUsageAction } = await import('./actions/pulse.ts');
  const result = await trackUsageAction(params);
  if (result?.serverError) {
    logger.warn({ error: result.serverError }, 'trackUsage failed');
  }
}

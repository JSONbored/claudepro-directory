'use server';

/**
 * Pulse Server Actions
 * Consolidated event tracking and recommendations
 * Moves all tracking-related Supabase RPC calls off the client bundle.
 *
 * Architecture:
 * - Tracking functions (writes): Enqueue to Supabase Queue → Worker processes in batches (hyper-optimized)
 * - Recommendation functions (reads): Use cached data layer (fetchCachedRpc)
 *
 * Egress Optimization:
 * - Events are queued (fast, non-blocking)
 * - Worker processes batches (100 events = 1 batch insert = 98% egress reduction)
 */

import { z } from 'zod';
import { invalidateByKeys, runRpc } from '@/src/lib/actions/action-helpers';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getSimilarContent } from '@/src/lib/data/content/similar';
import { getConfigRecommendations } from '@/src/lib/data/tools/recommendations';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Json } from '@/src/types/database.types';
import type {
  Database,
  GetRecommendationsReturn,
  InteractionType,
} from '@/src/types/database-overrides';
import {
  CONTENT_CATEGORY_VALUES,
  type ContentCategory,
  INTERACTION_TYPE_VALUES,
} from '@/src/types/database-overrides';

// ============================================
// TYPES
// ============================================

export type TrackInteractionParams = Omit<
  Database['public']['Tables']['user_interactions']['Insert'],
  'id' | 'created_at' | 'user_id'
>;

interface TrackSponsoredEventData {
  sponsored_id: string;
  page_url?: string;
  position?: number;
  target_url?: string;
  [key: string]: string | number | undefined;
}

type RecommendationItem = GetRecommendationsReturn['results'][number];
type RecommendationsPayload = GetRecommendationsReturn;

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

// ============================================
// ZOD SCHEMAS
// ============================================

const trackInteractionSchema = z.object({
  content_type: z.string().nullable().optional(),
  content_slug: z.string().nullable().optional(),
  interaction_type: z.enum([...INTERACTION_TYPE_VALUES] as [InteractionType, ...InteractionType[]]),
  session_id: z.string().uuid().optional().nullable(),
  metadata: z.any().optional().nullable(), // Json type - database validates
});

const trackNewsletterEventSchema = z.object({
  eventType: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const trackTerminalCommandSchema = z.object({
  command_id: z.string(),
  action_type: z.string(),
  success: z.boolean(),
  error_reason: z.string().optional(),
  execution_time_ms: z.number().int().nonnegative().optional(),
});

const trackTerminalFormSubmissionSchema = z.object({
  category: z.string(), // contact_category enum (bug, feature, partnership, general, other) - will be fixed when we migrate contact_category enum
  success: z.boolean(),
  error: z.string().optional(),
});

const trackSponsoredImpressionSchema = z.object({
  sponsoredId: z.string(),
  pageUrl: z.string().optional(),
  position: z.number().int().nonnegative().optional(),
});

const trackSponsoredClickSchema = z.object({
  sponsoredId: z.string(),
  targetUrl: z.string().url(),
});

const getSimilarConfigsSchema = z.object({
  content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [ContentCategory, ...ContentCategory[]]),
  content_slug: z.string(),
  limit: z.number().int().positive().max(50).optional(),
});

const generateConfigRecommendationsSchema = z.object({
  useCase: z.string().min(1),
  experienceLevel: z.string().min(1),
  toolPreferences: z.array(z.string()),
  integrations: z.array(z.string()).optional(),
  focusAreas: z.array(z.string()).optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

const TRACKING_QUEUE_NAME = 'user_interactions';

/**
 * Enqueue tracking event to Supabase Queue
 * Fire-and-forget, non-blocking - worker processes in batches
 * Uses type assertion to access pgmq_public schema (not in generated types)
 */
async function enqueueTrackingEvent(event: {
  user_id?: string | null;
  content_type: string | null;
  content_slug: string | null;
  interaction_type: string;
  session_id?: string | null;
  metadata?: Json | null;
}): Promise<void> {
  try {
    const supabase = await createClient();
    // Type assertion needed - pgmq_public schema not in generated types
    // RLS is enabled, so anon/authenticated roles can access pgmq_public.send
    const pgmqClient = (
      supabase as unknown as {
        schema: (schema: string) => {
          rpc: (
            name: string,
            args: Record<string, unknown>
          ) => Promise<{
            data: unknown;
            error: { message: string } | null;
          }>;
        };
      }
    ).schema('pgmq_public');

    const { error } = await pgmqClient.rpc('send', {
      queue_name: TRACKING_QUEUE_NAME,
      msg: {
        user_id: event.user_id ?? null,
        content_type: event.content_type ?? null,
        content_slug: event.content_slug ?? null,
        interaction_type: event.interaction_type,
        session_id: event.session_id ?? null,
        metadata: event.metadata ?? null,
      },
    });

    if (error) {
      // Log but don't throw - tracking is best-effort
      logger.warn('Failed to enqueue tracking event', {
        error: error.message,
        interaction_type: event.interaction_type,
        content_type: event.content_type ?? 'unknown',
      });
    }
  } catch (error) {
    // Silent fail - tracking is best-effort, don't block user actions
    logger.warn('Tracking event enqueue exception', {
      error: error instanceof Error ? error.message : String(error),
      interaction_type: event.interaction_type,
    });
  }
}

async function invalidateSponsoredTrackingCaches(): Promise<void> {
  try {
    await invalidateByKeys({
      invalidateKeys: ['cache.invalidate.sponsored_tracking'],
    });
  } catch (error) {
    logger.error(
      'Failed to invalidate sponsored tracking caches',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// ============================================
// USER INTERACTION TRACKING
// ============================================

/**
 * Track user interaction (view, click, share, etc.)
 * Enqueues to user_interactions queue → Worker processes in batches (hyper-optimized)
 * Fire-and-forget, non-blocking
 */
export const trackInteractionAction = rateLimitedAction
  .metadata({ actionName: 'pulse.trackInteraction', category: 'analytics' })
  .schema(trackInteractionSchema)
  .action(async ({ parsedInput }) => {
    const contentType = parsedInput.content_type ?? 'unknown';
    const contentSlug = parsedInput.content_slug ?? 'unknown';

    // Get user ID if authenticated (optional - tracking works without auth)
    const { user } = await getAuthenticatedUser({ requireUser: false });
    const userId = user?.id ?? null;

    // Enqueue to queue (fast, non-blocking)
    await enqueueTrackingEvent({
      user_id: userId,
      content_type: contentType,
      content_slug: contentSlug,
      interaction_type: parsedInput.interaction_type,
      session_id: parsedInput.session_id ?? null,
      metadata: parsedInput.metadata ?? null,
    });
  });

/**
 * Track newsletter-specific events
 * Enqueues to queue (hyper-optimized batching)
 */
export const trackNewsletterEventAction = rateLimitedAction
  .metadata({ actionName: 'pulse.trackNewsletterEvent', category: 'analytics' })
  .schema(trackNewsletterEventSchema)
  .action(async ({ parsedInput }) => {
    const metadataPayload: Record<string, unknown> = {
      event_type: parsedInput.eventType,
      ...(parsedInput.metadata ?? {}),
    };

    // Get user ID if authenticated (optional - tracking works without auth)
    const { user } = await getAuthenticatedUser({ requireUser: false });
    const userId = user?.id ?? null;

    // Enqueue to queue (fast, non-blocking)
    await enqueueTrackingEvent({
      user_id: userId,
      content_type: 'newsletter',
      content_slug: 'newsletter_cta',
      interaction_type: 'click',
      session_id: null,
      metadata: metadataPayload as Json,
    });
  });

/**
 * Track contact terminal command execution
 * Used by interactive contact terminal (e.g., typing "help", "report-bug")
 * Enqueues to queue (hyper-optimized batching)
 */
export const trackTerminalCommandAction = rateLimitedAction
  .metadata({ actionName: 'pulse.trackTerminalCommand', category: 'analytics' })
  .schema(trackTerminalCommandSchema)
  .action(async ({ parsedInput }) => {
    // Get user ID if authenticated (optional - tracking works without auth)
    const { user } = await getAuthenticatedUser({ requireUser: false });
    const userId = user?.id ?? null;

    // Enqueue to queue (fast, non-blocking)
    await enqueueTrackingEvent({
      user_id: userId,
      content_type: 'terminal',
      content_slug: 'contact-terminal',
      interaction_type: 'contact_interact',
      session_id: null,
      metadata: {
        command_id: parsedInput.command_id,
        action_type: parsedInput.action_type,
        success: parsedInput.success,
        ...(parsedInput.error_reason && { error_reason: parsedInput.error_reason }),
        ...(parsedInput.execution_time_ms && {
          execution_time_ms: parsedInput.execution_time_ms,
        }),
      } as Json,
    });
  });

/**
 * Track contact form submission
 * Used when contact form is submitted via terminal
 * Enqueues to queue (hyper-optimized batching)
 */
export const trackTerminalFormSubmissionAction = rateLimitedAction
  .metadata({ actionName: 'pulse.trackTerminalFormSubmission', category: 'analytics' })
  .schema(trackTerminalFormSubmissionSchema)
  .action(async ({ parsedInput }) => {
    // Get user ID if authenticated (optional - tracking works without auth)
    const { user } = await getAuthenticatedUser({ requireUser: false });
    const userId = user?.id ?? null;

    // Enqueue to queue (fast, non-blocking)
    await enqueueTrackingEvent({
      user_id: userId,
      content_type: 'terminal',
      content_slug: 'contact-form',
      interaction_type: 'contact_submit',
      session_id: null,
      metadata: {
        category: parsedInput.category,
        success: parsedInput.success,
        ...(parsedInput.error && { error: parsedInput.error }),
      } as Json,
    });
  });

// ============================================
// SPONSORED CONTENT TRACKING
// ============================================

/**
 * Track sponsored content impression
 * Fire-and-forget, best-effort tracking
 * Direct RPC call (write operation, no caching)
 */
export const trackSponsoredImpression = rateLimitedAction
  .metadata({ actionName: 'pulse.trackSponsoredImpression', category: 'analytics' })
  .schema(trackSponsoredImpressionSchema)
  .action(async ({ parsedInput }) => {
    const eventData: TrackSponsoredEventData = {
      sponsored_id: parsedInput.sponsoredId,
      page_url: parsedInput.pageUrl || '',
      position: parsedInput.position ?? 0,
    };

    await runRpc<void>(
      'track_sponsored_event',
      {
        p_event_type: 'impression',
        p_user_id: '',
        p_data: eventData,
      },
      {
        action: 'pulse.trackSponsoredImpression.rpc',
        meta: {
          sponsoredId: parsedInput.sponsoredId,
          pageUrl: parsedInput.pageUrl ?? null,
        },
      }
    );
    await invalidateSponsoredTrackingCaches();
  });

/**
 * Track sponsored content click
 * Fire-and-forget, best-effort tracking
 * Direct RPC call (write operation, no caching)
 */
export const trackSponsoredClick = rateLimitedAction
  .metadata({ actionName: 'pulse.trackSponsoredClick', category: 'analytics' })
  .schema(trackSponsoredClickSchema)
  .action(async ({ parsedInput }) => {
    const eventData: TrackSponsoredEventData = {
      sponsored_id: parsedInput.sponsoredId,
      target_url: parsedInput.targetUrl,
    };

    await runRpc<void>(
      'track_sponsored_event',
      {
        p_event_type: 'click',
        p_user_id: '',
        p_data: eventData,
      },
      {
        action: 'pulse.trackSponsoredClick.rpc',
        meta: {
          sponsoredId: parsedInput.sponsoredId,
          targetUrl: parsedInput.targetUrl,
        },
      }
    );
    await invalidateSponsoredTrackingCaches();
  });

// ============================================
// CONTENT RECOMMENDATIONS
// ============================================

/**
 * Get similar content/configs for a given item
 * Returns similar items based on content type and slug
 * Uses cached data layer (fetchCachedRpc via getSimilarContent)
 */
export const getSimilarConfigsAction = rateLimitedAction
  .metadata({ actionName: 'pulse.getSimilarConfigs', category: 'analytics' })
  .schema(getSimilarConfigsSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await getSimilarContent({
        contentType: parsedInput.content_type,
        contentSlug: parsedInput.content_slug,
        ...(parsedInput.limit ? { limit: parsedInput.limit } : {}),
      });
    } catch (error) {
      // getSimilarContent uses fetchCachedRpc which should return fallback,
      // but if it throws, we catch it here and return null
      const normalized = normalizeError(error, 'Failed to get similar configs');
      const logContext: Record<string, string | number | boolean> = {
        contentType: parsedInput.content_type,
        contentSlug: parsedInput.content_slug,
      };
      if (parsedInput.limit !== undefined) {
        logContext.limit = parsedInput.limit;
      }
      logger.error('getSimilarConfigsAction: getSimilarContent threw', normalized, logContext);
      return null;
    }
  });

/**
 * Generate personalized config recommendations based on quiz answers
 * Returns recommendations with match scores and reasoning
 * Uses cached data layer (fetchCachedRpc via getConfigRecommendations)
 */
export const generateConfigRecommendationsAction = rateLimitedAction
  .metadata({ actionName: 'pulse.generateConfigRecommendations', category: 'analytics' })
  .schema(generateConfigRecommendationsSchema)
  .action(async ({ parsedInput }) => {
    try {
      const data = await getConfigRecommendations({
        useCase: parsedInput.useCase,
        experienceLevel: parsedInput.experienceLevel,
        toolPreferences: parsedInput.toolPreferences,
        integrations: parsedInput.integrations ?? [],
        focusAreas: parsedInput.focusAreas ?? [],
      });

      const responseId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const fallback: GetRecommendationsReturn = {
        results: [],
        totalMatches: 0,
        algorithm: 'unknown',
        summary: {},
      };

      const source = data ?? fallback;

      // Wrap transformation in try-catch
      let normalizedResults: RecommendationItem[];
      try {
        normalizedResults = source.results.map((item) => {
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
      } catch (transformError) {
        const normalized = normalizeError(transformError, 'Failed to transform recommendations');
        logger.error('generateConfigRecommendationsAction: transformation failed', normalized, {
          useCase: parsedInput.useCase,
          experienceLevel: parsedInput.experienceLevel,
        });
        normalizedResults = [];
      }

      const payload: RecommendationsPayload = {
        results: normalizedResults,
        totalMatches: source.totalMatches,
        algorithm: source.algorithm,
        summary: source.summary,
      };

      return {
        success: true,
        recommendations: {
          ...payload,
          answers: {
            useCase: parsedInput.useCase,
            experienceLevel: parsedInput.experienceLevel,
            toolPreferences: parsedInput.toolPreferences,
            integrations: parsedInput.integrations ?? [],
            focusAreas: parsedInput.focusAreas ?? [],
          },
          id: responseId,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      // If getConfigRecommendations throws, return error response
      const normalized = normalizeError(error, 'Failed to generate recommendations');
      logger.error(
        'generateConfigRecommendationsAction: getConfigRecommendations threw',
        normalized,
        {
          useCase: parsedInput.useCase,
          experienceLevel: parsedInput.experienceLevel,
        }
      );

      // Return error response instead of throwing (graceful degradation)
      return {
        success: false,
        recommendations: {
          results: [],
          totalMatches: 0,
          algorithm: 'unknown',
          summary: {},
          answers: {
            useCase: parsedInput.useCase,
            experienceLevel: parsedInput.experienceLevel,
            toolPreferences: parsedInput.toolPreferences,
            integrations: parsedInput.integrations ?? [],
            focusAreas: parsedInput.focusAreas ?? [],
          },
          id: `error_${Date.now()}`,
          generatedAt: new Date().toISOString(),
        },
      };
    }
  });

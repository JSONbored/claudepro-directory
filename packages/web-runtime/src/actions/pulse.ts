'use server';

/**
 * Pulse Server Actions
 * Consolidated event tracking and recommendations
 */

import type { Database, Json } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { z } from 'zod';
import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';
// Lazy loaded to avoid server-only side effects
// import { createSupabaseServerClient } from '../supabase/server.ts';
import { optionalAuthAction, rateLimitedAction } from './safe-action.ts';
// import { getSimilarContent } from '../data/content/similar.ts';
// import { getConfigRecommendations } from '../data/tools/recommendations.ts';
// import { enqueuePulseEventServer } from '../pulse.ts';

// Use enum values directly from @heyclaude/database-types Constants
const EXPERIENCE_LEVEL_VALUES = Constants.public.Enums.experience_level;
const FOCUS_AREA_TYPE_VALUES = Constants.public.Enums.focus_area_type;
const INTEGRATION_TYPE_VALUES = Constants.public.Enums.integration_type;
const INTERACTION_TYPE_VALUES = Constants.public.Enums.interaction_type;
const USE_CASE_TYPE_VALUES = Constants.public.Enums.use_case_type;
const CONTACT_ACTION_TYPE_VALUES = Constants.public.Enums.contact_action_type;
const CONTACT_CATEGORY_VALUES = Constants.public.Enums.contact_category;
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

// ============================================
// TYPES
// ============================================

export type TrackInteractionParams = Omit<
  Database['public']['Tables']['user_interactions']['Insert'],
  'id' | 'created_at' | 'user_id'
>;

type RecommendationItem = NonNullable<
  NonNullable<Database['public']['Functions']['get_recommendations']['Returns']>['results']
>[number];
type RecommendationsPayload = NonNullable<
  Database['public']['Functions']['get_recommendations']['Returns']
>;

export interface ConfigRecommendationsResponse {
  success: boolean;
  recommendations: RecommendationsPayload & {
    id: string;
    generatedAt: string;
    answers: {
      useCase: Database['public']['Enums']['use_case_type'];
      experienceLevel: Database['public']['Enums']['experience_level'];
      toolPreferences: string[];
      integrations: Database['public']['Enums']['integration_type'][];
      focusAreas: Database['public']['Enums']['focus_area_type'][];
    };
  };
}

// ============================================
// ZOD SCHEMAS
// ============================================

const trackInteractionSchema = z.object({
  content_type: z
    .enum([...CONTENT_CATEGORY_VALUES] as [
      Database['public']['Enums']['content_category'],
      ...Database['public']['Enums']['content_category'][],
    ])
    .nullable()
    .optional(),
  content_slug: z.string().nullable().optional(),
  interaction_type: z.enum([...INTERACTION_TYPE_VALUES] as [
    Database['public']['Enums']['interaction_type'],
    ...Database['public']['Enums']['interaction_type'][],
  ]),
  session_id: z
    .string()
    .refine(
      (val) => {
        if (val === null || val === undefined || val === '') return true;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(val);
      },
      { message: 'Invalid UUID format' }
    )
    .optional()
    .nullable(),
  metadata: z.unknown().optional().nullable(),
});

const trackNewsletterEventSchema = z.object({
  eventType: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const trackTerminalCommandSchema = z.object({
  command_id: z.string(),
  action_type: z.enum([...CONTACT_ACTION_TYPE_VALUES] as [
    Database['public']['Enums']['contact_action_type'],
    ...Database['public']['Enums']['contact_action_type'][],
  ]),
  success: z.boolean(),
  error_reason: z.string().optional(),
  execution_time_ms: z.number().int().min(0).optional(),
});

const trackTerminalFormSubmissionSchema = z.object({
  category: z.enum([...CONTACT_CATEGORY_VALUES] as [
    Database['public']['Enums']['contact_category'],
    ...Database['public']['Enums']['contact_category'][],
  ]),
  success: z.boolean(),
  error: z.string().optional(),
});

const trackSponsoredImpressionSchema = z.object({
  sponsoredId: z.string(),
  pageUrl: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

const trackSponsoredClickSchema = z.object({
  sponsoredId: z.string(),
  targetUrl: z.string().refine(
    (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid URL format' }
  ),
});

const trackUsageSchema = z.object({
  content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [
    Database['public']['Enums']['content_category'],
    ...Database['public']['Enums']['content_category'][],
  ]),
  content_slug: z.string(),
  action_type: z.enum(['copy', 'download_zip', 'download_markdown', 'llmstxt', 'download_mcpb', 'download_code']),
});

const getSimilarConfigsSchema = z.object({
  content_type: z.enum([...CONTENT_CATEGORY_VALUES] as [
    Database['public']['Enums']['content_category'],
    ...Database['public']['Enums']['content_category'][],
  ]),
  content_slug: z.string(),
  limit: z.number().int().min(1).max(50).optional(),
});

const generateConfigRecommendationsSchema = z.object({
  useCase: z.enum([...USE_CASE_TYPE_VALUES] as [
    Database['public']['Enums']['use_case_type'],
    ...Database['public']['Enums']['use_case_type'][],
  ]),
  experienceLevel: z.enum([...EXPERIENCE_LEVEL_VALUES] as [
    Database['public']['Enums']['experience_level'],
    ...Database['public']['Enums']['experience_level'][],
  ]),
  toolPreferences: z.array(z.string()),
  integrations: z
    .array(
      z.enum([...INTEGRATION_TYPE_VALUES] as [
        Database['public']['Enums']['integration_type'],
        ...Database['public']['Enums']['integration_type'][],
      ])
    )
    .optional(),
  focusAreas: z
    .array(
      z.enum([...FOCUS_AREA_TYPE_VALUES] as [
        Database['public']['Enums']['focus_area_type'],
        ...Database['public']['Enums']['focus_area_type'][],
      ])
    )
    .optional(),
});

// ============================================
// USER INTERACTION TRACKING
// ============================================

export const trackInteractionAction = optionalAuthAction
  .inputSchema(trackInteractionSchema)
  .metadata({ actionName: 'pulse.trackInteraction', category: 'analytics' })
  .action(async ({ parsedInput, ctx }) => {
    const contentType = parsedInput.content_type ?? null;
    const contentSlug = parsedInput.content_slug ?? null;
    const userId = ctx.userId ?? null;

    const { enqueuePulseEventServer } = await import('../pulse.ts');

    await enqueuePulseEventServer({
      user_id: userId,
      content_type: contentType,
      content_slug: contentSlug,
      interaction_type: parsedInput.interaction_type,
      session_id: parsedInput.session_id ?? null,
      metadata: parsedInput.metadata ? (parsedInput.metadata as Json) : null,
    });
  });

export const trackNewsletterEventAction = optionalAuthAction
  .inputSchema(trackNewsletterEventSchema)
  .metadata({ actionName: 'pulse.trackNewsletterEvent', category: 'analytics' })
  .action(async ({ parsedInput, ctx }) => {
    const metadataPayload: Record<string, unknown> = {
      event_type: parsedInput.eventType,
      ...(parsedInput.metadata ?? {}),
    };

    const userId = ctx.userId ?? null;

    const { enqueuePulseEventServer } = await import('../pulse.ts');

    await enqueuePulseEventServer({
      user_id: userId,
      content_type: null,
      content_slug: 'newsletter_cta',
      interaction_type: 'click',
      session_id: null,
      metadata: metadataPayload as Json,
    });
  });

export const trackTerminalCommandAction = optionalAuthAction
  .inputSchema(trackTerminalCommandSchema)
  .metadata({ actionName: 'pulse.trackTerminalCommand', category: 'analytics' })
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.userId ?? null;

    const { enqueuePulseEventServer } = await import('../pulse.ts');

    await enqueuePulseEventServer({
      user_id: userId,
      content_type: null,
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

export const trackTerminalFormSubmissionAction = optionalAuthAction
  .inputSchema(trackTerminalFormSubmissionSchema)
  .metadata({ actionName: 'pulse.trackTerminalFormSubmission', category: 'analytics' })
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.userId ?? null;

    const { enqueuePulseEventServer } = await import('../pulse.ts');

    await enqueuePulseEventServer({
      user_id: userId,
      content_type: null,
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

export const trackUsageAction = optionalAuthAction
  .inputSchema(trackUsageSchema)
  .metadata({ actionName: 'pulse.trackUsage', category: 'analytics' })
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.userId ?? null;
    const interactionType = parsedInput.action_type === 'copy' ? 'copy' : 'download';

    const { enqueuePulseEventServer } = await import('../pulse.ts');

    await enqueuePulseEventServer({
      user_id: userId,
      content_type: parsedInput.content_type,
      content_slug: parsedInput.content_slug,
      interaction_type: interactionType,
      metadata: {
        action_type: parsedInput.action_type,
      } as Json,
    });
  });

// ============================================
// SPONSORED CONTENT TRACKING
// ============================================

export const trackSponsoredImpression = optionalAuthAction
  .inputSchema(trackSponsoredImpressionSchema)
  .metadata({ actionName: 'pulse.trackSponsoredImpression', category: 'analytics' })
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.userId ?? null;

    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const supabase = await createSupabaseServerClient();

    const { data: sponsoredContent, error } = await supabase
      .from('sponsored_content')
      .select('content_type')
      .eq('id', parsedInput.sponsoredId)
      .single();

    if (error || !sponsoredContent) {
      logger.warn({ sponsored_id: parsedInput.sponsoredId,
        error: error?.message ?? 'Not found', }, 'Failed to fetch sponsored content for tracking');
      return;
    }

    const contentType = sponsoredContent.content_type;

    const { enqueuePulseEventServer } = await import('../pulse.ts');

    await enqueuePulseEventServer({
      user_id: userId,
      content_type: contentType,
      content_slug: parsedInput.sponsoredId,
      interaction_type: 'sponsored_impression',
      metadata: {
        event_type: 'impression',
        sponsored_id: parsedInput.sponsoredId,
        page_url: parsedInput.pageUrl,
        position: parsedInput.position,
      } as Json,
    });
  });

export const trackSponsoredClick = optionalAuthAction
  .inputSchema(trackSponsoredClickSchema)
  .metadata({ actionName: 'pulse.trackSponsoredClick', category: 'analytics' })
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.userId ?? null;

    const { createSupabaseServerClient } = await import('../supabase/server.ts');
    const supabase = await createSupabaseServerClient();

    const { data: sponsoredContent, error } = await supabase
      .from('sponsored_content')
      .select('content_type')
      .eq('id', parsedInput.sponsoredId)
      .single();

    if (error || !sponsoredContent) {
      logger.warn({ sponsored_id: parsedInput.sponsoredId,
        error: error?.message ?? 'Not found', }, 'Failed to fetch sponsored content for tracking');
      return;
    }

    const contentType = sponsoredContent.content_type;

    const { enqueuePulseEventServer } = await import('../pulse.ts');

    await enqueuePulseEventServer({
      user_id: userId,
      content_type: contentType,
      content_slug: parsedInput.sponsoredId,
      interaction_type: 'sponsored_click',
      metadata: {
        event_type: 'click',
        sponsored_id: parsedInput.sponsoredId,
        target_url: parsedInput.targetUrl,
      } as Json,
    });
  });

// ============================================
// CONTENT RECOMMENDATIONS
// ============================================

export const getSimilarConfigsAction = rateLimitedAction
  .inputSchema(getSimilarConfigsSchema)
  .metadata({ actionName: 'pulse.getSimilarConfigs', category: 'analytics' })
  .action(async ({ parsedInput }) => {
    try {
      const { getSimilarContent } = await import('../data/content/similar.ts');
      return await getSimilarContent({
        contentType: parsedInput.content_type,
        contentSlug: parsedInput.content_slug,
        ...(parsedInput.limit ? { limit: parsedInput.limit } : {}),
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to get similar configs');
      const logContext: Record<string, string | number | boolean> = {
        contentType: parsedInput.content_type,
        contentSlug: parsedInput.content_slug,
      };
      if (parsedInput['limit'] !== undefined) {
        logContext['limit'] = parsedInput['limit'];
      }
      logger.error({ err: normalized, ...logContext }, 'getSimilarConfigsAction: getSimilarContent threw');
      return null;
    }
  });

export const generateConfigRecommendationsAction = rateLimitedAction
  .inputSchema(generateConfigRecommendationsSchema)
  .metadata({ actionName: 'pulse.generateConfigRecommendations', category: 'analytics' })
  .action(async ({ parsedInput }) => {
    try {
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');
      const data = await getConfigRecommendations({
        useCase: parsedInput.useCase,
        experienceLevel: parsedInput.experienceLevel,
        toolPreferences: parsedInput.toolPreferences,
        integrations: parsedInput.integrations ?? [],
        focusAreas: parsedInput.focusAreas ?? [],
      });

      const responseId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const fallback: NonNullable<
        Database['public']['Functions']['get_recommendations']['Returns']
      > = {
        results: [],
        total_matches: 0,
        algorithm: 'unknown',
        summary: {
          top_category: null,
          avg_match_score: 0,
          diversity_score: 0,
        },
      };

      const source = data ?? fallback;

      // Wrap transformation in try-catch
      let normalizedResults: RecommendationItem[];
      try {
        normalizedResults = (source.results ?? []).map((item) => {
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
        logger.error(
          {
            err: normalized,
            quizInput: {
              // Grouped quiz input values - better for structured logging
              useCase: parsedInput.useCase,
              experienceLevel: parsedInput.experienceLevel,
            },
          },
          'generateConfigRecommendationsAction: transformation failed'
        );
        normalizedResults = [];
      }

      const payload: RecommendationsPayload = {
        results: normalizedResults,
        total_matches: source.total_matches ?? 0,
        algorithm: source.algorithm ?? 'unknown',
        summary: source.summary ?? {
          top_category: null,
          avg_match_score: 0,
          diversity_score: 0,
        },
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
      logger.error({ err: normalized, useCase: parsedInput.useCase,
          experienceLevel: parsedInput.experienceLevel, }, 'generateConfigRecommendationsAction: getConfigRecommendations threw');

      // Return error response instead of throwing (graceful degradation)
      // Match the RecommendationsPayload type structure (snake_case)
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

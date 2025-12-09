'use server';

import { QuizService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../../index.ts';
import { createSupabaseServerClient } from '../../supabase/server.ts';

export interface RecommendationInput {
  experienceLevel: Database['public']['Enums']['experience_level'];
  focusAreas?: Database['public']['Enums']['focus_area_type'][];
  integrations?: Database['public']['Enums']['integration_type'][];
  limit?: number;
  toolPreferences: string[];
  useCase: Database['public']['Enums']['use_case_type'];
  viewerId?: string;
}

/**
 * Get configuration recommendations
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope when viewerId is provided,
 * while still providing per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Cache keys include all input parameters
 * - Not prerendered (runs at request time)
 * @param input
 */
export async function getConfigRecommendations(
  input: RecommendationInput
): Promise<Database['public']['Functions']['get_recommendations']['Returns'] | null> {
  'use cache: private';

  const {
    useCase,
    experienceLevel,
    toolPreferences,
    integrations = [],
    focusAreas = [],
    limit = 20,
    viewerId,
  } = input;

  // Configure cache
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`recommendations-${useCase}-${experienceLevel}`);
  if (viewerId) {
    cacheTag(`recommendations-viewer-${viewerId}`);
  }

  const reqLogger = logger.child({
    operation: 'getConfigRecommendations',
    module: 'data/tools/recommendations',
  });

  try {
    // Can use cookies() inside 'use cache: private'
    const client = await createSupabaseServerClient();
    const service = new QuizService(client);

    const result = await service.getRecommendations({
      p_use_case: useCase,
      p_experience_level: experienceLevel,
      p_tool_preferences: toolPreferences,
      p_integrations: integrations,
      p_focus_areas: focusAreas,
      p_limit: limit,
      ...(viewerId ? { p_viewer_id: viewerId } : {}),
    });

    reqLogger.info(
      {
        useCase,
        experienceLevel,
        resultCount: result.results?.length ?? 0,
        hasViewer: Boolean(viewerId),
      },
      'getConfigRecommendations: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      { err: errorForLogging, useCase, experienceLevel, hasViewer: Boolean(viewerId) },
      'getConfigRecommendations: unexpected error'
    );
    return null;
  }
}

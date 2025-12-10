'use server';

import { QuizService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../../index.ts';
import { createSupabaseServerClient } from '../../supabase/server.ts';

export interface RecommendationInput {
  experienceLevel: Database['public']['Enums']['experience_level'];
  focusAreas?: Array<Database['public']['Enums']['focus_area_type']>;
  integrations?: Array<Database['public']['Enums']['integration_type']>;
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
 * @param input - Recommendation input parameters
 * @returns Promise resolving to recommendations result or null on error
 */
export async function getConfigRecommendations(
  input: RecommendationInput
): Promise<Database['public']['Functions']['get_recommendations']['Returns'] | null> {
  'use cache: private';

  const {
    experienceLevel,
    focusAreas = [],
    integrations = [],
    limit = 20,
    toolPreferences,
    useCase,
    viewerId,
  } = input;

  // Configure cache
  cacheLife({ expire: 1800, revalidate: 300, stale: 60 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`recommendations-${useCase}-${experienceLevel}`);
  if (viewerId) {
    cacheTag(`recommendations-viewer-${viewerId}`);
  }

  const reqLogger = logger.child({
    module: 'data/tools/recommendations',
    operation: 'getConfigRecommendations',
  });

  try {
    // Can use cookies() inside 'use cache: private'
    const client = await createSupabaseServerClient();
    const service = new QuizService(client);

    const result = await service.getRecommendations({
      p_experience_level: experienceLevel,
      p_focus_areas: focusAreas,
      p_integrations: integrations,
      p_limit: limit,
      p_tool_preferences: toolPreferences,
      p_use_case: useCase,
      ...(viewerId ? { p_viewer_id: viewerId } : {}),
    });

    reqLogger.info(
      {
        experienceLevel,
        hasViewer: Boolean(viewerId),
        resultCount: result.results?.length ?? 0,
        useCase,
      },
      'getConfigRecommendations: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      { err: errorForLogging, experienceLevel, hasViewer: Boolean(viewerId), useCase },
      'getConfigRecommendations: unexpected error'
    );
    return null;
  }
}

'use server';

import { QuizService } from '@heyclaude/data-layer';
import {
  type experience_level,
  type focus_area_type,
  type integration_type,
  type use_case_type,
} from '@heyclaude/data-layer/prisma';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../../errors.ts';
import { logger } from '../../index.ts';

export interface RecommendationInput {
  experienceLevel: experience_level;
  focusAreas?: focus_area_type[];
  integrations?: integration_type[];
  limit?: number;
  toolPreferences: string[];
  useCase: use_case_type;
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
    const service = new QuizService();

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
    const normalized = normalizeError(error, 'getConfigRecommendations failed');
    reqLogger.error(
      { err: normalized, experienceLevel, hasViewer: Boolean(viewerId), useCase },
      'getConfigRecommendations: unexpected error'
    );
    return null;
  }
}

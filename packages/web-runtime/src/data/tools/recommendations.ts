'use server';

import { QuizService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cache } from 'react';

import { logger, normalizeError } from '../../index.ts';
import { createSupabaseServerClient } from '../../supabase/server.ts';
import { generateRequestId } from '../../utils/request-id.ts';

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
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because:
 * 1. Recommendations are user-specific and require cookies() for auth when viewerId is provided
 * 2. cookies() cannot be called inside unstable_cache() (Next.js restriction)
 * 3. User-specific data should not be cached across requests anyway
 *
 * React.cache() provides request-level deduplication within the same React Server Component tree,
 * which is safe and appropriate for user-specific data.
 */
export const getConfigRecommendations = cache(
  async (
    input: RecommendationInput
  ): Promise<Database['public']['Functions']['get_recommendations']['Returns'] | null> => {
    const {
      useCase,
      experienceLevel,
      toolPreferences,
      integrations = [],
      focusAreas = [],
      limit = 20,
      viewerId,
    } = input;

    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'getConfigRecommendations',
      module: 'data/tools/recommendations',
    });

    try {
      // Create authenticated client OUTSIDE of any cache scope
      // This is safe because React.cache() only deduplicates within the same request
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

      reqLogger.info('getConfigRecommendations: fetched successfully', {
        useCase,
        experienceLevel,
        resultCount: result.results?.length ?? 0,
        hasViewer: Boolean(viewerId),
      });

      return result;
    } catch (error) {
      const normalized = normalizeError(error, 'getConfigRecommendations failed');
      reqLogger.error('getConfigRecommendations: unexpected error', normalized, {
        useCase,
        experienceLevel,
        hasViewer: Boolean(viewerId),
      });
      return null;
    }
  }
);

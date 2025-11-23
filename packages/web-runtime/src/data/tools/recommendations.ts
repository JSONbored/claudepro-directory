'use server';

import type { Database } from '@heyclaude/database-types';
import { fetchCached } from '../../cache/fetch-cached.ts';
import { QuizService } from '@heyclaude/data-layer';

export interface RecommendationInput {
  useCase: Database['public']['Enums']['use_case_type'];
  experienceLevel: Database['public']['Enums']['experience_level'];
  toolPreferences: string[];
  integrations?: Database['public']['Enums']['integration_type'][];
  focusAreas?: Database['public']['Enums']['focus_area_type'][];
  limit?: number;
  viewerId?: string;
}

export async function getConfigRecommendations(
  input: RecommendationInput
): Promise<Database['public']['Functions']['get_recommendations']['Returns'] | null> {
  const {
    useCase,
    experienceLevel,
    toolPreferences,
    integrations = [],
    focusAreas = [],
    limit = 20,
    viewerId,
  } = input;

  return fetchCached(
    (client) => new QuizService(client).getRecommendations({
        p_use_case: useCase,
        p_experience_level: experienceLevel,
        p_tool_preferences: toolPreferences,
        p_integrations: integrations,
        p_focus_areas: focusAreas,
        p_limit: limit,
        ...(viewerId ? { p_viewer_id: viewerId } : {})
    }),
    {
      key: [
        useCase,
        experienceLevel,
        toolPreferences.join('-') || 'none',
        integrations.join('-') || 'none',
        focusAreas.join('-') || 'none',
        viewerId ?? 'anon',
      ].join('|'),
      tags: ['content', 'quiz'],
      ttlKey: 'cache.quiz.ttl_seconds',
      useAuth: true,
      fallback: null,
      logMeta: {
        useCase,
        experienceLevel,
        toolPreferences: toolPreferences.length,
        integrations: integrations.length,
        focusAreas: focusAreas.length,
      },
    }
  );
}

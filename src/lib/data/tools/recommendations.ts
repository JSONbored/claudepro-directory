'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type {
  ExperienceLevel,
  FocusAreaType,
  GetGetRecommendationsReturn,
  IntegrationType,
  UseCaseType,
} from '@/src/types/database-overrides';

export interface RecommendationInput {
  useCase: UseCaseType;
  experienceLevel: ExperienceLevel;
  toolPreferences: string[];
  integrations?: IntegrationType[];
  focusAreas?: FocusAreaType[];
  limit?: number;
  viewerId?: string;
}

export async function getConfigRecommendations(
  input: RecommendationInput
): Promise<GetGetRecommendationsReturn | null> {
  const {
    useCase,
    experienceLevel,
    toolPreferences,
    integrations = [],
    focusAreas = [],
    limit = 20,
    viewerId,
  } = input;

  return fetchCachedRpc<'get_recommendations', GetGetRecommendationsReturn | null>(
    {
      p_use_case: useCase,
      p_experience_level: experienceLevel,
      p_tool_preferences: toolPreferences,
      p_integrations: integrations,
      p_focus_areas: focusAreas,
      p_limit: limit,
      ...(viewerId ? { p_viewer_id: viewerId } : {}),
    },
    {
      rpcName: 'get_recommendations',
      tags: ['content', 'quiz'],
      ttlKey: 'cache.quiz.ttl_seconds',
      keySuffix: [
        useCase,
        experienceLevel,
        toolPreferences.join('-') || 'none',
        integrations.join('-') || 'none',
        focusAreas.join('-') || 'none',
        viewerId ?? 'anon',
      ].join('|'),
      useAuthClient: true,
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

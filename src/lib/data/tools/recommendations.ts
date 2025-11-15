'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Json } from '@/src/types/database.types';

export interface RecommendationItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags?: string[] | null;
  author?: string | null;
  match_score?: number | null;
  match_percentage?: number | null;
  primary_reason?: string | null;
  rank?: number | null;
  reasons?: Json;
}

export interface RecommendationsResult {
  results: RecommendationItem[];
  totalMatches: number;
  algorithm: string;
  summary: {
    topCategory?: string;
    avgMatchScore?: number;
    diversityScore?: number;
    topTags?: string[];
  };
}

export interface RecommendationInput {
  useCase: string;
  experienceLevel: string;
  toolPreferences: string[];
  integrations?: string[];
  focusAreas?: string[];
  limit?: number;
  viewerId?: string;
}

export async function getConfigRecommendations(
  input: RecommendationInput
): Promise<RecommendationsResult | null> {
  const {
    useCase,
    experienceLevel,
    toolPreferences,
    integrations = [],
    focusAreas = [],
    limit = 20,
    viewerId,
  } = input;

  return fetchCachedRpc<RecommendationsResult | null>(
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

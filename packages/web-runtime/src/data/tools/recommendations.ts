import 'server-only';

import {
  type experience_level,
  type focus_area_type,
  type integration_type,
  type use_case_type,
} from '@heyclaude/data-layer/prisma';
import { type GetRecommendationsReturns } from '@heyclaude/database-types/postgres-types';

import { createDataFunction } from '../cached-data-factory.ts';

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
 */
export const getConfigRecommendations = createDataFunction<
  RecommendationInput,
  GetRecommendationsReturns | null
>({
  serviceKey: 'misc', // Consolidated: QuizService methods moved to MiscService
  methodName: 'getRecommendations',
  module: 'data/tools/recommendations',
  operation: 'getConfigRecommendations',
  transformArgs: (input) => ({
    p_experience_level: input.experienceLevel,
    p_focus_areas: input.focusAreas ?? [],
    p_integrations: input.integrations ?? [],
    p_limit: input.limit ?? 20,
    p_tool_preferences: input.toolPreferences,
    p_use_case: input.useCase,
    ...(input.viewerId ? { p_viewer_id: input.viewerId } : {}),
  }),
  onError: () => null,
  logContext: (input, result) => ({
    experienceLevel: input.experienceLevel,
    hasViewer: Boolean(input.viewerId),
    resultCount: (result as GetRecommendationsReturns | null)?.results?.length ?? 0,
    useCase: input.useCase,
  }),
});

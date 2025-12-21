/**
 * Pulse Action Types - Separated to avoid Next.js serialization issues
 *
 * Types are extracted from pulse.ts to allow type-only imports from client components
 * without triggering Next.js to analyze and serialize the entire pulse.ts module.
 */

import type { GetRecommendationsReturns } from '@heyclaude/database-types/postgres-types';
import type {
  experience_level,
  focus_area_type,
  integration_type,
  use_case_type,
} from '../types/client-safe-enums';

export type RecommendationItem = NonNullable<
  NonNullable<GetRecommendationsReturns>['results']
>[number];

type RecommendationsPayload = NonNullable<GetRecommendationsReturns>;

// Re-export GetRecommendationsReturns for internal use in pulse.ts
export type { GetRecommendationsReturns };

export type { RecommendationsPayload };

export interface ConfigRecommendationsResponse {
  success: boolean;
  recommendations: RecommendationsPayload & {
    id: string;
    generatedAt: string;
    answers: {
      useCase: use_case_type;
      experienceLevel: experience_level;
      toolPreferences: string[];
      integrations: integration_type[];
      focusAreas: focus_area_type[];
    };
  };
}

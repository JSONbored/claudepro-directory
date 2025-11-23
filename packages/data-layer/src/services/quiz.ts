import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type QuizConfigurationResult = Database['public']['Functions']['get_quiz_configuration']['Returns'];
export type RecommendationsResult = Database['public']['Functions']['get_recommendations']['Returns'];

export interface RecommendationInput {
  useCase: Database['public']['Enums']['use_case_type'];
  experienceLevel: Database['public']['Enums']['experience_level'];
  toolPreferences: string[];
  integrations?: Database['public']['Enums']['integration_type'][];
  focusAreas?: Database['public']['Enums']['focus_area_type'][];
  limit?: number;
  viewerId?: string;
}

export class QuizService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getQuizConfiguration() {
    const { data, error } = await this.supabase.rpc('get_quiz_configuration');
    if (error) throw error;
    return data as QuizConfigurationResult;
  }

  async getRecommendations(input: RecommendationInput) {
    const { data, error } = await this.supabase.rpc('get_recommendations', {
      p_use_case: input.useCase,
      p_experience_level: input.experienceLevel,
      p_tool_preferences: input.toolPreferences,
      p_integrations: input.integrations ?? [],
      p_focus_areas: input.focusAreas ?? [],
      p_limit: input.limit ?? 20,
      p_viewer_id: input.viewerId
    });
    if (error) throw error;
    return data as RecommendationsResult;
  }
}

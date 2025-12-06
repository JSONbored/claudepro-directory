/**
 * QuizService - Prisma-based service for quiz and recommendations
 * 
 * This service replaces the Supabase-based QuizService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/quiz.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';

/**
 * Arguments for get_recommendations RPC
 * 
 * @property p_use_case - The use case for recommendations
 * @property p_experience_level - User's experience level
 * @property p_tool_preferences - Array of preferred tools
 * @property p_integrations - Optional array of integrations (defaults to empty array)
 * @property p_focus_areas - Optional array of focus areas (defaults to empty array)
 * @property p_limit - Optional limit for results (defaults to 10)
 */
export interface GetRecommendationsArgs {
  p_use_case: string;
  p_experience_level: string;
  p_tool_preferences: string[];
  p_integrations?: string[];
  p_focus_areas?: string[];
  p_limit?: number;
}

/**
 * Prisma-based QuizService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class QuizService {
  /**
   * Calls the database RPC: get_quiz_configuration
   * 
   * @returns Array of quiz configuration questions
   */
  async getQuizConfiguration() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_quiz_configuration()');
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[QuizService] getQuizConfiguration error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_recommendations
   * 
   * @param args - RPC function arguments
   * @param args.p_use_case - The use case for recommendations
   * @param args.p_experience_level - User's experience level
   * @param args.p_tool_preferences - Array of preferred tools
   * @param args.p_integrations - Optional array of integrations (defaults to empty array)
   * @param args.p_focus_areas - Optional array of focus areas (defaults to empty array)
   * @param args.p_limit - Optional limit for results (defaults to 10)
   * @returns Array of recommendation results
   */
  async getRecommendations(args: GetRecommendationsArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query(
          'SELECT * FROM get_recommendations($1, $2, $3, $4, $5, $6)',
          [
            args.p_use_case,
            args.p_experience_level,
            args.p_tool_preferences,
            args.p_integrations ?? [],
            args.p_focus_areas ?? [],
            args.p_limit ?? 10,
          ]
        );
        return rows;
      });
    } catch (error) {
      console.error('[QuizService] getRecommendations error:', error);
      throw error;
    }
  }
}

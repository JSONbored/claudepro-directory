/**
 * Quiz Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import type {
  GetQuizConfigurationReturns,
  GetRecommendationsArgs,
  GetRecommendationsReturns,
} from '@heyclaude/database-types/postgres-types';
import { BasePrismaService } from './base-prisma-service.ts';

/**
 * Quiz Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class QuizService extends BasePrismaService {
  async getQuizConfiguration(): Promise<GetQuizConfigurationReturns> {
    return this.callRpc<GetQuizConfigurationReturns>(
      'get_quiz_configuration',
      {},
      { methodName: 'getQuizConfiguration' }
    );
  }

  async getRecommendations(
    args: GetRecommendationsArgs
  ): Promise<GetRecommendationsReturns> {
    return this.callRpc<GetRecommendationsReturns>(
      'get_recommendations',
      args,
      { methodName: 'getRecommendations' }
    );
  }
}

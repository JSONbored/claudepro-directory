/**
 * Quiz Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import { type Database } from '@heyclaude/database-types';
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
  async getQuizConfiguration(): Promise<
    Database['public']['Functions']['get_quiz_configuration']['Returns']
  > {
    return this.callRpc<Database['public']['Functions']['get_quiz_configuration']['Returns']>(
      'get_quiz_configuration',
      {},
      { methodName: 'getQuizConfiguration' }
    );
  }

  async getRecommendations(
    args: Database['public']['Functions']['get_recommendations']['Args']
  ): Promise<Database['public']['Functions']['get_recommendations']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_recommendations']['Returns']>(
      'get_recommendations',
      args,
      { methodName: 'getRecommendations' }
    );
  }
}

/**
 * Community Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import { type Database } from '@heyclaude/database-types';
import { BasePrismaService } from './base-prisma-service.ts';

/**
 * Community Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class CommunityService extends BasePrismaService {
  async getCommunityDirectory(
    args: Database['public']['Functions']['get_community_directory']['Args']
  ): Promise<Database['public']['Functions']['get_community_directory']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_community_directory']['Returns']>(
      'get_community_directory',
      args,
      { methodName: 'getCommunityDirectory' }
    );
  }

  async getUserProfile(
    args: Database['public']['Functions']['get_user_profile']['Args']
  ): Promise<Database['public']['Functions']['get_user_profile']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_profile']['Returns']>(
      'get_user_profile',
      args,
      { methodName: 'getUserProfile' }
    );
  }

  async getUserCollectionDetail(
    args: Database['public']['Functions']['get_user_collection_detail']['Args']
  ): Promise<Database['public']['Functions']['get_user_collection_detail']['Returns']> {
    return this.callRpc<Database['public']['Functions']['get_user_collection_detail']['Returns']>(
      'get_user_collection_detail',
      args,
      { methodName: 'getUserCollectionDetail' }
    );
  }
}

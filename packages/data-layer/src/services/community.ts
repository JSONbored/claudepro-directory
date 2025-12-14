/**
 * Community Service - Prisma Implementation
 *
 * Fully modernized for Prisma ORM - no backward compatibility.
 * All function types use Prisma-generated postgres-types.
 */

import type {
  GetCommunityDirectoryArgs,
  GetCommunityDirectoryReturns,
  GetUserProfileArgs,
  GetUserProfileReturns,
  GetUserCollectionDetailArgs,
  GetUserCollectionDetailReturns,
} from '@heyclaude/database-types/postgres-types/functions';
import { BasePrismaService } from './base-prisma-service.ts';

/**
 * Community Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Request-scoped caching (via BasePrismaService)
 * - Prisma-generated types for all function signatures
 */
export class CommunityService extends BasePrismaService {
  async getCommunityDirectory(
    args: GetCommunityDirectoryArgs
  ): Promise<GetCommunityDirectoryReturns> {
    return this.callRpc<GetCommunityDirectoryReturns>(
      'get_community_directory',
      args,
      { methodName: 'getCommunityDirectory' }
    );
  }

  async getUserProfile(
    args: GetUserProfileArgs
  ): Promise<GetUserProfileReturns> {
    return this.callRpc<GetUserProfileReturns>(
      'get_user_profile',
      args,
      { methodName: 'getUserProfile' }
    );
  }

  async getUserCollectionDetail(
    args: GetUserCollectionDetailArgs
  ): Promise<GetUserCollectionDetailReturns> {
    return this.callRpc<GetUserCollectionDetailReturns>(
      'get_user_collection_detail',
      args,
      { methodName: 'getUserCollectionDetail' }
    );
  }
}

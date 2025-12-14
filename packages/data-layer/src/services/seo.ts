/**
 * SEO Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import type {
  GenerateMetadataCompleteArgs,
  GenerateMetadataCompleteReturns,
} from '@heyclaude/database-types/postgres-types';
import { BasePrismaService } from './base-prisma-service.ts';

/**
 * SEO Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class SeoService extends BasePrismaService {
  async generateMetadata(
    args: GenerateMetadataCompleteArgs
  ): Promise<GenerateMetadataCompleteReturns> {
    return this.callRpc<GenerateMetadataCompleteReturns>(
      'generate_metadata_complete',
      args,
      { methodName: 'generateMetadata' }
    );
  }
}

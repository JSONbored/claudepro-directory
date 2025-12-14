/**
 * SEO Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import { type Database } from '@heyclaude/database-types';
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
    args: Database['public']['Functions']['generate_metadata_complete']['Args']
  ): Promise<Database['public']['Functions']['generate_metadata_complete']['Returns']> {
    return this.callRpc<Database['public']['Functions']['generate_metadata_complete']['Returns']>(
      'generate_metadata_complete',
      args,
      { methodName: 'generateMetadata' }
    );
  }
}

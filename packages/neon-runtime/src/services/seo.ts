/**
 * SeoService - Prisma-based service for SEO metadata generation
 * 
 * This service replaces the Supabase-based SeoService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/seo.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';

/**
 * Arguments for generate_metadata_complete RPC
 * 
 * @property p_route - Route path to generate metadata for
 * @property p_include - Optional include parameter (defaults to 'metadata')
 */
export interface GenerateMetadataArgs {
  p_route: string;
  p_include?: string | null;
}

/**
 * Prisma-based SeoService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class SeoService {
  /**
   * Calls the database RPC: generate_metadata_complete
   * 
   * @param args - RPC function arguments
   * @param args.p_route - Route path to generate metadata for
   * @param args.p_include - Optional include parameter (defaults to 'metadata' in database)
   * @returns Generated metadata object or null if not found
   */
  async generateMetadata(args: GenerateMetadataArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter, only pass p_include if provided
        const query =
          args.p_include !== undefined && args.p_include !== null
            ? 'SELECT * FROM generate_metadata_complete($1, $2)'
            : 'SELECT * FROM generate_metadata_complete($1)';
        const params =
          args.p_include !== undefined && args.p_include !== null
            ? [args.p_route, args.p_include]
            : [args.p_route];
        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[SeoService] generateMetadata error:', error);
      throw error;
    }
  }
}

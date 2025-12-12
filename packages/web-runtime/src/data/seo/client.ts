import 'server-only';
import { SeoService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { env } from '@heyclaude/shared-runtime/schemas/env';
import { cacheLife, cacheTag } from 'next/cache';

import { isBuildTime } from '../../build-time.ts';
import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { createSupabaseAnonClient } from '../../supabase/server-anon.ts';

/**
 * Determines if RPC calls should be skipped due to missing environment variables
 * @returns True if environment variables are missing, false otherwise
 */
function shouldSkipRpcCall(): boolean {
  const hasEnvironmentVariables =
    Boolean(env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return !hasEnvironmentVariables;
}

/**
 * Base SEO metadata interface
 */
interface SEOMetadataBase {
  _debug?: {
    category?: string;
    error?: string;
    pattern: string;
    route: string;
    slug?: string;
  };
  description: string;
  keywords: string[];
  openGraphType: 'profile' | 'website';
  robots: {
    follow: boolean;
    index: boolean;
  };
  title: string;
  twitterCard: 'summary_large_image';
}

/**
 * Get SEO metadata for a route (without schemas)
 * Uses 'use cache' to cache SEO metadata. Route becomes part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 *
 * @param route - The route path to generate SEO metadata for
 * @returns SEO metadata object, or null if error occurs
 */
export async function getSEOMetadata(route: string): Promise<null | SEOMetadataBase>;
/**
 * Get SEO metadata for a route (with schemas)
 * Uses 'use cache' to cache SEO metadata. Route becomes part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 *
 * @param route - The route path to generate SEO metadata for
 * @param options - Configuration with includeSchemas=true
 * @param options.includeSchemas - If true, includes JSON-LD structured data schemas
 * @returns SEO metadata with structured data schemas, or null if error occurs
 */
export async function getSEOMetadata(
  route: string,
  options: { includeSchemas: true }
): Promise<null | {
  metadata: SEOMetadataBase;
  schemas: Database['public']['Functions']['generate_metadata_complete']['Returns']['schemas'];
}>;
/**
 * Get SEO metadata for a route
 * Uses 'use cache' to cache SEO metadata. Route becomes part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 *
 * @param route - The route path to generate SEO metadata for
 * @param options - Optional configuration
 * @param options.includeSchemas - If true, includes JSON-LD structured data schemas (default: false)
 * @returns SEO metadata object (with schemas if includeSchemas=true), or null if error occurs
 */
export async function getSEOMetadata(
  route: string,
  options?: { includeSchemas?: boolean }
): Promise<
  | null
  | SEOMetadataBase
  | {
      metadata: SEOMetadataBase;
      schemas: Database['public']['Functions']['generate_metadata_complete']['Returns']['schemas'];
    }
> {
  'use cache';

  const includeSchemas = options?.includeSchemas ?? false;

  if (shouldSkipRpcCall()) {
    return null;
  }

  // Configure cache - use 'static' profile for SEO metadata (changes daily)
  // Route is automatically part of cache key
  cacheLife('static'); // 1 day stale, 6 hours revalidate, 30 days expire
  cacheTag('seo');
  cacheTag(`seo-${route}`);
  if (includeSchemas) {
    cacheTag('structured-data');
  }

  const reqLogger = logger.child({
    module: 'data/seo/client',
    operation: includeSchemas ? 'getSEOMetadataWithSchemas' : 'getSEOMetadata',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      // NOTE: Admin client bypasses RLS and is required here because:
      // 1. This function runs during static site generation (build time)
      // 2. SEO metadata is public data (same for all users, no user-specific content)
      // 3. Admin client provides better performance during build (no RLS overhead)
      // 4. At runtime, we use anon client with RLS for security
      // 5. The data being accessed is non-sensitive (public SEO metadata)
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const service = new SeoService(client);
    const result = await service.generateMetadata({
      p_include: includeSchemas ? 'metadata,schemas' : 'metadata',
      p_route: route,
    });

    if (!result.metadata) {
      reqLogger.debug({ includeSchemas, route }, 'getSEOMetadata: no metadata returned');
      return null;
    }

    const baseMetadata = buildBaseMetadata(result.metadata);

    reqLogger.info(
      {
        hasMetadata: Boolean(result.metadata),
        hasSchemas: includeSchemas && Boolean(result.schemas),
        route,
      },
      `getSEOMetadata: fetched successfully${includeSchemas ? ' with schemas' : ''}`
    );

    // Return wrapped structure if schemas requested, flat structure otherwise
    if (includeSchemas) {
      return {
        metadata: baseMetadata,
        schemas: result.schemas ?? [],
      };
    }

    return baseMetadata;
  } catch (error) {
    const normalized = normalizeError(error, 'getSEOMetadata failed');
    reqLogger.error({ err: normalized, includeSchemas, route }, 'getSEOMetadata failed');
    return null;
  }
}

/**
 * Build base SEO metadata from RPC result
 * Extracted to reduce cognitive complexity
 *
 * @param {NonNullable<Database['public']['Functions']['generate_metadata_complete']['Returns']['metadata']>} metadata - Non-null metadata result from generate_metadata_complete RPC
 * @returns {SEOMetadataBase} Base SEO metadata object
 */
function buildBaseMetadata(
  metadata: NonNullable<
    Database['public']['Functions']['generate_metadata_complete']['Returns']['metadata']
  >
): SEOMetadataBase {
  const debugObject: {
    category?: string;
    error?: string;
    pattern: string;
    route: string;
    slug?: string;
  } = {
    pattern: metadata.debug?.pattern ?? '',
    route: metadata.debug?.route ?? '',
  };

  if (metadata.debug?.category) {
    debugObject.category = metadata.debug.category;
  }
  if (metadata.debug?.slug) {
    debugObject.slug = metadata.debug.slug;
  }
  if (metadata.debug?.error) {
    debugObject.error = metadata.debug.error;
  }

  return {
    description: metadata.description ?? '',
    keywords: metadata.keywords ?? [],
    openGraphType: metadata.open_graph_type === 'profile' ? 'profile' : 'website',
    robots: {
      follow: metadata.robots?.follow ?? true,
      index: metadata.robots?.index ?? true,
    },
    title: metadata.title ?? '',
    twitterCard: 'summary_large_image',
    ...(metadata.debug ? { _debug: debugObject } : {}),
  };
}

/**
 * Get SEO metadata with schemas for a route
 * Convenience wrapper around getSEOMetadata() with includeSchemas=true
 *
 * @param route - The route path to generate SEO metadata for
 * @returns SEO metadata with structured data schemas, or null if error occurs
 */
export async function getSEOMetadataWithSchemas(route: string): Promise<null | {
  metadata: SEOMetadataBase;
  schemas: Database['public']['Functions']['generate_metadata_complete']['Returns']['schemas'];
}> {
  const result = await getSEOMetadata(route, { includeSchemas: true });
  if (!result || 'schemas' in result === false) {
    return null;
  }
  return result as {
    metadata: SEOMetadataBase;
    schemas: Database['public']['Functions']['generate_metadata_complete']['Returns']['schemas'];
  };
}

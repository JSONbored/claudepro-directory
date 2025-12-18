import 'server-only';

import { type GenerateMetadataCompleteReturns } from '@heyclaude/database-types/postgres-types';
import { env } from '@heyclaude/shared-runtime/schemas/env';

import { createCachedDataFunction, generateResourceTags } from '../cached-data-factory.ts';

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

// Internal cached function - declared before overloads
const getSEOMetadataInternal = createCachedDataFunction<
  { route: string; includeSchemas: boolean },
  SEOMetadataBase | { metadata: SEOMetadataBase; schemas: GenerateMetadataCompleteReturns['schemas'] } | null
>({
  serviceKey: 'misc', // Consolidated: SeoService methods moved to MiscService
  methodName: 'generateMetadata',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: (args) => {
    const tags = generateResourceTags('seo', args.route);
    if (args.includeSchemas) {
      tags.push('structured-data');
    }
    return tags;
  },
  module: 'data/seo/client',
  operation: 'getSEOMetadata',
  transformArgs: (args) => ({
    p_include: args.includeSchemas ? 'metadata,schemas' : 'metadata',
    p_route: args.route,
  }),
  transformResult: (result, args) => {
    const rpcResult = result as GenerateMetadataCompleteReturns;
    if (!rpcResult.metadata) {
      return null;
    }

    const baseMetadata = buildBaseMetadata(rpcResult.metadata);

    // Return wrapped structure if schemas requested, flat structure otherwise
    if (args?.includeSchemas) {
      return {
        metadata: baseMetadata,
        schemas: rpcResult.schemas ?? [],
      };
    }

    return baseMetadata;
  },
  onError: () => null,
  logContext: (args) => ({
    includeSchemas: args.includeSchemas,
    route: args.route,
  }),
});

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
  schemas: GenerateMetadataCompleteReturns['schemas'];
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
      schemas: GenerateMetadataCompleteReturns['schemas'];
    }
> {
  if (shouldSkipRpcCall()) {
    return null;
  }

  const includeSchemas = options?.includeSchemas ?? false;
  return await getSEOMetadataInternal({ route, includeSchemas });
}

/***
 * Build base SEO metadata from RPC result
 * Extracted to reduce cognitive complexity
 *
 * @param {NonNullable<GenerateMetadataCompleteReturns['metadata']>} metadata - Non-null metadata result from generate_metadata_complete RPC
 * @returns Base SEO metadata object
 */
function buildBaseMetadata(
  metadata: NonNullable<GenerateMetadataCompleteReturns['metadata']>
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
  schemas: GenerateMetadataCompleteReturns['schemas'];
}> {
  const result = await getSEOMetadata(route, { includeSchemas: true });
  if (!result || 'schemas' in result === false) {
    return null;
  }
  return result as {
    metadata: SEOMetadataBase;
    schemas: GenerateMetadataCompleteReturns['schemas'];
  };
}

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
 * Get SEO metadata for a route
 * Uses 'use cache' to cache SEO metadata. Route becomes part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 * @param route - The route path to generate SEO metadata for
 * @returns SEO metadata object, or null if error occurs or no metadata available
 */
export async function getSEOMetadata(route: string): Promise<null | {
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
}> {
  'use cache';

  if (shouldSkipRpcCall()) {
    return null;
  }

  // Configure cache - use 'static' profile for SEO metadata (changes daily)
  // Route is automatically part of cache key
  cacheLife('static'); // 1 day stale, 6 hours revalidate, 30 days expire
  cacheTag('seo');
  cacheTag(`seo-${route}`);

  const reqLogger = logger.child({
    operation: 'getSEOMetadata',
    module: 'data/seo/client',
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
    const result = await service.generateMetadata({ p_route: route, p_include: 'metadata' });

    if (!result.metadata) {
      reqLogger.debug({ route }, 'getSEOMetadata: no metadata returned');
      return null;
    }

    const metadata = result.metadata;

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

    reqLogger.info(
      { route, hasMetadata: Boolean(metadata) },
      'getSEOMetadata: fetched successfully'
    );

    return {
      title: metadata.title ?? '',
      description: metadata.description ?? '',
      keywords: metadata.keywords ?? [],
      openGraphType: metadata.open_graph_type === 'profile' ? 'profile' : 'website',
      twitterCard: 'summary_large_image',
      robots: {
        index: metadata.robots?.index ?? true,
        follow: metadata.robots?.follow ?? true,
      },
      ...(metadata.debug ? { _debug: debugObject } : {}),
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getSEOMetadata failed');
    reqLogger.error({ err: normalized, route }, 'getSEOMetadata failed');
    return null;
  }
}

/**
 * Get SEO metadata with schemas for a route
 * Uses 'use cache' to cache SEO metadata with schemas. Route becomes part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
 * @param route - The route path to generate SEO metadata for
 * @returns SEO metadata with structured data schemas, or null if error occurs
 */
export async function getSEOMetadataWithSchemas(route: string): Promise<null | {
  metadata: {
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
  };
  schemas: Database['public']['Functions']['generate_metadata_complete']['Returns']['schemas'];
}> {
  'use cache';

  if (shouldSkipRpcCall()) {
    return null;
  }

  // Configure cache - use 'static' profile for SEO metadata with schemas (changes daily)
  // Route is automatically part of cache key
  cacheLife('static'); // 1 day stale, 6 hours revalidate, 30 days expire
  cacheTag('seo');
  cacheTag(`seo-${route}`);
  cacheTag('structured-data');

  const reqLogger = logger.child({
    operation: 'getSEOMetadataWithSchemas',
    module: 'data/seo/client',
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
      p_route: route,
      p_include: 'metadata,schemas',
    });

    if (!result.metadata) {
      reqLogger.debug({ route }, 'getSEOMetadataWithSchemas: no metadata returned');
      return null;
    }

    const metadata = result.metadata;

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

    reqLogger.info(
      { route, hasMetadata: Boolean(metadata), hasSchemas: Boolean(result.schemas) },
      'getSEOMetadataWithSchemas: fetched successfully'
    );

    return {
      metadata: {
        title: metadata.title ?? '',
        description: metadata.description ?? '',
        keywords: metadata.keywords ?? [],
        openGraphType: metadata.open_graph_type === 'profile' ? 'profile' : 'website',
        twitterCard: 'summary_large_image',
        robots: {
          index: metadata.robots?.index ?? true,
          follow: metadata.robots?.follow ?? true,
        },
        ...(metadata.debug ? { _debug: debugObject } : {}),
      },
      schemas: result.schemas,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getSEOMetadataWithSchemas failed');
    reqLogger.error({ err: normalized, route }, 'getSEOMetadataWithSchemas failed');
    return null;
  }
}

import 'server-only';

import { SeoService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { env } from '@heyclaude/shared-runtime/schemas/env';
import { cacheLife, cacheTag } from 'next/cache';

import { isBuildTime } from '../../build-time.ts';
import { getCacheTtl } from '../../cache-config.ts';
import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { createSupabaseAnonClient } from '../../supabase/server-anon.ts';
import { generateRequestId } from '../../utils/request-id.ts';

function shouldSkipRpcCall(): boolean {
  const hasEnvironmentVariables =
    Boolean(env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return !hasEnvironmentVariables;
}

/**
 * Get SEO metadata for a route
 * Uses 'use cache' to cache SEO metadata. Route becomes part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
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

  // Configure cache - route is automatically part of cache key
  const ttl = getCacheTtl('cache.seo.ttl_seconds');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  cacheTag('seo');
  cacheTag(`seo-${route}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getSEOMetadata',
    module: 'data/seo/client',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const service = new SeoService(client);
    const result = await service.generateMetadata({ p_route: route, p_include: 'metadata' });

    if (!result?.metadata) {
      reqLogger.debug('getSEOMetadata: no metadata returned', {
        route,
      });
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

    reqLogger.info('getSEOMetadata: fetched successfully', {
      route,
      hasMetadata: Boolean(metadata),
    });

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
    reqLogger.error('getSEOMetadata failed', normalized, {
      route,
    });
    return null;
  }
}

/**
 * Get SEO metadata with schemas for a route
 * Uses 'use cache' to cache SEO metadata with schemas. Route becomes part of the cache key.
 * This data is public and same for all users, so it can be cached at build time.
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

  // Configure cache - route is automatically part of cache key
  const ttl = getCacheTtl('cache.seo.ttl_seconds');
  cacheLife({ stale: ttl / 2, revalidate: ttl, expire: ttl * 2 });
  cacheTag('seo');
  cacheTag(`seo-${route}`);
  cacheTag('structured-data');

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getSEOMetadataWithSchemas',
    module: 'data/seo/client',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const service = new SeoService(client);
    const result = await service.generateMetadata({
      p_route: route,
      p_include: 'metadata,schemas',
    });

    if (!result?.metadata) {
      reqLogger.debug('getSEOMetadataWithSchemas: no metadata returned', {
        route,
      });
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

    reqLogger.info('getSEOMetadataWithSchemas: fetched successfully', {
      route,
      hasMetadata: Boolean(metadata),
      hasSchemas: Boolean(result.schemas),
    });

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
    reqLogger.error('getSEOMetadataWithSchemas failed', normalized, {
      route,
    });
    return null;
  }
}

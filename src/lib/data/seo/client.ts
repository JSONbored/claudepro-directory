/**
 * SEO Data Layer - Database-First Architecture
 * Uses generate_metadata_complete RPC with edge-layer caching
 */

'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database, Json } from '@/src/types/database.types';

/**
 * Detect if we're in build-time context or missing required environment variables
 * During build, Supabase env vars may be unavailable, so RPC calls will fail
 */
function shouldSkipRpcCall(): boolean {
  // Check if Supabase environment variables are available
  const hasEnvVars =
    process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  // During build-time static generation, env vars may not be available
  // Return null to trigger fallback metadata in generatePageMetadata()
  return !hasEnvVars;
}

/**
 * Get SEO metadata for a route
 * Returns metadata-only response (unwraps metadata from unified structure)
 * During build-time, returns null to trigger fallback metadata
 */
export async function getSEOMetadata(route: string): Promise<{
  title: string;
  description: string;
  keywords: string[];
  openGraphType: 'profile' | 'website';
  twitterCard: 'summary_large_image';
  robots: {
    index: boolean;
    follow: boolean;
  };
  _debug?: {
    pattern: string;
    route: string;
    category?: string;
    slug?: string;
    error?: string;
  };
} | null> {
  // During build or if env vars missing, return null immediately
  // This triggers fallback metadata in generatePageMetadata()
  if (shouldSkipRpcCall()) {
    return null;
  }

  type GenerateMetadataResult =
    Database['public']['Functions']['generate_metadata_complete']['Returns'];

  const result = await fetchCachedRpc<'generate_metadata_complete', GenerateMetadataResult | null>(
    {
      p_route: route,
      p_include: 'metadata',
    },
    {
      rpcName: 'generate_metadata_complete',
      tags: ['seo', `seo-${route}`],
      ttlKey: 'cache.seo.ttl_seconds',
      keySuffix: `metadata-${route}`,
      useAuthClient: false,
      fallback: null,
      logMeta: { route, include: 'metadata' },
    }
  );

  if (!result?.metadata) {
    return null;
  }

  // Unwrap metadata from unified structure and convert snake_case to camelCase for backward compatibility
  const metadata = result.metadata;
  if (!metadata) {
    return null;
  }

  // Build _debug object conditionally to satisfy exactOptionalPropertyTypes
  const debugObj: {
    pattern: string;
    route: string;
    category?: string;
    slug?: string;
    error?: string;
  } = {
    pattern: metadata.debug?.pattern ?? '',
    route: metadata.debug?.route ?? '',
  };

  if (metadata.debug?.category) {
    debugObj.category = metadata.debug.category;
  }
  if (metadata.debug?.slug) {
    debugObj.slug = metadata.debug.slug;
  }
  if (metadata.debug?.error) {
    debugObj.error = metadata.debug.error;
  }

  return {
    title: metadata.title ?? '',
    description: metadata.description ?? '',
    keywords: metadata.keywords ?? [],
    openGraphType: metadata.open_graph_type === 'profile' ? 'profile' : 'website',
    twitterCard: 'summary_large_image', // Always this value
    robots: {
      index: metadata.robots?.index ?? true,
      follow: metadata.robots?.follow ?? true,
    },
    ...(metadata.debug ? { _debug: debugObj } : {}),
  };
}

/**
 * Get SEO metadata and JSON-LD schemas for a route
 * Returns metadata+schemas response (unified structure)
 * During build-time, returns null (no schemas during static generation)
 */
export async function getSEOMetadataWithSchemas(route: string): Promise<{
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    openGraphType: 'profile' | 'website';
    twitterCard: 'summary_large_image';
    robots: {
      index: boolean;
      follow: boolean;
    };
    _debug?: {
      pattern: string;
      route: string;
      category?: string;
      slug?: string;
      error?: string;
    };
  };
  schemas: Json[];
} | null> {
  // During build or if env vars missing, return null immediately
  // Structured data will be empty during build (expected behavior)
  if (shouldSkipRpcCall()) {
    return null;
  }

  type GenerateMetadataResult =
    Database['public']['Functions']['generate_metadata_complete']['Returns'];

  const result = await fetchCachedRpc<'generate_metadata_complete', GenerateMetadataResult | null>(
    {
      p_route: route,
      p_include: 'metadata,schemas',
    },
    {
      rpcName: 'generate_metadata_complete',
      tags: ['seo', `seo-${route}`, 'structured-data'],
      ttlKey: 'cache.seo.ttl_seconds',
      keySuffix: `metadata-schemas-${route}`,
      useAuthClient: false,
      fallback: null,
      logMeta: { route, include: 'metadata,schemas' },
    }
  );

  if (!result?.metadata) {
    return null;
  }

  // Convert snake_case to camelCase for backward compatibility
  const metadata = result.metadata;
  if (!metadata) {
    return null;
  }

  // Build _debug object conditionally to satisfy exactOptionalPropertyTypes
  const debugObj: {
    pattern: string;
    route: string;
    category?: string;
    slug?: string;
    error?: string;
  } = {
    pattern: metadata.debug?.pattern ?? '',
    route: metadata.debug?.route ?? '',
  };

  if (metadata.debug?.category) {
    debugObj.category = metadata.debug.category;
  }
  if (metadata.debug?.slug) {
    debugObj.slug = metadata.debug.slug;
  }
  if (metadata.debug?.error) {
    debugObj.error = metadata.debug.error;
  }

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
      ...(metadata.debug ? { _debug: debugObj } : {}),
    },
    schemas: (result.schemas ?? []) as Json[],
  };
}

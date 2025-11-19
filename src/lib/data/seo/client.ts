/**
 * SEO Data Layer - Database-First Architecture
 * Uses generate_metadata_complete RPC with edge-layer caching
 */

'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { GenerateMetadataCompleteReturn } from '@/src/types/database-overrides';

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
 * Returns metadata-only response (discriminated union case 1)
 * During build-time, returns null to trigger fallback metadata
 */
export async function getSEOMetadata(
  route: string
): Promise<GenerateMetadataCompleteReturn | null> {
  // During build or if env vars missing, return null immediately
  // This triggers fallback metadata in generatePageMetadata()
  if (shouldSkipRpcCall()) {
    return null;
  }

  return fetchCachedRpc<'generate_metadata_complete', GenerateMetadataCompleteReturn | null>(
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
}

/**
 * Get SEO metadata and JSON-LD schemas for a route
 * Returns metadata+schemas response (discriminated union case 2)
 * During build-time, returns null (no schemas during static generation)
 */
export async function getSEOMetadataWithSchemas(
  route: string
): Promise<GenerateMetadataCompleteReturn | null> {
  // During build or if env vars missing, return null immediately
  // Structured data will be empty during build (expected behavior)
  if (shouldSkipRpcCall()) {
    return null;
  }

  return fetchCachedRpc<'generate_metadata_complete', GenerateMetadataCompleteReturn | null>(
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
}

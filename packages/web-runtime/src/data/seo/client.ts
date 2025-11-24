import type { Database } from '@heyclaude/database-types';
import { fetchCached } from '../../cache/fetch-cached.ts';
import { SeoService } from '@heyclaude/data-layer';

function shouldSkipRpcCall(): boolean {
  const hasEnvVars =
    process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  return !hasEnvVars;
}

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
  if (shouldSkipRpcCall()) {
    return null;
  }

  const result = await fetchCached(
    (client) => new SeoService(client).generateMetadata({ p_route: route, p_include: 'metadata' }),
    {
      key: `metadata-${route}`,
      tags: ['seo', `seo-${route}`],
      ttlKey: 'cache.seo.ttl_seconds',
      fallback: null,
      logMeta: { route, include: 'metadata' },
    }
  );

  if (!result?.metadata) {
    return null;
  }

  const metadata = result.metadata;
  if (!metadata) {
    return null;
  }

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
    twitterCard: 'summary_large_image',
    robots: {
      index: metadata.robots?.index ?? true,
      follow: metadata.robots?.follow ?? true,
    },
    ...(metadata.debug ? { _debug: debugObj } : {}),
  };
}

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
  schemas: Database['public']['Functions']['generate_metadata_complete']['Returns']['schemas'];
} | null> {
  if (shouldSkipRpcCall()) {
    return null;
  }

  const result = await fetchCached(
    (client) => new SeoService(client).generateMetadata({ p_route: route, p_include: 'metadata,schemas' }),
    {
      key: `metadata-schemas-${route}`,
      tags: ['seo', `seo-${route}`, 'structured-data'],
      ttlKey: 'cache.seo.ttl_seconds',
      fallback: null,
      logMeta: { route, include: 'metadata,schemas' },
    }
  );

  if (!result?.metadata) {
    return null;
  }

  const metadata = result.metadata;
  if (!metadata) {
    return null;
  }

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
    schemas: result.schemas,
  };
}

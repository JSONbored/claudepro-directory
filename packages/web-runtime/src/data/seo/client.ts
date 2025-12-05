import 'server-only';

import { SeoService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { env } from '@heyclaude/shared-runtime/schemas/env';

import { fetchCached } from '../../cache/fetch-cached.ts';

function shouldSkipRpcCall(): boolean {
  const hasEnvironmentVariables =
    Boolean(env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return !hasEnvironmentVariables;
}

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
  if (shouldSkipRpcCall()) {
    return null;
  }

  const result = await fetchCached(
    (client) => new SeoService(client).generateMetadata({ p_route: route, p_include: 'metadata' }),
    {
      keyParts: ['seo-metadata', route],
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
}

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
  if (shouldSkipRpcCall()) {
    return null;
  }

  const result = await fetchCached(
    (client) =>
      new SeoService(client).generateMetadata({ p_route: route, p_include: 'metadata,schemas' }),
    {
      keyParts: ['seo-metadata-schemas', route],
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
}

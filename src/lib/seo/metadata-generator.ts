/**
 * Metadata Generator - Edge Function Architecture
 * Calls metadata-api edge function (cached 24hrs) instead of direct RPC
 * Replaces: 766 lines of TypeScript route classification + template logic
 */

import type { Metadata } from 'next';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { generateOGImageUrl, OG_IMAGE_DIMENSIONS } from '@/src/lib/og/url-generator';

const METADATA_API_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/metadata-api`;

interface MetadataContext {
  params?: Record<string, string | string[]>;
  [key: string]: unknown;
}

interface MetadataAPIResponse {
  title: string;
  description: string;
  keywords: string[];
  openGraphType: 'website' | 'article';
  twitterCard: string;
  robots: { index: boolean; follow: boolean };
  authors?: Array<{ name: string }> | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  shouldAddLlmsTxt: boolean;
  isOverride: boolean;
}

async function fetchMetadataFromAPI(route: string): Promise<MetadataAPIResponse> {
  const url = `${METADATA_API_URL}?route=${encodeURIComponent(route)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 86400 }, // 24hr Next.js cache (matches edge function cache)
    });

    if (!response.ok) {
      throw new Error(`Metadata API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error(`Failed to fetch metadata from edge function for route: ${route}`, error as Error);
    throw error;
  }
}

export async function generatePageMetadata(
  route: string,
  context?: MetadataContext
): Promise<Metadata> {
  // Resolve route with params if provided
  let resolvedRoute = route;
  if (context?.params) {
    for (const [key, value] of Object.entries(context.params)) {
      const paramValue = Array.isArray(value) ? value[0] : value;
      if (paramValue) {
        resolvedRoute = resolvedRoute.replace(`:${key}`, paramValue);
        resolvedRoute = resolvedRoute.replace(`[${key}]`, paramValue);
      }
    }
  }

  // Fetch metadata from cached edge function
  const config = await fetchMetadataFromAPI(resolvedRoute);

  const canonicalUrl = buildCanonicalUrl(resolvedRoute);
  const ogImageUrl = generateOGImageUrl(resolvedRoute);

  const metadata: Metadata = {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    authors: config.authors || undefined,
    robots: config.robots,
    alternates: {
      canonical: canonicalUrl,
      ...(config.shouldAddLlmsTxt && {
        types: {
          'text/plain': `${new URL(canonicalUrl).pathname}/llms.txt`,
        },
      }),
    },
    openGraph: {
      type: config.openGraphType,
      title: config.title,
      description: config.description,
      url: canonicalUrl,
      siteName: APP_CONFIG.name,
      locale: 'en_US',
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE_DIMENSIONS.width,
          height: OG_IMAGE_DIMENSIONS.height,
          alt: config.title,
        },
      ],
      ...(config.openGraphType === 'article' && {
        publishedTime: config.publishedTime || undefined,
        modifiedTime: config.modifiedTime || undefined,
        authors: config.authors?.map((a) => a.name),
      }),
    },
    twitter: {
      card: config.twitterCard as 'summary' | 'summary_large_image' | 'app' | 'player',
      title: config.title,
      description: config.description,
      images: [ogImageUrl],
      creator: '@JSONbored',
      site: '@JSONbored',
    },
  };

  logger.info(`✅ Metadata generated for ${resolvedRoute}`, {
    titleLength: metadata.title ? String(metadata.title).length : 0,
    descLength: metadata.description?.length || 0,
  });

  return metadata;
}

function buildCanonicalUrl(route: string): string {
  const baseUrl = APP_CONFIG.url;

  if (route === '/') {
    return baseUrl;
  }

  const url = `${baseUrl}${route}`;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

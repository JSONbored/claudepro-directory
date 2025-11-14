/**
 * Metadata Generator - Unified SEO API Architecture
 */

import type { Metadata } from 'next';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { generateOGImageUrl, OG_IMAGE_DIMENSIONS } from '@/src/lib/og/url-generator';
import { fetchMetadata, type SEOMetadata } from '@/src/lib/seo/client';

interface MetadataContext {
  params?: Record<string, string | string[]>;
  [key: string]: unknown;
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

  // Fetch metadata from unified data-api/seo endpoint
  const config: SEOMetadata = await fetchMetadata(resolvedRoute);

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

  // Only log during development, not during production builds
  // This prevents 400+ JSON log lines cluttering the build output
  if (process.env.NODE_ENV === 'development') {
    logger.info(`✅ Metadata generated for ${resolvedRoute}`, {
      titleLength: metadata.title ? String(metadata.title).length : 0,
      descLength: metadata.description?.length || 0,
    });
  }

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

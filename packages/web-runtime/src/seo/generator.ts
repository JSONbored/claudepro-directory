/**
 * Metadata Generator - Unified SEO API Architecture
 */

import { isDevelopment } from '@heyclaude/shared-runtime/schemas/env';

import { getSEOMetadata } from '../data/seo/client.ts';
import { logger } from '../logger.ts';
import type { Metadata } from 'next';
import { APP_CONFIG } from '@heyclaude/shared-runtime';
import { generateOGImageUrl, OG_IMAGE_DIMENSIONS } from './og.ts';

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

  // Fetch metadata from RPC (data layer)
  const seoData = await getSEOMetadata(resolvedRoute);

  if (!seoData) {
    // Fallback to default metadata if RPC returns null
    const canonicalUrl = buildCanonicalUrl(resolvedRoute);
    const ogImageUrl = generateOGImageUrl(resolvedRoute);
    return {
      title: APP_CONFIG.name,
      description: APP_CONFIG.description,
      metadataBase: new URL(APP_CONFIG.url),
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: 'website',
        title: APP_CONFIG.name,
        description: APP_CONFIG.description,
        url: canonicalUrl,
        siteName: APP_CONFIG.name,
        locale: 'en_US',
        images: [
          {
            url: ogImageUrl,
            width: OG_IMAGE_DIMENSIONS.width,
            height: OG_IMAGE_DIMENSIONS.height,
            alt: APP_CONFIG.name,
          },
        ],
      },
      twitter: {
        card: 'summary',
        title: APP_CONFIG.name,
        description: APP_CONFIG.description,
        images: [ogImageUrl],
        creator: '@JSONbored',
        site: '@JSONbored',
      },
    };
  }

  // getSEOMetadata() now always returns the unwrapped metadata object (no discriminated union)
  // The function handles the unified structure internally
  const config = seoData;

  if (!config || typeof config !== 'object') {
    // Fallback if structure is invalid
    const canonicalUrl = buildCanonicalUrl(resolvedRoute);
    const ogImageUrl = generateOGImageUrl(resolvedRoute);
    return {
      title: APP_CONFIG.name,
      description: APP_CONFIG.description,
      metadataBase: new URL(APP_CONFIG.url),
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: 'website',
        title: APP_CONFIG.name,
        description: APP_CONFIG.description,
        url: canonicalUrl,
        siteName: APP_CONFIG.name,
        locale: 'en_US',
        images: [
          {
            url: ogImageUrl,
            width: OG_IMAGE_DIMENSIONS.width,
            height: OG_IMAGE_DIMENSIONS.height,
            alt: APP_CONFIG.name,
          },
        ],
      },
      twitter: {
        card: 'summary',
        title: APP_CONFIG.name,
        description: APP_CONFIG.description,
        images: [ogImageUrl],
        creator: '@JSONbored',
        site: '@JSONbored',
      },
    };
  }

  const canonicalUrl = buildCanonicalUrl(resolvedRoute);
  const ogImageUrl = generateOGImageUrl(resolvedRoute);

  const metadata: Metadata = {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    robots: config.robots,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: config.openGraphType === 'profile' ? 'profile' : 'website',
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
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: [ogImageUrl],
      creator: '@JSONbored',
      site: '@JSONbored',
    },
  };

  // Only log during development, not during production builds
  // This prevents 400+ JSON log lines cluttering the build output
  if (isDevelopment) {
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

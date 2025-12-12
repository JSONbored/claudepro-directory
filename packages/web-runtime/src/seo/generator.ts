/**
 * Metadata Generator - Builds Next.js Metadata from SEO data
 * 
 * Simplified version that directly uses getSEOMetadata() and builds Metadata objects.
 */

import { getSEOMetadata } from '../data/seo/client.ts';
import type { Metadata } from 'next';
import { APP_CONFIG } from '@heyclaude/shared-runtime';
import { generateOGImageUrl, OG_IMAGE_DIMENSIONS } from './og.ts';

interface MetadataContext {
  params?: Record<string, string | string[]>;
  [key: string]: unknown;
}

/**
 * Generate page metadata for a route
 * 
 * Resolves route parameters, fetches SEO metadata from the database RPC,
 * and builds a Next.js Metadata object.
 * 
 * @param route - Route pattern (e.g., '/changelog/:slug' or '/changelog/[slug]')
 * @param context - Optional context with params to resolve route
 * @returns Next.js Metadata object
 */
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

  // Fetch metadata from RPC (build-time cached)
  const seoData = await getSEOMetadata(resolvedRoute);

  const canonicalUrl = buildCanonicalUrl(resolvedRoute);
  const ogImageUrl = generateOGImageUrl(resolvedRoute);

  // Fallback to default metadata if RPC returns null
  if (!seoData) {
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

  // Build Metadata from SEO data
  const metadata: Metadata = {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords,
    robots: {
      index: seoData.robots.index,
      follow: seoData.robots.follow,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: seoData.openGraphType === 'profile' ? 'profile' : 'website',
      title: seoData.title,
      description: seoData.description,
      url: canonicalUrl,
      siteName: APP_CONFIG.name,
      locale: 'en_US',
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE_DIMENSIONS.width,
          height: OG_IMAGE_DIMENSIONS.height,
          alt: seoData.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.title,
      description: seoData.description,
      images: [ogImageUrl],
      creator: '@JSONbored',
      site: '@JSONbored',
    },
  };

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

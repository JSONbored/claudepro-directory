/**
 * Metadata Generator - Database-First Architecture
 * ALL business logic in PostgreSQL via generate_metadata_for_route() RPC
 * TypeScript: thin wrapper adding URLs and Next.js type wrapping
 */

import type { Metadata } from 'next';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { generateOGImageUrl, OG_IMAGE_DIMENSIONS } from '@/src/lib/og/url-generator';
import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import { generateMetadataFromDB } from '@/src/lib/seo/metadata-templates';
import { extractContext } from '@/src/lib/seo/pattern-matcher';
import { classifyRoute } from '@/src/lib/seo/route-classifier';

export async function generatePageMetadata(
  route: string,
  context?: MetadataContext
): Promise<Metadata> {
  const classification = classifyRoute(route);

  logger.info(`🔍 Route classified as ${classification.pattern}`, {
    route,
    pattern: classification.pattern,
    confidence: classification.confidence,
  });

  const extractedContext = extractContext(classification, context?.params || {}, context?.item);
  const mergedContext: MetadataContext = {
    ...extractedContext,
    ...context,
  };

  const config = await generateMetadataFromDB(classification.pattern, mergedContext, route);

  const canonicalUrl = buildCanonicalUrl(route, mergedContext);
  const ogImageUrl = generateOGImageUrl(route);

  const metadata: Metadata = {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    authors: config.authors,
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
        publishedTime: config.publishedTime,
        modifiedTime: config.modifiedTime,
        authors: config.authors?.map((a) => a.name),
      }),
    },
    twitter: {
      card: config.twitterCard,
      title: config.title,
      description: config.description,
      images: [ogImageUrl],
      creator: '@JSONbored',
      site: '@JSONbored',
    },
  };

  logger.info(`✅ Metadata generated for ${route}`, {
    pattern: classification.pattern,
    titleLength: metadata.title ? String(metadata.title).length : 0,
    descLength: metadata.description?.length || 0,
  });

  return metadata;
}

export async function generateMetadataFromPattern(
  route: string,
  params?: Record<string, string | string[]>,
  item?: unknown,
  providedContext?: MetadataContext
): Promise<Metadata> {
  const context: MetadataContext = {
    params,
    item: item as MetadataContext['item'],
    ...providedContext,
  };

  return generatePageMetadata(route, context);
}

export async function generateCategoryMetadata(
  category: string,
  categoryConfig: MetadataContext['categoryConfig']
): Promise<Metadata> {
  const context: MetadataContext = {
    params: { category },
    ...(categoryConfig !== undefined && { categoryConfig }),
  };

  return await generatePageMetadata('/:category', context);
}

export async function generateContentMetadata(
  category: string,
  slug: string,
  item: MetadataContext['item'],
  categoryConfig?: MetadataContext['categoryConfig']
): Promise<Metadata> {
  const context: MetadataContext = {
    params: { category, slug },
    ...(item !== undefined && { item }),
    ...(categoryConfig !== undefined && { categoryConfig }),
  };

  return await generatePageMetadata('/:category/:slug', context);
}

function buildCanonicalUrl(route: string, context?: MetadataContext): string {
  const baseUrl = APP_CONFIG.url;
  let path = route;

  if (context?.params) {
    for (const [key, value] of Object.entries(context.params)) {
      const paramValue = Array.isArray(value) ? value[0] : value;
      if (paramValue) {
        path = path.replace(`:${key}`, paramValue);
      }
    }
  }

  if (path === '/') {
    return baseUrl;
  }

  const url = `${baseUrl}${path}`;
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

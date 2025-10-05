/**
 * Metadata Generator
 *
 * Generates Next.js Metadata objects from the centralized metadata registry.
 * Handles static routes, dynamic routes, and AI optimization.
 *
 * October 2025 SEO Optimization:
 * - Multi-engine optimized (Google, Bing, DuckDuckGo)
 * - AI citation ready (ChatGPT, Perplexity, Claude search)
 * - Server-side rendering only (AI bots skip client-side JS)
 *
 * @module lib/seo/metadata-generator
 */

import type { Metadata } from 'next';
import { APP_CONFIG } from '@/src/lib/constants';
import type { MetadataContext, RouteMetadata } from '@/src/lib/seo/metadata-registry';
import { METADATA_DEFAULTS, METADATA_REGISTRY } from '@/src/lib/seo/metadata-registry';
import { buildPageTitle } from '@/src/lib/seo/title-builder';

/**
 * Generate Next.js Metadata from registry configuration
 *
 * @param route - Route path or pattern (e.g., '/', '/trending', '/:category/:slug')
 * @param context - Optional context for dynamic metadata
 * @returns Next.js Metadata object
 *
 * @example
 * ```typescript
 * // Static route
 * export const metadata = await generatePageMetadata('/trending');
 *
 * // Dynamic route with context
 * export async function generateMetadata({ params }) {
 *   const item = await getContentBySlug(params.category, params.slug);
 *   return await generatePageMetadata('/:category/:slug', { params, item });
 * }
 * ```
 */
export async function generatePageMetadata(
  route: string,
  context?: MetadataContext
): Promise<Metadata> {
  // Get metadata config from registry
  const config = METADATA_REGISTRY[route as keyof typeof METADATA_REGISTRY];

  if (!config) {
    // Fallback for unknown routes
    return {
      title: METADATA_DEFAULTS.siteName,
      description: `Page on ${METADATA_DEFAULTS.siteName}`,
    };
  }

  // Build title
  const title = await resolveTitle(config.title, context);

  // Resolve description (may be function or string)
  const description = await resolveValue(config.description, context);

  // Resolve keywords (may be function or array)
  const keywords = config.keywords ? await resolveValue(config.keywords, context) : undefined;

  // Build canonical URL
  const canonicalUrl = buildCanonicalUrl(route, context);

  // OpenGraph metadata - all routes now have this defined with proper type widening
  const ogConfig = config.openGraph as {
    title?: string;
    description?: string;
    type: 'website' | 'article';
  };
  const ogTitle = ogConfig.title || title;
  const ogDescription = ogConfig.description || description;
  const ogType = ogConfig.type;

  // Twitter Card metadata - all routes now have this defined with proper type widening
  const twitterConfig = config.twitter as {
    title?: string;
    description?: string;
    card: 'summary' | 'summary_large_image';
  };
  const twitterTitle = twitterConfig.title || title;
  const twitterDescription = twitterConfig.description || description;
  const twitterCard = twitterConfig.card;

  // Build metadata object with proper fallbacks
  const metadata: Metadata = {
    title,
    description,
    keywords: keywords?.join(', '),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: ogType,
      url: canonicalUrl,
      siteName: METADATA_DEFAULTS.siteName,
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  // Add author if specified and available in context
  if (config.structuredData.author && context?.item?.author) {
    metadata.authors = [{ name: context.item.author }];
  }

  // Add published/modified dates for Article schema
  if (config.aiOptimization?.useArticleSchema && context?.item) {
    const ogMetadata = metadata.openGraph as Record<string, unknown>;
    ogMetadata.type = 'article';

    if (context.item.dateAdded) {
      ogMetadata.publishedTime = context.item.dateAdded;
    }

    if (context.item.lastModified) {
      ogMetadata.modifiedTime = context.item.lastModified;
    }

    if (context.item.author) {
      ogMetadata.authors = [context.item.author];
    }
  }

  return metadata;
}

/**
 * Resolve title from configuration
 * Handles both static and dynamic title configs
 *
 * Production-safe type checking with proper function resolution
 * Compatible with exactOptionalPropertyTypes: true
 */
async function resolveTitle(
  titleConfig: RouteMetadata['title'],
  context?: MetadataContext
): Promise<string> {
  // First check if titleConfig itself is a function (rare but possible)
  if (typeof titleConfig === 'function') {
    const resolved = await titleConfig(context);
    // Type assertion needed to widen Zod-inferred function return type
    return buildPageTitle(
      resolved as { tier: 'home' | 'section' | 'content'; title?: string; section?: string }
    );
  }

  // It's a TitleConfig object - resolve its properties with type narrowing
  const config = titleConfig;

  // Resolve title value (may be function or string or undefined)
  let titleValue: string | undefined;
  if (config.title !== undefined) {
    titleValue =
      typeof config.title === 'function'
        ? await (config.title as (context?: MetadataContext) => string | Promise<string>)(context)
        : (config.title as string);
  }

  // Resolve section value (may be function or string or undefined)
  let sectionValue: string | undefined;
  if (config.section !== undefined) {
    sectionValue =
      typeof config.section === 'function'
        ? await (config.section as (context?: MetadataContext) => string | Promise<string>)(context)
        : (config.section as string);
  }

  // Build title using title-builder.ts with explicit type assertion for compatibility
  return buildPageTitle({
    tier: config.tier,
    title: titleValue as string | undefined,
    section: sectionValue as string | undefined,
  });
}

/**
 * Resolve a value that may be a function or a direct value
 * Handles async functions and promises
 */
async function resolveValue<T>(
  value: T | ((context?: MetadataContext) => T | Promise<T>),
  context?: MetadataContext
): Promise<T> {
  if (typeof value === 'function') {
    return await (value as (context?: MetadataContext) => T | Promise<T>)(context);
  }
  return value;
}

/**
 * Build canonical URL from route and context
 * Handles both static and dynamic routes
 */
function buildCanonicalUrl(route: string, context?: MetadataContext): string {
  let path = route;

  // Replace dynamic segments with actual values
  if (context?.params) {
    for (const [key, value] of Object.entries(context.params)) {
      const segment = Array.isArray(value) ? value.join('/') : value;
      path = path.replace(`:${key}`, segment);
      path = path.replace(`[${key}]`, segment);
      path = path.replace(`[...${key}]`, segment);
    }
  }

  // Remove any remaining parameter markers
  path = path.replace(/\/:\w+/g, '').replace(/\/\[\w+\]/g, '');

  // Ensure path starts with /
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return `${APP_CONFIG.url}${path}`;
}

/**
 * Helper: Generate metadata for dynamic category pages
 * Convenience function for [category]/page.tsx routes
 *
 * Compatible with exactOptionalPropertyTypes: true
 */
export async function generateCategoryMetadata(
  category: string,
  categoryConfig: MetadataContext['categoryConfig']
): Promise<Metadata> {
  // Explicit context construction with proper undefined handling
  const context: MetadataContext = {
    params: { category },
    ...(categoryConfig !== undefined && { categoryConfig }),
  };

  return generatePageMetadata('/:category', context);
}

/**
 * Helper: Generate metadata for content detail pages
 * Convenience function for [category]/[slug]/page.tsx routes
 *
 * Compatible with exactOptionalPropertyTypes: true
 */
export async function generateContentMetadata(
  category: string,
  slug: string,
  item: MetadataContext['item'],
  categoryConfig?: MetadataContext['categoryConfig']
): Promise<Metadata> {
  // Explicit context construction with proper undefined handling
  const context: MetadataContext = {
    params: { category, slug },
    ...(item !== undefined && { item }),
    ...(categoryConfig !== undefined && { categoryConfig }),
  };

  return generatePageMetadata('/:category/:slug', context);
}

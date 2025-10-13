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
import { z } from 'zod';
import { type ValidatedMetadata, validatedMetadataSchema } from '@/src/lib/config/seo-config';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { generateOGImageUrl, OG_IMAGE_DIMENSIONS } from '@/src/lib/og/url-generator';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import type { MetadataContext, RouteMetadata, TitleConfig } from '@/src/lib/seo/metadata-registry';
import {
  applyAIOptimization,
  METADATA_DEFAULTS,
  METADATA_REGISTRY,
} from '@/src/lib/seo/metadata-registry';
import { deriveMetadataFromSchema } from '@/src/lib/seo/schema-metadata-adapter';

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate metadata against SEO quality rules
 * @throws ZodError if validation fails in development
 * @returns Validated metadata or fallback in production
 */
function validateMetadata(
  rawMetadata: Partial<ValidatedMetadata>,
  route: string
): ValidatedMetadata | null {
  try {
    const validated = validatedMetadataSchema.parse(rawMetadata);

    // Log validation success using dedicated metadata monitoring
    logger.metadataValidation(route, true, {
      titleLength: validated.title.length,
      descLength: validated.description.length,
      keywordCount: validated.keywords?.length || 0,
    });

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for logging
      const errors = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);

      // Log validation failure using dedicated metadata monitoring
      logger.metadataValidation(route, false, { errors });

      // In development/test: throw to catch issues immediately
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        throw new Error(
          `Metadata validation failed for ${route}:\n${errors.map((e) => `- ${e}`).join('\n')}`
        );
      }

      // In production: return null to use fallback
      return null;
    }
    throw error;
  }
}

/**
 * Generate fallback metadata for production safety
 * Used when validation fails to ensure pages always have metadata
 */
function generateFallbackMetadata(route: string, context?: MetadataContext): Metadata {
  const siteName = METADATA_DEFAULTS.siteName;
  const fallbackTitle = `${siteName} - Page`;
  const fallbackDescription = `Browse ${siteName} for AI agents, MCP servers, commands, rules, hooks, statuslines, collections, and guides for Claude AI and Claude Code development.`;

  logger.warn(`⚠️ Using fallback metadata for route: ${route}`);

  const canonicalUrl = buildCanonicalUrl(route, context);

  return {
    title: fallbackTitle,
    description: fallbackDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fallbackTitle,
      description: fallbackDescription,
      type: 'website',
      siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: fallbackTitle,
      description: fallbackDescription,
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
}

/**
 * Convert ValidatedMetadata to Next.js Metadata format
 * Adds author, article schema, and other enhancements based on config
 */
function convertToNextMetadata(
  validated: ValidatedMetadata,
  route: string,
  config: RouteMetadata,
  context?: MetadataContext
): Metadata {
  const metadata: Metadata = {
    title: validated.title,
    description: validated.description,
    ...(validated.keywords &&
      validated.keywords.length > 0 && { keywords: validated.keywords.join(', ') }),
    alternates: {
      canonical: validated.canonicalUrl,
      types:
        route === '/:category/:slug' && context?.params?.category && context?.params?.slug
          ? {
              'text/plain': `/${context.params.category}/${context.params.slug}/llms.txt`,
            }
          : undefined,
    },
    openGraph: {
      title: validated.openGraph.title,
      description: validated.openGraph.description,
      type: validated.openGraph.type,
      url: validated.canonicalUrl,
      siteName: METADATA_DEFAULTS.siteName,
      images: [
        {
          url: validated.openGraph.image.url,
          width: validated.openGraph.image.width,
          height: validated.openGraph.image.height,
          alt: validated.openGraph.image.alt,
          type: 'image/png',
        },
      ],
    },
    twitter: validated.twitter
      ? {
          card: validated.twitter.card,
          title: validated.twitter.title,
          description: validated.twitter.description,
          images: [
            {
              url: validated.openGraph.image.url,
              width: validated.openGraph.image.width,
              height: validated.openGraph.image.height,
              alt: validated.twitter.title,
            },
          ],
        }
      : undefined,
    robots: validated.robots
      ? {
          index: validated.robots.index,
          follow: validated.robots.follow,
          googleBot: {
            index: validated.robots.index,
            follow: validated.robots.follow,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        }
      : {
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

// ============================================
// SCHEMA DERIVATION HELPERS
// ============================================

/**
 * Get content schema for a given route
 * Extracts category and item from context to derive metadata
 */
function getContentSchemaForRoute(
  route: string,
  context?: MetadataContext
): { category: ContentCategory; schema: Record<string, unknown> } | null {
  // Extract category from route pattern
  if (route === '/:category/:slug' && context?.params?.category && context?.item) {
    const category = context.params.category as ContentCategory;
    return {
      category,
      schema: context.item as Record<string, unknown>,
    };
  }

  return null;
}

/**
 * Generate smart default metadata for unknown routes
 * Provides SEO-compliant fallback when schema + registry both miss
 */
function generateSmartDefaultMetadata(route: string, context?: MetadataContext): Metadata {
  const siteName = METADATA_DEFAULTS.siteName;

  // Parse route to generate sensible title
  const pathParts = route.split('/').filter(Boolean);
  const pageName = pathParts[pathParts.length - 1]?.replace(/-/g, ' ').replace(/:/g, '') || 'Page';
  const title = `${pageName.charAt(0).toUpperCase() + pageName.slice(1)} - ${siteName}`;

  const description = `Explore ${pageName} on ${siteName}. Discover AI agents, MCP servers, commands, rules, hooks, statuslines, collections, and guides for Claude AI development.`;

  const canonicalUrl = buildCanonicalUrl(route, context);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
}

// ============================================
// MAIN METADATA GENERATOR
// ============================================

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
  // TIER 1: Try schema derivation (primary for content detail pages)
  const schemaData = getContentSchemaForRoute(route, context);
  if (schemaData) {
    const derived = deriveMetadataFromSchema(schemaData.category, schemaData.schema);
    if (derived) {
      // Schema-derived content - bypass registry, use derived values
      logger.info(`📊 Schema-derived metadata for ${route}`, {
        category: schemaData.category,
      });
      // Continue to registry config to get OG/Twitter structure
    }
  }

  // TIER 2: Get metadata config from registry
  const config = METADATA_REGISTRY[route as keyof typeof METADATA_REGISTRY];

  if (!config) {
    // TIER 3: Smart defaults for unknown routes
    return generateSmartDefaultMetadata(route, context);
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

  // Build raw metadata object for validation
  const ogImageUrl = generateOGImageUrl(canonicalUrl);

  const rawMetadata: Partial<ValidatedMetadata> = {
    title,
    description,
    ...(keywords && { keywords }), // Only add if defined - exactOptionalPropertyTypes requires explicit undefined handling
    canonicalUrl,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: ogType,
      image: {
        url: ogImageUrl,
        width: OG_IMAGE_DIMENSIONS.width,
        height: OG_IMAGE_DIMENSIONS.height,
        alt: ogTitle,
      },
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
    },
    robots:
      'robots' in config && config.robots
        ? config.robots
        : {
            index: true,
            follow: true,
          },
  };

  // Validate metadata (throws in dev, returns null in prod on failure)
  const validated = validateMetadata(rawMetadata, route);

  // If validation failed in production, use fallback
  if (!validated) {
    return generateFallbackMetadata(route, context);
  }

  // Apply AI optimization if enabled
  let optimizedMetadata = validated;
  if (config.aiOptimization) {
    optimizedMetadata = applyAIOptimization(
      validated,
      config.aiOptimization,
      context
    ) as ValidatedMetadata;
  }

  // Convert validated metadata to Next.js format
  return convertToNextMetadata(optimizedMetadata, route, config, context);
}

/**
 * Resolve title from configuration
 * Handles both static strings and dynamic title functions
 *
 * Production-safe type checking with proper function resolution
 * Compatible with exactOptionalPropertyTypes: true
 */
async function resolveTitle(titleConfig: TitleConfig, context?: MetadataContext): Promise<string> {
  // Title is now either a string or a function that returns a string
  if (typeof titleConfig === 'function') {
    return await titleConfig(context);
  }

  // It's a static string
  return titleConfig as string;
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
 *
 * @param route - Route pattern (e.g., '/:category/:slug' or '/submit')
 * @param context - Optional context with params
 * @returns Fully qualified canonical URL (no trailing slash)
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

  // Remove trailing slash (except for homepage)
  // SEO best practice: consistent URL format prevents duplicate content
  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1);
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

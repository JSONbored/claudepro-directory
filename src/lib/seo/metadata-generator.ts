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
import { isValidCategory } from '@/src/lib/config/category-config';
import { type ValidatedMetadata, validatedMetadataSchema } from '@/src/lib/config/seo-config';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { generateOGImageUrl, OG_IMAGE_DIMENSIONS } from '@/src/lib/og/url-generator';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';
import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import { getCurrentYear, METADATA_DEFAULTS } from '@/src/lib/seo/metadata-registry';
import { getTemplate } from '@/src/lib/seo/metadata-templates';
import { extractContext } from '@/src/lib/seo/pattern-matcher';
import { classifyRoute } from '@/src/lib/seo/route-classifier';
import { deriveMetadataFromSchema } from '@/src/lib/seo/schema-metadata-adapter';
import { validateTemplateOutput } from '@/src/lib/seo/validation-schemas';

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
  // Title must be 53-60 chars for validation
  const fallbackTitle = `${siteName} - Browse AI Resources & Tools ${getCurrentYear()}`;
  const fallbackDescription = `Browse ${siteName} for AI agents, MCP servers, commands, rules, hooks, statuslines, collections, and guides for Claude AI and Claude Code development.`;

  logger.warn(`⚠️ Using fallback metadata for route: ${route}`);

  const canonicalUrl = buildCanonicalUrl(route, context);
  // Extract pathname from canonical URL for OG image generation
  // generateOGImageUrl expects a path (e.g., "/agents") not a full URL
  const pathForOG = new URL(canonicalUrl).pathname;
  const ogImageUrl = generateOGImageUrl(pathForOG);

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
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE_DIMENSIONS.width,
          height: OG_IMAGE_DIMENSIONS.height,
          alt: fallbackTitle,
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fallbackTitle,
      description: fallbackDescription,
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE_DIMENSIONS.width,
          height: OG_IMAGE_DIMENSIONS.height,
          alt: fallbackTitle,
        },
      ],
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
// SCHEMA DERIVATION HELPERS
// ============================================

/**
 * Get content schema for a given route
 * Extracts category and item from context to derive metadata
 */
function getContentSchemaForRoute(
  route: string,
  context?: MetadataContext
): { category: CategoryId; schema: Record<string, unknown> } | null {
  // Extract category from route pattern
  if (route === '/:category/:slug' && context?.params?.category && context?.item) {
    const categoryParam = context.params.category;

    // Handle Next.js params which can be string | string[]
    const category = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;

    // Type guard validation (handles undefined from array access)
    if (!(category && isValidCategory(category))) {
      return null;
    }

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

  // Parse route to generate sensible title (must be 53-60 chars)
  const pathParts = route.split('/').filter(Boolean);
  const pageName = pathParts[pathParts.length - 1]?.replace(/-/g, ' ').replace(/:/g, '') || 'Page';
  const capitalizedName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  // Ensure title meets 53-60 char requirement
  // Formula: PageName - Claude Pro Directory - AI Resources [YEAR]
  const baseSuffix = ` - AI Resources ${getCurrentYear()}`;
  let title = `${capitalizedName} - ${siteName}${baseSuffix}`;

  if (title.length > 60) {
    // Truncate page name to fit within 60 chars
    const maxNameLength = 60 - (siteName.length + baseSuffix.length + 3); // 3 for " - "
    const truncatedName = capitalizedName.substring(0, maxNameLength);
    title = `${truncatedName} - ${siteName}${baseSuffix}`;
  } else if (title.length < 53) {
    // If too short, add padding
    title = `${capitalizedName} - ${siteName} - AI Resources & Tools ${getCurrentYear()}`;
    // If still too short, add more descriptive text
    if (title.length < 53) {
      title = `${capitalizedName} - ${siteName} - Browse AI Resources ${getCurrentYear()}`;
    }
  }

  const description = `Explore ${pageName} on ${siteName}. Discover AI agents, MCP servers, commands, rules, hooks, statuslines, collections, and guides for Claude AI development.`;

  const canonicalUrl = buildCanonicalUrl(route, context);
  // Extract pathname from canonical URL for OG image generation
  const pathForOG = new URL(canonicalUrl).pathname;
  const ogImageUrl = generateOGImageUrl(pathForOG);

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
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE_DIMENSIONS.width,
          height: OG_IMAGE_DIMENSIONS.height,
          alt: title,
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE_DIMENSIONS.width,
          height: OG_IMAGE_DIMENSIONS.height,
          alt: title,
        },
      ],
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
// SHARED METADATA BUILDER (DRY)
// ============================================

/**
 * Metadata Components - Input for shared builder
 *
 * Single source of truth for metadata content (title, description, keywords).
 * Builder handles the rest (URLs, OpenGraph, Twitter, validation, conversion).
 */
interface MetadataComponents {
  /** Page title (required) */
  title: string;
  /** Meta description (required) */
  description: string;
  /** SEO keywords (optional) */
  keywords?: string[];
  /** OpenGraph type (default: 'website') */
  openGraphType?: 'website' | 'article';
  /** Twitter card type (default: 'summary_large_image') */
  twitterCard?: 'summary' | 'summary_large_image';
  /** Robots directives (default: { index: true, follow: true }) */
  robots?: {
    index?: boolean;
    follow?: boolean;
    noarchive?: boolean;
    nosnippet?: boolean;
  };
}

/**
 * Build complete Next.js Metadata object from components
 *
 * **SINGLE SOURCE OF TRUTH** for metadata object construction.
 * Both pattern-based and registry-based generation use this builder.
 *
 * **What this function does:**
 * 1. Builds canonical URL
 * 2. Generates OG image URL
 * 3. Constructs raw metadata object (OpenGraph, Twitter, etc.)
 * 4. Validates metadata
 * 5. Converts to Next.js Metadata format
 *
 * **What callers provide:**
 * - Title, description, keywords (the content)
 * - Route and context (for URLs)
 *
 * **Synchronous**: No async operations, optimal for Next.js metadata generation
 *
 * @param components - Metadata content components
 * @param route - Route path for URL generation
 * @param context - Optional context for dynamic data
 * @returns Next.js Metadata object
 *
 * @example
 * ```typescript
 * // Pattern-based usage
 * const template = getTemplate(pattern);
 * const metadata = buildMetadataObject({
 *   title: template.title(context),
 *   description: template.description(context),
 *   keywords: template.keywords(context),
 * }, route, context);
 *
 * // Registry-based usage
 * const metadata = buildMetadataObject({
 *   title: config.title,
 *   description: config.description,
 *   keywords: config.keywords,
 *   openGraphType: config.openGraph.type,
 * }, route, context);
 * ```
 */
/**
 * Build OpenGraph metadata object
 *
 * Constructs OpenGraph metadata with validated content and OG image.
 * Follows OpenGraph protocol standards for social media sharing.
 *
 * @param validated - Validated metadata from Zod schema
 * @param canonicalUrl - Canonical URL for og:url property
 * @returns OpenGraph metadata object for Next.js Metadata
 */
function buildOpenGraphMetadata(
  validated: ValidatedMetadata,
  canonicalUrl: string
): Metadata['openGraph'] {
  return {
    title: validated.openGraph.title,
    description: validated.openGraph.description,
    type: validated.openGraph.type,
    url: canonicalUrl,
    siteName: METADATA_DEFAULTS.siteName,
    images: [
      {
        url: validated.openGraph.image.url,
        width: validated.openGraph.image.width,
        height: validated.openGraph.image.height,
        alt: validated.openGraph.image.alt,
        type: 'image/webp',
      },
    ],
  };
}

/**
 * Build Twitter Card metadata object
 *
 * Constructs Twitter Card metadata for optimal Twitter sharing.
 * Falls back to unvalidated data if validation failed (production graceful degradation).
 *
 * @param validated - Validated metadata from Zod schema (or null if validation failed)
 * @param fallbackTitle - Fallback title if validation failed
 * @param fallbackDescription - Fallback description if validation failed
 * @param fallbackCard - Fallback card type if validation failed
 * @returns Twitter Card metadata object for Next.js Metadata
 */
function buildTwitterMetadata(
  validated: ValidatedMetadata,
  fallbackTitle: string,
  fallbackDescription: string,
  fallbackCard: 'summary' | 'summary_large_image'
): Metadata['twitter'] {
  // Use validated Twitter data if available
  if (validated.twitter) {
    return {
      card: validated.twitter.card,
      title: validated.twitter.title,
      description: validated.twitter.description,
      images: [
        {
          url: validated.openGraph.image.url,
          width: validated.openGraph.image.width,
          height: validated.openGraph.image.height,
          alt: validated.openGraph.image.alt,
        },
      ],
    };
  }

  // Fallback to unvalidated data (production graceful degradation)
  return {
    card: fallbackCard,
    title: fallbackTitle,
    description: fallbackDescription,
    images: [
      {
        url: validated.openGraph.image.url,
        width: validated.openGraph.image.width,
        height: validated.openGraph.image.height,
        alt: fallbackTitle,
      },
    ],
  };
}

/**
 * Build robots directives for search engine crawlers
 *
 * Constructs robots meta tags with enhanced GoogleBot-specific directives.
 * Enables rich snippets, large image previews, and unlimited video previews.
 *
 * **GoogleBot Directives:**
 * - max-snippet: -1 (no limit on text snippet length)
 * - max-image-preview: large (allows large image previews in SERPs)
 * - max-video-preview: -1 (no limit on video preview duration)
 *
 * @param validated - Validated metadata from Zod schema
 * @returns Robots directives object for Next.js Metadata
 */
function buildRobotsDirectives(validated: ValidatedMetadata): Metadata['robots'] {
  if (validated.robots) {
    return {
      ...validated.robots,
      googleBot: {
        index: validated.robots.index ?? true,
        follow: validated.robots.follow ?? true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    };
  }

  // Default: Allow all crawling with enhanced GoogleBot features
  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}

/**
 * Build complete metadata object for Next.js
 *
 * Orchestrates metadata construction by:
 * 1. Building canonical URL and OG image URL
 * 2. Constructing raw metadata object for validation
 * 3. Validating metadata with Zod schemas (throws in dev, graceful in prod)
 * 4. Building final Next.js Metadata object with focused sub-functions
 *
 * **Architecture:**
 * - Single Responsibility: Each sub-function builds one metadata section
 * - Validation Layer: All metadata validated before use (fail-fast in dev)
 * - Graceful Degradation: Fallback metadata in production on validation failure
 *
 * @param components - Metadata components from template generation
 * @param route - Route path for canonical URL construction
 * @param context - Optional metadata context for dynamic routes
 * @returns Complete Next.js Metadata object ready for export
 */
function buildMetadataObject(
  components: MetadataComponents,
  route: string,
  context?: MetadataContext
): Metadata {
  const {
    title,
    description,
    keywords,
    openGraphType = 'website',
    twitterCard = 'summary_large_image',
    robots,
  } = components;

  // Build canonical URL and OG image URL
  const canonicalUrl = buildCanonicalUrl(route, context);
  const pathForOG = new URL(canonicalUrl).pathname;
  const ogImageUrl = generateOGImageUrl(pathForOG);

  // Build raw metadata object for validation
  // ValidatedMetadata robots requires ONLY { index: boolean, follow: boolean }
  const rawMetadata: Partial<ValidatedMetadata> = {
    title,
    description,
    ...(keywords && keywords.length > 0 && { keywords }),
    canonicalUrl,
    openGraph: {
      title,
      description,
      type: openGraphType,
      image: {
        url: ogImageUrl,
        width: OG_IMAGE_DIMENSIONS.width,
        height: OG_IMAGE_DIMENSIONS.height,
        alt: title,
      },
    },
    twitter: {
      card: twitterCard,
      title,
      description,
    },
    robots: robots
      ? {
          index: robots.index ?? true,
          follow: robots.follow ?? true,
        }
      : undefined,
  };

  // Validate metadata (throws in dev, returns null in prod on failure)
  const validated = validateMetadata(rawMetadata, route);

  // If validation failed in production, use fallback
  if (!validated) {
    return generateFallbackMetadata(route, context);
  }

  // Build complete Next.js Metadata object using focused sub-functions
  const metadata: Metadata = {
    title: validated.title,
    description: validated.description,
    ...(validated.keywords &&
      validated.keywords.length > 0 && { keywords: validated.keywords.join(', ') }),
    alternates: {
      canonical: validated.canonicalUrl,
    },
    openGraph: buildOpenGraphMetadata(validated, validated.canonicalUrl),
    twitter: buildTwitterMetadata(validated, title, description, twitterCard),
    robots: buildRobotsDirectives(validated),
  };

  return metadata;
}

// ============================================
// MAIN METADATA GENERATOR
// ============================================

/**
 * Generate Next.js Metadata from registry configuration
 *
 * **PERFORMANCE**: Fully synchronous for optimal build-time optimization
 * Next.js 15 can statically analyze and optimize synchronous metadata exports
 *
 * @param route - Route path or pattern (e.g., '/', '/trending', '/:category/:slug')
 * @param context - Optional context for dynamic metadata
 * @returns Next.js Metadata object
 *
 * @example
 * ```typescript
 * // Static route (no await needed - synchronous)
 * export const metadata = generatePageMetadata('/trending');
 *
 * // Dynamic route with context
 * export async function generateMetadata({ params }) {
 *   const item = await getContentBySlug(params.category, params.slug);
 *   return generatePageMetadata('/:category/:slug', { params, item });
 * }
 * ```
 */
export function generatePageMetadata(route: string, context?: MetadataContext): Metadata {
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

  // TIER 1.5: Try pattern-based generation (NEW - October 2025)
  // Classify route and attempt template-based metadata generation
  const classification = classifyRoute(route);

  // PHASE 3A-3E: All patterns active (migration complete!)
  // Pattern system activated for:
  // - HOMEPAGE route (Phase 3A, confidence = 1.0)
  // - CATEGORY routes (Phase 3A, confidence ≥ 0.9)
  // - CONTENT_DETAIL routes (Phase 3B, confidence ≥ 0.9)
  // - STATIC routes (Phase 3C, confidence ≥ 0.5 - fallback classification)
  // - ACCOUNT routes (Phase 3D, confidence ≥ 1.0)
  // - USER_PROFILE routes (Phase 3E, confidence ≥ 1.0)
  // - TOOL routes (Phase 3E, confidence ≥ 1.0)
  // - AUTH routes (Phase 3E, confidence ≥ 1.0)
  const isHomepagePattern =
    classification.pattern === 'HOMEPAGE' && classification.confidence >= 1.0;
  const isCategoryPattern =
    classification.pattern === 'CATEGORY' && classification.confidence >= 0.9;
  const isContentDetailPattern =
    classification.pattern === 'CONTENT_DETAIL' && classification.confidence >= 0.9;
  const isStaticPattern = classification.pattern === 'STATIC' && classification.confidence >= 0.5;
  const isAccountPattern = classification.pattern === 'ACCOUNT' && classification.confidence >= 1.0;
  const isUserProfilePattern =
    classification.pattern === 'USER_PROFILE' && classification.confidence >= 1.0;
  const isToolPattern = classification.pattern === 'TOOL' && classification.confidence >= 1.0;
  const isAuthPattern = classification.pattern === 'AUTH' && classification.confidence >= 1.0;
  const activatePattern =
    isHomepagePattern ||
    isCategoryPattern ||
    isContentDetailPattern ||
    isStaticPattern ||
    isAccountPattern ||
    isUserProfilePattern ||
    isToolPattern ||
    isAuthPattern;

  if (activatePattern) {
    logger.info(`🎯 Attempting pattern-based generation for ${route}`, {
      pattern: classification.pattern,
      confidence: classification.confidence,
    });

    // Generate metadata from pattern (throws on error - no silent fallback)
    // Pass full context to preserve categoryConfig and other test data
    const patternMetadata = generateMetadataFromPattern(
      route,
      context?.params,
      context?.item,
      context
    );

    logger.info(`✅ Pattern-based metadata generated for ${route}`, {
      pattern: classification.pattern,
    });
    return patternMetadata;
  }

  // TIER 2: Smart defaults for unknown routes (fallback only)
  // All 41 routes now use pattern system - this is only for edge cases
  return generateSmartDefaultMetadata(route, context);
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
 * Generate metadata using pattern-based architecture
 *
 * **Enterprise Pattern-Based Metadata Generation (October 2025)**
 *
 * Uses route classification and templates to generate metadata automatically.
 * This is the NEW system that eliminates manual route configuration.
 *
 * **Architecture:**
 * 1. Classify route into one of 8 patterns
 * 2. Extract context data for the pattern
 * 3. Get template for the pattern
 * 4. Generate metadata from template + context
 * 5. Build complete Next.js Metadata object
 *
 * **Performance:** Fully synchronous for optimal build-time optimization
 *
 * @param route - Route path (e.g., '/', '/agents', '/agents/code-reviewer')
 * @param params - Optional dynamic route params
 * @param item - Optional content item data (for content detail pages)
 * @returns Next.js Metadata object
 *
 * @example
 * ```typescript
 * // HOMEPAGE pattern
 * export const metadata = generateMetadataFromPattern('/');
 *
 * // CATEGORY pattern
 * export function generateMetadata({ params }) {
 *   return generateMetadataFromPattern(`/${params.category}`, { category: params.category });
 * }
 *
 * // CONTENT_DETAIL pattern
 * export async function generateMetadata({ params }) {
 *   const item = await getContentBySlug(params.category, params.slug);
 *   return generateMetadataFromPattern(
 *     `/${params.category}/${params.slug}`,
 *     { category: params.category, slug: params.slug },
 *     item
 *   );
 * }
 * ```
 */
export function generateMetadataFromPattern(
  route: string,
  params?: Record<string, string | string[]>,
  item?: unknown,
  providedContext?: MetadataContext
): Metadata {
  // Step 1: Classify the route
  const classification = classifyRoute(route);

  logger.info(`🔍 Route classified as ${classification.pattern}`, {
    route,
    pattern: classification.pattern,
    confidence: classification.confidence,
  });

  // Step 2: Extract context for this pattern
  // Merge provided context (from tests) with extracted context (from registry)
  const extractedContext = extractContext(classification, params || {}, item);
  const context: MetadataContext = {
    ...extractedContext,
    ...providedContext, // Override with provided context (for tests)
  };

  // Step 3: Get template for this pattern
  const template = getTemplate(classification.pattern);

  // Step 4: Generate metadata content from template
  const rawTitle = template.title(context);
  const rawDescription = template.description(context);
  const rawKeywords = template.keywords(context);

  // Step 4.5: Validate template output (LAYER 2 VALIDATION)
  // Catches SEO violations (title/description length, keyword limits) before building metadata
  const validated = validateTemplateOutput(
    {
      title: rawTitle,
      description: rawDescription,
      keywords: rawKeywords,
    },
    classification.pattern
  );

  // Production: Use fallback if template validation failed
  if (!validated) {
    logger.warn('Template output validation failed, using fallback metadata', {
      route,
      pattern: classification.pattern,
    });
    return generateFallbackMetadata(route, context);
  }

  const { title, description, keywords } = validated;

  // Step 5: Determine OpenGraph type based on pattern
  // Content detail pages use 'article' for better AI citations
  const openGraphType = classification.pattern === 'CONTENT_DETAIL' ? 'article' : 'website';

  // Step 6: Determine robots directives (account/auth pages should be noindex)
  const shouldIndex =
    classification.pattern !== 'ACCOUNT' &&
    classification.pattern !== 'AUTH' &&
    !route.includes('/new'); // Create pages should be noindex
  const shouldFollow = classification.pattern !== 'AUTH';

  // Step 7: Build metadata using shared builder (DRY)
  const metadata = buildMetadataObject(
    {
      title,
      description,
      ...(keywords && keywords.length > 0 && { keywords }),
      openGraphType,
      twitterCard: 'summary_large_image',
      robots: {
        index: shouldIndex,
        follow: shouldFollow,
      },
    },
    route,
    context
  );

  logger.info(`✅ Metadata generated for ${route}`, {
    pattern: classification.pattern,
    titleLength: metadata.title ? String(metadata.title).length : 0,
    descLength: metadata.description?.length || 0,
  });

  // Step 8: Add article-specific metadata for CONTENT_DETAIL pattern
  if (classification.pattern === 'CONTENT_DETAIL' && context.item) {
    const item = context.item as {
      author?: string;
      dateAdded?: string;
      lastModified?: string;
    };

    // Add author metadata
    if (item.author) {
      metadata.authors = [{ name: item.author }];
    }

    // Add article timestamps to OpenGraph
    if (item.dateAdded || item.lastModified) {
      metadata.openGraph = {
        ...metadata.openGraph,
        type: 'article',
        ...(item.dateAdded && { publishedTime: item.dateAdded }),
        ...(item.lastModified && { modifiedTime: item.lastModified }),
        ...(item.author && { authors: [item.author] }),
      };
    }

    // Add llms.txt alternate link for AI optimization
    const canonical = metadata.alternates?.canonical;
    if (canonical && typeof canonical === 'string') {
      const canonicalPath = new URL(canonical).pathname;
      metadata.alternates = {
        ...metadata.alternates,
        types: {
          'text/plain': `${canonicalPath}/llms.txt`,
        },
      };
    }
  }

  return metadata;
}

/**
 * Helper: Generate metadata for dynamic category pages
 * Convenience function for [category]/page.tsx routes
 *
 * **PERFORMANCE**: Fully synchronous for optimal build-time optimization
 * Compatible with exactOptionalPropertyTypes: true
 */
export function generateCategoryMetadata(
  category: string,
  categoryConfig: MetadataContext['categoryConfig']
): Metadata {
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
 * **PERFORMANCE**: Fully synchronous for optimal build-time optimization
 * Compatible with exactOptionalPropertyTypes: true
 */
export function generateContentMetadata(
  category: string,
  slug: string,
  item: MetadataContext['item'],
  categoryConfig?: MetadataContext['categoryConfig']
): Metadata {
  // Explicit context construction with proper undefined handling
  const context: MetadataContext = {
    params: { category, slug },
    ...(item !== undefined && { item }),
    ...(categoryConfig !== undefined && { categoryConfig }),
  };

  return generatePageMetadata('/:category/:slug', context);
}

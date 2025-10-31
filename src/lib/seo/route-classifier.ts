/**
 * Route Pattern Classifier - Database-First
 * Classifies Next.js routes into metadata patterns using category_configs table validation.
 *
 * **Usage:**
 * ```typescript
 * const classification = classifyRoute('/agents/code-reviewer');
 * // Returns: { pattern: 'CONTENT_DETAIL', confidence: 1.0, ... }
 * ```
 *
 * @module lib/seo/route-classifier
 */

import { isValidCategory } from '@/src/lib/config/category-config';

/**
 * Route Pattern Types
 *
 * Branded string types for pattern safety and autocomplete support.
 * Each pattern maps to a specific metadata template in metadata-templates.ts
 */
export type RoutePattern =
  | 'HOMEPAGE'
  | 'CATEGORY'
  | 'CONTENT_DETAIL'
  | 'USER_PROFILE'
  | 'ACCOUNT'
  | 'TOOL'
  | 'STATIC'
  | 'AUTH';

/**
 * Route Classification Result
 *
 * Contains pattern type, confidence score, and parsed route segments.
 * Confidence indicates classification certainty (1.0 = definitive, <1.0 = heuristic)
 */
export interface RouteClassification {
  /** Classified pattern type */
  pattern: RoutePattern;

  /** Classification confidence (0-1 scale, 1.0 = definitive match) */
  confidence: number;

  /** Parsed route segments (e.g., ['agents', ':slug']) */
  segments: string[];

  /** Whether route contains dynamic segments (:slug, :id, etc.) */
  isDynamic: boolean;

  /** Original route string */
  route: string;
}

/**
 * Classify a Next.js route into a metadata pattern
 *
 * **Algorithm:**
 * 1. Parse route into segments (split by /)
 * 2. Apply priority-based pattern matching:
 *    - Exact matches first (HOMEPAGE, AUTH, ACCOUNT, TOOL)
 *    - Category validation second (CATEGORY, CONTENT_DETAIL)
 *    - Heuristic fallback third (STATIC)
 * 3. Return pattern with confidence score
 *
 * **Priority Order:**
 * - HOMEPAGE (/) → 1.0 confidence
 * - AUTH (/auth/*) → 1.0 confidence
 * - ACCOUNT (/account/*) → 1.0 confidence
 * - TOOL (/tools/*) → 1.0 confidence
 * - USER_PROFILE (/u/:slug) → 1.0 confidence
 * - CATEGORY (/:category) → 1.0 confidence (if valid category)
 * - CONTENT_DETAIL (/:category/:slug) → 1.0 confidence (if valid category)
 * - STATIC (fallback) → 0.5 confidence
 *
 * @param route - Next.js route string (e.g., '/agents/code-reviewer', '/:category/:slug')
 * @returns Route classification with pattern, confidence, and metadata
 *
 * @example
 * ```typescript
 * classifyRoute('/') // HOMEPAGE, 1.0
 * classifyRoute('/agents') // CATEGORY, 1.0
 * classifyRoute('/agents/code-reviewer') // CONTENT_DETAIL, 1.0
 * classifyRoute('/u/john-doe') // USER_PROFILE, 1.0
 * classifyRoute('/account/settings') // ACCOUNT, 1.0
 * classifyRoute('/trending') // STATIC, 0.5
 * ```
 */
export function classifyRoute(route: string): RouteClassification {
  // Normalize route: Remove trailing slash, ensure leading slash
  const normalizedRoute = route === '/' ? '/' : `/${route.replace(/^\/+|\/+$/g, '')}`;

  // Parse into segments
  const segments = normalizedRoute.split('/').filter(Boolean);

  // Check for dynamic segments (:slug, [slug], :id, [id], etc.)
  const isDynamic = segments.some(
    (seg) => seg.startsWith(':') || seg.startsWith('[') || seg.includes('[')
  );

  // PRIORITY 1: Exact match - Homepage
  if (normalizedRoute === '/') {
    return {
      pattern: 'HOMEPAGE',
      confidence: 1.0,
      segments,
      isDynamic: false,
      route: normalizedRoute,
    };
  }

  // PRIORITY 2: Prefix match - Auth pages
  if (segments[0] === 'auth') {
    return {
      pattern: 'AUTH',
      confidence: 1.0,
      segments,
      isDynamic,
      route: normalizedRoute,
    };
  }

  // PRIORITY 3: Prefix match - Account pages
  if (segments[0] === 'account') {
    return {
      pattern: 'ACCOUNT',
      confidence: 1.0,
      segments,
      isDynamic,
      route: normalizedRoute,
    };
  }

  // PRIORITY 4: Prefix match - Tool pages
  if (segments[0] === 'tools') {
    return {
      pattern: 'TOOL',
      confidence: 1.0,
      segments,
      isDynamic,
      route: normalizedRoute,
    };
  }

  // PRIORITY 5: Prefix match - User profile pages
  if (segments[0] === 'u' && segments.length >= 2) {
    return {
      pattern: 'USER_PROFILE',
      confidence: 1.0,
      segments,
      isDynamic: true,
      route: normalizedRoute,
    };
  }

  // PRIORITY 6: Dynamic category patterns - Single segment
  // Handles: /[category], /:category (Next.js dynamic routes)
  if (segments.length === 1 && (segments[0] === '[category]' || segments[0] === ':category')) {
    return {
      pattern: 'CATEGORY',
      confidence: 1.0,
      segments,
      isDynamic: true,
      route: normalizedRoute,
    };
  }

  // PRIORITY 7: Category validation - Single segment (category list pages)
  if (segments.length === 1 && segments[0]) {
    const category = segments[0].replace(':', ''); // Handle :category dynamic routes

    if (isValidCategory(category)) {
      return {
        pattern: 'CATEGORY',
        confidence: 1.0,
        segments,
        isDynamic: segments[0].startsWith(':'),
        route: normalizedRoute,
      };
    }
  }

  // PRIORITY 8: Dynamic patterns - Two segments
  // Handles: /[category]/[slug], /:category/:slug (Next.js dynamic routes)
  if (segments.length === 2) {
    const firstSeg = segments[0];
    const secondSeg = segments[1];

    // Match [category]/[slug] or :category/:slug patterns
    if (
      (firstSeg === '[category]' || firstSeg === ':category') &&
      (secondSeg === '[slug]' || secondSeg === ':slug')
    ) {
      return {
        pattern: 'CONTENT_DETAIL',
        confidence: 1.0,
        segments,
        isDynamic: true,
        route: normalizedRoute,
      };
    }
  }

  // PRIORITY 9: Category validation - Two segments (content detail pages)
  // Handles: /:category/:slug, /agents/code-reviewer, /jobs/:slug, etc.
  if (segments.length === 2 && segments[0]) {
    const category = segments[0].replace(':', ''); // Handle dynamic routes

    if (isValidCategory(category)) {
      return {
        pattern: 'CONTENT_DETAIL',
        confidence: 1.0,
        segments,
        isDynamic: true, // Detail pages always have dynamic slugs
        route: normalizedRoute,
      };
    }
  }

  // FALLBACK: Static pages (lower confidence)
  // This catches: /trending, /search, /for-you, /partner, /community, etc.
  return {
    pattern: 'STATIC',
    confidence: 0.5,
    segments,
    isDynamic,
    route: normalizedRoute,
  };
}

/**
 * Get human-readable pattern description
 *
 * Useful for debugging, logging, and documentation.
 *
 * @param pattern - Route pattern type
 * @returns Human-readable description of the pattern
 *
 * @example
 * ```typescript
 * getPatternDescription('CATEGORY') // "Category list page"
 * getPatternDescription('CONTENT_DETAIL') // "Content detail page"
 * ```
 */
export function getPatternDescription(pattern: RoutePattern): string {
  const descriptions: Record<RoutePattern, string> = {
    HOMEPAGE: 'Homepage',
    CATEGORY: 'Category list page',
    CONTENT_DETAIL: 'Content detail page',
    USER_PROFILE: 'User profile page',
    ACCOUNT: 'Account management page',
    TOOL: 'Tool page',
    STATIC: 'Static page',
    AUTH: 'Authentication page',
  };

  return descriptions[pattern];
}

/**
 * Validate classification confidence
 *
 * Checks if classification confidence meets minimum threshold.
 * Low confidence may indicate ambiguous routes that need manual review.
 *
 * @param classification - Route classification result
 * @param minConfidence - Minimum acceptable confidence (default: 0.8)
 * @returns Whether classification meets confidence threshold
 *
 * @example
 * ```typescript
 * const result = classifyRoute('/some-route');
 * if (!isConfidentClassification(result)) {
 *   console.warn('Low confidence classification:', result);
 * }
 * ```
 */
export function isConfidentClassification(
  classification: RouteClassification,
  minConfidence = 0.8
): boolean {
  return classification.confidence >= minConfidence;
}

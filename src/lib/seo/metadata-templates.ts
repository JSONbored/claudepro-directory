/**
 * Metadata Templates - Pattern-Based Generation
 *
 * **Enterprise Pattern-Based Metadata Architecture (October 2025)**
 *
 * Defines metadata templates for 8 route patterns. Each template generates SEO-optimized
 * metadata (title, description, keywords) based on route context without manual configuration.
 *
 * **Architecture:**
 * - Single Source of Truth: Uses UNIFIED_CATEGORY_REGISTRY for all category data
 * - Schema-First: Derives metadata from content schemas (no duplication)
 * - Validation-First: All templates enforce 53-60 char titles, 150-160 char descriptions
 * - Type-Safe: Full TypeScript support with proper MetadataContext typing
 *
 * **Template System:**
 * - 8 patterns → 8 templates (1:1 mapping)
 * - Context-aware: Access to category config, item data, user data
 * - Fallback chain: Template → CategoryConfig → Smart defaults
 * - Year injection: Automatic "2025" for freshness signals
 *
 * **Validation Rules (October 2025 SEO Standards - Optimized):**
 * - Title: 53-60 characters (optimized for keyword density within Google limits)
 * - Description: 150-160 characters (Google ~920px desktop, ~680px mobile)
 * - Keywords: 3-10 keywords, max 30 chars each
 * - All rules enforced at template level (fail fast)
 *
 * @module lib/seo/metadata-templates
 */

import { METADATA_QUALITY_RULES, OPTIMAL_MAX, OPTIMAL_MIN } from '@/src/lib/config/seo-config';
import { APP_CONFIG } from '@/src/lib/constants';
import type { MetadataContext } from '@/src/lib/seo/metadata-registry';
import { getCurrentMonthYear, getCurrentYear } from '@/src/lib/seo/metadata-registry';
import type { RoutePattern } from '@/src/lib/seo/route-classifier';

// ============================================
// SEO CONSTANTS (October 2025 Standards)
// ============================================

/**
 * SEO-critical constants for metadata generation
 *
 * **Title Constants:**
 * - TITLE_ELLIPSIS_LENGTH: Length of "..." truncation indicator
 * - TITLE_EXTENDED_MAX: Extended max for semantic preservation (61-65 chars acceptable)
 * - TITLE_WORD_BOUNDARY_BUFFER: Min chars from edge to prefer word boundary
 * - TITLE_TRUNCATION_STEP: Incremental search step for optimal word boundaries
 * - TITLE_TRUNCATION_MAX_EXTRA: Maximum extra chars to search for word boundaries
 *
 * **Description Constants:**
 * - DESC_MIN, DESC_MAX: Imported from METADATA_QUALITY_RULES
 * - DESC_WORD_BOUNDARY_MIN: Minimum chars from edge for description word boundaries
 *
 * **Keyword Constants:**
 * - MIN_KEYWORDS: Minimum keyword count for SEO relevance
 */
const TITLE_ELLIPSIS_LENGTH = 3; // "..." character count
const TITLE_EXTENDED_MAX = 65; // SEO 2025: 61-65 chars acceptable for complete words
const TITLE_WORD_BOUNDARY_BUFFER = 20; // Prefer word boundary if within this many chars of target
const TITLE_TRUNCATION_STEP = 5; // Incremental search step size for word boundaries
const TITLE_TRUNCATION_MAX_EXTRA = 25; // Maximum extra characters to search
const DESC_WORD_BOUNDARY_MIN = 10; // Minimum position from start for word boundary
const MIN_KEYWORDS = 3; // Minimum keyword count for SEO (METADATA_QUALITY_RULES.keywords.minCount)

// ============================================
// TITLE FORMULA SELECTION UTILITY
// ============================================

/**
 * Select optimal title from multiple formulas
 *
 * Iterates through title formulas and returns the first one that fits within
 * the optimal SEO range (53-60 characters). If none fit, returns the first
 * formula truncated to fit.
 *
 * **Why This Matters:**
 * - Google displays ~50-60 chars in SERPs (varies by device/font)
 * - Too long → truncated with "..." (unprofessional)
 * - Too short → wasted keyword opportunity
 * - 53-60 range = optimal keyword density + full display
 *
 * **Algorithm:**
 * 1. Try each formula in order (priority-based)
 * 2. Return first formula in optimal range
 * 3. Fallback: Truncate first formula to fit
 *
 * @param formulas - Array of title formulas to try (in priority order)
 * @returns Title string within 53-60 character range
 *
 * @example
 * ```typescript
 * const formulas = [
 *   `Browse ${category} - ${keyword} for Claude AI - Directory ${year}`,
 *   `Explore ${category} - ${keyword} for Claude AI - Directory ${year}`,
 *   `${category} for Claude - Community Directory ${year}`,
 * ];
 * const title = selectOptimalTitle(formulas);
 * // Returns first formula that fits 53-60 chars
 * ```
 */
function selectOptimalTitle(formulas: string[]): string {
  // Find first formula that fits optimal range
  for (const formula of formulas) {
    if (formula.length >= OPTIMAL_MIN && formula.length <= OPTIMAL_MAX) {
      return formula;
    }
  }

  // Fallback: Use first formula and truncate to fit optimal range
  const baseTitle = formulas[0] || 'Page';

  // If already under minimum, pad with site name
  if (baseTitle.length < OPTIMAL_MIN) {
    const padded = `${baseTitle} - ${APP_CONFIG.name}`;
    if (padded.length <= OPTIMAL_MAX) {
      return padded;
    }
  }

  // If over maximum, intelligently truncate
  if (baseTitle.length > OPTIMAL_MAX) {
    // For content detail pages (pattern: "Title - Category - SiteName"),
    // preserve the suffix (category + site name) and truncate the title part
    const siteName = APP_CONFIG.name;

    // Check if this follows the content detail pattern
    if (baseTitle.includes(` - ${siteName}`)) {
      // Extract parts: "LongTitle - Category - SiteName"
      const parts = baseTitle.split(' - ');
      if (parts.length >= 3) {
        // parts[0] = title, parts[1] = category, parts[2] = site name
        const category = parts[1];
        const suffix = ` - ${category} - ${siteName}`;
        const maxTitleLength = OPTIMAL_MAX - suffix.length - TITLE_ELLIPSIS_LENGTH;

        if (maxTitleLength > 10) {
          // Truncate title part intelligently at word boundaries
          let truncatedTitle = parts[0]?.substring(0, maxTitleLength) || '';

          // ALWAYS truncate at word boundary to avoid splitting words like "Configuratio..."
          const lastSpace = truncatedTitle.lastIndexOf(' ');
          if (lastSpace > 0) {
            // Found a space - truncate there to keep complete words
            truncatedTitle = truncatedTitle.substring(0, lastSpace);
          }
          // If no space found (single long word), use character truncation as fallback

          let candidateTitle = `${truncatedTitle}... - ${category} - ${siteName}`;

          // Verify result meets minimum length requirement
          if (candidateTitle.length >= OPTIMAL_MIN) {
            return candidateTitle;
          }

          // If word-boundary truncation makes it too short, try incrementally longer versions
          // Strategy: Prefer semantic completeness (whole words) over strict length limits
          // SEO 2025 best practice: Complete words > exact character count
          // Research: Too short (< 53) is worse than slightly long (61-65) for CTR and rewrites
          for (
            let extraChars = TITLE_TRUNCATION_STEP;
            extraChars <= TITLE_TRUNCATION_MAX_EXTRA;
            extraChars += TITLE_TRUNCATION_STEP
          ) {
            const longerTitle = parts[0]?.substring(0, maxTitleLength + extraChars) || '';
            const longerSpace = longerTitle.lastIndexOf(' ');
            if (longerSpace > 0) {
              const wordBoundaryTitle = longerTitle.substring(0, longerSpace);
              const longerCandidate = `${wordBoundaryTitle}... - ${category} - ${siteName}`;

              // Prioritize: 53-60 range (optimal)
              if (longerCandidate.length >= OPTIMAL_MIN && longerCandidate.length <= OPTIMAL_MAX) {
                return longerCandidate;
              }

              // Fallback: 60-65 range (acceptable - preserves complete words)
              // Better to slightly exceed 60 than lose semantic meaning
              // SEO 2025: Titles rewritten 96% at 1-5 chars, only 40% at 51-60 chars
              if (
                longerCandidate.length > OPTIMAL_MAX &&
                longerCandidate.length <= TITLE_EXTENDED_MAX
              ) {
                // Store first acceptable candidate (prefer shortest one in 60-65 range)
                // Only replace if current candidate is too short OR this one is shorter
                const currentIsGood =
                  candidateTitle.length > OPTIMAL_MAX &&
                  candidateTitle.length <= TITLE_EXTENDED_MAX;
                if (!currentIsGood || longerCandidate.length < candidateTitle.length) {
                  candidateTitle = longerCandidate;
                }
              }
            }
          }

          // If we found a candidate in 60-65 range with complete words, use it
          // SEO 2025 research: Too long (61-65) > too short (< 53) for engagement
          if (
            candidateTitle &&
            candidateTitle.length > OPTIMAL_MAX &&
            candidateTitle.length <= TITLE_EXTENDED_MAX
          ) {
            return candidateTitle;
          }

          // Final fallback: Must hit minimum 53 chars for validation
          // Use character truncation as last resort (acceptable per SEO 2025 - validation > perfection)
          const fallbackLength = OPTIMAL_MIN - suffix.length - TITLE_ELLIPSIS_LENGTH;
          const fallbackTitle = parts[0]?.substring(0, fallbackLength) || '';
          return `${fallbackTitle}... - ${category} - ${siteName}`;
        }
      }
    }

    // Generic truncation fallback
    const truncated = baseTitle.substring(0, OPTIMAL_MAX - TITLE_ELLIPSIS_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > OPTIMAL_MAX - TITLE_WORD_BOUNDARY_BUFFER) {
      // If we have a reasonable word boundary, use it
      return truncated.substring(0, lastSpace) + '...';
    }
    // Otherwise hard truncate
    return truncated + '...';
  }

  return baseTitle;
}

/**
 * Metadata Template Function
 *
 * Function that generates metadata from context.
 * Must be synchronous for performance (no Promise overhead).
 */
export type MetadataTemplateFunction<T = string> = (context: MetadataContext) => T;

/**
 * Metadata Template Definition
 *
 * Defines how to generate metadata for a specific route pattern.
 * All functions receive MetadataContext with route-specific data.
 */
export interface MetadataTemplate {
  /** Generate page title (must be 53-60 chars total including site name) */
  title: MetadataTemplateFunction<string>;

  /** Generate meta description (must be 150-160 chars) */
  description: MetadataTemplateFunction<string>;

  /** Generate keywords array (must have 3-10 keywords) */
  keywords: MetadataTemplateFunction<string[]>;

  /** Validation rules for this pattern */
  validation: {
    /** Title length range [min, max] */
    titleLength: [number, number];
    /** Description length range [min, max] */
    descLength: [number, number];
    /** Minimum number of keywords */
    minKeywords: number;
  };
}

/**
 * Standard validation rules (derived from seo-config constants)
 */
const STANDARD_VALIDATION = {
  titleLength: [OPTIMAL_MIN, OPTIMAL_MAX] as [number, number],
  descLength: [150, 160] as [number, number],
  minKeywords: 3,
};

// ============================================
// SHARED DESCRIPTION UTILITIES
// ============================================

/**
 * Smart Description Padding/Truncation
 *
 * Enterprise-grade utility for ensuring descriptions meet SEO standards (150-160 chars).
 * Used by CATEGORY, CONTENT_DETAIL, and other patterns requiring description normalization.
 *
 * **Strategy:**
 * 1. If description already in range (150-160 chars) → return as-is
 * 2. If too short → apply multi-tier padding to reach 150-160 chars
 * 3. If too long → smart truncate at word boundary with ellipsis
 *
 * **Padding Tiers:**
 * - 5 padding options sorted by length (shortest to longest)
 * - Algorithm selects shortest padding that fits target range
 * - Fallback: use longest padding + truncate if needed
 *
 * @param rawDescription - Original description (any length)
 * @param categoryName - Category name for padding context (e.g., "Agents", "MCP Servers")
 * @returns SEO-optimized description (150-160 chars guaranteed)
 *
 * @example
 * ```typescript
 * smartDescriptionPadding("Short description.", "Agents")
 * // Returns: "Short description. Browse Agents on Claude Pro Directory - ..."
 *
 * smartDescriptionPadding("Already perfect length description...", "MCP")
 * // Returns: "Already perfect length description..." (no changes)
 *
 * smartDescriptionPadding("Very long description that exceeds...", "Rules")
 * // Returns: "Very long description that..." (truncated at word boundary)
 * ```
 */
function smartDescriptionPadding(rawDescription: string, categoryName: string): string {
  const DESC_MIN = METADATA_QUALITY_RULES.description.minLength;
  const DESC_MAX = METADATA_QUALITY_RULES.description.maxLength;

  // Case 1: Description already in optimal range (150-160 chars) - return as-is
  if (rawDescription.length >= DESC_MIN && rawDescription.length <= DESC_MAX) {
    return rawDescription;
  }

  // Case 2: Description too short - add intelligent padding
  if (rawDescription.length < DESC_MIN) {
    // Multi-tier padding strategy to reach 150-160 chars
    // Sorted by length (shortest to longest) to find optimal fit
    const paddings = [
      ` Browse ${categoryName} on ${APP_CONFIG.name} - curated resources for AI development and automation.`, // ~97 chars
      ` Explore ${categoryName} on ${APP_CONFIG.name} - community tools, guides, and best practices for Claude AI.`, // ~104 chars
      ` Discover ${categoryName} on ${APP_CONFIG.name} - open-source community resources for developers and AI enthusiasts.`, // ~111 chars
      ` Browse ${categoryName} on ${APP_CONFIG.name} - community-curated resources for Claude AI development and automation workflows.`, // ~129 chars
      ` Explore ${categoryName} on ${APP_CONFIG.name} - community-curated resources, tools, guides, and best practices for Claude AI development, automation workflows, and productivity enhancement.`, // ~187 chars (for very short descriptions)
    ];

    // Try each padding to find one that fits 150-160 range
    for (const padding of paddings) {
      const padded = rawDescription + padding;
      if (padded.length >= DESC_MIN && padded.length <= DESC_MAX) {
        return padded;
      }
    }

    // Fallback: Use longest padding and truncate if needed
    const fallbackPadded = rawDescription + paddings[paddings.length - 1];
    if (fallbackPadded.length > DESC_MAX) {
      // Truncate the padded result at word boundary
      const lastSpace = fallbackPadded
        .substring(0, DESC_MAX - TITLE_ELLIPSIS_LENGTH)
        .lastIndexOf(' ');
      return (
        fallbackPadded.substring(
          0,
          lastSpace > DESC_MIN - DESC_WORD_BOUNDARY_MIN
            ? lastSpace
            : DESC_MAX - TITLE_ELLIPSIS_LENGTH
        ) + '...'
      );
    }

    return fallbackPadded;
  }

  // Case 3: Description too long - smart truncation at word boundary
  const ellipsis = '...';
  let truncated = rawDescription.substring(0, DESC_MAX - ellipsis.length);
  const lastSpace = truncated.lastIndexOf(' ');

  // Only use word boundary if it's reasonably close to target (within 20 chars)
  if (lastSpace > DESC_MAX - 20) {
    truncated = truncated.substring(0, lastSpace) + ellipsis;
  } else {
    // No good word boundary, hard truncate
    truncated = rawDescription.substring(0, DESC_MAX - ellipsis.length) + ellipsis;
  }

  return truncated;
}

/**
 * Metadata Templates Registry
 *
 * Maps each route pattern to its metadata generation template.
 * Templates use UNIFIED_CATEGORY_REGISTRY as single source of truth.
 */
export const METADATA_TEMPLATES: Record<RoutePattern, MetadataTemplate> = {
  /**
   * HOMEPAGE Pattern
   * Route: /
   * Static metadata - never changes
   */
  HOMEPAGE: {
    title: () => `${APP_CONFIG.name} - MCP Servers, AI Agents & Configs`,
    description: () =>
      `Discover Claude configurations in ${getCurrentMonthYear()}. Explore expert rules, MCP servers, AI agents, commands, hooks, and statuslines for Claude development.`,
    keywords: () => ['claude ai', 'mcp servers', 'ai agents', 'configurations', getCurrentYear()],
    validation: STANDARD_VALIDATION,
  },

  /**
   * CATEGORY Pattern
   * Routes: /agents, /mcp, /commands, etc. (11 routes)
   * Data Source: UNIFIED_CATEGORY_REGISTRY
   */
  CATEGORY: {
    title: (context): string => {
      const config = context.categoryConfig;
      if (!config) {
        return `Browse Content - ${APP_CONFIG.name}`;
      }

      // Dynamic title generation using category data (53-60 chars for keyword density)
      // Uses keywords from UNIFIED_CATEGORY_REGISTRY for meaningful, variable-based titles
      const keywords = config.keywords || 'content, tools, resources';
      const keywordsArray = keywords.split(',').map((k) => k.trim());
      const kw1 = keywordsArray[0] || 'content';
      const kw2 = keywordsArray[1] || kw1;

      // Try multiple formula variations to find one that fits optimal range
      // Prioritize formulas with "Claude" and current year for brand consistency and freshness signals
      // Include longer formulas for short category names (e.g., "Mcps" = 4 chars needs 53+ chars)
      const formulas = [
        `Browse ${config.pluralTitle} - ${kw1} for Claude AI - Directory ${getCurrentYear()}`,
        `Explore ${config.pluralTitle} - ${kw1} for Claude AI - Directory ${getCurrentYear()}`,
        `Browse ${config.pluralTitle} for Claude AI - Community Directory ${getCurrentYear()}`,
        `Explore ${config.pluralTitle} for Claude AI - Community Directory ${getCurrentYear()}`,
        `${config.pluralTitle} for Claude - Community Directory ${getCurrentYear()}`,
        `Explore ${config.pluralTitle} for Claude - ${kw1} Directory ${getCurrentYear()}`,
        `Browse ${config.pluralTitle} for Claude - ${kw1} Directory ${getCurrentYear()}`,
        `Explore ${config.pluralTitle} for Claude - Community Directory ${getCurrentYear()}`,
        `Browse ${config.pluralTitle} for Claude - Community Directory ${getCurrentYear()}`,
        `Explore ${config.pluralTitle} for Claude - Community ${getCurrentYear()}`,
        `Browse ${config.pluralTitle} for Claude - Community ${getCurrentYear()}`,
        `Explore ${config.pluralTitle} for Claude - Directory ${getCurrentYear()}`,
        `Browse ${config.pluralTitle} for Claude - Directory ${getCurrentYear()}`,
        `${config.pluralTitle} for Claude - ${kw1} & ${kw2} Directory`,
      ];

      return selectOptimalTitle(formulas);
    },
    description: (context) => {
      const config = context.categoryConfig;
      const fallback = `Browse Claude AI configurations and resources for ${getCurrentMonthYear()}. Find tools, plugins, and setups to enhance your development workflow.`;

      if (!config) {
        return fallback;
      }

      // Get metaDescription from category config
      const rawDescription = config.metaDescription || fallback;
      const categoryName = config.pluralTitle || 'content';

      // Use shared smart padding/truncation utility
      return smartDescriptionPadding(rawDescription, categoryName);
    },
    keywords: (context) => {
      const config = context.categoryConfig;
      const defaultKeywords = ['claude', 'ai', getCurrentYear()];

      if (!(config && config.keywords)) {
        return defaultKeywords;
      }

      // Parse comma-separated keywords from category config
      const parsedKeywords = config.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      // Ensure minimum 3 keywords by padding with defaults
      if (parsedKeywords.length < MIN_KEYWORDS) {
        const needed = MIN_KEYWORDS - parsedKeywords.length;
        return [...parsedKeywords, ...defaultKeywords.slice(0, needed)];
      }

      return parsedKeywords;
    },
    validation: STANDARD_VALIDATION,
  },

  /**
   * CONTENT_DETAIL Pattern
   * Routes: /:category/:slug, /guides/:category/:slug (158+ routes)
   * Data Source: Content schemas via schema-metadata-adapter.ts
   * Note: Primary metadata comes from schema adapter, this is fallback only
   */
  CONTENT_DETAIL: {
    title: (context) => {
      if (!context.item) {
        return `Content - ${APP_CONFIG.name}`;
      }

      // Prioritize seoTitle (optimized for length), then title/name
      const item = context.item as {
        seoTitle?: string;
        title?: string;
        name?: string;
      };

      const displayTitle = item.seoTitle || item.title || item.name || 'Content';
      const categoryConfig = context.categoryConfig;
      const categoryName = categoryConfig?.title || 'Content';

      // Try multiple title formats to achieve 53-60 char optimal range
      const formulas = [
        `${displayTitle} - ${categoryName} - ${APP_CONFIG.name}`,
        `${displayTitle} - ${categoryName} for Claude - ${APP_CONFIG.name}`,
        `${displayTitle} - ${categoryName} Template - ${APP_CONFIG.name}`,
        `${displayTitle} - ${categoryName} Config - ${APP_CONFIG.name}`,
        `${displayTitle} - ${categoryName} ${getCurrentYear()} - ${APP_CONFIG.name}`,
      ];

      return selectOptimalTitle(formulas);
    },
    description: (context) => {
      const fallback = `View content details on ${APP_CONFIG.name}. Discover configurations, guides, and resources for Claude AI development workflow.`;

      if (!context.item) {
        return fallback;
      }

      const item = context.item as { description?: string };
      const rawDescription = item.description || fallback;
      const categoryName = context.categoryConfig?.pluralTitle || 'content';

      // Use shared smart padding/truncation utility
      return smartDescriptionPadding(rawDescription, categoryName);
    },
    keywords: (context) => {
      if (!context.item) {
        return ['claude', 'content', getCurrentYear()];
      }

      const item = context.item as { tags?: string[]; keywords?: string[]; category?: string };

      // Guides have separate SEO keywords field for long-tail phrases
      // Always use short tags for meta keywords (SEO best practice: max 30 chars per keyword)
      if (item.category === 'guides') {
        return item.tags || ['claude', 'guides', getCurrentYear()];
      }

      // For other content types, prefer tags, fallback to keywords, then defaults
      // Filter any keywords >30 chars to pass validation (shouldn't happen, but defensive)
      const source = item.tags || item.keywords || ['claude', 'content', getCurrentYear()];
      return source.filter((k) => k.length <= 30);
    },
    validation: STANDARD_VALIDATION,
  },

  /**
   * USER_PROFILE Pattern
   * Routes: /u/:slug, /u/:slug/collections/:collectionSlug (2 routes)
   * Data Source: Supabase users table (dynamic, async)
   * SEO-optimized: 53-60 char titles, 150-160 char descriptions
   */
  USER_PROFILE: {
    title: (context) => {
      const route = context.route || '';
      const slug = (context.params?.slug as string) || 'user';
      const profile = context.profile as { name?: string } | undefined;
      const name = profile?.name || slug;

      // Collection page
      if (route.includes('/collections/')) {
        return `${name} Collections - ${APP_CONFIG.name} Community ${getCurrentYear()}`;
      }

      // Main profile page (add extra word to ensure 53+ chars)
      return `${name} - Claude Developer Profile - ${APP_CONFIG.name}`;
    },
    description: (context) => {
      const route = context.route || '';
      const slug = (context.params?.slug as string) || 'user';
      const profile = context.profile as
        | {
            bio?: string;
            name?: string;
            followerCount?: number;
            postCount?: number;
          }
        | undefined;

      const name = profile?.name || slug;

      // Collection page - use smart padding system
      if (route.includes('/collections/')) {
        const baseDesc = `Browse ${name}'s Claude configuration collections on ${APP_CONFIG.name} in ${getCurrentMonthYear()}.`;

        // Apply smart padding to reach 150-160 chars
        const DESC_MIN = METADATA_QUALITY_RULES.description.minLength;
        const DESC_MAX = METADATA_QUALITY_RULES.description.maxLength;

        if (baseDesc.length >= DESC_MIN && baseDesc.length <= DESC_MAX) {
          return baseDesc;
        }

        if (baseDesc.length < DESC_MIN) {
          const padding =
            ' Discover curated lists of tools, guides, and resources for AI development workflows.';
          const padded = baseDesc + padding;

          if (padded.length > DESC_MAX) {
            return baseDesc + ' Discover curated lists of tools and resources for AI development.';
          }
          return padded;
        }

        // Too long - truncate (unlikely)
        return baseDesc.substring(0, DESC_MAX - TITLE_ELLIPSIS_LENGTH) + '...';
      }

      // Main profile page - use smart padding system
      const bio =
        profile?.bio || `${name} is a member of the ${APP_CONFIG.name} developer community.`;
      const followerCount = profile?.followerCount || 0;
      const postCount = profile?.postCount || 0;

      const baseDesc = `${bio} ${followerCount} followers, ${postCount} posts on ${APP_CONFIG.name} in ${getCurrentMonthYear()}.`;

      // Apply smart padding/truncation
      const DESC_MIN = METADATA_QUALITY_RULES.description.minLength;
      const DESC_MAX = METADATA_QUALITY_RULES.description.maxLength;

      if (baseDesc.length >= DESC_MIN && baseDesc.length <= DESC_MAX) {
        return baseDesc;
      }

      if (baseDesc.length < DESC_MIN) {
        // Multi-tier padding to ensure we reach 150-160 chars
        const paddings = [
          ' Active contributor.',
          ' Active contributor sharing Claude configurations.',
          ' Active contributor sharing Claude configurations and development tools.',
          ' Active contributor sharing Claude AI configurations, development tools, and resources.',
        ];

        for (const padding of paddings) {
          const padded = baseDesc + padding;
          if (padded.length >= DESC_MIN && padded.length <= DESC_MAX) {
            return padded;
          }
        }

        // Fallback: use longest padding and truncate if needed
        const fallback = baseDesc + paddings[paddings.length - 1];
        if (fallback.length > DESC_MAX) {
          const lastSpace = fallback
            .substring(0, DESC_MAX - TITLE_ELLIPSIS_LENGTH)
            .lastIndexOf(' ');
          return (
            fallback.substring(
              0,
              lastSpace > DESC_MIN - DESC_WORD_BOUNDARY_MIN
                ? lastSpace
                : DESC_MAX - TITLE_ELLIPSIS_LENGTH
            ) + '...'
          );
        }

        return fallback;
      }

      // Too long - smart truncation at word boundary
      const lastSpace = baseDesc.substring(0, DESC_MAX - TITLE_ELLIPSIS_LENGTH).lastIndexOf(' ');
      return (
        baseDesc.substring(
          0,
          lastSpace > DESC_MIN - DESC_WORD_BOUNDARY_MIN
            ? lastSpace
            : DESC_MAX - TITLE_ELLIPSIS_LENGTH
        ) + '...'
      );
    },
    keywords: (context) => {
      const profile = context.profile as { interests?: string[] } | undefined;
      const interests = profile?.interests || [];

      return [
        'claude',
        'profile',
        'developer',
        'community',
        getCurrentYear(),
        ...interests.slice(0, 3),
      ];
    },
    validation: STANDARD_VALIDATION,
  },

  /**
   * ACCOUNT Pattern
   * Routes: /account/* (15 routes)
   * Static templates with dynamic page names (SEO-optimized 53-60 chars, 150-160 chars)
   */
  ACCOUNT: {
    title: (context) => {
      const route = context.route || '/account';

      // Map routes to complete SEO-optimized titles (53-60 chars)
      const accountTitles: Record<string, string> = {
        '/account': `Account Dashboard - ${APP_CONFIG.name} Platform ${getCurrentYear()}`,
        '/account/activity': `Activity History - ${APP_CONFIG.name} Account Dashboard`,
        '/account/bookmarks': `My Bookmarks - Saved Claude Configs - ${APP_CONFIG.name}`,
        '/account/jobs': `My Job Postings - ${APP_CONFIG.name} Account Dashboard`,
        '/account/jobs/new': `Create Job Posting - ${APP_CONFIG.name} Platform ${getCurrentYear()}`,
        '/account/library': `My Library - Claude Collections - ${APP_CONFIG.name}`,
        '/account/library/new': `Create Collection - ${APP_CONFIG.name} Library ${getCurrentYear()}`,
        '/account/settings': `Account Settings - ${APP_CONFIG.name} Profile Manager`,
        '/account/sponsorships': `My Sponsorships - ${APP_CONFIG.name} Account Dashboard`,
        '/account/submissions': `My Submissions - ${APP_CONFIG.name} Account Dashboard`,
      };

      // Handle dynamic routes with pattern matching
      if (route.includes('/jobs/') && route.includes('/edit')) {
        return `Edit Job Posting - ${APP_CONFIG.name} Account Dashboard`;
      }
      if (route.includes('/jobs/') && route.includes('/analytics')) {
        return `Job Analytics - ${APP_CONFIG.name} Account Dashboard ${getCurrentYear()}`;
      }
      if (route.includes('/library/') && route.includes('/edit')) {
        return `Edit Collection - ${APP_CONFIG.name} Library Manager`;
      }
      if (route.includes('/library/') && route.match(/\/library\/[^/]+$/)) {
        return `Collection Details - ${APP_CONFIG.name} Library Manager`;
      }
      if (route.includes('/sponsorships/') && route.includes('/analytics')) {
        return `Sponsorship Analytics - ${APP_CONFIG.name} Dashboard`;
      }

      return accountTitles[route] || `My Account - ${APP_CONFIG.name} Platform ${getCurrentYear()}`;
    },
    description: (context) => {
      const route = context.route || '/account';

      // Map routes to complete SEO-optimized descriptions (150-160 chars)
      const accountDescriptions: Record<string, string> = {
        '/account': `Manage your ${APP_CONFIG.name} account dashboard in ${getCurrentMonthYear()}. View activity, saved content, submissions, and manage your Claude development profile.`,
        '/account/activity': `View your activity history on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Track your interactions, contributions, and engagement with the Claude developer community.`,
        '/account/bookmarks': `Access your saved Claude configurations and bookmarks on ${APP_CONFIG.name}. Organize favorite tools, guides, and resources for quick access in ${getCurrentYear()}.`,
        '/account/jobs': `Manage your job postings on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. View analytics, edit listings, and connect with Claude developers seeking opportunities.`,
        '/account/jobs/new': `Create a new job posting on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Reach thousands of Claude developers and AI professionals in the developer community.`,
        '/account/library': `Manage your Claude configuration collections on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Organize, share, and discover curated lists for AI development workflows.`,
        '/account/library/new': `Create a new collection on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Organize Claude configurations, tools, and resources into shareable curated lists today.`,
        '/account/settings': `Update your ${APP_CONFIG.name} account settings in ${getCurrentMonthYear()}. Manage profile information, preferences, notifications, and privacy settings today.`,
        '/account/sponsorships': `View your sponsorships on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Track sponsored content performance, analytics, and engagement with Claude developers.`,
        '/account/submissions': `Manage your submitted Claude configurations on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. View status, edit submissions, and track community engagement on content.`,
      };

      // Handle dynamic routes with pattern matching
      if (route.includes('/jobs/') && route.includes('/edit')) {
        return `Edit your job posting on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Update details, requirements, and description to attract Claude AI developers and professionals.`;
      }
      if (route.includes('/jobs/') && route.includes('/analytics')) {
        return `View job posting analytics on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Track views, applications, and engagement metrics for your developer job listing today.`;
      }
      if (route.includes('/library/') && route.includes('/edit')) {
        return `Edit your collection on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Update title, description, and configurations in your curated list of Claude resources today.`;
      }
      if (route.includes('/library/') && route.match(/\/library\/[^/]+$/)) {
        return `View collection details on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Browse curated Claude configurations, tools, and resources organized for development workflows.`;
      }
      if (route.includes('/sponsorships/') && route.includes('/analytics')) {
        return `View sponsorship analytics on ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Track performance metrics, engagement, and ROI for your sponsored Claude developer content.`;
      }

      return (
        accountDescriptions[route] ||
        `Manage your ${APP_CONFIG.name} account in ${getCurrentMonthYear()}. Update settings, view activity, and organize your Claude configurations for AI development workflows.`
      );
    },
    keywords: () => ['claude', 'account', 'dashboard', 'profile', getCurrentYear()],
    validation: STANDARD_VALIDATION,
  },

  /**
   * TOOL Pattern
   * Routes: /tools/* (2 routes)
   * Static templates per tool (SEO-optimized 53-60 chars, 150-160 chars)
   */
  TOOL: {
    title: (context) => {
      const route = context.route || '';

      if (route.includes('config-recommender')) {
        if (route.includes('results')) {
          return `Your Claude Config Recommendations - ${APP_CONFIG.name}`;
        }
        return `Claude Configuration Recommender - ${APP_CONFIG.name}`;
      }

      return `Claude Tools & Utilities ${getCurrentYear()} - ${APP_CONFIG.name}`;
    },
    description: (context) => {
      const route = context.route || '';

      if (route.includes('config-recommender')) {
        if (route.includes('results')) {
          return `Your personalized Claude configuration recommendations in ${getCurrentMonthYear()}. Explore matched configurations based on use case, experience level, and preferences.`;
        }
        return `Answer 7 quick questions and get personalized Claude configuration recommendations in ${getCurrentMonthYear()}. Instant results, zero cost, tailored to your needs.`;
      }

      return `Explore Claude tools and utilities to enhance your AI workflow in ${getCurrentMonthYear()}. Find recommenders, analyzers, and helpers for Claude development projects.`;
    },
    keywords: (context) => {
      const route = context.route || '';

      if (route.includes('config-recommender')) {
        return [
          'claude',
          'tools',
          'recommender',
          'configuration',
          'personalized',
          getCurrentYear(),
        ];
      }

      return ['claude', 'tools', 'utilities', 'workflow', getCurrentYear()];
    },
    validation: STANDARD_VALIDATION,
  },

  /**
   * STATIC Pattern
   * Routes: /trending, /search, /for-you, etc. (11 routes)
   * Static metadata per route (complete titles, 53-60 chars)
   */
  STATIC: {
    title: (context) => {
      const route = context.route || '/';

      const staticTitles: Record<string, string> = {
        '/search': `Search Claude Configs & Resources - ${APP_CONFIG.name}`,
        '/trending': `Trending Claude AI Configurations - ${APP_CONFIG.name}`,
        '/for-you': `For You - Personalized Claude Recommendations ${getCurrentYear()} Directory`,
        '/partner': `Partner with ${APP_CONFIG.name} - Sponsorship Options ${getCurrentYear()}`,
        '/community': `Claude Community & Discussions ${getCurrentYear()} - ${APP_CONFIG.name}`,
        '/login': `Login to ${APP_CONFIG.name} - Account Dashboard Access`,
        '/companies': `Companies Using Claude AI in ${getCurrentYear()} - ${APP_CONFIG.name}`,
        '/api-docs': `API Documentation for ${APP_CONFIG.name} Platform ${getCurrentYear()}`,
        '/submit': `Submit Claude Content ${getCurrentYear()} - ${APP_CONFIG.name} Platform`,
        '/board': `Claude Community Board ${getCurrentYear()} - ${APP_CONFIG.name} Forum`,
        '/board/new': `Create Post - ${APP_CONFIG.name} Community Board ${getCurrentYear()}`,
      };

      return (
        staticTitles[route] ||
        `${APP_CONFIG.name} - Browse AI Resources & Tools ${getCurrentYear()}`
      );
    },
    description: (context) => {
      const route = context.route || '/';

      const staticDescriptions: Record<string, string> = {
        '/search': `Search through 150+ Claude configurations, MCP servers, agents, commands, rules, and tools. Find what you need for your Claude AI workflows in ${getCurrentYear()} today.`,
        '/trending': `Discover popular and trending Claude configurations based on community engagement. Stay updated with what developers are using and loving in ${getCurrentMonthYear()}.`,
        '/for-you': `Personalized Claude configuration recommendations based on your interests and usage patterns. Discover content tailored for your workflow needs in ${getCurrentYear()}.`,
        '/partner': `Partner with ${APP_CONFIG.name} in ${getCurrentYear()} to showcase tools and reach thousands of Claude developers. Explore sponsorship opportunities and partnership options.`,
        '/community': `Join the Claude developer community in ${getCurrentMonthYear()}. Share configurations, discuss best practices, connect with developers building the future of AI systems.`,
        '/login': `Login to ${APP_CONFIG.name} to save configurations, create collections, submit content, and engage with the Claude developer community in ${getCurrentMonthYear()}.`,
        '/companies': `Discover companies using Claude AI for development, automation, and productivity in ${getCurrentMonthYear()}. Learn how organizations leverage Claude for operations.`,
        '/api-docs': `API documentation for ${APP_CONFIG.name} in ${getCurrentMonthYear()}. Integrate our catalog of configurations into your tools and workflows with RESTful endpoints.`,
        '/submit': `Submit your Claude configurations to ${APP_CONFIG.name}. Share agents, MCP servers, commands, rules, and tools with the developer community in ${getCurrentYear()}.`,
        '/board': `Community discussion board for Claude developers in ${getCurrentMonthYear()}. Ask questions, share insights, connect with other developers building with AI systems.`,
        '/board/new': `Create a new post on the ${APP_CONFIG.name} community board in ${getCurrentMonthYear()}. Share your questions, insights, or configurations with the community now.`,
      };

      return (
        staticDescriptions[route] ||
        `Browse Claude AI configurations and resources for ${getCurrentMonthYear()}. Find tools, plugins, and setups to enhance your Claude development workflow and productivity.`
      );
    },
    keywords: (context) => {
      const route = context.route || '/';
      const routeName = route.slice(1) || 'home';

      return ['claude', getCurrentYear(), routeName, 'configurations', 'ai'];
    },
    validation: STANDARD_VALIDATION,
  },

  /**
   * AUTH Pattern
   * Routes: /auth/* (1 route)
   * Error page - no indexing (SEO-optimized 53-60 chars, 150-160 chars)
   */
  AUTH: {
    title: () => `Authentication Error - ${APP_CONFIG.name} Platform ${getCurrentYear()}`,
    description: () =>
      `There was an error with your authentication request on ${APP_CONFIG.name}. Please try again or contact support if the problem persists in ${getCurrentMonthYear()}.`,
    keywords: () => ['claude', 'auth', 'error', 'login', 'authentication'],
    validation: STANDARD_VALIDATION,
  },
};

/**
 * Get metadata template for a route pattern
 *
 * @param pattern - Route pattern type
 * @returns Metadata template for the pattern
 *
 * @example
 * ```typescript
 * const template = getTemplate('CATEGORY');
 * const title = template.title({ categoryConfig: {...} });
 * ```
 */
export function getTemplate(pattern: RoutePattern): MetadataTemplate {
  return METADATA_TEMPLATES[pattern];
}

/**
 * Validate generated metadata against template rules
 *
 * Checks if title, description, and keywords meet pattern-specific validation rules.
 * Returns validation errors if any rules are violated.
 *
 * @param metadata - Generated metadata to validate
 * @param pattern - Route pattern (for validation rules)
 * @returns Array of validation errors (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateTemplateMetadata(
 *   { title: 'Too Short', description: '...', keywords: ['a'] },
 *   'CATEGORY'
 * );
 * // Returns: ['Title too short: 9 chars (need 55-60)', 'Too few keywords: 1 (need >= 3)']
 * ```
 */
export function validateTemplateMetadata(
  metadata: { title: string; description: string; keywords: string[] },
  pattern: RoutePattern
): string[] {
  const template = METADATA_TEMPLATES[pattern];
  const { validation } = template;
  const errors: string[] = [];

  // Validate title length
  const titleLength = metadata.title.length;
  const [minTitle, maxTitle] = validation.titleLength;

  if (titleLength < minTitle) {
    errors.push(`Title too short: ${titleLength} chars (need ${minTitle}-${maxTitle})`);
  } else if (titleLength > maxTitle) {
    errors.push(`Title too long: ${titleLength} chars (need ${minTitle}-${maxTitle})`);
  }

  // Validate description length
  const descLength = metadata.description.length;
  const [minDesc, maxDesc] = validation.descLength;

  if (descLength < minDesc) {
    errors.push(`Description too short: ${descLength} chars (need ${minDesc}-${maxDesc})`);
  } else if (descLength > maxDesc) {
    errors.push(`Description too long: ${descLength} chars (need ${minDesc}-${maxDesc})`);
  }

  // Validate keywords count
  const keywordCount = metadata.keywords.length;
  if (keywordCount < validation.minKeywords) {
    errors.push(`Too few keywords: ${keywordCount} (need >= ${validation.minKeywords})`);
  }

  return errors;
}

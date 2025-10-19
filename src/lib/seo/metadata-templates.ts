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
import type { RoutePattern } from '@/src/lib/seo/route-classifier';

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
      const lastSpace = fallbackPadded.substring(0, DESC_MAX - 3).lastIndexOf(' ');
      return (
        fallbackPadded.substring(0, lastSpace > DESC_MIN - 10 ? lastSpace : DESC_MAX - 3) + '...'
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
      'Discover Claude configurations in October 2025. Explore expert rules, MCP servers, AI agents, commands, hooks, and statuslines for Claude development.',
    keywords: () => ['claude ai', 'mcp servers', 'ai agents', 'configurations', '2025'],
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
      // Prioritize formulas with "Claude" and "2025" for brand consistency and freshness signals
      // Include longer formulas for short category names (e.g., "Mcps" = 4 chars needs 53+ chars)
      const formulas = [
        `Browse ${config.pluralTitle} - ${kw1} for Claude AI - Directory 2025`,
        `Explore ${config.pluralTitle} - ${kw1} for Claude AI - Directory 2025`,
        `Browse ${config.pluralTitle} for Claude AI - Community Directory 2025`,
        `Explore ${config.pluralTitle} for Claude AI - Community Directory 2025`,
        `${config.pluralTitle} for Claude - Community Directory 2025`,
        `Explore ${config.pluralTitle} for Claude - ${kw1} Directory 2025`,
        `Browse ${config.pluralTitle} for Claude - ${kw1} Directory 2025`,
        `Explore ${config.pluralTitle} for Claude - Community Directory 2025`,
        `Browse ${config.pluralTitle} for Claude - Community Directory 2025`,
        `Explore ${config.pluralTitle} for Claude - Community 2025`,
        `Browse ${config.pluralTitle} for Claude - Community 2025`,
        `Explore ${config.pluralTitle} for Claude - Directory 2025`,
        `Browse ${config.pluralTitle} for Claude - Directory 2025`,
        `${config.pluralTitle} for Claude - ${kw1} & ${kw2} Directory`,
      ];

      // Find first formula that fits optimal range (uses seo-config constants)
      for (const formula of formulas) {
        if (formula.length >= OPTIMAL_MIN && formula.length <= OPTIMAL_MAX) {
          return formula;
        }
      }

      // Fallback: return formula closest to target (middle of optimal range)
      const targetLength = Math.floor((OPTIMAL_MIN + OPTIMAL_MAX) / 2);
      let closestFormula = formulas[0] as string;
      let closestDiff = Math.abs((formulas[0] as string).length - targetLength);

      for (const formula of formulas) {
        const diff = Math.abs(formula.length - targetLength);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestFormula = formula;
        }
      }

      return closestFormula;
    },
    description: (context) => {
      const config = context.categoryConfig;
      const fallback =
        'Browse Claude AI configurations and resources for October 2025. Find tools, plugins, and setups to enhance your development workflow.';

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
      const defaultKeywords = ['claude', 'ai', '2025'];

      if (!(config && config.keywords)) {
        return defaultKeywords;
      }

      // Parse comma-separated keywords from category config
      const parsedKeywords = config.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      // Ensure minimum 3 keywords by padding with defaults
      if (parsedKeywords.length < 3) {
        const needed = 3 - parsedKeywords.length;
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
      ];

      // Find first formula that fits optimal range
      for (const formula of formulas) {
        if (formula.length >= OPTIMAL_MIN && formula.length <= OPTIMAL_MAX) {
          return formula;
        }
      }

      // Fallback: Use base formula and truncate if needed
      const baseTitle = `${displayTitle} - ${categoryName} - ${APP_CONFIG.name}`;
      if (baseTitle.length > OPTIMAL_MAX) {
        // Truncate displayTitle to fit (keep category and site name)
        const suffix = ` - ${categoryName} - ${APP_CONFIG.name}`;
        const maxDisplayLength = OPTIMAL_MAX - suffix.length;
        const truncatedDisplay = displayTitle.substring(0, maxDisplayLength);
        return `${truncatedDisplay} - ${categoryName} - ${APP_CONFIG.name}`;
      }

      // Title is too short - pad with year for freshness signal
      if (baseTitle.length < OPTIMAL_MIN) {
        return `${displayTitle} - ${categoryName} 2025 - ${APP_CONFIG.name}`;
      }

      return baseTitle;
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
        return ['claude', 'content', '2025'];
      }

      const item = context.item as { tags?: string[]; keywords?: string[] };
      return item.tags || item.keywords || ['claude', 'content', '2025'];
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
        return `${name} Collections - ${APP_CONFIG.name} Community 2025`;
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
        const baseDesc = `Browse ${name}'s Claude configuration collections on ${APP_CONFIG.name} in October 2025.`;

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
        return baseDesc.substring(0, DESC_MAX - 3) + '...';
      }

      // Main profile page - use smart padding system
      const bio =
        profile?.bio || `${name} is a member of the ${APP_CONFIG.name} developer community.`;
      const followerCount = profile?.followerCount || 0;
      const postCount = profile?.postCount || 0;

      const baseDesc = `${bio} ${followerCount} followers, ${postCount} posts on ${APP_CONFIG.name} in October 2025.`;

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
          const lastSpace = fallback.substring(0, DESC_MAX - 3).lastIndexOf(' ');
          return (
            fallback.substring(0, lastSpace > DESC_MIN - 10 ? lastSpace : DESC_MAX - 3) + '...'
          );
        }

        return fallback;
      }

      // Too long - smart truncation at word boundary
      const lastSpace = baseDesc.substring(0, DESC_MAX - 3).lastIndexOf(' ');
      return baseDesc.substring(0, lastSpace > DESC_MIN - 10 ? lastSpace : DESC_MAX - 3) + '...';
    },
    keywords: (context) => {
      const profile = context.profile as { interests?: string[] } | undefined;
      const interests = profile?.interests || [];

      return ['claude', 'profile', 'developer', 'community', '2025', ...interests.slice(0, 3)];
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
        '/account': `Account Dashboard - ${APP_CONFIG.name} Platform 2025`,
        '/account/activity': `Activity History - ${APP_CONFIG.name} Account Dashboard`,
        '/account/bookmarks': `My Bookmarks - Saved Claude Configs - ${APP_CONFIG.name}`,
        '/account/jobs': `My Job Postings - ${APP_CONFIG.name} Account Dashboard`,
        '/account/jobs/new': `Create Job Posting - ${APP_CONFIG.name} Platform 2025`,
        '/account/library': `My Library - Claude Collections - ${APP_CONFIG.name}`,
        '/account/library/new': `Create Collection - ${APP_CONFIG.name} Library 2025`,
        '/account/settings': `Account Settings - ${APP_CONFIG.name} Profile Manager`,
        '/account/sponsorships': `My Sponsorships - ${APP_CONFIG.name} Account Dashboard`,
        '/account/submissions': `My Submissions - ${APP_CONFIG.name} Account Dashboard`,
      };

      // Handle dynamic routes with pattern matching
      if (route.includes('/jobs/') && route.includes('/edit')) {
        return `Edit Job Posting - ${APP_CONFIG.name} Account Dashboard`;
      }
      if (route.includes('/jobs/') && route.includes('/analytics')) {
        return `Job Analytics - ${APP_CONFIG.name} Account Dashboard 2025`;
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

      return accountTitles[route] || `My Account - ${APP_CONFIG.name} Platform 2025`;
    },
    description: (context) => {
      const route = context.route || '/account';

      // Map routes to complete SEO-optimized descriptions (150-160 chars)
      const accountDescriptions: Record<string, string> = {
        '/account': `Manage your ${APP_CONFIG.name} account dashboard in October 2025. View activity, saved content, submissions, and manage your Claude development profile.`,
        '/account/activity': `View your activity history on ${APP_CONFIG.name} in October 2025. Track your interactions, contributions, and engagement with the Claude developer community.`,
        '/account/bookmarks': `Access your saved Claude configurations and bookmarks on ${APP_CONFIG.name}. Organize favorite tools, guides, and resources for quick access in 2025.`,
        '/account/jobs': `Manage your job postings on ${APP_CONFIG.name} in October 2025. View analytics, edit listings, and connect with Claude developers seeking opportunities.`,
        '/account/jobs/new': `Create a new job posting on ${APP_CONFIG.name} in October 2025. Reach thousands of Claude developers and AI professionals in the developer community.`,
        '/account/library': `Manage your Claude configuration collections on ${APP_CONFIG.name} in October 2025. Organize, share, and discover curated lists for AI development workflows.`,
        '/account/library/new': `Create a new collection on ${APP_CONFIG.name} in October 2025. Organize Claude configurations, tools, and resources into shareable curated lists today.`,
        '/account/settings': `Update your ${APP_CONFIG.name} account settings in October 2025. Manage profile information, preferences, notifications, and privacy settings today.`,
        '/account/sponsorships': `View your sponsorships on ${APP_CONFIG.name} in October 2025. Track sponsored content performance, analytics, and engagement with Claude developers.`,
        '/account/submissions': `Manage your submitted Claude configurations on ${APP_CONFIG.name} in October 2025. View status, edit submissions, and track community engagement on content.`,
      };

      // Handle dynamic routes with pattern matching
      if (route.includes('/jobs/') && route.includes('/edit')) {
        return `Edit your job posting on ${APP_CONFIG.name} in October 2025. Update details, requirements, and description to attract Claude AI developers and professionals.`;
      }
      if (route.includes('/jobs/') && route.includes('/analytics')) {
        return `View job posting analytics on ${APP_CONFIG.name} in October 2025. Track views, applications, and engagement metrics for your developer job listing today.`;
      }
      if (route.includes('/library/') && route.includes('/edit')) {
        return `Edit your collection on ${APP_CONFIG.name} in October 2025. Update title, description, and configurations in your curated list of Claude resources today.`;
      }
      if (route.includes('/library/') && route.match(/\/library\/[^/]+$/)) {
        return `View collection details on ${APP_CONFIG.name} in October 2025. Browse curated Claude configurations, tools, and resources organized for development workflows.`;
      }
      if (route.includes('/sponsorships/') && route.includes('/analytics')) {
        return `View sponsorship analytics on ${APP_CONFIG.name} in October 2025. Track performance metrics, engagement, and ROI for your sponsored Claude developer content.`;
      }

      return (
        accountDescriptions[route] ||
        `Manage your ${APP_CONFIG.name} account in October 2025. Update settings, view activity, and organize your Claude configurations for AI development workflows.`
      );
    },
    keywords: () => ['claude', 'account', 'dashboard', 'profile', '2025'],
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

      return `Claude Tools & Utilities 2025 - ${APP_CONFIG.name}`;
    },
    description: (context) => {
      const route = context.route || '';

      if (route.includes('config-recommender')) {
        if (route.includes('results')) {
          return 'Your personalized Claude configuration recommendations in October 2025. Explore matched configurations based on use case, experience level, and preferences.';
        }
        return 'Answer 7 quick questions and get personalized Claude configuration recommendations in October 2025. Instant results, zero cost, tailored to your needs.';
      }

      return 'Explore Claude tools and utilities to enhance your AI workflow in October 2025. Find recommenders, analyzers, and helpers for Claude development projects.';
    },
    keywords: (context) => {
      const route = context.route || '';

      if (route.includes('config-recommender')) {
        return ['claude', 'tools', 'recommender', 'configuration', 'personalized', '2025'];
      }

      return ['claude', 'tools', 'utilities', 'workflow', '2025'];
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
        '/for-you': 'For You - Personalized Claude Recommendations 2025 Directory',
        '/partner': `Partner with ${APP_CONFIG.name} - Sponsorship Options 2025`,
        '/community': `Claude Community & Discussions 2025 - ${APP_CONFIG.name}`,
        '/login': `Login to ${APP_CONFIG.name} - Account Dashboard Access`,
        '/companies': `Companies Using Claude AI in 2025 - ${APP_CONFIG.name}`,
        '/api-docs': `API Documentation for ${APP_CONFIG.name} Platform 2025`,
        '/submit': `Submit Claude Content 2025 - ${APP_CONFIG.name} Platform`,
        '/board': `Claude Community Board 2025 - ${APP_CONFIG.name} Forum`,
        '/board/new': `Create Post - ${APP_CONFIG.name} Community Board 2025`,
      };

      return staticTitles[route] || `${APP_CONFIG.name} - Browse AI Resources & Tools 2025`;
    },
    description: (context) => {
      const route = context.route || '/';

      const staticDescriptions: Record<string, string> = {
        '/search':
          'Search through 150+ Claude configurations, MCP servers, agents, commands, rules, and tools. Find what you need for your Claude AI workflows in 2025 today.',
        '/trending':
          'Discover popular and trending Claude configurations based on community engagement. Stay updated with what developers are using and loving in October 2025.',
        '/for-you':
          'Personalized Claude configuration recommendations based on your interests and usage patterns. Discover content tailored for your workflow needs in 2025.',
        '/partner': `Partner with ${APP_CONFIG.name} in 2025 to showcase tools and reach thousands of Claude developers. Explore sponsorship opportunities and partnership options.`,
        '/community':
          'Join the Claude developer community in October 2025. Share configurations, discuss best practices, connect with developers building the future of AI systems.',
        '/login': `Login to ${APP_CONFIG.name} to save configurations, create collections, submit content, and engage with the Claude developer community in October 2025.`,
        '/companies':
          'Discover companies using Claude AI for development, automation, and productivity in October 2025. Learn how organizations leverage Claude for operations.',
        '/api-docs': `API documentation for ${APP_CONFIG.name} in October 2025. Integrate our catalog of configurations into your tools and workflows with RESTful endpoints.`,
        '/submit': `Submit your Claude configurations to ${APP_CONFIG.name}. Share agents, MCP servers, commands, rules, and tools with the developer community in 2025.`,
        '/board':
          'Community discussion board for Claude developers in October 2025. Ask questions, share insights, connect with other developers building with AI systems.',
        '/board/new': `Create a new post on the ${APP_CONFIG.name} community board in October 2025. Share your questions, insights, or configurations with the community now.`,
      };

      return (
        staticDescriptions[route] ||
        'Browse Claude AI configurations and resources for October 2025. Find tools, plugins, and setups to enhance your Claude development workflow and productivity.'
      );
    },
    keywords: (context) => {
      const route = context.route || '/';
      const routeName = route.slice(1) || 'home';

      return ['claude', '2025', routeName, 'configurations', 'ai'];
    },
    validation: STANDARD_VALIDATION,
  },

  /**
   * AUTH Pattern
   * Routes: /auth/* (1 route)
   * Error page - no indexing (SEO-optimized 53-60 chars, 150-160 chars)
   */
  AUTH: {
    title: () => `Authentication Error - ${APP_CONFIG.name} Platform 2025`,
    description: () =>
      `There was an error with your authentication request on ${APP_CONFIG.name}. Please try again or contact support if the problem persists in October 2025.`,
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

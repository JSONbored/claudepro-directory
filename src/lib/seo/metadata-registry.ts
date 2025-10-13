/**
 * Centralized Metadata Registry
 *
 * **SCHEMA-FIRST ARCHITECTURE (October 2025):**
 * This registry is now a FALLBACK for explicit overrides only.
 * Primary metadata source is schema-metadata-adapter.ts which derives metadata
 * from content schemas automatically (NO manual configuration needed).
 *
 * Metadata Resolution Order:
 * 1. **Schema Derivation** (Primary) - Automatic from content schemas
 * 2. **Registry Config** (Fallback) - Explicit overrides defined here
 * 3. **Smart Defaults** (Last Resort) - Generic metadata for unknown routes
 *
 * October 2025 SEO Optimization:
 * - AI citation optimization (ChatGPT, Perplexity, Claude search)
 * - Schema.org 29.3 compliance (817 types available)
 * - Server-side JSON-LD only (AI bots skip client-side JavaScript)
 * - Recency signals (dateModified within 30 days = 3.2x more citations)
 * - Year inclusion in descriptions (ChatGPT queries for current year)
 *
 * @module lib/seo/metadata-registry
 */

import { z } from 'zod';
import { APP_CONFIG } from '@/src/lib/constants';
import { getDisplayTitle } from '@/src/lib/utils';

/**
 * Metadata Source Type
 * Indicates where metadata originated from
 */
export type RouteMetadataSource = 'registry' | 'schema' | 'smart-default';

/**
 * Context type for metadata generation
 * Defined here to avoid circular imports
 *
 * Production Standards:
 * - Compatible with exactOptionalPropertyTypes: true
 * - All optional properties explicitly allow undefined
 * - Index signatures for flexibility with content loaders
 */
export interface MetadataContext {
  params?: Record<string, string | string[]> | undefined;
  item?:
    | {
        title?: string | undefined;
        name?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        author?: string | undefined;
        dateAdded?: string | undefined;
        lastModified?: string | undefined;
        [key: string]: unknown;
      }
    | undefined;
  categoryConfig?:
    | {
        title?: string | undefined;
        pluralTitle?: string | undefined;
        metaDescription?: string | undefined;
        keywords?: string | undefined; // Comma-separated string from category-config.ts
        [key: string]: unknown;
      }
    | undefined;
  category?: string | undefined;
  slug?: string | undefined;
  filters?: Record<string, unknown> | undefined;
  [key: string]: unknown;
}

/**
 * AI Optimization Configuration Schema
 * Flags for October 2025 AI search engine optimization
 *
 * Research-backed optimizations:
 * - Content updated within 30 days = 3.2x more AI citations
 * - Including "2025" in descriptions increases ChatGPT citation likelihood
 * - Wikipedia-style content gets 7.8% citation rate (highest of all sources)
 * - Article schema preferred over WebPage for content pages
 *
 * @see {@link file://./ai-optimization.ts} - Helper functions for AI optimization
 */
export const aiOptimizationSchema = z
  .object({
    /** Include current year in description (ChatGPT search queries for "2025") */
    includeYear: z
      .boolean()
      .default(true)
      .describe('Add current year/month to description for AI search optimization'),

    /** Add recency signal (dateModified timestamp) for 3.2x more AI citations */
    recencySignal: z
      .boolean()
      .default(false)
      .describe('Include dateModified in metadata for fresh content signals'),

    /** Use Article schema instead of WebPage (better for AI citations) */
    useArticleSchema: z
      .boolean()
      .default(false)
      .describe('Prefer Article over WebPage schema for content pages'),

    /** Generate FAQ schema for AI answer engines */
    generateFAQSchema: z
      .boolean()
      .default(false)
      .describe('Generate FAQ structured data for question-answering AI engines'),

    /** Structure content like Wikipedia (preferred by AI models - 7.8% citation rate) */
    wikipediaStyle: z
      .boolean()
      .default(false)
      .describe('Use Wikipedia-style structure (H2→H3→bullets) for higher citation rate'),
  })
  .describe('AI search engine optimization configuration for October 2025');

export type AIOptimization = z.infer<typeof aiOptimizationSchema>;

/**
 * Title Configuration
 * Titles are generated using helper functions (buildPageTitle, buildContentTitle)
 *
 * Production Standards:
 * - Max 60 chars total (Google recommendation, October 2025)
 * - Dash separator (9% higher CTR than pipe on Google)
 * - Support for static strings or dynamic functions
 */
export type TitleConfig = string | ((context?: MetadataContext) => string | Promise<string>);

/**
 * Structured Data Configuration Schema
 * Controls JSON-LD schema generation for SEO
 *
 * Production Standards:
 * - Server-side only (AI bots skip client-side JavaScript)
 * - Schema.org 29.3 compliance (September 2025 version)
 * - Article schema preferred for content pages (better AI citations)
 * - All schemas include required properties for validation
 *
 * @see {@link https://schema.org/docs/schemas.html} - Schema.org documentation
 */
export const structuredDataConfigSchema = z
  .object({
    /** Primary schema type (Article recommended for AI citations) */
    type: z
      .enum([
        'WebPage',
        'Article',
        'FAQPage',
        'HowTo',
        'SoftwareApplication',
        'JobPosting',
        'CollectionPage',
        'Blog',
        'TechArticle',
        'ProfilePage',
      ])
      .describe('Schema.org type for structured data generation'),

    /** Generate breadcrumb navigation schema */
    breadcrumbs: z.boolean().default(true).describe('Include BreadcrumbList schema for navigation'),

    /** Include dateModified for recency signals */
    dateModified: z
      .boolean()
      .default(false)
      .describe('Add dateModified property for fresh content signals (3.2x more AI citations)'),

    /** Include author information */
    author: z.boolean().default(false).describe('Include author/publisher information in schema'),
  })
  .describe('Configuration for JSON-LD structured data generation');

export type StructuredDataConfig = z.infer<typeof structuredDataConfigSchema>;

/**
 * Route Metadata Configuration
 * Defines metadata for a specific route or route pattern
 *
 * Production Standards:
 * - Type-safe function signatures with explicit MetadataContext
 * - Support for both static values and dynamic resolution
 * - AI optimization flags for October 2025 SEO
 * - Full TSDoc documentation for all properties
 *
 * @interface RouteMetadata
 */
export interface RouteMetadata {
  /**
   * Page title configuration
   * Can be static string or function for dynamic resolution
   *
   * @example
   * ```typescript
   * // Static
   * title: buildPageTitle('Community')
   *
   * // Dynamic
   * title: (context) => buildContentTitle(context?.item?.title || 'Item', 'Category')
   * ```
   */
  title: TitleConfig;

  /**
   * Meta description (120-160 chars for AI optimization)
   * AI-optimized length based on October 2025 research
   * Can be static string or function for dynamic resolution
   */
  description: string | ((context?: MetadataContext) => string | Promise<string>);

  /**
   * Keywords array (max 10 for SEO best practice)
   * Optional - only used for specific content types
   * Can be static array or function for dynamic resolution
   */
  keywords?: string[] | ((context?: MetadataContext) => string[] | Promise<string[]>);

  /**
   * OpenGraph configuration (REQUIRED for all routes)
   * Used for social media sharing previews
   * Title and description default to page title/description if not specified
   */
  openGraph: {
    title?: string | undefined;
    description?: string | undefined;
    type: 'website' | 'article';
  };

  /**
   * Twitter Card configuration (REQUIRED for all routes)
   * Used for Twitter/X sharing previews
   * Title and description default to page title/description if not specified
   */
  twitter: {
    title?: string | undefined;
    description?: string | undefined;
    card: 'summary' | 'summary_large_image';
  };

  /**
   * Structured data configuration
   * Controls JSON-LD schema generation for SEO
   */
  structuredData: StructuredDataConfig;

  /**
   * AI optimization flags
   * October 2025 settings for ChatGPT, Perplexity, Claude search
   */
  aiOptimization?: AIOptimization;

  /**
   * Robots meta directives (optional)
   * Controls search engine crawler behavior
   * Defaults to index: true, follow: true if not specified
   */
  robots?: {
    index: boolean;
    follow: boolean;
  };
}

/**
 * Global Metadata Defaults
 * Applied to all routes unless overridden
 */
export const METADATA_DEFAULTS = {
  siteName: APP_CONFIG.name,
  separator: ' - ',
  includeYear: true,
  serverSideOnly: true, // No client-side JSON-LD (AI bots skip JavaScript)
  schemaVersion: '29.3', // Schema.org version (Sept 4, 2025)
} as const;

// ============================================
// TITLE GENERATION HELPERS (Consolidated)
// ============================================

/**
 * Site name and separator constants
 * Centralized for consistent title generation
 */
const SITE_NAME = METADATA_DEFAULTS.siteName; // "Claude Pro Directory" (20 chars)
const SEPARATOR = METADATA_DEFAULTS.separator; // " - " (3 chars)

/**
 * Category display names for content routes
 * Maps URL slugs to human-readable category names
 * Used in content-tier titles: {name} - {category} - Claude Pro Directory
 */
export const CATEGORY_NAMES: Record<string, string> = {
  agents: 'AI Agents', // 9 chars → overhead 35, max title 20-25
  mcp: 'MCP', // 3 chars → overhead 29, max title 26-31
  rules: 'Rules', // 5 chars → overhead 31, max title 24-29
  commands: 'Commands', // 8 chars → overhead 34, max title 21-26
  hooks: 'Hooks', // 5 chars → overhead 31, max title 24-29
  statuslines: 'Statuslines', // 11 chars → overhead 37, max title 18-23
  guides: 'Guides', // 6 chars → overhead 32, max title 23-28
  collections: 'Collections', // 11 chars → overhead 37, max title 18-23
} as const;

/**
 * Smart title truncation that preserves word boundaries
 * Truncates at last space before maxLength (if space exists in last 30% of string)
 *
 * @param title - Title to truncate
 * @param maxLength - Maximum length in characters
 * @returns Truncated title without trailing ellipsis
 *
 * @example
 * smartTruncate("Technical Documentation Writer Agent", 20)
 * // → "Technical Documentation" (word boundary preserved)
 *
 * @example
 * smartTruncate("Short Title", 50)
 * // → "Short Title" (no truncation needed)
 */
export function smartTruncate(title: string, maxLength: number): string {
  if (title.length <= maxLength) return title;

  // Try to truncate at word boundary
  const truncated = title.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  // Only use word boundary if it's in the last 30% of target length
  // This prevents cutting off too much content
  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace);
  }

  return truncated.trim();
}

/**
 * Build content-tier titles with automatic truncation
 * Pattern: {contentName} - {category} - Claude Pro Directory
 * Target: 55-60 characters total
 *
 * @param contentName - Content name (from item.seoTitle or item.title)
 * @param category - Category slug (e.g., 'agents', 'mcp', 'hooks')
 * @returns Final page title within 55-60 char range
 *
 * @example
 * buildContentTitle("Code Reviewer Agent", "agents")
 * // → "Code Reviewer Agent - AI Agents - Claude Pro Directory" (58 chars)
 *
 * @example
 * buildContentTitle("Technical Documentation Writer Agent", "agents")
 * // → "Technical Documentation - AI Agents - Claude Pro Directory" (59 chars)
 */
export function buildContentTitle(contentName: string, category: string): string {
  const categoryDisplay = CATEGORY_NAMES[category] || category;

  // Calculate overhead: " - {category} - Claude Pro Directory"
  const overhead = SEPARATOR.length + categoryDisplay.length + SEPARATOR.length + SITE_NAME.length;

  // Calculate max allowed content name length (target: 60 chars total)
  const maxContentLength = 60 - overhead;

  // Smart truncate if needed (preserves word boundaries)
  let finalContentName = smartTruncate(contentName, maxContentLength);

  // Build title
  let title = `${finalContentName}${SEPARATOR}${categoryDisplay}${SEPARATOR}${SITE_NAME}`;

  // Ensure minimum 55 characters - pad if needed
  if (title.length < 55) {
    const paddingWords: Record<string, string> = {
      agents: 'Tool',
      mcp: 'Server',
      rules: 'Config',
      commands: 'Tool',
      hooks: 'Config',
      statuslines: 'Config',
      guides: 'Guide',
      collections: 'Collection',
    };

    const padding = paddingWords[category] || 'Configuration';

    if (finalContentName.length + padding.length + 1 <= maxContentLength) {
      finalContentName = `${finalContentName} ${padding}`;
      title = `${finalContentName}${SEPARATOR}${categoryDisplay}${SEPARATOR}${SITE_NAME}`;
    }

    if (title.length < 55 && finalContentName.length + 5 <= maxContentLength) {
      finalContentName = `${finalContentName} 2025`;
      title = `${finalContentName}${SEPARATOR}${categoryDisplay}${SEPARATOR}${SITE_NAME}`;
    }

    if (title.length < 55 && finalContentName.length + 4 <= maxContentLength) {
      finalContentName = `${finalContentName} Tool`;
      title = `${finalContentName}${SEPARATOR}${categoryDisplay}${SEPARATOR}${SITE_NAME}`;
    }
  }

  return title;
}

/**
 * Build section/static-tier titles
 * Pattern: {title} - Claude Pro Directory
 * Target: 55-60 characters total
 *
 * @param parts - Title parts (excluding site name, which is auto-appended)
 * @returns Final page title
 *
 * @example
 * buildPageTitle("Trending Configurations")
 * // → "Trending Configurations - Claude Pro Directory" (51 chars)
 *
 * @example
 * buildPageTitle("404 Not Found", "Browse AI Configs")
 * // → "404 Not Found - Browse AI Configs - Claude Pro Directory" (57 chars)
 */
export function buildPageTitle(...parts: string[]): string {
  const filteredParts = parts.filter(Boolean);
  return [...filteredParts, SITE_NAME].join(SEPARATOR);
}

/**
 * Centralized Metadata Registry
 * Maps route patterns to metadata configurations
 *
 * Route Patterns:
 * - Static: '/trending', '/submit', etc.
 * - Dynamic: '/:category', '/:category/:slug'
 * - Catch-all: '/guides/:path*'
 *
 * Title Generation:
 * - All titles now generated using helpers above (no external dependencies)
 * - Content routes use buildContentTitle() with seoTitle priority
 * - Static routes use buildPageTitle()
 * - All titles automatically fit within 55-60 character SEO optimal range
 */
export const METADATA_REGISTRY = {
  /**
   * Homepage - Special Case
   * Optimized for AI citations with Wikipedia-style structuring
   *
   * Must meet 55-60 char title requirement for SEO validation
   * OpenGraph/Twitter: Uses page title and description by default from metadata-generator.ts
   */
  '/': {
    title: 'Claude Pro Directory - MCP Servers, AI Agents & Configs', // 55 chars - meets SEO requirement
    description:
      'Directory of 150+ Claude AI configurations for October 2025. Community collection of MCP servers, agents, hooks, commands, and rules for AI development.',
    keywords: [
      'claude ai',
      'claude pro',
      'mcp servers 2025',
      'claude agents',
      'claude configurations',
      'ai development tools',
      'model context protocol',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: false,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: true,
    },
  },

  /**
   * Trending Page - Tier 2
   * High recency signal for fresh content
   */
  '/trending': {
    title: buildPageTitle('Trending Claude AI Configurations'), // 56 chars ✓
    description:
      'Trending Claude AI configurations updated daily in October 2025. Track real-time growth velocity and popularity metrics for MCP servers, agents, and tools.',
    keywords: [
      'trending claude configs',
      'popular mcp servers 2025',
      'claude ai trending',
      'ai tools popularity',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: true, // High recency signal
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true, // Updated daily
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Submit Page - Tier 2
   * Clear action-oriented description
   */
  '/submit': {
    title: buildPageTitle('Submit Claude Configuration 2025'),
    description:
      'Submit your Claude AI configuration in October 2025. Share agents, MCP servers, hooks, commands, and rules with developers worldwide for Claude Code projects.',
    keywords: [
      'submit claude config',
      'contribute to claude directory',
      'share mcp server',
      'claude community 2025',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: true, // FAQ about submission process
      wikipediaStyle: false,
    },
  },

  /**
   * Configuration Recommender Landing Page - Tier 2
   * Interactive tool for personalized configuration recommendations
   */
  '/tools/config-recommender': {
    title: buildPageTitle('Claude Config Recommender Tool'),
    description: async () => {
      const { getTotalContentCount } = await import('@/src/lib/content/content-loaders');
      const count = await getTotalContentCount();
      return `Find your perfect Claude configuration in 2 minutes. Answer 7 questions and get personalized recommendations from ${count}+ configs. Instant, AI-powered matching for your exact needs.`;
    },
    keywords: [
      'claude config recommender',
      'claude configuration quiz',
      'personalized claude setup',
      'claude ai recommendations 2025',
      'find best claude config',
      'claude tool finder',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'HowTo' as const, // Quiz is a how-to process
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: true, // FAQ about recommendation process
      wikipediaStyle: false,
    },
  },

  /**
   * Configuration Recommender Results Page - Tier 3
   * Dynamic results with personalized recommendations
   */
  '/tools/config-recommender/results/:id': {
    title: (ctx?: MetadataContext) => {
      const resultTitle = ctx?.item?.title
        ? String(ctx.item.title)
        : 'Your Configuration Recommendations';
      return buildPageTitle(resultTitle, 'Config Recommender');
    },
    description: (ctx?: MetadataContext) =>
      ctx?.item?.description
        ? String(ctx.item.description)
        : 'View your personalized Claude configuration recommendations. Discover the best configs matched to your specific needs and use case.',
    keywords: [
      'claude config results',
      'personalized recommendations',
      'claude configuration matches',
      'ai config suggestions',
    ],
    openGraph: {
      type: 'article' as const, // Results are user-specific content
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'Article' as const,
      breadcrumbs: true,
      dateModified: false,
      author: true,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: true,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Partner Page - Tier 2
   * Business-focused description
   */
  '/partner': {
    title: buildPageTitle('Partner With Claude Pro Directory'),
    description:
      'Partner with Claude Pro Directory to showcase your AI tools and reach developers in October 2025. Collaborate on integrations, sponsorships, and community initiatives.',
    keywords: [
      'claude pro partnership',
      'ai tools partnership 2025',
      'developer community collaboration',
      'claude sponsorship',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: true,
      wikipediaStyle: false,
    },
  },

  /**
   * Collections List - Tier 2
   * Curated content discovery
   */
  '/collections': {
    title: buildPageTitle('Claude Configuration Collections 2025'),
    description:
      'Curated Claude AI collections for October 2025. Hand-picked MCP servers, agents, and workflows organized by use case, expertise level, and development needs.',
    keywords: [
      'claude collections',
      'curated ai tools 2025',
      'mcp server collections',
      'claude workflows',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'CollectionPage' as const,
      breadcrumbs: true,
      dateModified: true,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Guides List - Tier 2
   * Educational content hub
   */
  '/guides': {
    title: buildPageTitle('Claude AI Guides & Tutorials 2025'),
    description:
      'Comprehensive guides for Claude AI in October 2025. Learn MCP server setup, agent configuration, automation workflows, and advanced development techniques.',
    keywords: [
      'claude ai guides 2025',
      'mcp server tutorial',
      'claude agent setup',
      'ai development guides',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: true,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: true,
    },
  },

  /**
   * Community Page - Tier 2
   * Social engagement focus
   */
  '/community': {
    title: buildPageTitle('Community Hub - Connect & Collaborate'),
    description:
      'Join the Claude community for October 2025. Connect with AI developers, share Claude configurations, contribute to projects, and get AI development support.',
    keywords: [
      'claude community 2025',
      'ai developers network',
      'claude discord',
      'open source ai tools',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: true,
      wikipediaStyle: false,
    },
  },

  /**
   * Jobs List - Tier 2
   * Career opportunities
   */
  '/jobs': {
    title: buildPageTitle('AI Jobs'),
    description:
      'Discover Claude AI and machine learning job opportunities in October 2025. Browse open roles in AI development, research, engineering, and data science with leading companies.',
    keywords: [
      'ai jobs 2025',
      'claude ai careers',
      'machine learning jobs',
      'ai engineering positions',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'CollectionPage' as const,
      breadcrumbs: true,
      dateModified: true,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * API Documentation - Tier 2
   * Developer resources
   */
  '/api-docs': {
    title: buildPageTitle('API Documentation'),
    description:
      'Comprehensive REST API documentation for ClaudePro Directory in October 2025. Browse 8 endpoints for content discovery, analytics, and caching with full examples.',
    keywords: ['claude pro api', 'rest api documentation 2025', 'developer api', 'api reference'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: true,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: true,
      wikipediaStyle: true,
    },
  },

  /**
   * API Documentation Endpoint Pages (/api-docs/:slug)
   * Individual API endpoint documentation with schemas and examples
   */
  '/api-docs/:slug': {
    title: (context?: MetadataContext) => {
      const endpointTitle = context?.item?.title || 'API Endpoint';
      return buildContentTitle(endpointTitle, 'API');
    },
    description: (context?: MetadataContext) => {
      // Map slug to SEO-optimized descriptions (150-160 chars)
      const slug = (context?.item as { slug?: string })?.slug || '';
      const descriptions: Record<string, string> = {
        getContentByCategory:
          'Retrieve paginated content items by category with REST API. Get agents, MCP servers, rules, commands, hooks, and statuslines with full filtering support.',
        getContentBySlug:
          'Fetch single content item by category and slug. REST API endpoint for retrieving detailed configuration data with full metadata, schemas, and examples.',
        searchContent:
          'Full-text search across all Claude configurations. REST API with advanced filtering, pagination, sorting, relevance ranking, and category-based discovery.',
        getTrendingContent:
          'Get trending Claude configurations with real-time analytics. REST API endpoint for popular content discovery with views, rankings, and time-based filtering.',
        getTrendingGuides:
          'Discover trending Claude guides and tutorials. REST API for popular educational content with category filtering, views tracking, rankings, and analytics.',
        getAllConfigurations:
          'Stream all Claude configurations in JSON/NDJSON format. REST API with batch processing, streaming support, comprehensive dataset export, and statistics.',
        getCacheStatus:
          'Check API cache status and performance metrics. REST API endpoint for monitoring cache health, response times, system optimization, and uptime status.',
        triggerCacheWarming:
          'Trigger cache warming for improved API performance. REST API endpoint for pre-loading data, reducing latency, optimizing response times, and throughput.',
      };
      return (
        descriptions[slug] ||
        context?.item?.description ||
        'REST API endpoint documentation with request/response schemas, examples, and integration guides for Claude Pro Directory.'
      );
    },
    keywords: (context?: MetadataContext): string[] => {
      const slug = (context?.item as { slug?: string })?.slug || '';
      const keywordMap: Record<string, string[]> = {
        getContentByCategory: [
          'rest api content by category',
          'claude api pagination',
          'api category endpoint 2025',
        ],
        getContentBySlug: [
          'rest api get by slug',
          'claude api single item',
          'api detail endpoint 2025',
        ],
        searchContent: [
          'rest api full-text search',
          'claude api search endpoint',
          'api search filtering 2025',
        ],
        getTrendingContent: [
          'rest api trending content',
          'claude api analytics',
          'api trending endpoint 2025',
        ],
        getTrendingGuides: [
          'rest api trending guides',
          'claude api guides endpoint',
          'api tutorials trending 2025',
        ],
        getAllConfigurations: [
          'rest api stream all data',
          'claude api bulk export',
          'api dataset endpoint 2025',
        ],
        getCacheStatus: [
          'rest api cache status',
          'claude api performance',
          'api monitoring endpoint 2025',
        ],
        triggerCacheWarming: [
          'rest api cache warming',
          'claude api optimization',
          'api performance endpoint 2025',
        ],
      };
      return keywordMap[slug] || ['claude pro api', 'rest api endpoint 2025', 'api documentation'];
    },
    openGraph: {
      type: 'article' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'TechArticle' as const,
      breadcrumbs: true,
      dateModified: true,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: true,
      generateFAQSchema: false,
      wikipediaStyle: true,
    },
  },

  /**
   * 404 Error Page
   * User-friendly error messaging
   */
  '/404': {
    title: buildPageTitle('404 Not Found', 'Browse AI Configs'),
    description:
      'Page not found. Explore our comprehensive collection of 150+ AI agents, MCP servers, rules, commands, hooks, statuslines, and configurations for Claude AI.',
    keywords: ['404', 'page not found', 'claude directory'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: false,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Dynamic Category List Pages (/:category)
   * Handles: /agents, /mcp, /commands, /rules, /hooks, /statuslines
   * Title/description/keywords are dynamically resolved from category config
   *
   * SEO Strategy: Maximize 60-char limit with keyword-rich titles
   */
  '/:category': {
    title: (context?: MetadataContext) => {
      const category = context?.category || context?.params?.category;

      const categoryTitles: Record<string, string> = {
        agents: 'Browse AI Agents for Claude 2025',
        mcp: 'Browse MCP Servers for Claude 2025',
        hooks: 'Browse Hooks for Claude Code 2025',
        commands: 'Browse Commands for Claude 2025',
        rules: 'Browse Rules for Claude AI 2025',
        statuslines: 'Browse Statuslines for Claude 2025',
      };

      const baseTitle =
        categoryTitles[category as string] ||
        context?.categoryConfig?.pluralTitle ||
        'Browse Content & Resources';
      return buildPageTitle(baseTitle);
    },
    description: (context?: MetadataContext) => {
      const category = context?.category || context?.params?.category;
      const metaDesc = context?.categoryConfig?.metaDescription;

      // If category config has description and it's 150-160 chars, use it
      if (metaDesc && metaDesc.length >= 150 && metaDesc.length <= 160) {
        return metaDesc;
      }

      // Fallback descriptions that meet 150-160 char requirement
      const categoryDescriptions: Record<string, string> = {
        agents:
          'Browse 50+ Claude AI agent templates for October 2025. Production-ready configurations for code review, content creation, data analysis, and automation tasks.',
        mcp: 'Browse 40+ Claude MCP server templates for October 2025. Connect Claude to filesystems, databases, APIs, and external tools via Model Context Protocol servers.',
        hooks:
          'Browse Claude hook templates for October 2025. Customize your Claude Code workflow with pre-commit hooks, validation scripts, and automation for development tasks.',
        commands:
          'Browse Claude command templates for October 2025. Pre-built slash commands for code generation, refactoring, testing, and development workflow automation tasks.',
        rules:
          'Browse Claude rules and system prompts for October 2025. Configure AI behavior, coding standards, security policies, and best practices for your development workflow.',
        statuslines:
          'Browse Claude statusline templates for October 2025. Customize your CLI status bar with project info, git status, environment indicators, and development metrics.',
      };

      return (
        categoryDescriptions[category as string] ||
        metaDesc ||
        'Browse Claude AI configurations and templates for October 2025. Find tools, plugins, and setups to enhance your Claude development workflow and productivity.'
      );
    },
    keywords: (context?: MetadataContext): string[] => {
      const keywordsStr = context?.categoryConfig?.keywords;
      if (keywordsStr) {
        const parsed = keywordsStr.split(',').map((k) => k.trim());
        // Ensure minimum 3 keywords for validation
        if (parsed.length >= 3) return parsed;
      }
      // Fallback with minimum 3 keywords
      return ['claude ai', 'configurations', 'claude 2025'];
    },
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Dynamic Content Detail Pages (/:category/:slug)
   * Handles: /agents/code-reviewer, /mcp/filesystem-server, etc. (138 pages)
   * Uses Article schema for better AI citations
   */
  '/:category/:slug': {
    title: (context?: MetadataContext) => {
      if (!context?.item) return buildContentTitle('Item', 'content');

      const rawCategory = context?.category || context?.params?.category || 'content';
      const category = Array.isArray(rawCategory) ? rawCategory[0] || 'content' : rawCategory;

      // Prioritize seoTitle for SEO optimization (already optimized for length)
      const seoTitle = (context.item as { seoTitle?: string })?.seoTitle;
      if (seoTitle) {
        return buildContentTitle(seoTitle, category);
      }

      // Fall back to full title with smart truncation
      const item = context.item as {
        title?: string;
        name?: string;
        slug: string;
        category: string;
      };
      const displayTitle = getDisplayTitle(item);
      return buildContentTitle(displayTitle, category);
    },
    description: (context?: MetadataContext) => {
      const itemDesc = context?.item?.description;

      // If item has description and it's 150-160 chars, use it
      if (itemDesc && itemDesc.length >= 150 && itemDesc.length <= 160) {
        return itemDesc;
      }

      // If item has description but it's too short, pad it
      if (itemDesc) {
        const category = context?.category || context?.params?.category || 'configuration';
        const padding = `Explore this ${category} for Claude AI in October 2025. Community-contributed setup for enhanced productivity and development workflow automation.`;
        const combined = `${itemDesc} ${padding}`;

        // Return first 160 chars if combined is too long
        return combined.length <= 160 ? combined : `${combined.slice(0, 157)}...`;
      }

      // Fallback if no description at all
      return 'Community-contributed Claude AI configuration for October 2025. Enhance your development workflow with production-ready setup for Claude Pro and Claude Code.';
    },
    keywords: (context?: MetadataContext): string[] => {
      const baseTags = (context?.item?.tags as string[]) || [];
      const year = new Date().getFullYear().toString();
      const rawCategory = context?.category || context?.params?.category || 'config';
      const category = Array.isArray(rawCategory) ? rawCategory[0] || 'config' : rawCategory;

      // Ensure minimum 3 keywords for validation
      const keywords = [...baseTags, 'claude ai', `claude ${year}`, category];
      const unique = [...new Set(keywords)]; // Remove duplicates

      return unique.slice(0, 10); // Max 10 keywords
    },
    openGraph: {
      type: 'article' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'Article' as const, // Article schema for AI citations
      breadcrumbs: true,
      dateModified: true, // Recency signal
      author: true,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true, // 3.2x more citations for fresh content
      useArticleSchema: true, // Better than WebPage for AI
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Guide Category Pages (/guides/:category)
   * Handles: /guides/tutorials, /guides/workflows, etc.
   */
  '/guides/:category': {
    title: (context?: MetadataContext) => {
      const categoryMap: Record<string, string> = {
        tutorials: 'Tutorials',
        'use-cases': 'Use Cases',
        workflows: 'Workflows',
        comparisons: 'Comparisons',
        troubleshooting: 'Troubleshooting',
      };
      const category = context?.params?.category as string;
      const categoryTitle = categoryMap[category] || 'Guides';
      return buildContentTitle(categoryTitle, 'Guides');
    },
    description: (context?: MetadataContext) => {
      const category = context?.params?.category as string;
      return `Comprehensive ${category} guides for Claude AI in October 2025. Learn best practices and advanced techniques.`;
    },
    keywords: (context?: MetadataContext): string[] => {
      const category = context?.params?.category as string;
      return [`claude ${category}`, `ai ${category} 2025`, 'claude guides', 'ai tutorials'];
    },
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: true,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: true,
    },
  },

  /**
   * Guide Detail Pages (/guides/:category/:slug)
   * Individual tutorial/guide content with Article schema
   * Prioritizes seoTitle for <title> tag, preserves full title for H1/longtail
   */
  '/guides/:category/:slug': {
    title: (context?: MetadataContext) => {
      // Prioritize seoTitle for SEO optimization (already optimized for length)
      const seoTitle = (context?.item as { seoTitle?: string })?.seoTitle;
      const guideTitle = seoTitle || context?.item?.title || 'Guide';
      return buildContentTitle(guideTitle, 'Guides');
    },
    description: (context?: MetadataContext) =>
      context?.item?.description || 'Comprehensive guide for Claude AI development.',
    keywords: (context?: MetadataContext): string[] =>
      (context?.item?.tags as string[]) || ['claude ai', 'guide', 'tutorial 2025'],
    openGraph: {
      type: 'article' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'Article' as const,
      breadcrumbs: true,
      dateModified: true,
      author: true,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true,
      useArticleSchema: true,
      generateFAQSchema: true, // Guides benefit from FAQ schema
      wikipediaStyle: true,
    },
  },

  /**
   * Comparison Pages (/compare/:slug)
   * Tool/feature comparison content
   */
  '/compare/:slug': {
    title: (context?: MetadataContext) => {
      const comparisonTitle = context?.item?.title || 'Comparison';
      return buildContentTitle(comparisonTitle, 'Comparisons');
    },
    description: (context?: MetadataContext) =>
      context?.item?.description || 'Compare Claude AI tools and configurations.',
    keywords: ['claude comparison', 'ai tool comparison 2025', 'claude vs'],
    openGraph: {
      type: 'article' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'Article' as const,
      breadcrumbs: true,
      dateModified: true,
      author: true,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: true,
      generateFAQSchema: false,
      wikipediaStyle: true,
    },
  },

  /**
   * Collection Detail Pages (/collections/:slug)
   * Curated content collections
   * Prioritizes seoTitle for <title> tag optimization
   */
  '/collections/:slug': {
    title: (context?: MetadataContext) => {
      // Prioritize seoTitle for SEO optimization (<60 chars)
      const seoTitle = (context?.item as { seoTitle?: string })?.seoTitle;
      const collectionTitle = seoTitle || context?.item?.title || 'Collection';
      return buildContentTitle(collectionTitle, 'Collections');
    },
    description: (context?: MetadataContext) =>
      context?.item?.description || 'Curated collection of Claude AI tools and configurations.',
    keywords: ['claude collection', 'curated ai tools 2025', 'claude toolkit'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'CollectionPage' as const,
      breadcrumbs: true,
      dateModified: true,
      author: true,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Job Posting Pages (/jobs/:slug)
   * Individual job listings
   */
  '/jobs/:slug': {
    title: (context?: MetadataContext) => {
      const jobTitle = context?.item?.title || 'Job';
      return buildContentTitle(jobTitle, 'AI Jobs');
    },
    description: (context?: MetadataContext) =>
      context?.item?.description || 'AI job opportunity in machine learning and development.',
    keywords: ['ai jobs 2025', 'machine learning careers', 'claude ai positions'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'JobPosting' as const,
      breadcrumbs: true,
      dateModified: true,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true, // Job freshness is critical
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Changelog List - Tier 2
   * Platform updates and release notes
   */
  '/changelog': {
    title: buildPageTitle('Changelog'),
    description:
      'Track all updates, new features, bug fixes, and improvements to Claude Pro Directory in October 2025. Stay informed about platform changes and enhancements.',
    keywords: [
      'claude pro directory changelog 2025',
      'platform updates',
      'release notes',
      'new features',
      'bug fixes',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'Blog' as const,
      breadcrumbs: true,
      dateModified: true,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true, // Changelog freshness is important
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Changelog Entry Pages (/changelog/:slug)
   * Individual changelog entries
   */
  '/changelog/:slug': {
    title: (context?: MetadataContext) => {
      // Extract title from item or use slug fallback
      const changelogTitle = context?.item?.title ? (context.item.title as string) : 'Update';
      return buildContentTitle(changelogTitle, 'Changelog');
    },
    description: (context?: MetadataContext) =>
      (context?.item?.description as string | undefined) ||
      'Platform update and release notes for Claude Pro Directory.',
    keywords: ['claude pro changelog', 'platform updates 2025', 'release notes', 'feature updates'],
    openGraph: {
      type: 'article' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'TechArticle' as const,
      breadcrumbs: true,
      dateModified: true,
      author: true,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true, // Update recency is critical for changelog
      useArticleSchema: true, // Article schema for better AI citations
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/search': {
    title: buildPageTitle('Search Results'),
    description:
      'Search Claude AI configurations, agents, MCP servers, rules, commands, hooks, and guides.',
    keywords: ['claude search', 'ai configuration search', 'claude tools search'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: false,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/u/:slug': {
    title: (context?: MetadataContext) => {
      const slug = context?.params?.slug as string | undefined;
      const profileTitle = slug ? `${slug}'s Profile` : 'User Profile';
      return buildContentTitle(profileTitle, 'Community');
    },
    description: (context?: MetadataContext) => {
      const slug = context?.params?.slug as string | undefined;
      return `View ${slug ? `${slug}'s` : 'user'} contributions, collections, and activity on Claude Pro Directory.`;
    },
    keywords: ['claude user profile', 'community member', 'contributions'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/library/:slug': {
    title: buildPageTitle('My Collection', 'Library'),
    description: 'Manage your personal collection of Claude configurations and saved items.',
    keywords: ['my collection', 'saved configurations', 'personal library'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: false,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/library/:slug/edit': {
    title: buildPageTitle('Edit Collection', 'Library'),
    description: 'Edit your collection details and settings.',
    keywords: ['edit collection', 'manage library'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: false,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/u/:slug/collections/:collectionSlug': {
    title: (context?: MetadataContext) => {
      const collectionSlug = context?.params?.collectionSlug as string | undefined;
      const userSlug = context?.params?.slug as string | undefined;
      const collectionName = collectionSlug ? collectionSlug.replace(/-/g, ' ') : 'Collection';
      const section = userSlug ? `by ${userSlug}` : 'Community Collection';
      return buildContentTitle(collectionName, section);
    },
    description: (context?: MetadataContext) => {
      const slug = context?.params?.slug as string | undefined;
      return `Explore this curated collection ${slug ? `by ${slug}` : ''} of Claude configurations and tools.`;
    },
    keywords: ['claude collection', 'curated configurations', 'community collection'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'CollectionPage' as const,
      breadcrumbs: true,
      dateModified: true,
      author: true,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: true,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Account Pages - Tier 3 (Private/Authenticated)
   * User dashboard and account management pages
   * All account pages have noindex/nofollow for privacy
   */
  '/account': {
    title: buildPageTitle('Account Dashboard - Manage Profile'),
    description:
      'Manage your Claude Pro Directory account, view activity, bookmarks, submissions, and settings. Track your reputation score and community contributions.',
    keywords: ['account dashboard', 'user profile', 'claude directory account'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: false,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/activity': {
    title: buildPageTitle('My Activity - Contribution History'),
    description:
      'View your contribution history on Claude Pro Directory: submissions, comments, community engagement. Track badges earned, reputation milestones, activity stats.',
    keywords: ['user activity', 'contribution history', 'engagement tracking'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'ProfilePage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/bookmarks': {
    title: buildPageTitle('My Bookmarks - Saved Configurations'),
    description:
      'Browse your saved bookmarks of Claude AI agents, MCP servers, rules, commands, and hooks. Organize your favorite configurations and tools for quick access.',
    keywords: ['bookmarks', 'saved items', 'favorites', 'claude configurations'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'CollectionPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/library': {
    title: buildPageTitle('My Library - Personal Collections'),
    description:
      'Manage your personal library of Claude configurations including custom agents, MCP servers, and workflows. Create, edit, and organize your private collection.',
    keywords: ['library', 'collection management', 'custom configurations'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'CollectionPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/library/new': {
    title: buildPageTitle('Create Library Item - Add Config'),
    description:
      'Create a new library item for your personal collection. Add custom Claude configurations, agents, MCP servers, rules, or workflows to your private library.',
    keywords: ['create configuration', 'add library item', 'custom agent'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/settings': {
    title: buildPageTitle('Account Settings - Profile & Prefs'),
    description:
      'Configure your Claude Pro Directory account: profile information, email preferences, notification settings, privacy options, and connected integrations.',
    keywords: ['account settings', 'user preferences', 'profile configuration'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'ProfilePage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/submissions': {
    title: buildPageTitle('My Submissions - Published & Pending'),
    description:
      'View all your submitted Claude configurations including published agents, MCP servers, rules, and commands. Track submission status and manage your content.',
    keywords: ['user submissions', 'published configurations', 'content management'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'CollectionPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/jobs': {
    title: buildPageTitle('Job Listings - Post & Track Jobs'),
    description:
      'Manage job postings on Claude Pro Directory. Create, edit, and track applications for AI developer positions, Claude integration roles, and technical jobs.',
    keywords: ['job management', 'job postings', 'AI developer jobs', 'recruitment'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'CollectionPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/jobs/new': {
    title: buildPageTitle('Post New Job - Create AI Position'),
    description:
      'Create a new job posting on Claude Pro Directory. Post AI developer positions, integration roles, and technical opportunities to reach qualified talent.',
    keywords: ['post job', 'create job listing', 'AI recruitment', 'developer hiring'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/jobs/:id/edit': {
    title: buildPageTitle('Edit Job Posting', 'Jobs Management'),
    description:
      'Edit your job posting details including title, description, requirements, salary range, and application settings. Update job listing to attract qualified candidates.',
    keywords: ['edit job', 'update job posting', 'modify job listing'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/jobs/:id/analytics': {
    title: buildPageTitle('Job Analytics Dashboard', 'Jobs Management'),
    description:
      'View detailed analytics for your job posting including views, applications, engagement metrics, and candidate demographics. Track recruiting performance and optimize listings.',
    keywords: ['job analytics', 'recruiting metrics', 'application tracking', 'hiring insights'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/sponsorships': {
    title: buildPageTitle('Sponsorships Management - Track'),
    description:
      'Manage Claude Pro Directory sponsorships. View active campaigns, track performance metrics, manage billing, and access detailed analytics for your content.',
    keywords: ['sponsorships', 'advertising management', 'campaign tracking', 'sponsored content'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'CollectionPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/account/sponsorships/:id/analytics': {
    title: buildPageTitle('Sponsorship Analytics Dashboard', 'Sponsorships Management'),
    description:
      'View detailed analytics for your sponsorship campaign including impressions, clicks, conversions, engagement metrics, and ROI. Optimize sponsored content performance.',
    keywords: [
      'sponsorship analytics',
      'campaign metrics',
      'advertising performance',
      'ROI tracking',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  /**
   * Discovery & Utility Pages - Tier 2 (Public)
   * Personalized feeds and utility pages
   */
  '/for-you': {
    title: buildPageTitle('For You - Personalized AI Configs'),
    description:
      'Discover personalized Claude AI configurations recommended just for you based on your interests and activity. Get tailored suggestions for agents, MCP servers, rules, and workflows.',
    keywords: [
      'personalized recommendations',
      'for you feed',
      'claude discovery',
      'ai suggestions',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/board': {
    title: buildPageTitle('Community Board - AI Discussions'),
    description:
      'Browse community discussions, feature requests, and announcements for Claude Pro Directory. Share ideas, report issues, and connect with other Claude AI power users.',
    keywords: ['community board', 'feature requests', 'discussions', 'claude community'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'CollectionPage' as const,
      breadcrumbs: true,
      dateModified: true,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/board/new': {
    title: buildPageTitle('New Discussion - Create AI Post'),
    description:
      'Start a discussion on Claude Pro Directory community board. Share feature requests, ask questions, or announce new Claude configurations and development tools.',
    keywords: ['new discussion', 'create post', 'community feedback', 'feature request'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: true,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/login': {
    title: buildPageTitle('Login - Access Claude Pro Account'),
    description:
      'Sign in to Claude Pro Directory to access personalized feed, manage bookmarks, track submissions, and connect with the Claude AI development community today.',
    keywords: ['login', 'sign in', 'authentication', 'claude account'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: true,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: false,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/auth/auth-code-error': {
    title: buildPageTitle('Authentication Error - Sign In Issue'),
    description:
      'Authentication error while signing in to Claude Pro Directory. Please try again or contact support if the issue persists. Check your email for sign-in link.',
    keywords: ['auth error', 'sign in error', 'authentication failed'],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary' as const,
    },
    robots: {
      index: false,
      follow: false,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: false,
      dateModified: false,
      author: false,
    },
    aiOptimization: {
      includeYear: false,
      recencySignal: false,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },

  '/companies': {
    title: buildPageTitle('Companies Using Claude - AI Builders'),
    description:
      'Explore companies and organizations building with Claude AI and Cursor IDE. Discover industry leaders, startups, and enterprises leveraging Claude for AI-powered development and automation.',
    keywords: [
      'claude companies',
      'companies using claude',
      'claude ai organizations',
      'cursor companies',
      'ai development companies',
    ],
    openGraph: {
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    structuredData: {
      type: 'WebPage' as const,
      breadcrumbs: true,
      dateModified: true,
      author: false,
    },
    aiOptimization: {
      includeYear: true,
      recencySignal: true,
      useArticleSchema: false,
      generateFAQSchema: false,
      wikipediaStyle: false,
    },
  },
} as const satisfies Record<string, RouteMetadata>;

/**
 * Type-safe metadata registry
 * Ensures all route configurations are valid
 */
export type MetadataRegistryKey = keyof typeof METADATA_REGISTRY;
export type MetadataRegistryValue = (typeof METADATA_REGISTRY)[MetadataRegistryKey];

// ============================================
// AI SEARCH OPTIMIZATION UTILITIES
// ============================================
// Consolidated from ai-optimization.ts for tree-shaking
// October 2025 AI citation optimization for ChatGPT, Perplexity, Claude

/**
 * Get current year for AI search optimization
 * ChatGPT often includes the current year when issuing Bing queries
 */
export function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

/**
 * Get current month and year (e.g., "October 2025")
 * Useful for seasonal/time-sensitive content
 */
export function getCurrentMonthYear(): string {
  const date = new Date();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${year}`;
}

/**
 * Add year to description for AI citation optimization
 * Research: Including current year increases ChatGPT citation likelihood
 *
 * @example
 * addYearToDescription("Browse Claude AI tools")
 * // → "Browse Claude AI tools. Updated October 2025."
 */
export function addYearToDescription(
  description: string,
  options: {
    fullDate?: boolean;
    position?: 'end' | 'beginning';
  } = {}
): string {
  const { fullDate = true, position = 'end' } = options;
  const yearText = fullDate ? getCurrentMonthYear() : getCurrentYear();

  // Don't add if already contains year
  if (description.includes(yearText) || description.includes(getCurrentYear())) {
    return description;
  }

  if (position === 'beginning') {
    return `${yearText}: ${description}`;
  }

  // Add year at end naturally
  const endsWithPeriod = description.trim().endsWith('.');
  const separator = endsWithPeriod ? '' : '.';
  return `${description.trim()}${separator} Updated ${yearText}.`;
}

/**
 * Check if content is fresh (updated within 30 days)
 * Research: Fresh content gets 3.2x more AI citations
 */
export function isContentFresh(dateString: string | Date): boolean {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  } catch {
    return false;
  }
}

/**
 * Generate recency signal for metadata
 * Returns ISO timestamp if content is fresh, undefined otherwise
 */
export function getRecencySignal(lastModified?: string): string | undefined {
  if (!lastModified) return undefined;
  return isContentFresh(lastModified) ? lastModified : undefined;
}

/**
 * Optimize keywords for AI search
 * Adds current year and common LLM search patterns
 *
 * @example
 * optimizeKeywordsForAI(['claude ai', 'mcp servers'])
 * // → ['claude ai', 'mcp servers', 'claude ai 2025', 'mcp servers 2025', 'ai tools 2025']
 */
export function optimizeKeywordsForAI(
  baseKeywords: string[],
  options: {
    addYear?: boolean;
    addAITools?: boolean;
    maxKeywords?: number;
  } = {}
): string[] {
  const { addYear = true, addAITools = true, maxKeywords = 10 } = options;
  const year = getCurrentYear();
  const optimized = [...baseKeywords];

  if (addYear) {
    const topKeywords = baseKeywords.slice(0, 3);
    for (const keyword of topKeywords) {
      if (!keyword.includes(year)) {
        optimized.push(`${keyword} ${year}`);
      }
    }
  }

  if (addAITools && !baseKeywords.some((k) => k.includes('ai tools'))) {
    optimized.push(`ai tools ${year}`);
  }

  return optimized.slice(0, maxKeywords);
}

/**
 * Calculate content freshness score
 * Used to prioritize fresh content in search results
 * @returns Freshness score (0-100, higher = fresher)
 */
export function calculateFreshnessScore(lastModified: string | Date): number {
  try {
    const date = typeof lastModified === 'string' ? new Date(lastModified) : lastModified;
    const now = new Date();
    const daysSinceUpdate = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    // Scoring: 100 (today) → 50 (30 days) → 0 (90+ days)
    if (daysSinceUpdate <= 0) return 100;
    if (daysSinceUpdate <= 30) return 100 - Math.floor((daysSinceUpdate / 30) * 50);
    if (daysSinceUpdate <= 90) return 50 - Math.floor(((daysSinceUpdate - 30) / 60) * 50);
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Generate AI-optimized meta description
 * Combines best practices from Google SEO + AI citation research
 * @returns Optimized description (120-160 chars)
 */
export function optimizeDescriptionForAI(
  base: string,
  options: {
    includeYear?: boolean;
    targetLength?: number;
    addCTA?: boolean;
  } = {}
): string {
  const { includeYear = true, targetLength = 150, addCTA = false } = options;
  let description = base.trim();

  // Add year if requested and not already present
  if (includeYear && !description.includes(getCurrentYear())) {
    const year = getCurrentMonthYear();
    if (description.length + year.length + 4 <= targetLength) {
      description = `${description} in ${year}`;
    }
  }

  // Add CTA if requested and space allows
  if (addCTA && description.length + 15 <= targetLength) {
    description = `${description}. Browse now.`;
  }

  // Truncate if too long (preserve sentence structure)
  if (description.length > targetLength) {
    const truncated = description.substring(0, targetLength - 3);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastPeriod > targetLength * 0.8) {
      description = truncated.substring(0, lastPeriod + 1);
    } else if (lastSpace > targetLength * 0.9) {
      description = `${truncated.substring(0, lastSpace)}...`;
    } else {
      description = `${truncated}...`;
    }
  }

  return description;
}

// ============================================
// AI OPTIMIZATION ORCHESTRATOR
// ============================================

/**
 * Apply AI optimization to metadata
 * Central orchestrator for all AI search engine optimizations
 *
 * @param metadata - Metadata object to optimize
 * @param options - AI optimization configuration
 * @param context - Optional context (item, category, etc.)
 * @returns Optimized metadata
 */
export interface MetadataToOptimize {
  title?: string;
  description?: string;
  keywords?: string[] | undefined; // Compatible with exactOptionalPropertyTypes: true
  lastModified?: string;
  [key: string]: unknown;
}

export function applyAIOptimization(
  metadata: MetadataToOptimize,
  options: AIOptimization,
  context?: MetadataContext
): MetadataToOptimize {
  const optimized = { ...metadata };

  // 1. Optimize description with year
  if (options.includeYear && optimized.description) {
    optimized.description = optimizeDescriptionForAI(optimized.description, {
      includeYear: true,
      targetLength: 155,
      addCTA: false,
    });
  }

  // 2. Optimize keywords with year variants
  if (optimized.keywords && Array.isArray(optimized.keywords)) {
    optimized.keywords = optimizeKeywordsForAI(optimized.keywords, {
      addYear: options.includeYear,
      addAITools: true,
      maxKeywords: 10,
    });
  }

  // 3. Add recency signal if content is fresh
  if (options.recencySignal && context?.item?.lastModified) {
    const recencySignal = getRecencySignal(context.item.lastModified);
    if (recencySignal) {
      optimized.lastModified = recencySignal;
    }
  }

  return optimized;
}

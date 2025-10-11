/**
 * Centralized Metadata Registry
 *
 * Single source of truth for all page metadata across the application.
 * Eliminates duplication, ensures consistency, and enables AI citation optimization.
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
 * Title Configuration Schema
 * Controls how page titles are built using title-builder.ts
 *
 * Production Standards:
 * - 3-tier system (home, section, content) for optimal SEO
 * - Dash separator (9% higher CTR than pipe on Google)
 * - Max 60 chars total (Google recommendation, October 2025)
 * - Support for dynamic function-based values
 *
 * @see {@link file://./title-builder.ts} - Title building implementation
 */
export const titleConfigSchema = z
  .object({
    /** Title tier (home, section, or content) */
    tier: z.enum(['home', 'section', 'content']).describe('Title hierarchy tier'),

    /** Page-specific title (optional for home tier) */
    title: z.union([z.string(), z.function()]).optional().describe('Page-specific title text'),

    /** Section name (required for content tier) */
    section: z.union([z.string(), z.function()]).optional().describe('Section/category name'),
  })
  .describe('Configuration for building SEO-optimized page titles');

export type TitleConfig = z.infer<typeof titleConfigSchema>;

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
   * Can be static TitleConfig or function for dynamic resolution
   *
   * @example
   * ```typescript
   * // Static
   * title: { tier: 'section', title: 'Community' }
   *
   * // Dynamic
   * title: {
   *   tier: 'content',
   *   title: (context) => context?.item?.title || 'Item',
   *   section: (context) => context?.categoryConfig?.title || 'Content'
   * }
   * ```
   */
  title: TitleConfig | ((context?: MetadataContext) => TitleConfig | Promise<TitleConfig>);

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

/**
 * Centralized Metadata Registry
 * Maps route patterns to metadata configurations
 *
 * Route Patterns:
 * - Static: '/trending', '/submit', etc.
 * - Dynamic: '/:category', '/:category/:slug'
 * - Catch-all: '/guides/:path*'
 */
export const METADATA_REGISTRY = {
  /**
   * Homepage - Tier 1
   * Optimized for AI citations with Wikipedia-style structuring
   *
   * OpenGraph/Twitter: Uses page title and description by default from metadata-generator.ts
   * Title will be just APP_CONFIG.name (tier: home)
   */
  '/': {
    title: { tier: 'home' as const },
    description:
      'Open-source directory of 150+ Claude AI configurations in October 2025. Community-driven collection of MCP servers, AI agents, automation hooks, custom commands, and development rules.',
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
    title: { tier: 'section' as const, title: 'Trending Configurations' },
    description:
      'Discover trending Claude AI configurations updated daily in October 2025. View real-time growth velocity and popularity metrics for MCP servers, agents, and tools.',
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
    title: { tier: 'section' as const, title: 'Submit Configuration' },
    description:
      'Submit your Claude AI configuration to the community directory in October 2025. Share agents, MCP servers, hooks, commands, and rules with developers worldwide.',
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
    title: { tier: 'section' as const, title: 'Config Recommender' },
    description:
      'Find your perfect Claude configuration in 2 minutes. Answer 7 questions and get personalized recommendations from 147+ configs. Instant, AI-powered matching for your exact needs.',
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
    title: {
      tier: 'content' as const,
      title: (ctx?: MetadataContext) =>
        ctx?.item?.title ? String(ctx.item.title) : 'Your Configuration Recommendations',
      section: 'Config Recommender',
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
    title: { tier: 'section' as const, title: 'Partner With Us' },
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
    title: {
      tier: 'section' as const,
      title: 'Claude Configuration Collections 2025',
    },
    description:
      'Browse curated collections of Claude AI tools and configurations in October 2025. Hand-picked MCP servers, agents, and workflows organized by use case and expertise level.',
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
    title: {
      tier: 'section' as const,
      title: 'Claude AI Guides & Tutorials 2025',
    },
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
    title: { tier: 'section' as const, title: 'Community' },
    description:
      'Join the Claude Pro Directory community in October 2025. Connect with AI developers, share configurations, contribute to open-source projects, and get support.',
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
    title: { tier: 'section' as const, title: 'AI Jobs' },
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
    title: { tier: 'section' as const, title: 'API Documentation' },
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
   * 404 Error Page
   * User-friendly error messaging
   */
  '/404': {
    title: { tier: 'section' as const, title: '404 - Page Not Found' },
    description: `The page you're looking for doesn't exist on Claude Pro Directory. Browse our collection of AI agents, MCP servers, and configurations instead.`,
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
    title: {
      tier: 'section' as const,
      title: (context?: MetadataContext) => {
        const category = context?.category || context?.params?.category;

        // Optimized titles that maximize SEO value within 60-char limit
        const categoryTitles: Record<string, string> = {
          agents: 'Claude AI Agent Templates 2025',
          mcp: 'Claude MCP Server Templates 2025',
          hooks: 'Claude Hook Templates 2025',
          commands: 'Claude Commands Templates 2025',
          rules: 'Claude Rules & Prompts 2025',
          statuslines: 'Claude Statusline Templates 2025',
        };

        return (
          categoryTitles[category as string] || context?.categoryConfig?.pluralTitle || 'Content'
        );
      },
    },
    description: (context?: MetadataContext) =>
      context?.categoryConfig?.metaDescription || 'Browse Claude AI configurations.',
    keywords: (context?: MetadataContext): string[] => {
      const keywordsStr = context?.categoryConfig?.keywords;
      return keywordsStr
        ? keywordsStr.split(',').map((k) => k.trim())
        : ['claude ai', 'configurations'];
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
    title: {
      tier: 'content' as const,
      title: (context?: MetadataContext) => {
        if (!context?.item) return 'Item';

        // Prioritize seoTitle for SEO optimization (<60 chars)
        // Fall back to full title for longtail keywords
        const seoTitle = (context.item as { seoTitle?: string })?.seoTitle;
        if (seoTitle) return seoTitle;

        // Type assertion to include slug and category required by getDisplayTitle
        const item = context.item as {
          title?: string;
          name?: string;
          slug: string;
          category: string;
        };
        return getDisplayTitle(item);
      },
      section: (context?: MetadataContext) => context?.categoryConfig?.title || 'Content',
    },
    description: (context?: MetadataContext) =>
      context?.item?.description || 'Claude AI configuration from the community directory.',
    keywords: (context?: MetadataContext): string[] => {
      const baseTags = (context?.item?.tags as string[]) || [];
      const year = new Date().getFullYear().toString();
      return [...baseTags, 'claude ai', `claude ${year}`].slice(0, 10);
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
    title: {
      tier: 'content' as const,
      title: (context?: MetadataContext) => {
        const categoryMap: Record<string, string> = {
          tutorials: 'Tutorials',
          'use-cases': 'Use Cases',
          workflows: 'Workflows',
          comparisons: 'Comparisons',
          troubleshooting: 'Troubleshooting',
        };
        const category = context?.params?.category as string;
        return categoryMap[category] || 'Guides';
      },
      section: 'Guides',
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
    title: {
      tier: 'content' as const,
      title: (context?: MetadataContext) => {
        // Prioritize seoTitle for SEO optimization (<60 chars)
        // Fall back to full title for longtail keywords
        const seoTitle = (context?.item as { seoTitle?: string })?.seoTitle;
        return seoTitle || context?.item?.title || 'Guide';
      },
      section: 'Guides',
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
    title: {
      tier: 'content' as const,
      title: (context?: MetadataContext) => context?.item?.title || 'Comparison',
      section: 'Comparisons',
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
    title: {
      tier: 'content' as const,
      title: (context?: MetadataContext) => {
        // Prioritize seoTitle for SEO optimization (<60 chars)
        const seoTitle = (context?.item as { seoTitle?: string })?.seoTitle;
        return seoTitle || context?.item?.title || 'Collection';
      },
      section: 'Collections',
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
    title: {
      tier: 'content' as const,
      title: (context?: MetadataContext) => context?.item?.title || 'Job',
      section: 'AI Jobs',
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
    title: {
      tier: 'section' as const,
      title: 'Changelog',
    },
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
    title: {
      tier: 'content' as const,
      title: (context?: MetadataContext) => {
        // Extract title from item or use slug fallback
        if (context?.item?.title) {
          return context.item.title as string;
        }
        return 'Update';
      },
      section: 'Changelog',
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
} as const satisfies Record<string, RouteMetadata>;

/**
 * Type-safe metadata registry
 * Ensures all route configurations are valid
 */
export type MetadataRegistryKey = keyof typeof METADATA_REGISTRY;
export type MetadataRegistryValue = (typeof METADATA_REGISTRY)[MetadataRegistryKey];

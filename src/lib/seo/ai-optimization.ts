/**
 * AI Search Optimization Utilities
 *
 * October 2025 AI citation optimization for ChatGPT, Perplexity, Claude, and other LLM search engines.
 *
 * Research-backed optimizations:
 * - Content updated within 30 days = 3.2x more AI citations
 * - Including "2025" in descriptions increases ChatGPT citation likelihood
 * - H2→H3→bullet point structure = 40% more likely to be cited
 * - Wikipedia-style content gets 7.8% citation rate (highest of all sources)
 * - Sites ranking in Google top 10 are significantly more likely to be cited by AI
 *
 * @module lib/seo/ai-optimization
 */

import { APP_CONFIG } from '@/src/lib/constants';

/**
 * Get current year for AI search optimization
 * ChatGPT often includes the current year when issuing Bing queries behind the scenes
 *
 * @returns Current year as string
 */
export function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

/**
 * Get current month and year (e.g., "October 2025")
 * Useful for seasonal/time-sensitive content
 *
 * @returns Current month and year
 */
export function getCurrentMonthYear(): string {
  const date = new Date();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${year}`;
}

/**
 * Add year to description for AI citation optimization
 * ChatGPT queries Bing with current year, so including it increases visibility
 *
 * @param description - Base description text
 * @param options - Optimization options
 * @returns Description with year included
 *
 * @example
 * ```typescript
 * addYearToDescription("Browse Claude AI tools and configurations")
 * // → "Browse Claude AI tools and configurations in October 2025"
 * ```
 */
export function addYearToDescription(
  description: string,
  options: {
    /** Use full month+year vs just year */
    fullDate?: boolean;
    /** Position to insert year ('end' | 'beginning') */
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

  // Default: Add year at end naturally
  // Check if description ends with period
  const endsWithPeriod = description.trim().endsWith('.');
  const separator = endsWithPeriod ? '' : '.';

  return `${description.trim()}${separator} Updated ${yearText}.`;
}

/**
 * Check if content is fresh (updated within 30 days)
 * Fresh content gets 3.2x more AI citations
 *
 * @param dateString - ISO date string or Date object
 * @returns True if content is fresh (< 30 days old)
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
 *
 * @param lastModified - Last modified date string
 * @returns ISO timestamp if fresh, undefined if stale
 */
export function getRecencySignal(lastModified?: string): string | undefined {
  if (!lastModified) return undefined;
  return isContentFresh(lastModified) ? lastModified : undefined;
}

/**
 * Generate FAQ-optimized question/answer pairs for AI search engines
 * FAQ schema increases chances of being cited in AI-generated answers
 *
 * @param topic - Topic name
 * @param description - Topic description
 * @returns FAQ items array
 *
 * @example
 * ```typescript
 * generateBasicFAQ("MCP Servers", "Model Context Protocol servers for Claude AI")
 * // Returns common questions about MCP servers
 * ```
 */
export function generateBasicFAQ(
  topic: string,
  description: string
): Array<{ question: string; answer: string }> {
  const year = getCurrentYear();

  return [
    {
      question: `What is ${topic}?`,
      answer: description,
    },
    {
      question: `How do I use ${topic}?`,
      answer: `Visit ${APP_CONFIG.url} to browse and install ${topic} for Claude AI in ${year}. Follow the installation guides and configuration examples provided.`,
    },
    {
      question: `Where can I find ${topic} in ${year}?`,
      answer: `${APP_CONFIG.name} provides a comprehensive directory of ${topic}. All configurations are community-curated and updated regularly.`,
    },
  ];
}

/**
 * Optimize keywords for AI search
 * Adds current year and common LLM search patterns
 *
 * @param baseKeywords - Base keyword array
 * @param options - Optimization options
 * @returns Optimized keywords with year and AI patterns
 *
 * @example
 * ```typescript
 * optimizeKeywordsForAI(['claude ai', 'mcp servers'])
 * // → ['claude ai', 'mcp servers', 'claude ai 2025', 'mcp servers 2025', 'ai tools 2025']
 * ```
 */
export function optimizeKeywordsForAI(
  baseKeywords: string[],
  options: {
    /** Add year suffix to keywords */
    addYear?: boolean;
    /** Add "ai tools" variant */
    addAITools?: boolean;
    /** Maximum keywords to return (SEO best practice: 10) */
    maxKeywords?: number;
  } = {}
): string[] {
  const { addYear = true, addAITools = true, maxKeywords = 10 } = options;
  const year = getCurrentYear();
  const optimized = [...baseKeywords];

  if (addYear) {
    // Add year variants for top keywords only (avoid keyword stuffing)
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

  // Return max keywords (SEO best practice)
  return optimized.slice(0, maxKeywords);
}

/**
 * Generate Wikipedia-style structured content hint
 * Wikipedia gets 7.8% AI citation rate (highest of all sources)
 *
 * Returns recommendations for content structure that mimics Wikipedia's success
 *
 * @returns Structure recommendations
 */
export function getWikipediaStyleRecommendations() {
  return {
    structure: [
      'Start with clear, concise introduction paragraph',
      'Use hierarchical headings (H2 → H3 → H4)',
      'Include bullet points for key features/benefits',
      'Add "See Also" section for related topics',
      'Include references/sources section',
    ],
    formatting: [
      'Use tables for comparison data',
      'Include code examples in fenced blocks',
      'Add inline citations where relevant',
      'Use consistent terminology throughout',
    ],
    contentDepth: [
      'Cover topic comprehensively (1500+ words for main topics)',
      'Answer "what", "how", "why", and "when" questions',
      'Include practical examples and use cases',
      'Link to related concepts and resources',
    ],
  };
}

/**
 * Calculate content freshness score
 * Used to prioritize fresh content in search results
 *
 * @param lastModified - Last modified date
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
 *
 * @param base - Base description
 * @param options - Optimization options
 * @returns Optimized description (120-160 chars)
 */
export function optimizeDescriptionForAI(
  base: string,
  options: {
    /** Include year reference */
    includeYear?: boolean;
    /** Target character length (120-160 optimal) */
    targetLength?: number;
    /** Add action-oriented CTA */
    addCTA?: boolean;
  } = {}
): string {
  const { includeYear = true, targetLength = 150, addCTA = false } = options;

  let description = base.trim();

  // Add year if requested and not already present
  if (includeYear && !description.includes(getCurrentYear())) {
    const year = getCurrentMonthYear();
    // Smart insertion - try to fit naturally
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

    // Try to end at sentence boundary, otherwise at word boundary
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

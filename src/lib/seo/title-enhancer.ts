/**
 * Title Enhancement Utility
 * Smart SEO title optimization using existing metadata
 */

import {
  MAX_BASE_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_ENHANCEMENT_GAIN,
  OPTIMAL_MIN,
  SUFFIX_LENGTHS,
} from "@/src/lib/config/seo-config";
import type { ContentCategory } from "@/src/lib/schemas/shared.schema";

export interface ContentItem {
  title?: string;
  name?: string;
  slug: string;
  tags: string[];
  description?: string;
  seoTitle?: string;
  category: string;
}

export interface EnhancementResult {
  enhanced: boolean;
  originalTitle: string;
  enhancedTitle: string | null;
  strategy: string | null;
  gain: number;
  finalLength: number;
}

/**
 * Enhancement Strategy Interface
 */
interface EnhancementStrategy {
  name: string;
  apply: (item: ContentItem, available: number) => string | null;
  minRequired: number; // Minimum chars needed to apply this strategy
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert slug to human-readable title case
 * Examples:
 *   "api-design-expert" → "API Design Expert"
 *   "github-mcp-server" → "GitHub MCP Server"
 *   "go-golang-expert" → "Go Golang Expert"
 */
function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => {
      // Handle common acronyms/brands
      const upper = word.toUpperCase();
      if (
        [
          "API",
          "REST",
          "HTTP",
          "CLI",
          "MCP",
          "AWS",
          "GCP",
          "SQL",
          "CSS",
          "HTML",
          "JSON",
          "XML",
        ].includes(upper)
      ) {
        return upper;
      }
      // Handle common brand names
      const brands: Record<string, string> = {
        github: "GitHub",
        gitlab: "GitLab",
        nodejs: "Node.js",
        javascript: "JavaScript",
        typescript: "TypeScript",
        postgresql: "PostgreSQL",
        mongodb: "MongoDB",
        redis: "Redis",
        graphql: "GraphQL",
      };
      if (brands[word.toLowerCase()]) {
        return brands[word.toLowerCase()];
      }
      // Default: capitalize first letter
      return capitalize(word);
    })
    .join(" ");
}

/**
 * Enhancement Strategies (in priority order)
 */
const strategies: EnhancementStrategy[] = [
  // Strategy: Add "for Claude" (natural SEO optimization)
  {
    name: "for-claude",
    apply: (item, available) => {
      // Get base title - convert slug to human-readable if no title exists
      const rawTitle = item.title || item.name || item.slug;
      const baseTitle =
        item.title || item.name ? rawTitle : slugToTitle(item.slug);

      const addition = " for Claude";
      if (addition.length <= available) {
        return `${baseTitle} for Claude`;
      }
      return null;
    },
    minRequired: 11, // " for Claude" = 11 chars
  },
];

/**
 * Calculate total title length with category suffix
 */
export function calculateTitleLength(
  baseTitle: string,
  category: ContentCategory,
): number {
  const suffixLength =
    SUFFIX_LENGTHS[category as keyof typeof SUFFIX_LENGTHS] || 0;
  return baseTitle.length + suffixLength;
}

/**
 * Check if title needs enhancement
 */
export function shouldEnhanceTitle(
  item: ContentItem,
  category: ContentCategory,
): boolean {
  const currentTitle = item.seoTitle || item.title || item.name || item.slug;
  const currentLength = calculateTitleLength(currentTitle, category);

  // Only enhance if underutilized (less than optimal minimum)
  return currentLength < OPTIMAL_MIN;
}

/**
 * Enhance a title using smart strategies
 */
export function enhanceTitle(
  item: ContentItem,
  category: ContentCategory,
): EnhancementResult {
  const originalTitle = item.seoTitle || item.title || item.name || item.slug;
  const currentLength = calculateTitleLength(originalTitle, category);

  const result: EnhancementResult = {
    enhanced: false,
    originalTitle,
    enhancedTitle: null,
    strategy: null,
    gain: 0,
    finalLength: currentLength,
  };

  // Don't enhance if already optimal or over limit
  if (currentLength >= OPTIMAL_MIN) {
    return result;
  }

  // Calculate available space for enhancement
  const maxAllowed =
    MAX_BASE_TITLE_LENGTH[category as keyof typeof MAX_BASE_TITLE_LENGTH] || 20;
  const available = maxAllowed - originalTitle.length;

  // Try each strategy in order
  for (const strategy of strategies) {
    if (available < strategy.minRequired) continue;

    const enhanced = strategy.apply(item, available);
    if (!enhanced) continue;

    // Validate enhanced title
    if (enhanced.length > maxAllowed) continue;

    const enhancedLength = calculateTitleLength(enhanced, category);
    if (enhancedLength > MAX_TITLE_LENGTH) continue;

    const gain = enhancedLength - currentLength;

    // Only apply if meaningful gain
    if (gain >= MIN_ENHANCEMENT_GAIN) {
      result.enhanced = true;
      result.enhancedTitle = enhanced;
      result.strategy = strategy.name;
      result.gain = gain;
      result.finalLength = enhancedLength;
      return result;
    }
  }

  return result;
}

/**
 * Batch enhance multiple items
 */
export function batchEnhance(
  items: ContentItem[],
  category: ContentCategory,
): Map<string, EnhancementResult> {
  const results = new Map<string, EnhancementResult>();

  for (const item of items) {
    const result = enhanceTitle(item, category);
    results.set(item.slug, result);
  }

  return results;
}

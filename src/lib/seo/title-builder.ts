/**
 * SEO-optimized page title builder for multi-engine search optimization
 *
 * Optimized for Bing, Google, and DuckDuckGo (October 2025):
 * - Bing: Exact-match keywords, front-loaded, <65 chars
 * - Google: Dash separator (9% higher CTR), <60 chars
 * - DuckDuckGo: Inherits Bing preferences via shared index
 *
 * @module seo/title-builder
 */

import { APP_CONFIG } from '@/src/lib/constants';

export type TitleTier = 'home' | 'section' | 'content';

export interface TitleOptions {
  /** Title tier strategy */
  tier: TitleTier;
  /** Page title (exact-match keyword for section tier, content title for content tier) */
  title?: string | undefined;
  /** Section/category name (required for content tier) */
  section?: string | undefined;
}

export interface TitleValidation {
  /** Whether title meets length requirements */
  isValid: boolean;
  /** Character count */
  length: number;
  /** SEO recommendation */
  recommendation: string;
}

const OPTIMAL_LENGTH = 60; // Safe across all engines
const MAX_LENGTH = 65; // Bing max before truncation

/**
 * Build SEO-optimized page titles with multi-engine compatibility
 *
 * @example
 * // Homepage (Tier 1)
 * buildPageTitle({ tier: 'home', title: '' })
 * // → "Claude Pro Directory"
 *
 * @example
 * // Section pages (Tier 2)
 * buildPageTitle({ tier: 'section', title: 'AI Agents' })
 * // → "AI Agents - Claude Pro Directory"
 *
 * @example
 * // Content pages (Tier 3)
 * buildPageTitle({
 *   tier: 'content',
 *   title: 'Code Reviewer Agent',
 *   section: 'AI Agents'
 * })
 * // → "Code Reviewer Agent - AI Agents - Claude Pro Directory" (58 chars)
 *
 * @param options - Title configuration object
 * @returns SEO-optimized page title
 * @throws Error if section is missing for content-tier titles
 */
export function buildPageTitle(options: TitleOptions): string {
  const { tier, title, section } = options;
  const siteName = APP_CONFIG.name;

  switch (tier) {
    case 'home':
      return siteName;

    case 'section':
      if (!title) {
        throw new Error('Title is required for section-tier titles');
      }
      // Tier 2: Section keyword + brand
      // Dash separator (Google: higher CTR, Bing/DDG: no penalty)
      return `${title} - ${siteName}`;

    case 'content':
      if (!(title && section)) {
        throw new Error('Both title and section are required for content-tier titles');
      }
      // Tier 3: Title + Section + Brand
      // All dashes for consistency and optimal SERP display
      return `${title} - ${section} - ${siteName}`;

    default:
      // Fallback to site name if tier is invalid
      return siteName;
  }
}

/**
 * Validate title length against multi-engine best practices
 *
 * @param title - Page title to validate
 * @returns Validation result with recommendation
 *
 * @example
 * validateTitleLength("AI Agents - Claude Pro Directory")
 * // → { isValid: true, length: 38, recommendation: "Optimal for all search engines" }
 */
export function validateTitleLength(title: string): TitleValidation {
  const length = title.length;

  if (length <= OPTIMAL_LENGTH) {
    return {
      isValid: true,
      length,
      recommendation: 'Optimal for all search engines',
    };
  }

  if (length <= MAX_LENGTH) {
    return {
      isValid: true,
      length,
      recommendation: 'Good for Bing, may truncate on Google',
    };
  }

  return {
    isValid: false,
    length,
    recommendation: 'Too long - will truncate on all engines',
  };
}

/**
 * Helper to get the site name constant
 * @returns Site name string
 */
export function getSiteName(): string {
  return APP_CONFIG.name;
}

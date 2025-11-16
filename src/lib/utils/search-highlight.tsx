/**
 * Search Result Highlighting Utility
 * Hyper-optimized, secure, accessible highlighting for search results
 *
 * Features:
 * - XSS protection via regex escaping
 * - Memoization for performance
 * - Semantic HTML (<mark> tags)
 * - Theme-aware styling
 * - Case-insensitive matching
 * - Multiple search term support
 * - Beautiful microinteractions with Motion.dev
 *
 * @module search-highlight
 */

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

// Regex pattern cache for performance (limit to prevent memory leaks)
const patternCache = new Map<string, RegExp>();
const MAX_CACHE_SIZE = 100;

/**
 * Escape special regex characters to prevent injection attacks
 * Critical for security when user input is used in regex
 *
 * @param str - String to escape
 * @returns Escaped string safe for use in regex
 *
 * @example
 * escapeRegex("test(.*)") // Returns: "test\\(.*\\)"
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get or create regex pattern for search terms
 * Cached for performance - same query = same pattern
 *
 * @param query - Search query string
 * @param wholeWordsOnly - Whether to match whole words only (default: true)
 * @returns RegExp pattern or null if query is empty
 */
function getHighlightPattern(query: string, wholeWordsOnly = true): RegExp | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // Create cache key
  const cacheKey = `${trimmed}:${wholeWordsOnly}`;

  // Check cache
  const cached = patternCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Split query into terms (handle multiple words)
  const terms = trimmed
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map(escapeRegex);

  if (terms.length === 0) return null;

  // Create regex pattern
  // Word boundaries (\b) ensure we match whole words only
  const boundary = wholeWordsOnly ? '\\b' : '';
  const pattern = new RegExp(
    `(${boundary}${terms.join(`${boundary}|${boundary}`)}${boundary})`,
    'gi'
  );

  // Cache pattern
  patternCache.set(cacheKey, pattern);

  // Limit cache size (prevent memory leak)
  if (patternCache.size > MAX_CACHE_SIZE) {
    const firstKey = patternCache.keys().next().value;
    if (firstKey) {
      patternCache.delete(firstKey);
    }
  }

  return pattern;
}

export interface HighlightOptions {
  /** CSS class for highlighted text (default: Tailwind classes) */
  className?: string;
  /** Case-sensitive matching (default: false) */
  caseSensitive?: boolean;
  /** Match whole words only (default: true) */
  wholeWordsOnly?: boolean;
  /** Maximum length of text to highlight (safety limit, default: 10000) */
  maxLength?: number;
  /** Enable animation for highlight appearance (default: true) */
  enableAnimation?: boolean;
  /** Animation duration in seconds (default: 0.3) */
  animationDuration?: number;
}

/**
 * Highlights search terms in text using semantic <mark> tags
 *
 * @param text - Text to highlight
 * @param query - Search query (can be multiple words)
 * @param options - Highlighting options
 * @returns ReactNode with highlighted terms wrapped in <mark> tags
 *
 * @example
 * highlightSearchTerms("React Hooks Guide", "react hooks")
 * // Returns: <><mark>React</mark> <mark>Hooks</mark> Guide</>
 *
 * @example
 * highlightSearchTerms("Advanced React Guide", "react", { wholeWordsOnly: false })
 * // Returns: <><span>Advanced </span><mark>React</mark><span> Guide</span></>
 */
export function highlightSearchTerms(
  text: string,
  query: string,
  options: HighlightOptions = {}
): ReactNode {
  const {
    className = 'bg-yellow-200/30 dark:bg-yellow-600/40 font-medium px-0.5 py-0 rounded',
    caseSensitive: _caseSensitive = false, // Reserved for future use (currently always case-insensitive)
    wholeWordsOnly = true,
    maxLength = 10000, // Safety limit
    enableAnimation = true,
    animationDuration = 0.3,
  } = options;

  // Early returns for performance
  if (!(text && query.trim())) {
    return text;
  }

  // Safety: limit text length to prevent performance issues
  const safeText = text.length > maxLength ? text.slice(0, maxLength) : text;

  // Get regex pattern
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return safeText;
  }

  const pattern = getHighlightPattern(trimmedQuery, wholeWordsOnly);

  if (!pattern) {
    return safeText;
  }

  // Reset regex lastIndex (important for global regex)
  pattern.lastIndex = 0;

  // Use matchAll to find all matches with their positions
  const matches: Array<{ text: string; index: number }> = [];
  let match: RegExpExecArray | null = null;

  // Find all matches
  // eslint-disable-next-line no-constant-condition
  while (true) {
    match = pattern.exec(safeText);
    if (match === null) break;
    matches.push({
      text: match[0],
      index: match.index,
    });
    // Prevent infinite loop if regex has no global flag
    if (!pattern.global) break;
  }

  // Reset pattern for reuse
  pattern.lastIndex = 0;

  // If no matches, return original text
  if (matches.length === 0) {
    return safeText;
  }

  // Build array of text segments (alternating between non-match and match)
  const segments: Array<{ text: string; isMatch: boolean }> = [];
  let lastIndex = 0;

  for (const match of matches) {
    // Skip overlapping matches (safety check)
    if (match.index < lastIndex) {
      continue;
    }

    // Add text before match (if any)
    if (match.index > lastIndex) {
      segments.push({
        text: safeText.slice(lastIndex, match.index),
        isMatch: false,
      });
    }
    // Add matched text
    segments.push({
      text: match.text,
      isMatch: true,
    });
    lastIndex = match.index + match.text.length;
  }

  // Add remaining text after last match (if any)
  if (lastIndex < safeText.length) {
    segments.push({
      text: safeText.slice(lastIndex),
      isMatch: false,
    });
  }

  // Map segments to React elements with optional animation
  return (
    <>
      {segments.map((segment, index) => {
        if (!segment.text) {
          return null;
        }

        // Create stable key: index + first 10 chars of text (for uniqueness)
        const stableKey = `${index}-${segment.text.slice(0, 10)}-${segment.isMatch ? 'match' : 'text'}`;

        if (segment.isMatch) {
          // Use motion.mark for beautiful microinteraction
          if (enableAnimation) {
            return (
              <motion.mark
                key={stableKey}
                className={className}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: animationDuration,
                  ease: [0.4, 0, 0.2, 1], // Standard easing curve
                  delay: index * 0.02, // Stagger animation for multiple highlights
                }}
              >
                {segment.text}
              </motion.mark>
            );
          }
          // Fallback to regular mark if animation disabled
          return (
            <mark key={stableKey} className={className}>
              {segment.text}
            </mark>
          );
        }

        return <span key={stableKey}>{segment.text}</span>;
      })}
    </>
  );
}

/**
 * Simplified version for single-term highlighting
 * More performant for simple cases (no caching overhead)
 *
 * @param text - Text to highlight
 * @param term - Single search term
 * @param options - Highlighting options
 * @returns ReactNode with highlighted term wrapped in <mark> tag
 *
 * @example
 * highlightSingleTerm("React Hooks", "react")
 * // Returns: <><mark>React</mark><span> Hooks</span></>
 */
export function highlightSingleTerm(
  text: string,
  term: string,
  options: HighlightOptions = {}
): ReactNode {
  if (!(text && term.trim())) {
    return text;
  }

  const {
    className = 'bg-yellow-200/30 dark:bg-yellow-600/40 font-medium px-0.5 py-0 rounded',
    caseSensitive = false,
    wholeWordsOnly = true,
  } = options;

  const escaped = escapeRegex(term.trim());
  const flags = caseSensitive ? 'g' : 'gi';
  const boundary = wholeWordsOnly ? '\\b' : '';
  const pattern = new RegExp(`(${boundary}${escaped}${boundary})`, flags);

  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        pattern.lastIndex = 0;
        const isMatch = pattern.test(part);
        pattern.lastIndex = 0;

        // Create stable key: index + first 10 chars of part (for uniqueness)
        const stableKey = `${index}-${part.slice(0, 10)}-${isMatch ? 'match' : 'text'}`;

        return isMatch ? (
          <mark key={stableKey} className={className}>
            {part}
          </mark>
        ) : (
          <span key={stableKey}>{part}</span>
        );
      })}
    </>
  );
}

/**
 * Highlight search terms in multiple fields
 * Useful for highlighting title + description simultaneously
 *
 * @param fields - Object with field names and text values
 * @param query - Search query
 * @param options - Highlighting options
 * @returns Object with same keys but ReactNode values
 *
 * @example
 * highlightSearchFields(
 *   { title: "React Guide", description: "Learn React hooks" },
 *   "react"
 * )
 * // Returns: {
 * //   title: <><mark>React</mark> Guide</>,
 * //   description: <><span>Learn </span><mark>React</mark><span> hooks</span></>
 * // }
 */
export function highlightSearchFields(
  fields: Record<string, string>,
  query: string,
  options: HighlightOptions = {}
): Record<string, ReactNode> {
  const highlighted: Record<string, ReactNode> = {};

  for (const [key, value] of Object.entries(fields)) {
    highlighted[key] = highlightSearchTerms(value, query, options);
  }

  return highlighted;
}

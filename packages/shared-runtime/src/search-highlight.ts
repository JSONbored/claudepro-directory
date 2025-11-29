/**
 * Search Term Highlighting Utility (Edge Function)
 * HTML version for server-side highlighting (no React dependencies)
 *
 * Features:
 * - XSS protection via regex escaping
 * - Semantic HTML (<mark> tags)
 * - Case-insensitive matching
 * - Multiple search term support
 * - Whole word matching (configurable)
 *
 * Returns HTML string instead of ReactNode (for edge functions)
 */

/**
 * Escape special regex characters to prevent injection attacks
 */
function escapeRegex(str: string): string {
  return str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/**
 * Get regex pattern for search terms
 */
function getHighlightPattern(query: string, wholeWordsOnly = true): null | RegExp {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // Split query into terms (handle multiple words)
  const terms = trimmed
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => escapeRegex(term));

  if (terms.length === 0) return null;

  // Create regex pattern
  const boundary = wholeWordsOnly ? String.raw`\b` : '';
  const pattern = new RegExp(
    `(${boundary}${terms.join(`${boundary}|${boundary}`)}${boundary})`,
    'gi'
  );

  return pattern;
}

export interface HighlightOptions {
  /** CSS class for highlighted text (default: Tailwind classes) */
  className?: string;
  /** Maximum length of text to highlight (safety limit, default: 10000) */
  maxLength?: number;
  /** Match whole words only (default: true) */
  wholeWordsOnly?: boolean;
}

/**
 * Highlights search terms in text using semantic <mark> tags
 * Returns HTML string (for edge functions, not React)
 *
 * @param text - Text to highlight
 * @param query - Search query (can be multiple words)
 * @param options - Highlighting options
 * @returns HTML string with highlighted terms wrapped in <mark> tags
 *
 * @example
 * highlightSearchTerms("React Hooks Guide", "react hooks")
 * // Returns: "<mark>React</mark> <mark>Hooks</mark> Guide"
 */
export function highlightSearchTerms(
  text: string,
  query: string,
  options: HighlightOptions = {}
): string {
  const {
    className = 'bg-yellow-200/30 dark:bg-yellow-600/40 font-medium px-0.5 py-0 rounded',
    wholeWordsOnly = true,
    maxLength = 10_000,
  } = options;

  // Early returns for performance
  if (!(text && query.trim())) {
    return escapeHtml(text);
  }

  // Safety: limit text length to prevent performance issues
  const safeText = text.length > maxLength ? text.slice(0, maxLength) : text;

  // Get regex pattern
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return escapeHtml(safeText);
  }

  const pattern = getHighlightPattern(trimmedQuery, wholeWordsOnly);
  if (!pattern) {
    return escapeHtml(safeText);
  }

  // Reset regex lastIndex (important for global regex)
  pattern.lastIndex = 0;

  // Use matchAll to find all matches with their positions
  const matches: Array<{ index: number; text: string }> = [];
  let match: null | RegExpExecArray = pattern.exec(safeText);

  // Find all matches
  while (match !== null) {
    matches.push({
      index: match.index,
      text: match[0],
    });
    // Prevent infinite loop if regex has no global flag
    if (!pattern.global) break;
    match = pattern.exec(safeText);
  }

  // Reset pattern for reuse
  pattern.lastIndex = 0;

  // If no matches, return escaped original text
  if (matches.length === 0) {
    return escapeHtml(safeText);
  }

  // Build array of text segments (alternating between non-match and match)
  const segments: Array<{ isMatch: boolean; text: string }> = [];
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

  // Build HTML string
  return segments
    .map((segment) => {
      if (!segment.text) return '';
      const escaped = escapeHtml(segment.text);
      return segment.isMatch ? `<mark class="${className}">${escaped}</mark>` : escaped;
    })
    .join('');
}

/**
 * Escape HTML characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * Highlight search terms in an array of strings (e.g., tags)
 * Returns array of HTML strings
 */
export function highlightSearchTermsArray(
  items: string[],
  query: string,
  options: HighlightOptions = {}
): string[] {
  return items.map((item) =>
    highlightSearchTerms(item, query, { ...options, wholeWordsOnly: false })
  );
}

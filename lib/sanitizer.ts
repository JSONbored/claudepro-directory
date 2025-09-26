/**
 * XSS Sanitization Utility
 * Provides secure sanitization for user input
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize search queries to prevent XSS attacks
 * Allows only alphanumeric characters, spaces, hyphens, and underscores
 */
export function sanitizeSearchQuery(query: string): string {
  // First, use DOMPurify to remove any HTML/Script tags
  const htmlSanitized = DOMPurify.sanitize(query, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Then apply additional restrictions for search queries
  // Allow: letters, numbers, spaces, hyphens, underscores, dots, and common search operators
  const searchSanitized = htmlSanitized
    .replace(/[^a-zA-Z0-9\s\-_.+*]/g, '') // Remove special characters except common search ones
    .trim()
    .substring(0, 100); // Limit length

  return searchSanitized;
}

/**
 * Sanitize general text input (for display)
 * Allows safe HTML formatting but removes dangerous elements
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

/**
 * Sanitize form input fields
 * Strips all HTML and limits length
 */
export function sanitizeFormInput(input: string, maxLength = 500): string {
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  return sanitized.trim().substring(0, maxLength);
}

/**
 * Sanitize URL parameters
 * Ensures safe URL construction
 */
export function sanitizeURLParam(param: string): string {
  // Remove any potential URL injection attempts
  const sanitized = param
    .replace(/[<>"'`]/g, '') // Remove HTML/JS injection characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();

  // Encode for URL
  return encodeURIComponent(sanitized);
}

/**
 * Validate and sanitize category input
 * Ensures only valid categories are accepted
 */
export function sanitizeCategory(category: string): string | null {
  const validCategories = [
    'agents',
    'mcp',
    'rules',
    'commands',
    'hooks',
    'tutorials',
    'comparisons',
    'workflows',
    'use-cases',
    'troubleshooting',
  ];

  const sanitized = sanitizeFormInput(category, 50).toLowerCase();

  if (validCategories.includes(sanitized)) {
    return sanitized;
  }

  return null;
}

/**
 * Sanitize array of tags
 * Ensures each tag is safe and valid
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map((tag) => sanitizeFormInput(tag, 50))
    .filter((tag) => tag.length > 0 && tag.length <= 50)
    .slice(0, 20); // Limit to 20 tags
}

/**
 * Create a sanitized excerpt from HTML content
 * Useful for meta descriptions and previews
 */
export function createSafeExcerpt(html: string, maxLength = 160): string {
  const textOnly = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });

  return textOnly
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, maxLength);
}

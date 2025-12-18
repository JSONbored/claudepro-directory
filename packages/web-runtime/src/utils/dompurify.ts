/**
 * Shared DOMPurify Utility
 *
 * Provides a singleton DOMPurify instance to ensure the library is only loaded once
 * and shared across all components. This prevents duplicate chunks and reduces bundle size.
 *
 * @example
 * ```ts
 * import { sanitizeHtml } from '@heyclaude/web-runtime/utils/dompurify';
 * const clean = await sanitizeHtml(dirtyHtml, { ALLOWED_TAGS: ['p', 'br'] });
 * ```
 */

let dompurifyPromise: Promise<typeof import('dompurify')> | null = null;
let dompurifyInstance: typeof import('dompurify').default | null = null;

/**
 * Get DOMPurify instance (lazy-loaded, cached)
 * Ensures DOMPurify is only loaded once and reused across all components
 */
async function getDOMPurify(): Promise<typeof import('dompurify').default> {
  // Return cached instance if available
  if (dompurifyInstance) {
    return dompurifyInstance;
  }

  // Return existing promise if already loading
  if (dompurifyPromise) {
    const module = await dompurifyPromise;
    dompurifyInstance = module.default;
    return dompurifyInstance;
  }

  // Start loading DOMPurify
  dompurifyPromise = import('dompurify');
  const module = await dompurifyPromise;
  dompurifyInstance = module.default;
  return dompurifyInstance;
}

/**
 * Sanitize HTML using DOMPurify
 *
 * @param html - HTML string to sanitize
 * @param config - DOMPurify configuration options
 * @returns Sanitized HTML string
 */
export async function sanitizeHtml(
  html: string,
  config?: import('dompurify').Config
): Promise<string> {
  const DOMPurify = await getDOMPurify();
  return DOMPurify.sanitize(html, config);
}

/**
 * Sanitize HTML synchronously (only if DOMPurify is already loaded)
 * Use this if you're certain DOMPurify has been loaded previously
 *
 * @param html - HTML string to sanitize
 * @param config - DOMPurify configuration options
 * @returns Sanitized HTML string, or original HTML if DOMPurify not loaded
 */
export function sanitizeHtmlSync(
  html: string,
  config?: import('dompurify').Config
): string {
  if (!dompurifyInstance) {
    // Fallback to original HTML if DOMPurify not loaded yet
    // This should rarely happen if using async sanitizeHtml
    return html;
  }
  return dompurifyInstance.sanitize(html, config);
}

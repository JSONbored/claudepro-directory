'use client';

/**
 * View Transitions API Utilities
 *
 * Production-ready utilities for smooth cross-page animations using the View Transitions API.
 * Now Baseline as of October 2025 (Chrome 111+, Firefox 144+, Safari 18+, Edge 111+).
 *
 * Features:
 * - Progressive enhancement (works everywhere, enhanced where supported)
 * - Next.js App Router compatible
 * - Respects prefers-reduced-motion
 * - Type-safe with feature detection
 * - Handles errors gracefully
 *
 * Usage:
 * ```typescript
 * import { navigateWithTransition } from '@heyclaude/web-runtime/client';
 *
 * // Card click handler
 * const handleClick = () => {
 *   navigateWithTransition('/agents/code-reviewer');
 * };
 * ```
 *
 * Architecture:
 * - Same-document transitions: Already supported via Motion.dev layoutId (Tabs)
 * - Cross-document transitions: Chrome/Edge only, progressive enhancement
 * - Fallback: Instant navigation for Firefox/Safari (still fast!)
 *
 * Browser Support (Q4 2025):
 * - ✅ Chrome 111+ (same-document + cross-document with flag)
 * - ✅ Edge 111+ (same-document + cross-document with flag)
 * - ✅ Firefox 144+ (same-document only)
 * - ✅ Safari 18+ (same-document only)
 *
 * Note: Cross-document transitions require experimental flag in Chrome.
 * We use same-document transitions via client-side navigation for universal support.
 *
 * @module lib/utils/view-transitions
 */

/**
 * Check if View Transitions API is supported
 */
export function supportsViewTransitions(): boolean {
  if (typeof document === 'undefined') return false;
  return 'startViewTransition' in document;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Validate internal navigation path is safe
 * Only allows relative paths starting with /, no protocol-relative URLs
 */
function isValidInternalPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false;
  // Must start with / for relative paths
  if (!path.startsWith('/')) return false;
  // Reject protocol-relative URLs (//example.com)
  if (path.startsWith('//')) return false;
  // Reject dangerous protocols
  if (/^(javascript|data|vbscript|file):/i.test(path)) return false;
  // Basic path validation - allow alphanumeric, slashes, hyphens, underscores, query params, hash
  return /^\/[a-zA-Z0-9/?#\-_.~!*'();:@&=+$,%[\]]*$/.test(path);
}

/**
 * Navigate with view transition (client-side)
 *
 * Uses View Transitions API for smooth page morphing if supported.
 * Falls back to instant navigation if not supported or reduced motion preferred.
 *
 * @param url - Destination URL (must be a valid internal path)
 * @param router - Next.js router instance (optional, will use window.location if not provided)
 *
 * @example
 * ```typescript
 * import { useRouter } from 'next/navigation';
 * import { navigateWithTransition } from '@heyclaude/web-runtime/client';
 *
 * function ConfigCard() {
 *   const router = useRouter();
 *
 *   const handleClick = () => {
 *     navigateWithTransition('/agents/code-reviewer', router);
 *   };
 * }
 * ```
 */
export function navigateWithTransition(
  url: string,
  router?: { push: (url: string) => void }
): void {
  // Validate URL is a safe internal path
  if (!isValidInternalPath(url)) {
    // Silently skip invalid URLs to prevent XSS/redirect attacks
    return;
  }

  // Check if transitions are supported and user hasn't disabled animations
  const canTransition = supportsViewTransitions() && !prefersReducedMotion();

  if (!canTransition) {
    // Fallback: Instant navigation
    if (router) {
      router.push(url);
    } else {
      window.location.href = url;
    }
    return;
  }

  // Use View Transitions API
  if ('startViewTransition' in document) {
    // Type assertion: We checked existence above
    const doc = document as Document & {
      startViewTransition: (callback: () => void | Promise<void>) => {
        finished: Promise<void>;
        ready: Promise<void>;
        updateCallbackDone: Promise<void>;
      };
    };

    doc.startViewTransition(() => {
      if (router) {
        router.push(url);
      } else {
        window.location.href = url;
      }
    });
  } else if (router) {
    // Fallback (shouldn't reach here due to check above, but safety)
    router.push(url);
  } else {
    window.location.href = url;
  }
}

/**
 * Get view transition name for a content item
 *
 * Generates a unique, stable view transition name for smooth card → detail morphing.
 *
 * @param type - Content type (e.g., 'card', 'detail')
 * @param slug - Content slug (unique identifier)
 * @returns View transition name string
 *
 * @example
 * ```typescript
 * const transitionName = getViewTransitionName('card', 'code-reviewer');
 * // Returns: 'config-card-code-reviewer'
 *
 * // Apply to JSX element:
 * <div style={{ viewTransitionName: transitionName }}>
 *   Card content here
 * </div>
 * ```
 */
export function getViewTransitionName(type: 'card' | 'detail' | 'image', slug: string): string {
  // Sanitize slug (remove special characters for CSS compatibility)
  const sanitizedSlug = slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  return `config-${type}-${sanitizedSlug}`;
}

/**
 * Apply view transition name to element
 *
 * Helper to safely apply view transition name with type safety.
 *
 * @param type - Content type
 * @param slug - Content slug
 * @returns Style object with viewTransitionName
 *
 * @example
 * ```typescript
 * <div style={getViewTransitionStyle('card', 'code-reviewer')}>
 *   Card content here
 * </div>
 * ```
 */

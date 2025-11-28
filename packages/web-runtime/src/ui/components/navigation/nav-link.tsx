/**
 * Navigation Link Component
 *
 * Navigation link with orange underline animation pattern.
 * Implements the canonical orange underline pattern from navigation.
 * Underline expands from left to right on hover, instantly visible when active.
 *
 * Architecture:
 * - Next.js-specific (uses Next.js Link component)
 * - URL validation for security (prevents XSS/redirect attacks)
 * - Supports both internal and external links
 * - Uses web-runtime UI constants for styling
 *
 * Security:
 * - Validates internal paths (prevents protocol-relative URLs, dangerous protocols)
 * - Sanitizes external URLs (removes credentials, normalizes hostname)
 * - Gracefully handles invalid URLs (renders as span instead of link)
 *
 * Usage:
 * ```tsx
 * import { NavLink } from '@heyclaude/web-runtime/ui';
 *
 * <NavLink href="/agents" active={pathname === '/agents'}>
 *   Agents
 * </NavLink>
 *
 * <NavLink href="https://example.com" external>
 *   External Link
 * </NavLink>
 * ```
 */

import { ANIMATION_CONSTANTS, DIMENSIONS, POSITION_PATTERNS } from '../../constants.ts';
import { logger } from '../../../logger.ts';
import { normalizeError } from '../../../errors.ts';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

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
  // This is permissive but safe for Next.js routing
  return /^\/[a-zA-Z0-9/?#\-_.~!*'();:@&=+$,%[\]]*$/.test(path);
}

/**
 * Validate and sanitize external URL for safe use in href
 * Only allows HTTPS URLs, returns canonicalized URL or null if invalid
 */
function getSafeExternalUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url.trim());
    // Allow HTTPS, HTTP, and mailto protocols
    if (
      parsed.protocol !== 'https:' &&
      parsed.protocol !== 'http:' &&
      parsed.protocol !== 'mailto:'
    )
      return null;
    // Block localhost in production (optional, but safer)
    // For now, allow it for development
    // Reject dangerous components
    if (parsed.username || parsed.password) return null;

    // Sanitize: remove query strings and fragments for external links (optional)
    // For navigation links, we might want to keep them, so we'll just sanitize credentials
    parsed.username = '';
    parsed.password = '';
    // Normalize hostname
    parsed.hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
    // Remove default ports
    if (parsed.port === '80' || parsed.port === '443') {
      parsed.port = '';
    }

    // Return canonicalized href
    return parsed.href;
  } catch (error) {
    // Log URL parsing errors for debugging
    const normalized = normalizeError(error, 'NavLink: Failed to parse external URL');
    logger.warn('NavLink: Invalid external URL', {
      err: normalized,
      component: 'NavLink',
      url: String(url),
    });
    return null;
  }
}

export interface NavLinkProps extends Omit<ComponentProps<typeof Link>, 'href' | 'children'> {
  /** Link destination */
  href: string;
  /** Link content */
  children: ReactNode;
  /** Whether link is currently active (shows full underline) */
  active?: boolean;
  /** Additional classes for the wrapper */
  className?: string;
  /** Whether this is an external link (uses <a> instead of Next.js Link) */
  external?: boolean;
}

/**
 * Navigation link with orange underline animation
 *
 * Implements the canonical orange underline pattern from navigation.
 * Underline expands from left to right on hover, instantly visible when active.
 *
 * @example
 * ```tsx
 * <NavLink href="/agents" active={pathname === '/agents'}>
 *   Agents
 * </NavLink>
 * ```
 */
export function NavLink({
  href,
  children,
  active = false,
  className = '',
  external = false,
  ...props
}: NavLinkProps) {
  const content = (
    <span className="relative inline-block">
      {children}
      <span
        className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} ${
          active ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
        aria-hidden="true"
      />
    </span>
  );

  if (external) {
    // Validate and sanitize external URL
    const safeUrl = getSafeExternalUrl(href);
    if (!safeUrl) {
      // Don't render unsafe external links - log for debugging
      logger.warn('NavLink: Unsafe external URL rejected', undefined, {
        component: 'NavLink',
        href: String(href),
        external: true,
      });
      return <span className={`group ${className}`}>{content}</span>;
    }
    return (
      <a
        href={safeUrl}
        className={`group ${className}`}
        target="_blank"
        rel="noopener noreferrer"
        {...(props as ComponentProps<'a'>)}
      >
        {content}
      </a>
    );
  }

  // Validate internal path
  if (!isValidInternalPath(href)) {
    // Don't render unsafe internal links - log for debugging
    logger.warn('NavLink: Unsafe internal path rejected', undefined, {
      component: 'NavLink',
      href: String(href),
      external: false,
    });
    return <span className={`group ${className}`}>{content}</span>;
  }

  return (
    <Link href={href} className={`group ${className}`} {...props}>
      {content}
    </Link>
  );
}

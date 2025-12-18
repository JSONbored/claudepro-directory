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

import { logger } from '../../../logger.ts';
import { getSafeExternalUrl, getSafeMailtoUrl } from '../../../utils/url-safety.ts';
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
        className={`absolute bottom-0 left-0 h-[2px] bg-accent transition-all duration-300 ease-out ${
          active ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
        aria-hidden="true"
      />
    </span>
  );

  if (external) {
    // Check if this is a mailto link
    const isMailto = typeof href === 'string' && href.trim().toLowerCase().startsWith('mailto:');
    
    let safeUrl: string | null = null;
    
    if (isMailto) {
      // Extract email from mailto: URL and validate
      const email = href.trim().substring(7); // Remove 'mailto:' prefix
      safeUrl = getSafeMailtoUrl(email);
    } else {
      // Validate and sanitize external website URL using shared utility
      safeUrl = getSafeExternalUrl(href);
    }
    
    if (!safeUrl) {
      // Don't render unsafe external links - log for debugging
      logger.warn(
        {
          component: 'NavLink',
          href: String(href),
          external: true,
          isMailto,
        },
        'NavLink: Unsafe external URL rejected'
      );
      return <span className={`group ${className}`}>{content}</span>;
    }
    
    // For mailto links, don't add target="_blank" or rel="noopener noreferrer"
    // (mailto links open email client, not a new tab)
    const linkProps = isMailto
      ? { href: safeUrl, ...(props as ComponentProps<'a'>) }
      : {
          href: safeUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          ...(props as ComponentProps<'a'>),
        };
    
    return (
      <a className={`group ${className}`} {...linkProps}>
        {content}
      </a>
    );
  }

  // Validate internal path
  if (!isValidInternalPath(href)) {
    // Don't render unsafe internal links - log for debugging
      logger.warn(
        {
          component: 'NavLink',
          href: String(href),
          external: false,
        },
        'NavLink: Unsafe internal path rejected'
      );
    return <span className={`group ${className}`}>{content}</span>;
  }

  return (
    <Link href={href} className={`group ${className}`} {...props}>
      {content}
    </Link>
  );
}

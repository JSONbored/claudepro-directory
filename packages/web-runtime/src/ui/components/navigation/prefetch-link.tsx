'use client';

/**
 * PrefetchLink Component - Smart Link with Hover Intent Prefetching
 *
 * Drop-in replacement for Next.js Link with smart prefetching.
 * Prefetches on hover intent (300ms delay) for instant navigation.
 *
 * Architecture:
 * - Next.js-specific (uses Next.js Link component)
 * - Uses usePrefetchOnHover hook for prefetch logic
 * - Client component (requires browser APIs)
 * - Error handling via hook's internal logging
 *
 * Performance:
 * - Prefetches route after 300ms hover (clear intent)
 * - Provides instant navigation feel without wasting bandwidth
 * - Mobile: prefetches immediately on touch
 *
 * Usage:
 * ```tsx
 * import { PrefetchLink } from '@heyclaude/web-runtime/ui';
 *
 * // Instead of:
 * <Link href="/agents">Agents</Link>
 *
 * // Use:
 * <PrefetchLink href="/agents">Agents</PrefetchLink>
 * ```
 */

import { usePrefetchOnHover } from '../../../hooks/use-prefetch-on-hover.ts';
import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { UrlObject } from 'url';

export interface PrefetchLinkProps extends Omit<ComponentPropsWithoutRef<typeof Link>, 'href' | 'children'> {
  /**
   * Link destination (string or UrlObject)
   */
  href: string | UrlObject;
  
  /**
   * Link content
   */
  children: ReactNode;
  
  /**
   * Hover delay before prefetch (ms)
   * @default 300
   */
  prefetchDelay?: number;

  /**
   * Disable smart prefetching (use standard Link behavior)
   * @default false
   */
  disablePrefetch?: boolean;
}

/**
 * Smart Link component with hover intent prefetching
 *
 * Automatically prefetches route after 300ms hover (clear intent).
 * Provides instant navigation feel without wasting bandwidth.
 *
 * @example
 * ```tsx
 * <PrefetchLink href="/agents/code-reviewer">
 *   View Agent
 * </PrefetchLink>
 * ```
 */
export function PrefetchLink({
  href,
  prefetchDelay = 300,
  disablePrefetch = false,
  children,
  ...props
}: PrefetchLinkProps) {
  // Extract string path from href (handles both string and UrlObject)
  const hrefString =
    typeof href === 'string'
      ? href
      : typeof href === 'object' && href !== null
        ? (href as UrlObject).pathname || (href as UrlObject).href || '/'
        : '/';

  const { handleMouseEnter, handleMouseLeave, handleTouchStart } = usePrefetchOnHover(hrefString, {
    delay: prefetchDelay,
    disabled: disablePrefetch,
  });

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {children}
    </Link>
  );
}

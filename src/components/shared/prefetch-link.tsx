'use client';

/**
 * PrefetchLink Component - Smart Link with Hover Intent Prefetching
 * 
 * Drop-in replacement for Next.js Link with smart prefetching.
 * Prefetches on hover intent (300ms delay) for instant navigation.
 * 
 * Usage:
 * ```tsx
 * // Instead of:
 * <Link href="/agents">Agents</Link>
 * 
 * // Use:
 * <PrefetchLink href="/agents">Agents</PrefetchLink>
 * ```
 * 
 * @module components/shared/prefetch-link
 */

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { usePrefetchOnHover } from '@/src/hooks/use-prefetch-on-hover';

export interface PrefetchLinkProps extends ComponentProps<typeof Link> {
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
  const hrefString = typeof href === 'string' ? href : href.pathname || '';
  
  const { handleMouseEnter, handleMouseLeave, handleTouchStart } = usePrefetchOnHover(
    hrefString,
    {
      delay: prefetchDelay,
      disabled: disablePrefetch,
    }
  );

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

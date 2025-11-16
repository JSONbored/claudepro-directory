/**
 * Navigation link with orange underline animation pattern
 */

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { ANIMATION_CONSTANTS, DIMENSIONS, POSITION_PATTERNS } from '@/src/lib/ui-constants';

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
    return (
      <a
        href={href}
        className={`group ${className}`}
        target="_blank"
        rel="noopener noreferrer"
        {...(props as ComponentProps<'a'>)}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={`group ${className}`} {...props}>
      {content}
    </Link>
  );
}

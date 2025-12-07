/**
 * Desktop Navigation Component
 * Visible only at xl: breakpoint (1280px+)
 * Handles full dropdown menus with descriptions
 */

'use client';

import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@heyclaude/web-runtime/config/navigation';
import { Briefcase, ChevronDown, Handshake, Users } from '@heyclaude/web-runtime/icons';
import {
  ANIMATION_CONSTANTS,
  DIMENSIONS,
  POSITION_PATTERNS,
  UI_CLASSES,
  UnifiedBadge,
  PrefetchLink,
  NavigationHoverCard,
  NavigationHoverCardTrigger,
  NavigationHoverCardContent,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SearchTrigger } from '@/src/components/features/search/search-trigger';

interface NavLinkProps {
  children: React.ReactNode;
  className?: string;
  href: string;
  isActive: (href: string) => boolean;
  onClick?: () => void;
}

const NavLink = ({ href, children, className = '', isActive, onClick }: NavLinkProps) => {
  const active = isActive(href);

  const linkProps = {
    href,
    prefetch: true,
    className: `group relative px-2 py-1 text-xs font-medium ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} no-underline ${
      active ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
    } ${className}`,
    ...(active && { 'aria-current': 'page' as const }),
    ...(onClick && { onClick }),
    style: {
      viewTransitionName: active ? 'nav-link' : undefined,
    } as React.CSSProperties,
  };

  return (
    <PrefetchLink {...linkProps}>
      <span className="relative inline-block">
        {children}
        <span
          className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} ${
            active ? 'w-full' : 'w-0 group-hover:w-full'
          }`}
          aria-hidden="true"
        />
      </span>
    </PrefetchLink>
  );
};

interface NavigationDesktopProps {
  isActive: (path: string) => boolean;
  onCommandPaletteOpen: () => void;
}

export function NavigationDesktop({ isActive, onCommandPaletteOpen }: NavigationDesktopProps) {
  // Client-side hydration state to prevent SSR hydration mismatch with Radix UI IDs
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render until mounted (prevents hydration mismatch with Radix UI generated IDs)
  if (!isMounted) {
    return (
      <nav
        className={`hidden xl:flex ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-xs`}
        aria-label="Primary navigation"
      >
        {/* Placeholder to maintain layout during SSR */}
        <div className="invisible">
          {PRIMARY_NAVIGATION.map((link) => (
            <span key={link.label}>{link.label}</span>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`hidden xl:flex ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-xs`}
      aria-label="Primary navigation"
    >
      {PRIMARY_NAVIGATION.map((link) => {
        // Render hover dropdown for links with sections or children (e.g., Configs)
        if ((link.sections && link.sections.length > 0) || (link.children && link.children.length > 0)) {
          return (
            <NavigationHoverCard key={link.label} openDelay={150} closeDelay={300}>
              <NavigationHoverCardTrigger asChild>
                <button
                  type="button"
                  className={`group relative flex items-center px-2 py-1 font-medium ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_NAV} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
                  aria-label={`Open ${link.label} menu`}
                >
                  <span className="relative">
                    {link.label}
                    <span
                      className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} bg-accent w-0 ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} group-hover:w-full`}
                      aria-hidden="true"
                    />
                  </span>
                  <ChevronDown className="ml-1 h-2.5 w-2.5 opacity-50" />
                </button>
              </NavigationHoverCardTrigger>
              <NavigationHoverCardContent align="start" className="w-56 p-3" sideOffset={8}>
                {link.sections ? (
                  // Organized sections with headers (matching reference design)
                  <div className="space-y-4">
                    {link.sections.map((section, sectionIndex) => (
                      <div key={section.heading}>
                        {/* Section header - subtle grey text like reference */}
                        <div className="px-2 py-1 mb-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                            {section.heading}
                          </p>
                        </div>
                        {/* Section items */}
                        <div className="space-y-0.5">
                          {section.links.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                prefetch
                                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/5 transition-colors group/item text-foreground"
                              >
                                {ChildIcon && (
                                  <ChildIcon className="h-4 w-4 text-muted-foreground group-hover/item:text-foreground transition-colors" />
                                )}
                                <span className="flex-1">{child.label}</span>
                                {child.isNew && (
                                  <UnifiedBadge variant="new-indicator" label={`New: ${child.label}`} />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                        {/* Separator between sections (except last) - subtle border */}
                        {link.sections && sectionIndex < link.sections.length - 1 && (
                          <div className="mt-4 mb-0 h-px bg-border/50" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : link.children ? (
                  // Fallback: flat list for links without sections
                  <div className="space-y-0.5">
                    {link.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          prefetch
                          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/5 transition-colors group/item"
                        >
                          {ChildIcon && (
                            <ChildIcon className="h-4 w-4 text-muted-foreground group-hover/item:text-foreground transition-colors" />
                          )}
                          <span className="flex-1">{child.label}</span>
                          {child.isNew && (
                            <UnifiedBadge variant="new-indicator" label={`New: ${child.label}`} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </NavigationHoverCardContent>
            </NavigationHoverCard>
          );
        }

        // Render regular link for items without children
        return (
          <NavLink key={link.href} href={link.href} isActive={isActive}>
            {link.isNew ? (
              <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
                {link.label}
                <UnifiedBadge variant="new-indicator" label={`New: ${link.label}`} />
              </span>
            ) : (
              link.label
            )}
          </NavLink>
        );
      })}

      <NavigationHoverCard openDelay={150} closeDelay={300}>
        <NavigationHoverCardTrigger asChild>
          <button
            type="button"
            className={`group relative flex items-center px-2 py-1 font-medium ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_NAV} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
            aria-label="Open additional navigation menu"
          >
            <span className="relative">
              More
              <span
                className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} bg-accent w-0 ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} group-hover:w-full`}
                aria-hidden="true"
              />
            </span>
            <ChevronDown className="ml-1 h-2.5 w-2.5 opacity-50" />
          </button>
        </NavigationHoverCardTrigger>
        <NavigationHoverCardContent align="end" className="w-64 p-3" sideOffset={8}>
          {/* Simplified single column layout */}
          <div className="space-y-2">
            {SECONDARY_NAVIGATION.map((group) => (
              <div key={group.heading}>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  {group.heading}
                </div>
                <div className="space-y-0.5">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch
                      className="block px-2 py-1.5 text-sm rounded-md hover:bg-accent/5 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Links - Community, Partner Program, Consulting */}
          <div className="mt-2.5 pt-2.5 border-t border-border">
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/community"
                prefetch
                className="flex flex-col items-center gap-1 rounded-md p-2 hover:bg-accent/5 transition-colors group/item"
              >
                <Users
                  className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors"
                  aria-hidden="true"
                />
                <div className="text-foreground group-hover/item:text-accent text-xs font-medium transition-colors">
                  Community
                </div>
              </Link>
              <Link
                href="/partner"
                prefetch
                className="flex flex-col items-center gap-1 rounded-md p-2 hover:bg-accent/5 transition-colors group/item"
              >
                <Handshake
                  className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors"
                  aria-hidden="true"
                />
                <div className="text-foreground group-hover/item:text-accent text-xs font-medium transition-colors">
                  Partner
                </div>
              </Link>
              <Link
                href="/consulting"
                prefetch
                className="flex flex-col items-center gap-1 rounded-md p-2 hover:bg-accent/5 transition-colors group/item"
              >
                <Briefcase
                  className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors"
                  aria-hidden="true"
                />
                <div className="text-foreground group-hover/item:text-accent text-xs font-medium transition-colors">
                  Consulting
                </div>
              </Link>
            </div>
          </div>
        </NavigationHoverCardContent>
      </NavigationHoverCard>

      {/* Search Icon - Right of More */}
      <SearchTrigger
        variant="ghost"
        size="sm"
        showShortcut={false}
        onClick={onCommandPaletteOpen}
        className={UI_CLASSES.TEXT_XS}
      />
    </nav>
  );
}

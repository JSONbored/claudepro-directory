/**
 * Desktop Navigation Component
 * Visible only at xl: breakpoint (1280px+)
 * Handles full dropdown menus with descriptions
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@heyclaude/web-runtime/config/navigation';
import { ChevronDown, PlusCircle } from '@heyclaude/web-runtime/icons';
import {
  ANIMATION_CONSTANTS,
  DIMENSIONS,
  POSITION_PATTERNS,
  STATE_PATTERNS,
  UI_CLASSES,
  UnifiedBadge,
  PrefetchLink,
  NavigationHoverCard,
  NavigationHoverCardTrigger,
  NavigationHoverCardContent,
  cn,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { SearchTrigger } from '@/src/components/features/search/search-trigger';

/**
 * Get category from href for badge display
 */
function getCategoryFromHref(href: string): Database['public']['Enums']['content_category'] | null {
  if (href.includes('/agents')) return 'agents';
  if (href.includes('/mcp')) return 'mcp';
  if (href.includes('/commands')) return 'commands';
  if (href.includes('/rules') || href.includes('/claude.md')) return 'rules';
  if (href.includes('/hooks')) return 'hooks';
  if (href.includes('/statuslines')) return 'statuslines';
  if (href.includes('/collections')) return 'collections';
  if (href.includes('/skills')) return 'skills';
  if (href.includes('/guides')) return 'guides';
  return null;
}

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

/**
 * Configs Dropdown Component
 * Extracted to allow hooks at top level (fixes Rules of Hooks violation)
 */
interface ConfigsDropdownProps {
  link: typeof PRIMARY_NAVIGATION[0];
  getCategoryFromHref: (href: string) => Database['public']['Enums']['content_category'] | null;
}

function ConfigsDropdown({ link, getCategoryFromHref }: ConfigsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [isOpen]);

  return (
    <NavigationHoverCard 
      key={link.label} 
      openDelay={150} 
      closeDelay={300}
      onOpenChange={setIsOpen}
    >
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
      <NavigationHoverCardContent
        align="start"
        className={cn('w-[720px] xl:w-[800px]', UI_CLASSES.PADDING_DEFAULT, 'overflow-hidden bg-popover border border-border/50 shadow-lg')}
        sideOffset={8}
      >
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key={animationKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={cn('grid grid-cols-[.6fr_1.4fr]', UI_CLASSES.SPACE_COMFORTABLE)}
            >
              {/* Left Column: Hero Card */}
              <div>
                <Link
                  href="/tools/config-recommender"
                  className="group/hero block rounded-lg border border-border/50 bg-card/50 p-4 hover:border-border hover:bg-card/80 transition-all"
                >
                  <div className="mb-3">
                    <h3 className="font-semibold text-base mb-1">{link.label}</h3>
                    <p className="text-muted-foreground text-sm leading-tight">
                      {link.description || 'Browse all configuration types for Claude Code'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-accent">
                    <span>Explore All</span>
                    <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                  </div>
                </Link>
              </div>

              {/* Right Column: Multi-column sections */}
              <div>
                {(() => {
                  const allLinks = link.sections!.flatMap((section) =>
                    section.links.map((child) => ({
                      ...child,
                      sectionHeading: section.heading,
                    }))
                  );

                  const itemsPerColumn = 4;
                  const columns: Array<Array<typeof allLinks[0]>> = [];
                  for (let i = 0; i < allLinks.length; i += itemsPerColumn) {
                    columns.push(allLinks.slice(i, i + itemsPerColumn));
                  }

                  return (
                    <div className={cn('grid gap-4', columns.length === 1 ? 'grid-cols-1' : columns.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                      {columns.map((columnLinks, colIndex) => (
                        <div key={`${link.label}-column-${colIndex}`} className="space-y-2 max-h-[280px] overflow-y-auto overflow-x-hidden">
                          {columnLinks.map((child, childIndex) => {
                            const category = getCategoryFromHref(child.href);
                            const ChildIcon = child.icon;
                            return (
                              <motion.div
                                key={`${animationKey}-${link.label}-${child.label}-${colIndex}-${childIndex}`}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 300,
                                  damping: 25,
                                  delay: (colIndex * itemsPerColumn + childIndex) * 0.02,
                                }}
                              >
                                <Link
                                  href={child.href}
                                  prefetch
                                  className={cn('group/item block rounded-lg px-2.5 py-2 text-sm leading-none no-underline outline-none transition-all', STATE_PATTERNS.HOVER_BG_STRONG, STATE_PATTERNS.FOCUS_RING, 'overflow-hidden')}
                                >
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    {ChildIcon && (
                                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground transition-all duration-200">
                                        <ChildIcon className="h-3.5 w-3.5" />
                                      </div>
                                    )}
                                    <div className="font-medium break-words word-break-break-word">{child.label}</div>
                                    {category && (
                                      <UnifiedBadge 
                                        variant="category" 
                                        category={category} 
                                        href={null}
                                        className="shrink-0 text-[10px] px-1.5 py-0" 
                                      />
                                    )}
                                    {child.isNew && (
                                      <UnifiedBadge variant="new-badge" badgeVariant="default" className="shrink-0" />
                                    )}
                                    {child.external && (
                                      <span className="text-muted-foreground text-xs shrink-0 ml-auto">↗</span>
                                    )}
                                  </div>
                                  {child.description && (
                                    <p className="text-muted-foreground text-[11px] leading-snug break-words word-break-break-word line-clamp-1 ml-8">
                                      {child.description}
                                    </p>
                                  )}
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </NavigationHoverCardContent>
    </NavigationHoverCard>
  );
}

/**
 * Discover/Resources/Contribute Dropdown Component
 * Extracted to allow hooks at top level (fixes Rules of Hooks violation)
 */
interface DiscoverResourcesContributeDropdownProps {
  link: typeof PRIMARY_NAVIGATION[0];
  getCategoryFromHref: (href: string) => Database['public']['Enums']['content_category'] | null;
}

function DiscoverResourcesContributeDropdown({ link, getCategoryFromHref }: DiscoverResourcesContributeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [isOpen]);

  return (
    <NavigationHoverCard 
      key={link.label} 
      openDelay={150} 
      closeDelay={300}
      onOpenChange={setIsOpen}
    >
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
      <NavigationHoverCardContent
        align="start"
        className={cn(DIMENSIONS.NAV_DROPDOWN_BASE, DIMENSIONS.NAV_DROPDOWN_BASE_LG, UI_CLASSES.PADDING_DEFAULT, 'overflow-hidden bg-popover border border-border/50 shadow-lg')}
        sideOffset={8}
      >
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.ul
              key={animationKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={cn('grid', UI_CLASSES.SPACE_DEFAULT, DIMENSIONS.NAV_DROPDOWN_INNER_SM, DIMENSIONS.NAV_DROPDOWN_BASE_MD, 'md:grid-cols-2', DIMENSIONS.NAV_DROPDOWN_INNER_LG)}
            >
              {link.sections!.map((section) => (
                <li key={`${link.label}-${section.heading}`}>
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2">
                      {section.heading}
                    </p>
                  </div>
                  <div className={UI_CLASSES.SPACE_Y_TIGHT}>
                    {section.links.map((child, childIndex) => {
                      const ChildIcon = child.icon;
                      return (
                        <motion.div
                          key={`${animationKey}-${link.label}-${section.heading}-${child.label}`}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                            delay: childIndex * 0.03,
                          }}
                        >
                          <Link
                            href={child.href}
                            prefetch
                            className={cn('group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none transition-all', STATE_PATTERNS.HOVER_BG_STRONG, STATE_PATTERNS.FOCUS_RING, 'overflow-hidden')}
                          >
                            <div className="flex items-start gap-3">
                              {ChildIcon && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground transition-all duration-200">
                                  <ChildIcon className="h-4 w-4" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <div className="font-medium break-words word-break-break-word">{child.label}</div>
                                  {(() => {
                                    const category = getCategoryFromHref(child.href);
                                    return category ? (
                                      <UnifiedBadge 
                                        variant="category" 
                                        category={category} 
                                        href={null}
                                        className="shrink-0 text-[10px] px-1.5 py-0" 
                                      />
                                    ) : null;
                                  })()}
                                  {child.isNew && (
                                    <UnifiedBadge variant="new-badge" badgeVariant="default" className="shrink-0" />
                                  )}
                                  {child.external && (
                                    <span className="text-muted-foreground text-xs shrink-0 ml-auto">↗</span>
                                  )}
                                </div>
                                {child.description && (
                                  <p className="text-muted-foreground text-xs leading-snug break-words word-break-break-word line-clamp-2">
                                    {child.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </NavigationHoverCardContent>
    </NavigationHoverCard>
  );
}

/**
 * Fallback Dropdown Component
 * Extracted to allow hooks at top level (fixes Rules of Hooks violation)
 */
interface FallbackDropdownProps {
  link: typeof PRIMARY_NAVIGATION[0];
  getCategoryFromHref: (href: string) => Database['public']['Enums']['content_category'] | null;
}

function FallbackDropdown({ link, getCategoryFromHref }: FallbackDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [isOpen]);

  return (
    <NavigationHoverCard 
      key={link.label} 
      openDelay={150} 
      closeDelay={300}
      onOpenChange={setIsOpen}
    >
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
      <NavigationHoverCardContent align="start" className={cn('w-64', UI_CLASSES.PADDING_COMPACT, 'bg-popover border border-border/50 shadow-lg')} sideOffset={8}>
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key={animationKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {link.sections ? (
                <div className={UI_CLASSES.SPACE_Y_COMFORTABLE}>
                  {link.sections.map((section, sectionIndex) => (
                    <div key={`${link.label}-${section.heading}`}>
                      <div className="px-2 py-1 mb-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                          {section.heading}
                        </p>
                      </div>
                      <div className={UI_CLASSES.SPACE_Y_TIGHT}>
                        {section.links.map((child, childIndex) => {
                          const ChildIcon = child.icon;
                          return (
                            <motion.div
                              key={`${animationKey}-${link.label}-${section.heading}-${child.label}-${childIndex}`}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 25,
                                delay: childIndex * 0.03,
                              }}
                            >
                              <Link
                                href={child.href}
                                prefetch
                                className={cn('group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none transition-all', STATE_PATTERNS.HOVER_BG_STRONG, STATE_PATTERNS.FOCUS_RING, 'overflow-hidden')}
                              >
                                <div className="flex items-start gap-3">
                                  {ChildIcon && (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground transition-all duration-200">
                                      <ChildIcon className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                      <div className="font-medium break-words word-break-break-word">{child.label}</div>
                                      {(() => {
                                        const category = getCategoryFromHref(child.href);
                                        return category ? (
                                          <UnifiedBadge 
                                            variant="category" 
                                            category={category} 
                                            href={null}
                                            className="shrink-0 text-[10px] px-1.5 py-0" 
                                          />
                                        ) : null;
                                      })()}
                                      {child.isNew && (
                                        <UnifiedBadge variant="new-badge" badgeVariant="default" className="shrink-0" />
                                      )}
                                      {child.external && (
                                        <span className="text-muted-foreground text-xs shrink-0 ml-auto">↗</span>
                                      )}
                                    </div>
                                    {child.description && (
                                      <p className="text-muted-foreground text-xs leading-snug break-words word-break-break-word line-clamp-2">
                                        {child.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                      {link.sections && sectionIndex < link.sections.length - 1 && (
                        <div className="mt-4 mb-0 h-px bg-border/50" />
                      )}
                    </div>
                  ))}
                </div>
              ) : link.children ? (
                <div className={UI_CLASSES.SPACE_Y_TIGHT}>
                  {link.children.map((child, childIndex) => {
                    const ChildIcon = child.icon;
                    return (
                      <motion.div
                        key={`${animationKey}-${link.label}-${child.label}-${childIndex}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                          delay: childIndex * 0.03,
                        }}
                      >
                        <Link
                          href={child.href}
                          prefetch
                          className={cn('group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none', STATE_PATTERNS.HOVER_BG_SUBTLE, STATE_PATTERNS.FOCUS_RING, ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT)}
                        >
                          <div className="flex items-start gap-3">
                            {ChildIcon && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground transition-all duration-200">
                                <ChildIcon className="h-4 w-4" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <div className="font-medium">{child.label}</div>
                                {child.isNew && (
                                  <UnifiedBadge variant="new-badge" badgeVariant="default" className="shrink-0" />
                                )}
                              </div>
                              {child.description && (
                                <p className="text-muted-foreground line-clamp-2 text-xs leading-snug">
                                  {child.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </NavigationHoverCardContent>
    </NavigationHoverCard>
  );
}

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
        // Special handling for Jobs dropdown with enhanced design
        if (link.label === 'Jobs' && link.sections) {
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
              <NavigationHoverCardContent align="start" className={cn(DIMENSIONS.NAV_DROPDOWN_JOBS, UI_CLASSES.PADDING_DEFAULT)} sideOffset={8}>
                <div className={cn('grid grid-cols-2', UI_CLASSES.SPACE_COMFORTABLE)}>
                  {/* Left Column: Post a Job CTA + Quick Links */}
                  <div className={UI_CLASSES.SPACE_Y_3}>
                    {/* Post a Job Hero Card */}
                    <Link
                      href="/account/jobs/new"
                      className="group/cta block rounded-lg border-2 border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 p-4 hover:border-accent/40 transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 group-hover/cta:bg-accent/30 transition-colors">
                          <PlusCircle className="h-5 w-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">Post a Job</h3>
                          <p className="text-xs text-muted-foreground">Reach talented developers</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Featured listings available. Premium placement options.
                      </p>
                      <div className="flex items-center gap-2 text-xs font-medium text-accent">
                        <span>Create Listing</span>
                        <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                      </div>
                    </Link>

                    {/* Quick Links */}
                    <div className="space-y-0.5">
                      {link.sections[0]?.links.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={`${link.label}-${child.label}`}
                            href={child.href}
                            prefetch
                            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/5 transition-colors group/item"
                          >
                            {ChildIcon && (
                              <ChildIcon className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                            )}
                            <span className="flex-1">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Featured Jobs Preview */}
                  <div>
                    <div className="px-2 py-1 mb-2">
                      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        Featured Jobs
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-md border border-border/50 bg-card/50 p-3 text-sm">
                        <p className="text-muted-foreground text-xs">
                          Featured job previews will appear here
                        </p>
                        <Link
                          href="/jobs?featured=true"
                          className="text-xs text-accent hover:underline mt-2 inline-block"
                        >
                          View all featured jobs →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </NavigationHoverCardContent>
            </NavigationHoverCard>
          );
        }

        // Special handling for Configs - Two-column layout with hero card on left
        if (link.label === 'Configs' && link.sections) {
          return (
            <ConfigsDropdown
              key={link.label}
              link={link}
              getCategoryFromHref={getCategoryFromHref}
            />
          );
        }

        // Special handling for Discover, Resources, Contribute - Multi-column grid with descriptions
        if (
          (link.label === 'Discover' || link.label === 'Resources' || link.label === 'Contribute') &&
          link.sections
        ) {
          return (
            <DiscoverResourcesContributeDropdown
              key={link.label}
              link={link}
              getCategoryFromHref={getCategoryFromHref}
            />
          );
        }

        // Render hover dropdown for links with sections or children (fallback)
        if ((link.sections && link.sections.length > 0) || (link.children && link.children.length > 0)) {
          return (
            <FallbackDropdown
              key={link.label}
              link={link}
              getCategoryFromHref={getCategoryFromHref}
            />
          );
        }

        // Render regular link for items without children
        return (
          <NavLink key={link.label} href={link.href} isActive={isActive}>
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
        <NavigationHoverCardContent align="end" className={cn('w-80', UI_CLASSES.PADDING_DEFAULT, 'overflow-hidden bg-popover border border-border/50 shadow-lg')} sideOffset={8}>
          {/* Support group with enhanced layout */}
          <div className={UI_CLASSES.SPACE_Y_DEFAULT}>
            {SECONDARY_NAVIGATION.map((group) => (
              <div key={group.heading}>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5 mb-2">
                  {group.heading}
                </div>
                <ul className="grid gap-1">
                  {group.links.map((link) => {
                    const LinkIcon = link.icon;
                    return (
                      <li key={`${group.heading}-${link.label}`}>
                        <Link
                          href={link.href}
                          prefetch
                              className="group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none transition-all hover:bg-accent/5 focus:bg-accent/5"
                        >
                          <div className="flex items-start gap-3">
                            {LinkIcon && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground transition-all duration-200">
                                <LinkIcon className="h-4 w-4" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="font-medium mb-0.5 break-words">{link.label}</div>
                              {link.description && (
                                <p className="text-muted-foreground text-xs leading-snug break-words line-clamp-2">
                                  {link.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
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

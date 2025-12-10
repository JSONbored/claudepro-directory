/**
 * Desktop Navigation Component
 * Visible only at xl: breakpoint (1280px+)
 * Handles full dropdown menus with descriptions
 */

'use client';

import { type Database } from '@heyclaude/database-types';
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@heyclaude/web-runtime/config/navigation';
import { SPRING, MICROINTERACTIONS, STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
import { Bookmark, ChevronDown, Github, MessageSquare, PlusCircle } from '@heyclaude/web-runtime/icons';
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
import { AnimatedBorder } from '@heyclaude/web-runtime/ui';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';

import { getSocialLinks, logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { Button } from '@heyclaude/web-runtime/ui';

import { usePinboardDrawer } from '@/src/components/features/navigation/pinboard-drawer-provider';


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
        align="end"
        alignOffset={-16}
        className={cn(
          'w-[720px] xl:w-[800px]',
          UI_CLASSES.PADDING_DEFAULT,
          'relative overflow-hidden rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl'
        )}
        sideOffset={8}
      >
        {/* Animated gradient border with heyclaude orange */}
        <AnimatedBorder
          colorFrom="#F97316"
          colorTo="#FB923C"
          duration={3}
          borderWidth={2}
        />
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key={animationKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.micro }}
              className={cn('relative z-10 grid grid-cols-[.6fr_1.4fr]', UI_CLASSES.SPACE_COMFORTABLE)}
            >
              {/* Left Column: Hero Card */}
              <div>
                <motion.div
                  whileHover={MICROINTERACTIONS.card.hover}
                  whileTap={MICROINTERACTIONS.card.tap}
                  transition={MICROINTERACTIONS.card.transition}
                >
                  <Link
                    href="/tools/config-recommender"
                    className="group/hero block rounded-lg border border-border/50 bg-card/50 p-4"
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
                </motion.div>
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
                        <div key={`${link.label}-column-${colIndex}`} className="space-y-2 max-h-[280px] overflow-y-auto overflow-x-hidden scrollbar-hide">
                          {columnLinks.map((child, childIndex) => {
                            const category = getCategoryFromHref(child.href);
                            const ChildIcon = child.icon;
                            const isLastInColumn = childIndex === columnLinks.length - 1;
                            return (
                              <div key={`${animationKey}-${link.label}-${child.label}-${colIndex}-${childIndex}`}>
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    ...SPRING.smooth,
                                    delay: (colIndex * itemsPerColumn + childIndex) * STAGGER.micro, // Using micro for 20ms
                                  }}
                                >
                                  <motion.div
                                    whileHover={MICROINTERACTIONS.card.hover}
                                    whileTap={MICROINTERACTIONS.card.tap}
                                    transition={MICROINTERACTIONS.card.transition}
                                  >
                                    <Link
                                      href={child.href}
                                      prefetch
                                      className={cn('group/item block rounded-lg px-2.5 py-2 text-sm leading-none no-underline outline-none', STATE_PATTERNS.HOVER_BG_STRONG, STATE_PATTERNS.FOCUS_RING, 'overflow-hidden')}
                                    >
                                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        {ChildIcon && (
                                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground">
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
                                </motion.div>
                                {!isLastInColumn && (
                                  <div className="h-px bg-border/30 my-1.5" />
                                )}
                              </div>
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
        align="end"
        alignOffset={-16}
        className={cn(
          DIMENSIONS.NAV_DROPDOWN_BASE,
          DIMENSIONS.NAV_DROPDOWN_BASE_LG,
          UI_CLASSES.PADDING_DEFAULT,
          'relative overflow-hidden rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl'
        )}
        sideOffset={8}
      >
        {/* Animated gradient border with heyclaude orange */}
        <AnimatedBorder
          colorFrom="#F97316"
          colorTo="#FB923C"
          duration={3}
          borderWidth={2}
        />
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.ul
              key={animationKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.micro }}
              className={cn('relative z-10 grid', UI_CLASSES.SPACE_DEFAULT, DIMENSIONS.NAV_DROPDOWN_INNER_SM, DIMENSIONS.NAV_DROPDOWN_BASE_MD, 'md:grid-cols-2', DIMENSIONS.NAV_DROPDOWN_INNER_LG)}
            >
              {link.sections!.map((section, sectionIndex) => {
                const isLastSection = sectionIndex === link.sections!.length - 1;
                return (
                  <li key={`${link.label}-${section.heading}`}>
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2">
                        {section.heading}
                      </p>
                    </div>
                    <div className={UI_CLASSES.SPACE_Y_TIGHT}>
                      {section.links.map((child, childIndex) => {
                        const isLastInSection = childIndex === section.links.length - 1;
                        const ChildIcon = child.icon;
                        return (
                          <div key={`${animationKey}-${link.label}-${section.heading}-${child.label}`}>
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                ...SPRING.smooth,
                                delay: childIndex * STAGGER.micro, // Using micro for 30ms
                              }}
                            >
                              <motion.div
                                whileHover={MICROINTERACTIONS.card.hover}
                                whileTap={MICROINTERACTIONS.card.tap}
                                transition={MICROINTERACTIONS.card.transition}
                              >
                                <Link
                                  href={child.href}
                                  prefetch
                                  className={cn('group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none', STATE_PATTERNS.HOVER_BG_STRONG, STATE_PATTERNS.FOCUS_RING, 'overflow-hidden')}
                                >
                                  <div className="flex items-start gap-3">
                                    {ChildIcon && (
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground">
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
                            </motion.div>
                            {!isLastInSection && (
                              <div className="h-px bg-border/30 mx-3" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                    {!isLastSection && (
                      <div className="h-px bg-border/40 my-3 mx-2" />
                    )}
                  </li>
                );
              })}
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
      <NavigationHoverCardContent
        align="end"
        alignOffset={-16}
        className={cn(
          'w-64',
          UI_CLASSES.PADDING_COMPACT,
          'relative overflow-hidden rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl'
        )}
        sideOffset={8}
      >
        {/* Animated gradient border with heyclaude orange */}
        <AnimatedBorder
          colorFrom="#F97316"
          colorTo="#FB923C"
          duration={3}
          borderWidth={2}
        />
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key={animationKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.micro }}
              className="relative z-10"
            >
              {link.sections ? (
                <div className={UI_CLASSES.SPACE_Y_COMFORTABLE}>
                  {link.sections.map((section, sectionIndex) => {
                    const isLastSection = sectionIndex === (link.sections?.length ?? 0) - 1;
                    return (
                      <div key={`${link.label}-${section.heading}`}>
                        <div className="px-2 py-1 mb-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                            {section.heading}
                          </p>
                        </div>
                        <div className={UI_CLASSES.SPACE_Y_TIGHT}>
                          {section.links.map((child, childIndex) => {
                            const ChildIcon = child.icon;
                            const isLastInSection = childIndex === section.links.length - 1;
                            return (
                              <div key={`${animationKey}-${link.label}-${section.heading}-${child.label}-${childIndex}`}>
                            <motion.div
                              key={`${animationKey}-${link.label}-${section.heading}-${child.label}-${childIndex}`}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                ...SPRING.smooth,
                                delay: childIndex * STAGGER.micro, // Using micro for 30ms
                              }}
                            >
                              <motion.div
                                whileHover={MICROINTERACTIONS.card.hover}
                                whileTap={MICROINTERACTIONS.card.tap}
                                transition={MICROINTERACTIONS.card.transition}
                              >
                                <Link
                                  href={child.href}
                                  prefetch
                                  className={cn('group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none', STATE_PATTERNS.HOVER_BG_STRONG, STATE_PATTERNS.FOCUS_RING, 'overflow-hidden')}
                                >
                                <div className="flex items-start gap-3">
                                  {ChildIcon && (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground">
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
                            </motion.div>
                            {!isLastInSection && (
                              <div className="h-px bg-border/30 mx-3" />
                            )}
                          </div>
                          );
                        })}
                      </div>
                      {!isLastSection && (
                        <div className="h-px bg-border/40 my-3 mx-2" />
                      )}
                    </div>
                  );
                })}
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
                          ...SPRING.smooth,
                          delay: childIndex * STAGGER.micro, // Using micro for 30ms
                        }}
                      >
                        <motion.div
                          whileHover={MICROINTERACTIONS.card.hover}
                          whileTap={MICROINTERACTIONS.card.tap}
                          transition={MICROINTERACTIONS.card.transition}
                        >
                          <Link
                            href={child.href}
                            prefetch
                            className={cn('group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none', STATE_PATTERNS.HOVER_BG_SUBTLE, STATE_PATTERNS.FOCUS_RING)}
                          >
                          <div className="flex items-start gap-3">
                                  {ChildIcon && (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground">
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
}

/**
 * Community Icons Row Component
 * Horizontal row of icon-only buttons for Discord, Pinboard, and GitHub Stars
 */
function CommunityIconsRow({ openPinboardDrawer }: { openPinboardDrawer: () => void }) {
  const pulse = usePulse();
  const SOCIAL_LINK_SNAPSHOT = getSocialLinks();
  const [githubStars, setGithubStars] = useState<number | null>(null);
  
  // Fetch GitHub star count
  useEffect(() => {
    const repoUrl = SOCIAL_LINK_SNAPSHOT.github;
    const apiUrl = (() => {
      try {
        const { pathname, hostname } = new URL(repoUrl);
        if (hostname === 'github.com') {
          const [, owner, repo] = pathname.split('/');
          if (owner && repo) {
            return `https://api.github.com/repos/${owner}/${repo}`;
          }
        }
      } catch {
        // Fall back to default repo
      }
      return 'https://api.github.com/repos/JSONbored/claudepro-directory';
    })();

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        const count =
          data && typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
        setGithubStars(count);
      })
      .catch((error) => {
        const normalized = normalizeError(error, 'Failed to fetch GitHub star count');
        logClientWarn(
          '[GitHub] Failed to fetch star count',
          normalized,
          'CommunityIconsRow.fetchStars',
          {
            component: 'CommunityIconsRow',
            action: 'fetch-star-count',
            category: 'external-api',
            apiUrl,
          }
        );
        setGithubStars(null);
      });
  }, []);
  
  const handleDiscordClick = () => {
    pulse
      .click({
        category: null,
        slug: null,
        metadata: {
          action: 'external_link',
          link_type: 'discord',
          target_url: 'https://discord.gg/Ax3Py4YDrq',
        },
      })
      .catch((error) => {
        logUnhandledPromise('CommunityIconsRow: Discord click pulse failed', error, {});
      });
    window.open('https://discord.gg/Ax3Py4YDrq', '_blank', 'noopener,noreferrer');
  };
  
  const handleGitHubClick = () => {
    const repoUrl = SOCIAL_LINK_SNAPSHOT.github;
    pulse
      .click({
        category: null,
        slug: null,
        metadata: {
          action: 'external_link',
          link_type: 'github',
          target_url: repoUrl,
        },
      })
      .catch((error) => {
        logUnhandledPromise('CommunityIconsRow: GitHub click pulse failed', error, { repoUrl });
      });
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="border-t border-border/30 mt-4 pt-4">
      <div className="flex items-center justify-center gap-3 px-2">
        {/* Discord */}
        <motion.div
          whileHover={MICROINTERACTIONS.button.hover}
          whileTap={MICROINTERACTIONS.button.tap}
          transition={MICROINTERACTIONS.button.transition}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDiscordClick}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Join our Discord community"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </motion.div>
        
        {/* Pinboard */}
        <motion.div
          whileHover={MICROINTERACTIONS.button.hover}
          whileTap={MICROINTERACTIONS.button.tap}
          transition={MICROINTERACTIONS.button.transition}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={openPinboardDrawer}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Open pinboard"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </motion.div>
        
        {/* GitHub Stars */}
        <motion.div
          whileHover={MICROINTERACTIONS.button.hover}
          whileTap={MICROINTERACTIONS.button.tap}
          transition={MICROINTERACTIONS.button.transition}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGitHubClick}
            className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
            aria-label={`Star us on GitHub${githubStars !== null ? ` - ${githubStars} stars` : ''}`}
          >
            <Github className="h-4 w-4" />
            {githubStars !== null && (
              <span className="absolute -top-1 -right-1 text-[10px] font-medium text-accent">
                {githubStars > 999 ? `${(githubStars / 1000).toFixed(1)}k` : githubStars.toLocaleString()}
              </span>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export function NavigationDesktop({ isActive }: NavigationDesktopProps) {
  // Client-side hydration state to prevent SSR hydration mismatch with Radix UI IDs
  const [isMounted, setIsMounted] = useState(false);
  const { openDrawer: openPinboardDrawer } = usePinboardDrawer();

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
              <NavigationHoverCardContent
                align="end"
                alignOffset={-16}
                className={cn(
                  DIMENSIONS.NAV_DROPDOWN_JOBS,
                  UI_CLASSES.PADDING_DEFAULT,
                  'relative overflow-hidden rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl'
                )}
                sideOffset={8}
              >
                {/* Subtle animated gradient border */}
                <AnimatedBorder
                  colorFrom="rgba(249, 115, 22, 0.4)"
                  colorTo="rgba(249, 115, 22, 0.2)"
                  duration={4}
                  borderWidth={1.5}
                />
                <div className={cn('relative z-10 grid grid-cols-2', UI_CLASSES.SPACE_COMFORTABLE)}>
                  {/* Left Column: Post a Job CTA + Quick Links */}
                  <div className={UI_CLASSES.SPACE_Y_3}>
                    {/* Post a Job Hero Card */}
                    <motion.div
                      whileHover={MICROINTERACTIONS.card.hover}
                      whileTap={MICROINTERACTIONS.card.tap}
                      transition={MICROINTERACTIONS.card.transition}
                    >
                      <Link
                        href="/account/jobs/new"
                        className="group/cta block rounded-lg border-2 border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 p-4"
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
                    </motion.div>

                    {/* Quick Links */}
                    <div className="space-y-0.5">
                      {link.sections[0]?.links.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <motion.div
                            key={`${link.label}-${child.label}`}
                            whileHover={{
                              ...MICROINTERACTIONS.button.hover,
                              backgroundColor: 'rgba(249, 115, 22, 0.05)', // Preserve exact original background (accent/5)
                            }}
                            whileTap={MICROINTERACTIONS.button.tap}
                            transition={MICROINTERACTIONS.button.transition}
                          >
                            <Link
                              href={child.href}
                              prefetch
                              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md group/item"
                            >
                              {ChildIcon && (
                                <ChildIcon className="h-4 w-4 text-muted-foreground group-hover/item:text-accent" />
                              )}
                              <span className="flex-1">{child.label}</span>
                            </Link>
                          </motion.div>
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
        <NavigationHoverCardContent
          align="end"
          alignOffset={-16}
          className={cn(
            'w-80',
            UI_CLASSES.PADDING_DEFAULT,
            'relative overflow-hidden rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl'
          )}
          sideOffset={8}
        >
                {/* Subtle animated gradient border */}
                <AnimatedBorder
                  colorFrom="rgba(249, 115, 22, 0.4)"
                  colorTo="rgba(249, 115, 22, 0.2)"
                  duration={4}
                  borderWidth={1.5}
                />
          {/* Support group with enhanced layout */}
          <div className={cn('relative z-10', UI_CLASSES.SPACE_Y_DEFAULT)}>
            {SECONDARY_NAVIGATION.map((group, groupIndex) => {
              const isLastGroup = groupIndex === SECONDARY_NAVIGATION.length - 1;
              return (
                <div key={group.heading}>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5 mb-2">
                    {group.heading}
                  </div>
                  <ul className="grid gap-1">
                    {group.links
                      // Filter out Pinboard, Discord, and GitHub from vertical list (they'll be in horizontal icon row at bottom)
                      .filter((link) => {
                        if (group.heading === 'Community') {
                          return link.label !== 'Pinboard' && link.label !== 'Discord' && link.label !== 'GitHub';
                        }
                        return true;
                      })
                      .map((link, linkIndex) => {
                      const LinkIcon = link.icon;
                      
                  return (
                    <Fragment key={`${group.heading}-${link.label}-fragment`}>
                      {linkIndex > 0 && (
                        <li key={`${group.heading}-${link.label}-divider`}>
                          <div className="h-px bg-border/30 my-1 mx-3" />
                        </li>
                      )}
                      <li key={`${group.heading}-${link.label}`}>
                        <motion.div
                          whileHover={{
                            ...MICROINTERACTIONS.card.hover,
                            backgroundColor: 'rgba(249, 115, 22, 0.05)', // Preserve exact original background (accent/5)
                            y: 0, // Preserve original (no y movement for these links)
                          }}
                          whileTap={MICROINTERACTIONS.card.tap}
                          transition={MICROINTERACTIONS.card.transition}
                        >
                          <Link
                            href={link.href}
                            prefetch={!link.external}
                            {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
                            className="group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none focus:bg-accent/5"
                          >
                            <div className="flex items-start gap-3">
                              {LinkIcon && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground">
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
                        </motion.div>
                      </li>
                    </Fragment>
                  );
                  })}
                  </ul>
                  {!isLastGroup && (
                    <div className="h-px bg-border/40 my-4 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Horizontal icon row at bottom: Discord, Pinboard, GitHub Stars */}
          <CommunityIconsRow openPinboardDrawer={openPinboardDrawer} />
        </NavigationHoverCardContent>
      </NavigationHoverCard>

    </nav>
  );
}

/**
 * Desktop Navigation Component
 * Visible only at xl: breakpoint (1280px+)
 * Handles full dropdown menus with descriptions
 */

'use client';

import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@heyclaude/web-runtime/config/navigation';
import { SPRING, MICROINTERACTIONS, STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
import { Bookmark, ChevronDown, Github, MessageSquare, PlusCircle, Search } from '@heyclaude/web-runtime/icons';
import {
  UnifiedBadge,
  PrefetchLink,
  NavigationHoverCard,
  NavigationHoverCardTrigger,
  NavigationHoverCardContent,
  cn,
} from '@heyclaude/web-runtime/ui';
import { AnimatedBorder } from '@heyclaude/web-runtime/ui';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks';

import { getSocialLinks, logUnhandledPromise, getCategoryFromHref } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { Button } from '@heyclaude/web-runtime/ui';

import { usePinboardDrawer } from '@/src/components/features/navigation/pinboard-drawer-provider';
import { useCommandPalette } from '@/src/components/features/navigation/command-palette-provider';

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
    className: cn('group', 'relative', 'px-3', 'py-2', 'text-xs-medium', 'transition-all duration-200 ease-out', 'no-underline',
      active ? 'text-foreground' : 'text-foreground/80 hover:text-foreground',
      className
    ),
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
          className={cn('absolute bottom-0 left-0', 'underline', 'bg-accent', 'transition-all duration-300 ease-out', active ? 'w-full' : 'w-0 group-hover:w-full')}
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
}

function ConfigsDropdown({ link }: ConfigsDropdownProps) {
  const { value: isOpen, setValue: setIsOpen } = useBoolean();
  const [animationKey, setAnimationKey] = useState(0);
  const shouldReduceMotion = useReducedMotion();

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
          className={cn('group', 'relative', 'flex items-center', 'px-3', 'py-2', 'font-medium', 'text-xs', 'text-foreground/80 hover:text-foreground', 'transition-all duration-200 ease-out')}
          aria-label={`Open ${link.label} menu`}
        >
          <span className="relative">
            {link.label}
            <span
              className={cn('absolute bottom-0 left-0', 'underline', 'bg-accent w-0', 'transition-all duration-300 ease-out', 'group-hover:w-full')}
              aria-hidden="true"
            />
          </span>
          <ChevronDown className={cn('ml-1', 'h-2.5 w-2.5 opacity-50')} />
        </button>
      </NavigationHoverCardTrigger>
      <NavigationHoverCardContent
        align="end"
        alignOffset={-16}
        className={cn(
          'w-[720px] xl:w-[800px]',
          'p-4',
          cn('relative', 'overflow-hidden', 'rounded-xl', 'border', 'border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl')
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
              className={cn('relative z-10 grid grid-cols-[.6fr_1.4fr]', 'space-y-4')}
            >
              {/* Left Column: Hero Card */}
              <div>
                <motion.div
                  whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.card.hover}
                  whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.card.tap}
                  transition={MICROINTERACTIONS.card.transition}
                >
                  <Link
                    href="/tools/config-recommender"
                    className={cn('group/hero block', 'rounded-lg', 'border', 'border-border/50 bg-card/50', 'p-4')}
                  >
                  <div className="mb-4">
                    <h3 className={cn('font-semibold text-base', 'mb-1')}>{link.label}</h3>
                    <p className={cn('text-muted-foreground text-sm', 'leading-tight')}>
                      {link.description || 'Browse all configuration types for Claude Code'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs-medium text-accent">
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
                                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                                  transition={{
                                    ...SPRING.smooth,
                                    delay: (colIndex * itemsPerColumn + childIndex) * STAGGER.micro, // Using micro for 20ms
                                  }}
                                >
                                  <motion.div
                                    whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.card.hover}
                                    whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.card.tap}
                                    transition={MICROINTERACTIONS.card.transition}
                                  >
                                    <Link
                                      href={child.href}
                                      prefetch
                                      className={cn('group/item block', 'rounded-lg', 'px-2.5', 'py-3', 'text-sm leading-none no-underline outline-none', 'hover:bg-accent/20', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'overflow-hidden')}
                                    >
                                      <div className={cn('flex items-center gap-2', 'mb-0.5', 'flex-wrap')}>
                                        {ChildIcon && (
                                          <div className={cn('flex-center', 'h-5 w-5', 'shrink-0', 'rounded-lg', 'bg-muted/50', 'text-muted-foreground', 'group-hover/item:bg-muted group-hover/item:text-foreground')}>
                                            <ChildIcon className="h-3 w-3" />
                                          </div>
                                        )}
                                        <div className="font-medium break-words word-break-break-word">{child.label}</div>
                                        {category && (
                                          <UnifiedBadge 
                                            variant="category" 
                                            category={category} 
                                            href={null}
                                            className={cn('shrink-0', 'text-[10px]', 'px-1.5', 'py-0')} 
                                          />
                                        )}
                                        {child.isNew && (
                                          <UnifiedBadge variant="new-badge" badgeVariant="default" className="shrink-0" />
                                        )}
                                        {child.external && (
                                          <span className={cn('text-muted-foreground text-xs', 'shrink-0', 'ml-auto')}>↗</span>
                                        )}
                                      </div>
                                      {child.description && (
                                        <p className={cn('text-muted-foreground', 'text-[11px]', 'leading-snug break-words word-break-break-word line-clamp-1', 'ml-8')}>
                                          {child.description}
                                        </p>
                                      )}
                                    </Link>
                                  </motion.div>
                                </motion.div>
                                {!isLastInColumn && (
                                  <div className="h-px bg-border/30 my-0.5" />
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
}

function DiscoverResourcesContributeDropdown({ link }: DiscoverResourcesContributeDropdownProps) {
  const { value: isOpen, setValue: setIsOpen } = useBoolean();
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
          className={cn('group', 'relative', 'flex items-center', 'px-3', 'py-2', 'font-medium', 'text-xs', 'text-foreground/80 hover:text-foreground', 'transition-all duration-200 ease-out')}
          aria-label={`Open ${link.label} menu`}
        >
          <span className="relative">
            {link.label}
            <span
              className={cn('absolute bottom-0 left-0', 'underline', 'bg-accent w-0', 'transition-all duration-300 ease-out', 'group-hover:w-full')}
              aria-hidden="true"
            />
          </span>
          <ChevronDown className={cn('ml-1', 'h-2.5 w-2.5 opacity-50')} />
        </button>
      </NavigationHoverCardTrigger>
      <NavigationHoverCardContent
        align="end"
        alignOffset={-16}
        className={cn(
          'w-[480px]',
          'lg:w-[600px]',
          'p-4',
          cn('relative', 'overflow-hidden', 'rounded-xl', 'border', 'border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl')
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
              className={cn('relative', 'z-10 grid', 'space-y-3', 'sm:w-[400px]', 'md:w-[480px]', 'md:grid-cols-2', 'lg:w-[600px]')}
            >
              {link.sections!.map((section, sectionIndex) => {
                const isLastSection = sectionIndex === link.sections!.length - 1;
                return (
                  <li key={`${link.label}-${section.heading}`}>
                    <div className="mb-2">
                      <p className={cn('text-[10px]', 'font-semibold', 'text-muted-foreground', 'opacity-70 uppercase', 'tracking-wide', 'px-3')}>
                        {section.heading}
                      </p>
                    </div>
                    <div className="space-y-1">
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
                                  className={cn('group/item block', 'rounded-lg', 'px-3', 'py-2.5', 'text-sm leading-none no-underline outline-none', 'hover:bg-accent/20', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'overflow-hidden')}
                                >
                                  <div className="flex items-start gap-2">
                                    {ChildIcon && (
                                      <div className={cn('flex items-center', 'h-6 w-6', 'shrink-0', 'items-center justify-center', 'rounded-lg', 'bg-muted/50', 'text-muted-foreground', 'group-hover/item:bg-muted group-hover/item:text-foreground')}>
                                        <ChildIcon className="h-4 w-4" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className={cn('flex items-center gap-2', 'mb-0.5', 'flex-wrap')}>
                                        <div className="font-medium break-words word-break-break-word">{child.label}</div>
                                        {(() => {
                                          const category = getCategoryFromHref(child.href);
                                          return category ? (
                                            <UnifiedBadge 
                                              variant="category" 
                                              category={category} 
                                              href={null}
                                              className={cn('shrink-0', 'text-[10px]', 'px-1.5', 'py-0')} 
                                            />
                                          ) : null;
                                        })()}
                                        {child.isNew && (
                                          <UnifiedBadge variant="new-badge" badgeVariant="default" className="shrink-0" />
                                        )}
                                        {child.external && (
                                          <span className={cn('text-muted-foreground text-xs', 'shrink-0', 'ml-auto')}>↗</span>
                                        )}
                                      </div>
                                      {child.description && (
                                        <p className={cn('text-muted-foreground text-xs', 'leading-snug break-words word-break-break-word line-clamp-2')}>
                                          {child.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              </motion.div>
                            </motion.div>
                            {!isLastInSection && (
                              <div className="h-px bg-border/30 mx-2" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                    {!isLastSection && (
                      <div className="h-px bg-border/40 my-2 mx-1" />
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
}

function FallbackDropdown({ link }: FallbackDropdownProps) {
  const { value: isOpen, setValue: setIsOpen } = useBoolean();
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
          className={cn('group', 'relative', 'flex items-center', 'px-3', 'py-2', 'font-medium', 'text-xs', 'text-foreground/80 hover:text-foreground', 'transition-all duration-200 ease-out')}
          aria-label={`Open ${link.label} menu`}
        >
          <span className="relative">
            {link.label}
            <span
              className={cn('absolute bottom-0 left-0', 'underline', 'bg-accent w-0', 'transition-all duration-300 ease-out', 'group-hover:w-full')}
              aria-hidden="true"
            />
          </span>
          <ChevronDown className={cn('ml-1', 'h-2.5 w-2.5 opacity-50')} />
        </button>
      </NavigationHoverCardTrigger>
      <NavigationHoverCardContent
        align="end"
        alignOffset={-16}
        className={cn(
          'w-64',
          'p-3',
          cn('relative', 'overflow-hidden', 'rounded-xl', 'border', 'border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl')
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
                <div className="space-y-4">
                  {link.sections.map((section, sectionIndex) => {
                    const isLastSection = sectionIndex === (link.sections?.length ?? 0) - 1;
                    return (
                      <div key={`${link.label}-${section.heading}`}>
                        <div className={cn('px-3', 'py-2', 'mb-1.5')}>
                          <p className={cn('text-[10px]', 'font-semibold', 'text-muted-foreground', 'opacity-70 uppercase', 'tracking-wide')}>
                            {section.heading}
                          </p>
                        </div>
                        <div className="space-y-1">
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
                                  className={cn('group/item block', 'rounded-lg', 'px-3', 'py-2.5', 'text-sm leading-none no-underline outline-none', 'hover:bg-accent/20', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', 'overflow-hidden')}
                                >
                                <div className="flex items-start gap-2">
                                  {ChildIcon && (
                                    <div className="flex-center h-8 w-8 shrink-0 rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground">
                                      <ChildIcon className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                      <div className="font-medium break-words word-break-break-word">{child.label}</div>
                                      {(() => {
                                        const category = getCategoryFromHref(child.href);
                                        return category ? (
                                          <UnifiedBadge 
                                            variant="category" 
                                            category={category} 
                                            href={null}
                                            className={cn('shrink-0', 'text-[10px]', 'px-1.5', 'py-0')} 
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
                              <div className="h-px bg-border/30 mx-2" />
                            )}
                          </div>
                          );
                        })}
                      </div>
                      {!isLastSection && (
                        <div className="h-px bg-border/40 my-2 mx-1" />
                      )}
                    </div>
                  );
                })}
                </div>
              ) : link.children ? (
                        <div className="space-y-1">
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
                            className={cn('group/item block', 'rounded-lg', 'px-3', 'py-2.5', 'text-sm leading-none no-underline outline-none', 'hover:bg-accent/5', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2')}
                          >
                          <div className="flex items-start gap-2">
                                  {ChildIcon && (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground">
                                      <ChildIcon className="h-4 w-4" />
                                    </div>
                                  )}
                            <div className="flex-1 min-w-0">
                              <div className={cn('flex items-center gap-2', 'mb-0.5')}>
                                <div className="font-medium">{child.label}</div>
                                {child.isNew && (
                                  <UnifiedBadge variant="new-badge" badgeVariant="default" className="shrink-0" />
                                )}
                              </div>
                              {child.description && (
                                      <p className={cn('text-muted-foreground text-xs', 'line-clamp-2 leading-snug')}>
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
 * Horizontal row of icon-only buttons for Search, Discord, Pinboard, and GitHub Stars
 */
function CommunityIconsRow({ 
  openPinboardDrawer, 
  isPinboardOpen,
  openCommandPalette,
  isCommandMenuOpen,
}: { 
  openPinboardDrawer: () => void;
  isPinboardOpen: boolean;
  openCommandPalette: () => void;
  isCommandMenuOpen: boolean;
}) {
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
    <div className={cn('border-t border-border/30', 'mt-4', 'pt-4')}>
      <div className={cn('flex-center', 'gap-3', 'px-3')}>
        {/* Search / Command Menu */}
        <motion.div
          whileHover={MICROINTERACTIONS.button.hover}
          whileTap={MICROINTERACTIONS.button.tap}
          transition={MICROINTERACTIONS.button.transition}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={openCommandPalette}
            className={cn(
              'h-6 w-6',
              'text-muted-foreground',
              'hover:text-foreground',
              isCommandMenuOpen && "text-accent bg-accent/10"
            )}
            aria-label={isCommandMenuOpen ? "Close command menu" : "Open command menu"}
            title="Search navigation (⌘K)"
          >
            <Search className={cn('h-4 w-4', isCommandMenuOpen && "fill-current")} />
          </Button>
        </motion.div>

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
            className={cn('h-6 w-6', 'text-muted-foreground', 'hover:text-foreground')}
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
            className={cn(
              'h-6 w-6',
              'text-muted-foreground',
              'hover:text-foreground',
              isPinboardOpen && "text-accent bg-accent/10"
            )}
            aria-label={isPinboardOpen ? "Close pinboard" : "Open pinboard"}
          >
            <Bookmark className={cn('h-4 w-4', isPinboardOpen && "fill-current")} />
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
            className={cn('h-6 w-6', 'text-muted-foreground', 'hover:text-foreground', 'relative')}
            aria-label={`Star us on GitHub${githubStars !== null ? ` - ${githubStars} stars` : ''}`}
          >
            <Github className="h-4 w-4" />
            {githubStars !== null && (
              <span className={cn('absolute -top-1 -right-1', 'text-[10px]', 'font-medium', 'text-accent')}>
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
  const { value: isMounted, setTrue: setIsMountedTrue } = useBoolean();
  const { openDrawer: openPinboardDrawer, isOpen: isPinboardOpen } = usePinboardDrawer();
  const { openPalette, isOpen: isCommandMenuOpen } = useCommandPalette();

  useEffect(() => {
    setIsMountedTrue();
  }, [setIsMountedTrue]);

  // Don't render until mounted (prevents hydration mismatch with Radix UI generated IDs)
  if (!isMounted) {
    return (
      <nav
        className="hidden xl:flex items-center gap-2 text-xs"
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
        className="hidden xl:flex items-center gap-2 text-xs"
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
                  className={cn('group', 'relative', 'flex items-center', 'px-3', 'py-2', 'font-medium', 'text-xs', 'text-foreground/80 hover:text-foreground', 'transition-all duration-200 ease-out')}
                  aria-label={`Open ${link.label} menu`}
                >
                  <span className="relative">
                    {link.label}
                    <span
                      className={cn('absolute bottom-0 left-0', 'underline', 'bg-accent w-0', 'transition-all duration-300 ease-out', 'group-hover:w-full')}
                      aria-hidden="true"
                    />
                  </span>
                  <ChevronDown className={cn('ml-1', 'h-2.5 w-2.5 opacity-50')} />
                </button>
              </NavigationHoverCardTrigger>
              <NavigationHoverCardContent
                align="end"
                alignOffset={-16}
                className={cn(
                  'w-[720px] xl:w-[800px]',
                  'p-4',
                  cn('relative', 'overflow-hidden', 'rounded-xl', 'border', 'border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl')
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
                <div className={cn('relative z-10 grid grid-cols-2', 'gap-4')}>
                  {/* Left Column: Post a Job CTA + Quick Links */}
                  <div className="space-y-3">
                    {/* Post a Job Hero Card */}
                    <motion.div
                      whileHover={MICROINTERACTIONS.card.hover}
                      whileTap={MICROINTERACTIONS.card.tap}
                      transition={MICROINTERACTIONS.card.transition}
                    >
                      <Link
                        href="/account/jobs/new"
                        className={cn('group/cta block', 'rounded-lg', 'border-2 border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5', 'p-4')}
                      >
                      <div className={cn('flex items-center gap-3', 'mb-2')}>
                        <div className="flex-center h-10 w-10 rounded-lg bg-accent/20 group-hover/cta:bg-accent/30 transition-colors">
                          <PlusCircle className="h-5 w-5 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">Post a Job</h3>
                          <p className="text-muted-foreground text-xs">Reach talented developers</p>
                        </div>
                      </div>
                      <p className={cn('text-muted-foreground text-xs', 'mb-4')}>
                        Featured listings available. Premium placement options.
                      </p>
                      <div className="flex items-center gap-1 text-xs-medium text-accent">
                        <span>Create Listing</span>
                        <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                      </div>
                    </Link>
                    </motion.div>

                    {/* Quick Links */}
                    <div className="space-y-3.5">
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
                              className="flex items-center gap-1 px-1 py-1.5 text-sm rounded-md group/item"
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
                    <div className="px-1 py-1 mb-2">
                      <p className={cn('text-[10px]', 'font-semibold', 'text-muted-foreground/70 uppercase', 'tracking-wide')}>
                        Featured Jobs
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-lg border border-border/50 bg-card/50 p-2 text-sm">
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
            <ConfigsDropdown key={link.label} link={link} />
          );
        }

        // Special handling for Discover, Resources, Contribute - Multi-column grid with descriptions
        if (
          (link.label === 'Discover' || link.label === 'Resources' || link.label === 'Contribute') &&
          link.sections
        ) {
          return (
            <DiscoverResourcesContributeDropdown key={link.label} link={link} />
          );
        }

        // Render hover dropdown for links with sections or children (fallback)
        if ((link.sections && link.sections.length > 0) || (link.children && link.children.length > 0)) {
          return (
            <FallbackDropdown key={link.label} link={link} />
          );
        }

        // Render regular link for items without children
        return (
          <NavLink key={link.label} href={link.href} isActive={isActive}>
            {link.isNew ? (
              <span className={cn('flex items-center gap-1.5')}>
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
            className={cn('group', 'relative', 'flex items-center', 'px-3', 'py-2', 'font-medium', 'text-xs', 'text-foreground/80 hover:text-foreground', 'transition-all duration-200 ease-out')}
            aria-label="Open additional navigation menu"
          >
            <span className="relative">
              More
              <span
                className={cn('absolute bottom-0 left-0', 'underline', 'bg-accent w-0', 'transition-all duration-300 ease-out', 'group-hover:w-full')}
                aria-hidden="true"
              />
            </span>
            <ChevronDown className={cn('ml-1', 'h-2.5 w-2.5 opacity-50')} />
          </button>
        </NavigationHoverCardTrigger>
        <NavigationHoverCardContent
          align="end"
          alignOffset={-16}
          className={cn(
            'w-80',
            'p-4',
            cn('relative', 'overflow-hidden', 'rounded-xl', 'border', 'border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl')
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
          <div className={cn('relative z-10', 'space-y-3')}>
            {SECONDARY_NAVIGATION.map((group, groupIndex) => {
              const isLastGroup = groupIndex === SECONDARY_NAVIGATION.length - 1;
              return (
                <div key={group.heading}>
                  <div className={cn('text-[10px]', 'font-semibold', 'text-muted-foreground', 'uppercase', 'tracking-wide', 'px-3', 'py-1.5', 'mb-2')}>
                    {group.heading}
                  </div>
                  <ul className="grid gap-0.5">
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
                          <div className="h-px bg-border/30 my-0.5 mx-2" />
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
                            <div className="flex items-start gap-2">
                              {LinkIcon && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground">
                                  <LinkIcon className="h-4 w-4" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className={cn('font-medium', 'mb-0.5', 'break-words')}>{link.label}</div>
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
                    <div className="h-px bg-border/40 my-4 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Horizontal icon row at bottom: Search, Discord, Pinboard, GitHub Stars */}
          <CommunityIconsRow 
            openPinboardDrawer={openPinboardDrawer}
            isPinboardOpen={isPinboardOpen}
            openCommandPalette={openPalette}
            isCommandMenuOpen={isCommandMenuOpen}
          />
        </NavigationHoverCardContent>
      </NavigationHoverCard>

    </nav>
  );
}

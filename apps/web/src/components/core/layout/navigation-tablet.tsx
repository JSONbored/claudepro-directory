/**
 * Tablet Navigation Component
 * Visible md:flex xl:hidden (768px-1279px)
 * Horizontal scroll with first 5 nav items
 * Uses Popover for dropdowns (click-to-open, better for touch devices)
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { PRIMARY_NAVIGATION } from '@heyclaude/web-runtime/config/navigation';
import { ChevronDown, PlusCircle } from '@heyclaude/web-runtime/icons';
import {
  ANIMATION_CONSTANTS,
  DIMENSIONS,
  POSITION_PATTERNS,
  STATE_PATTERNS,
  UI_CLASSES,
  PrefetchLink,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  UnifiedBadge,
  cn,
} from '@heyclaude/web-runtime/ui';
import { SPRING, MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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

/**
 * Get icon background gradient classes based on link href/category
 * Returns gradient background classes for icons instead of flat colors
 */
function getIconBackgroundClass(href: string): string {
  // Category-based gradients
  if (href.includes('/agents')) return 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-400 group-hover/item:from-purple-500/30 group-hover/item:to-purple-600/20';
  if (href.includes('/mcp')) return 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 text-cyan-400 group-hover/item:from-cyan-500/30 group-hover/item:to-cyan-600/20';
  if (href.includes('/commands')) return 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 group-hover/item:from-blue-500/30 group-hover/item:to-blue-600/20';
  if (href.includes('/rules') || href.includes('/claude.md')) return 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 group-hover/item:from-amber-500/30 group-hover/item:to-amber-600/20';
  if (href.includes('/hooks')) return 'bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-400 group-hover/item:from-green-500/30 group-hover/item:to-green-600/20';
  if (href.includes('/statuslines')) return 'bg-gradient-to-br from-teal-500/20 to-teal-600/10 text-teal-400 group-hover/item:from-teal-500/30 group-hover/item:to-teal-600/20';
  if (href.includes('/collections')) return 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 text-indigo-400 group-hover/item:from-indigo-500/30 group-hover/item:to-indigo-600/20';
  if (href.includes('/skills')) return 'bg-gradient-to-br from-pink-500/20 to-pink-600/10 text-pink-400 group-hover/item:from-pink-500/30 group-hover/item:to-pink-600/20';
  if (href.includes('/guides')) return 'bg-gradient-to-br from-violet-500/20 to-violet-600/10 text-violet-400 group-hover/item:from-violet-500/30 group-hover/item:to-violet-600/20';
  if (href.includes('/jobs')) return 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 group-hover/item:from-orange-500/30 group-hover/item:to-orange-600/20';
  if (href.includes('/changelog')) return 'bg-gradient-to-br from-slate-500/20 to-slate-600/10 text-slate-400 group-hover/item:from-slate-500/30 group-hover/item:to-slate-600/20';
  
  // Feature-based gradients
  if (href.includes('/search')) return 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 group-hover/item:from-blue-500/30 group-hover/item:to-blue-600/20';
  if (href.includes('/trending')) return 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 group-hover/item:from-orange-500/30 group-hover/item:to-orange-600/20';
  if (href.includes('/help')) return 'bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-400 group-hover/item:from-green-500/30 group-hover/item:to-green-600/20';
  if (href.includes('/tools')) return 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-400 group-hover/item:from-purple-500/30 group-hover/item:to-purple-600/20';
  if (href.includes('/submit')) return 'bg-gradient-to-br from-accent/20 to-accent/10 text-accent group-hover/item:from-accent/30 group-hover/item:to-accent/20';
  if (href.includes('/community')) return 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 group-hover/item:from-blue-500/30 group-hover/item:to-blue-600/20';
  if (href.includes('/companies')) return 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 text-indigo-400 group-hover/item:from-indigo-500/30 group-hover/item:to-indigo-600/20';
  if (href.includes('/partner')) return 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 group-hover/item:from-amber-500/30 group-hover/item:to-amber-600/20';
  if (href.includes('/consulting')) return 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 group-hover/item:from-orange-500/30 group-hover/item:to-orange-600/20';
  if (href.includes('/contact')) return 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 group-hover/item:from-blue-500/30 group-hover/item:to-blue-600/20';
  if (href.includes('/rss') || href.includes('/feeds')) return 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 group-hover/item:from-orange-500/30 group-hover/item:to-orange-600/20';
  if (href.includes('/llms.txt')) return 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-400 group-hover/item:from-purple-500/30 group-hover/item:to-purple-600/20';
  
  // Default gradient
  return 'bg-gradient-to-br from-muted/50 to-muted/30 text-muted-foreground group-hover/item:from-accent/20 group-hover/item:to-accent/10 group-hover/item:text-accent';
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

interface NavigationTabletProps {
  isActive: (path: string) => boolean;
  onMobileMenuOpen: () => void;
}

export function NavigationTablet({ isActive, onMobileMenuOpen }: NavigationTabletProps) {
  return (
    <motion.nav
      className="scrollbar-hide hidden snap-x snap-mandatory overflow-x-auto md:flex xl:hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="Tablet navigation"
    >
      <div className={`flex ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} px-2`}>
        {PRIMARY_NAVIGATION.slice(0, 5).map((link, linkIndex) => {
          // Special handling for Jobs dropdown with enhanced design
          if (link.label === 'Jobs' && link.sections) {
            return (
              <motion.div
                key={`nav-${linkIndex}-${link.label}`}
                className="snap-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: linkIndex * 0.05, duration: 0.3 }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`group relative flex items-center px-3 py-2 text-xs font-medium whitespace-nowrap ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} ${
                        isActive(link.href) ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
                      }`}
                      aria-label={`Open ${link.label} menu`}
                    >
                      <span className="relative">
                        {link.label}
                        <span
                          className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} ${
                            isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                      <ChevronDown className="ml-1 h-2.5 w-2.5 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className={cn(DIMENSIONS.NAV_DROPDOWN_TABLET, UI_CLASSES.PADDING_DEFAULT, 'overflow-hidden')} sideOffset={8}>
                    <div className="space-y-4">
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
                      <div className="space-y-1">
                        {link.sections[0]?.links.map((child, childIndex) => {
                          const ChildIcon = child.icon;
                              const iconBgClass = getIconBackgroundClass(child.href);
                          return (
                            <motion.div
                              key={`${link.label}-quick-${childIndex}-${child.label}`}
                              whileHover={MICROINTERACTIONS.button.hover}
                              whileTap={MICROINTERACTIONS.button.tap}
                              transition={MICROINTERACTIONS.button.transition}
                            >
                              <Link
                                href={child.href}
                                prefetch
                                className="group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none hover:bg-accent/5 focus:bg-accent/5 overflow-hidden"
                              >
                              <div className="flex items-start gap-3">
                                {ChildIcon && (
                                  <motion.div
                                    className={cn(
                                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                      iconBgClass
                                    )}
                                    whileHover={{ scale: MICROINTERACTIONS.iconButton.hover.scale }}
                                    whileTap={{ scale: MICROINTERACTIONS.iconButton.tap.scale }}
                                    transition={MICROINTERACTIONS.iconButton.transition}
                                  >
                                    <ChildIcon className="h-4 w-4" />
                                  </motion.div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{child.label}</div>
                                  {child.description && (
                                    <p className="text-muted-foreground line-clamp-1 text-xs leading-snug mt-0.5">
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
                    </div>
                  </PopoverContent>
                </Popover>
              </motion.div>
            );
          }

          // Special handling for Configs - Hero card layout (tablet optimized)
          if (link.label === 'Configs' && link.sections) {
            return (
              <motion.div
                key={`nav-${linkIndex}-${link.label}`}
                className="snap-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: linkIndex * 0.05, duration: 0.3 }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`group relative flex items-center px-3 py-2 text-xs font-medium whitespace-nowrap ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} ${
                        isActive(link.href) ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
                      }`}
                      aria-label={`Open ${link.label} menu`}
                    >
                      <span className="relative">
                        {link.label}
                        <span
                          className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} ${
                            isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                      <ChevronDown className="ml-1 h-2.5 w-2.5 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className={cn(DIMENSIONS.NAV_DROPDOWN_TABLET, UI_CLASSES.PADDING_DEFAULT, 'overflow-hidden')} sideOffset={8}>
                    <ul className={cn('grid', UI_CLASSES.SPACE_DEFAULT)}>
                      {/* Hero card - only show if href is not "#" */}
                      {link.href !== '#' && (
                        <li key={`${link.label}-hero`}>
                          <Link
                            href={link.href}
                            className="from-muted/50 to-muted flex w-full flex-col justify-end rounded-md bg-gradient-to-b p-4 no-underline outline-none select-none focus:shadow-md transition-colors hover:bg-muted/80"
                          >
                            <div className="mb-2 text-base font-semibold">{link.label}</div>
                            <p className="text-muted-foreground text-sm leading-tight">
                              {link.description || 'Browse all configuration types for Claude Code'}
                            </p>
                          </Link>
                        </li>
                      )}
                      {/* Sections */}
                      {link.sections.map((section, sectionIndex) => (
                        <li key={`${link.label}-section-${sectionIndex}-${section.heading}`}>
                          <div className="mb-2">
                            <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2">
                              {section.heading}
                            </p>
                          </div>
                          <div className={UI_CLASSES.SPACE_Y_TIGHT}>
                            {section.links.map((child, childIndex) => {
                              const ChildIcon = child.icon;
                              const iconBgClass = getIconBackgroundClass(child.href);
                              return (
                                <motion.div
                                  key={`${link.label}-section-${sectionIndex}-${section.heading}-${child.label}`}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    ...SPRING.smooth,
                                    delay: childIndex * 0.03,
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
                                      className={cn('group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none', STATE_PATTERNS.HOVER_BG_STRONG, STATE_PATTERNS.FOCUS_RING)}
                                    >
                                      <div className="flex items-start gap-3">
                                        {ChildIcon && (
                                          <motion.div
                                            className={cn(
                                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                              iconBgClass
                                            )}
                                            whileHover={MICROINTERACTIONS.iconButton.hover}
                                            whileTap={MICROINTERACTIONS.iconButton.tap}
                                            transition={MICROINTERACTIONS.iconButton.transition}
                                          >
                                            <ChildIcon className="h-4 w-4" />
                                          </motion.div>
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
                              );
                            })}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              </motion.div>
            );
          }

          // Special handling for Discover, Resources, Contribute - Enhanced with descriptions
          if (
            (link.label === 'Discover' || link.label === 'Resources' || link.label === 'Contribute') &&
            link.sections
          ) {
            const [isOpen, setIsOpen] = useState(false);
            const [animationKey, setAnimationKey] = useState(0);

            useEffect(() => {
              if (isOpen) {
                // Force remount of animated children when popover opens
                setAnimationKey((prev) => prev + 1);
              }
            }, [isOpen]);

            return (
              <motion.div
                key={`nav-${linkIndex}-${link.label}`}
                className="snap-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: linkIndex * 0.05, duration: 0.3 }}
              >
                <Popover onOpenChange={setIsOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`group relative flex items-center px-3 py-2 text-xs font-medium whitespace-nowrap ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} ${
                        isActive(link.href) ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
                      }`}
                      aria-label={`Open ${link.label} menu`}
                    >
                      <span className="relative">
                        {link.label}
                        <span
                          className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} ${
                            isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                      <ChevronDown className="ml-1 h-2.5 w-2.5 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className={cn(DIMENSIONS.NAV_DROPDOWN_TABLET, UI_CLASSES.PADDING_DEFAULT, 'overflow-hidden')} sideOffset={8}>
                    <AnimatePresence mode="wait">
                      {isOpen && (
                        <motion.ul
                          key={animationKey}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.1 }}
                          className={cn('grid', UI_CLASSES.SPACE_DEFAULT)}
                        >
                          {link.sections.map((section, sectionIndex) => (
                            <li key={`${link.label}-section-${sectionIndex}-${section.heading}`}>
                              <div className="mb-2">
                                <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2">
                                  {section.heading}
                                </p>
                              </div>
                              <div className={UI_CLASSES.SPACE_Y_TIGHT}>
                                {section.links.map((child, childIndex) => {
                                  const ChildIcon = child.icon;
                                  const iconBgClass = getIconBackgroundClass(child.href);
                                  return (
                                    <motion.div
                                      key={`${animationKey}-${link.label}-${section.heading}-${child.label}`}
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{
                                        ...SPRING.smooth,
                                        delay: childIndex * 0.03,
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
                                            className={cn('group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none', STATE_PATTERNS.HOVER_BG_STRONG, STATE_PATTERNS.FOCUS_RING)}
                                          >
                                            <div className="flex items-start gap-3">
                                              {ChildIcon && (
                                                <motion.div
                                                  className={cn(
                                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                                    iconBgClass
                                                  )}
                                                  whileHover={MICROINTERACTIONS.iconButton.hover}
                                                  whileTap={MICROINTERACTIONS.iconButton.tap}
                                                  transition={MICROINTERACTIONS.iconButton.transition}
                                                >
                                                  <ChildIcon className="h-4 w-4" />
                                                </motion.div>
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
                                    );
                                  })}
                              </div>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </PopoverContent>
                </Popover>
              </motion.div>
            );
          }

          // Check if link has dropdown content (sections or children)
          const hasDropdown = (link.sections && link.sections.length > 0) || (link.children && link.children.length > 0);

          // Render dropdown with Popover for touch-friendly interaction
          if (hasDropdown) {
            return (
              <motion.div
                key={`nav-${linkIndex}-${link.label}`}
                className="snap-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: linkIndex * 0.05, duration: 0.3 }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`group relative flex items-center px-3 py-2 text-xs font-medium whitespace-nowrap ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} ${
                        isActive(link.href) ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
                      }`}
                      aria-label={`Open ${link.label} menu`}
                    >
                      <span className="relative">
                        {link.label}
                        <span
                          className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} ${
                            isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                      <ChevronDown className="ml-1 h-2.5 w-2.5 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-56 p-3" sideOffset={8}>
                    {link.sections ? (
                      // Organized sections with headers
                      <div className={UI_CLASSES.SPACE_Y_COMFORTABLE}>
                        {link.sections.map((section, sectionIndex) => (
                          <div key={`${link.label}-section-${sectionIndex}-${section.heading}`}>
                            {/* Section header */}
                            <div className="px-2 py-1 mb-1.5">
                              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                                {section.heading}
                              </p>
                            </div>
                            {/* Section items */}
                            <div className={UI_CLASSES.SPACE_Y_TIGHT}>
                              {section.links.map((child, childIndex) => {
                                const ChildIcon = child.icon;
                                const iconBgClass = getIconBackgroundClass(child.href);
                                return (
                                  <motion.div
                                    key={`${link.label}-section-${sectionIndex}-${section.heading}-${child.label}`}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      duration: 0.2,
                                      delay: childIndex * 0.03,
                                      ease: [0.25, 0.1, 0.25, 1],
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
                                        className={cn('group/item block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none', STATE_PATTERNS.HOVER_BG_STRONG, STATE_PATTERNS.FOCUS_RING)}
                                      >
                                      <div className="flex items-start gap-3">
                                        {ChildIcon && (
                                          <div className={cn(
                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                            iconBgClass
                                          )}>
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
                                );
                              })}
                            </div>
                            {/* Separator between sections (except last) */}
                            {link.sections && sectionIndex < link.sections.length - 1 && (
                              <div className="mt-4 mb-0 h-px bg-border/50" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : link.children ? (
                      // Fallback: flat list for links without sections
                      <div className="space-y-0.5">
                        {link.children.map((child, childIndex) => {
                          const ChildIcon = child.icon;
                          return (
                            <motion.div
                              key={`${link.label}-child-${childIndex}-${child.label}`}
                              whileHover={MICROINTERACTIONS.button.hover}
                              whileTap={MICROINTERACTIONS.button.tap}
                              transition={MICROINTERACTIONS.button.transition}
                            >
                              <Link
                                href={child.href}
                                prefetch
                                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/5 group/item"
                              >
                              {ChildIcon && (
                                <motion.div
                                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg opacity-70 group-hover/item:opacity-100"
                                  whileHover={MICROINTERACTIONS.iconButton.hover}
                                  whileTap={MICROINTERACTIONS.iconButton.tap}
                                  transition={MICROINTERACTIONS.iconButton.transition}
                                >
                                  <ChildIcon className="h-4 w-4 text-muted-foreground group-hover/item:text-foreground transition-colors" />
                                </motion.div>
                              )}
                              <span className="flex-1">{child.label}</span>
                              {child.isNew && (
                                <UnifiedBadge variant="new-indicator" label={`New: ${child.label}`} />
                              )}
                            </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : null}
                  </PopoverContent>
                </Popover>
              </motion.div>
            );
          }

          // Render regular link for items without dropdowns
          return (
            <motion.div
              key={`nav-${linkIndex}-${link.label}`}
              className="snap-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: linkIndex * 0.05, duration: 0.3 }}
            >
              <NavLink
                href={link.href}
                isActive={isActive}
                className="px-3 py-2 text-xs whitespace-nowrap"
              >
                {link.isNew ? (
                  <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
                    {link.label}
                    <UnifiedBadge variant="new-indicator" label={`New: ${link.label}`} />
                  </span>
                ) : (
                  link.label
                )}
              </NavLink>
            </motion.div>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuOpen}
          className="text-xs whitespace-nowrap"
          aria-label="Open more navigation options"
        >
          More
        </Button>
      </div>
    </motion.nav>
  );
}

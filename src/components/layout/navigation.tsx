'use client';

/**
 * Main navigation with keyboard support (⌘K search, dropdowns) and responsive layout
 */

import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';
import { memo, useEffect, useState } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedButton } from '@/src/components/domain/unified-button';
import { SearchTrigger } from '@/src/components/features/search/search-trigger';
import { HeyClaudeLogo } from '@/src/components/layout/heyclaude-logo';
import { NavigationCommandMenu } from '@/src/components/layout/navigation-command-menu';
import { UserMenu } from '@/src/components/layout/user-menu';
import { Button } from '@/src/components/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/primitives/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/src/components/primitives/sheet';
import { PrefetchLink } from '@/src/components/shared/prefetch-link';
import { ACTION_LINKS, PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@/src/config/navigation';
import { ROUTES, SOCIAL_LINKS } from '@/src/lib/constants';
import {
  Briefcase,
  ChevronDown,
  DiscordIcon,
  Github,
  Handshake,
  Menu,
  Users,
} from '@/src/lib/icons';
import {
  ANIMATION_CONSTANTS,
  DIMENSIONS,
  POSITION_PATTERNS,
  RESPONSIVE_PATTERNS,
  UI_CLASSES,
} from '@/src/lib/ui-constants';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
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

const NavigationComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const pathname = usePathname();

  // Motion.dev scroll-based animations (Phase 1.5 - October 2025)
  const { scrollY } = useScroll();
  const backdropBlur = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(12px)']);
  const navOpacity = useTransform(scrollY, [0, 50], [0.95, 1]);
  // Adjusted logo scale to compensate for removed size prop (scales slightly more to match h-11/h-12 sizing)
  const logoScale = useTransform(scrollY, [0, 100], [1, 0.78]);

  // SHA-2088: Optimized scroll handler with threshold check and rAF debouncing
  // Only updates state when crossing 20px threshold (prevents 98% of unnecessary re-renders)
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      // Cancel pending frame to debounce
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Schedule update for next animation frame
      rafId = requestAnimationFrame(() => {
        const scrolled = window.scrollY > 20;
        // Only update state when crossing threshold (prevents re-render on every pixel)
        setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
      });
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <>
      {/* Skip to main content link for keyboard navigation (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className={`sr-only ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background`}
      >
        Skip to main content
      </a>

      {/* Global Command Menu (⌘K) */}
      <NavigationCommandMenu open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      <motion.header
        className={`${POSITION_PATTERNS.STICKY_TOP} z-50 w-full px-3 pt-1 pb-3 will-change-transform contain-layout`}
        style={{ opacity: navOpacity }}
      >
        <div className="container mx-auto">
          <motion.nav
            className={`rounded-2xl border border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW}`}
            style={{ backdropFilter: backdropBlur }}
            aria-label="Main navigation container"
          >
            <div className={RESPONSIVE_PATTERNS.PADDING_RESPONSIVE_SM}>
              <div
                className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} transition-[height] ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} will-change-auto ${
                  isScrolled ? 'h-11 md:h-12' : 'h-14 md:h-16'
                }`}
              >
                {/* Logo with Motion.dev scale animation - no size prop to avoid double animation */}
                <Link
                  href={ROUTES.HOME}
                  prefetch={true}
                  className={`${UI_CLASSES.FLEX_ITEMS_CENTER_FLEX_SHRINK_0} no-underline`}
                  aria-label="heyclaude - Go to homepage"
                >
                  <motion.div style={{ scale: logoScale }}>
                    <HeyClaudeLogo size="md" duration={0} />
                  </motion.div>
                </Link>

                {/* Desktop Navigation - ONLY show at xl: (1280px+) */}
                <nav
                  className={`hidden xl:flex ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-xs`}
                  aria-label="Primary navigation"
                >
                  {PRIMARY_NAVIGATION.map((link) => {
                    // Render dropdown for links with children (e.g., Configs)
                    if (link.children && link.children.length > 0) {
                      return (
                        <DropdownMenu key={link.label}>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={`group relative flex items-center px-2 py-1 font-medium ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_NAV} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
                              aria-label={`Open ${link.label} menu`}
                            >
                              <span className="relative">
                                {link.label}
                                <span
                                  className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} w-0 bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} group-hover:w-full`}
                                  aria-hidden="true"
                                />
                              </span>
                              <ChevronDown className="ml-1 h-2.5 w-2.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className={`${DIMENSIONS.DROPDOWN_LG} p-3`}
                          >
                            <div className={UI_CLASSES.GRID_COLS_2_GAP_2}>
                              {link.children.map((child) => {
                                const ChildIcon = child.icon;
                                return (
                                  <DropdownMenuItem key={child.href} asChild>
                                    <Link
                                      href={child.href}
                                      prefetch={true}
                                      className={UI_CLASSES.FLEX_INTERACTIVE_MENU_ITEM}
                                    >
                                      {ChildIcon && (
                                        <div
                                          className={`${UI_CLASSES.FLEX_ICON_WRAPPER_SM} bg-muted/50`}
                                        >
                                          <ChildIcon
                                            className={`${UI_CLASSES.ICON_XS} text-muted-foreground`}
                                            aria-hidden="true"
                                          />
                                        </div>
                                      )}
                                      <div
                                        className={
                                          UI_CLASSES.FLEX_MIN_W_0_FLEX_1_COL_ITEMS_START_GAP_0_5
                                        }
                                      >
                                        <div
                                          className={`${UI_CLASSES.FLEX_W_FULL_ITEMS_CENTER_GAP_1_5} truncate font-medium text-sm`}
                                        >
                                          {child.label}
                                          {child.isNew && (
                                            <UnifiedBadge
                                              variant="new-indicator"
                                              label={`New: ${child.label}`}
                                            />
                                          )}
                                        </div>
                                        {child.description && (
                                          <div className="line-clamp-1 text-[11px] text-muted-foreground">
                                            {child.description}
                                          </div>
                                        )}
                                      </div>
                                    </Link>
                                  </DropdownMenuItem>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    }

                    // Render regular link for items without children
                    return (
                      <NavLink
                        key={link.href}
                        href={link.href}
                        isActive={isActive}
                        onClick={() => setIsOpen(false)}
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
                    );
                  })}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={`group relative flex items-center px-2 py-1 font-medium ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_NAV} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
                        aria-label="Open additional navigation menu"
                      >
                        <span className="relative">
                          More
                          <span
                            className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} w-0 bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} group-hover:w-full`}
                            aria-hidden="true"
                          />
                        </span>
                        <ChevronDown className="ml-1 h-2.5 w-2.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={`${DIMENSIONS.DROPDOWN_XL} p-4`}>
                      {/* 2-column grid for quick links */}
                      <div className={`${UI_CLASSES.MB_2} ${UI_CLASSES.GRID_COLS_2_GAP_4}`}>
                        {SECONDARY_NAVIGATION.map((group) => (
                          <div key={group.heading} className="space-y-2">
                            <DropdownMenuLabel className="px-2 py-1 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                              {group.heading}
                            </DropdownMenuLabel>
                            <DropdownMenuGroup className="space-y-0.5">
                              {group.links.map((link) => {
                                const IconComponent = link.icon;
                                return (
                                  <DropdownMenuItem key={link.href} asChild>
                                    <Link
                                      href={link.href}
                                      prefetch={true}
                                      className={UI_CLASSES.FLEX_INTERACTIVE_MENU_ITEM}
                                    >
                                      {IconComponent && (
                                        <div
                                          className={`${UI_CLASSES.FLEX_ICON_WRAPPER_SM} bg-muted/50`}
                                        >
                                          <IconComponent
                                            className={`${UI_CLASSES.ICON_XS} text-muted-foreground`}
                                            aria-hidden="true"
                                          />
                                        </div>
                                      )}
                                      <div
                                        className={
                                          UI_CLASSES.FLEX_MIN_W_0_FLEX_1_COL_ITEMS_START_GAP_0_5
                                        }
                                      >
                                        <div className="w-full truncate font-medium text-sm">
                                          {link.label}
                                        </div>
                                        {link.description && (
                                          <div className="line-clamp-1 text-[11px] text-muted-foreground">
                                            {link.description}
                                          </div>
                                        )}
                                      </div>
                                    </Link>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuGroup>
                          </div>
                        ))}
                      </div>

                      {/* Footer Links - Community, Partner Program, Consulting */}
                      <DropdownMenuSeparator className="my-2.5" />
                      <div className={UI_CLASSES.GRID_COLS_3_GAP_2}>
                        <Link
                          href="/community"
                          prefetch={true}
                          className={UI_CLASSES.FLEX_INTERACTIVE_NAV_ITEM}
                        >
                          <Users
                            className={`${UI_CLASSES.ICON_SM} text-muted-foreground transition-colors group-hover:text-accent`}
                            aria-hidden="true"
                          />
                          <div className="font-medium text-foreground text-sm transition-colors group-hover:text-accent">
                            Community
                          </div>
                        </Link>
                        <Link
                          href="/partner"
                          prefetch={true}
                          className={UI_CLASSES.FLEX_INTERACTIVE_NAV_ITEM}
                        >
                          <Handshake
                            className={`${UI_CLASSES.ICON_SM} text-muted-foreground transition-colors group-hover:text-accent`}
                            aria-hidden="true"
                          />
                          <div className="font-medium text-foreground text-sm transition-colors group-hover:text-accent">
                            Partner Program
                          </div>
                        </Link>
                        <Link
                          href="/consulting"
                          prefetch={true}
                          className={UI_CLASSES.FLEX_INTERACTIVE_NAV_ITEM}
                        >
                          <Briefcase
                            className={`${UI_CLASSES.ICON_SM} text-muted-foreground transition-colors group-hover:text-accent`}
                            aria-hidden="true"
                          />
                          <div className="font-medium text-foreground text-sm transition-colors group-hover:text-accent">
                            Consulting
                          </div>
                        </Link>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Search Icon - Right of More */}
                  <SearchTrigger
                    variant="ghost"
                    size="sm"
                    showShortcut={false}
                    onClick={() => setCommandPaletteOpen(true)}
                    className={UI_CLASSES.TEXT_XS}
                  />
                </nav>

                {/* Tablet Navigation (768px-1279px) - Horizontal scroll with Motion.dev */}
                <motion.nav
                  className="scrollbar-hide hidden snap-x snap-mandatory overflow-x-auto md:flex xl:hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  aria-label="Tablet navigation"
                >
                  <div className={`flex ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} px-2`}>
                    {PRIMARY_NAVIGATION.slice(0, 5).map((link, index) => (
                      <motion.div
                        key={link.href}
                        className="snap-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <NavLink
                          href={link.href}
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className="whitespace-nowrap px-3 py-2 text-xs"
                        >
                          {link.label}
                        </NavLink>
                      </motion.div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(true)}
                      className="whitespace-nowrap text-xs"
                      aria-label="Open more navigation options"
                    >
                      More
                    </Button>
                  </div>
                </motion.nav>

                {/* Right Side Actions */}
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
                  {/* Action Links - Create Button */}
                  {ACTION_LINKS.map((link) => {
                    const ActionIcon = link.icon;
                    return (
                      <Button
                        key={link.href}
                        asChild
                        variant="outline"
                        size="sm"
                        className={`hidden md:flex ${UI_CLASSES.TEXT_XS}`}
                      >
                        <Link href={link.href} prefetch={true}>
                          {ActionIcon && <ActionIcon className={UI_CLASSES.ICON_XS_LEADING} />}
                          {link.label}
                        </Link>
                      </Button>
                    );
                  })}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('https://discord.gg/Ax3Py4YDrq', '_blank')}
                    className={`hidden md:flex ${UI_CLASSES.TEXT_NAV} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                    aria-label="Join our Discord community"
                  >
                    <DiscordIcon className={UI_CLASSES.ICON_XS} />
                  </Button>

                  <UnifiedButton
                    variant="github-stars"
                    className={`hidden md:flex ${UI_CLASSES.TEXT_XS}`}
                  />

                  <UserMenu className={'hidden md:flex'} />

                  {/* Mobile Menu - Show ONLY below md: (< 768px) */}
                  <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        aria-label="Open mobile menu"
                      >
                        <Menu className={UI_CLASSES.ICON_LG} />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className={`w-full border-border/50 border-l sm:${DIMENSIONS.SIDEBAR_LG}`}
                    >
                      {/* Swipe-to-close indicator */}
                      <motion.div
                        className="${POSITION_PATTERNS.ABSOLUTE_TOP_HALF} -translate-x-1/2 left-1/2 h-1 w-12 cursor-grab rounded-full bg-border/50 active:cursor-grabbing"
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 50 }}
                        onDragEnd={(_, info) => {
                          if (info.offset.y > 100) setIsOpen(false);
                        }}
                        whileDrag={{ scale: 1.2, backgroundColor: 'hsl(var(--accent))' }}
                        transition={ANIMATION_CONSTANTS.SPRING_DEFAULT}
                      />

                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                      <div className={'flex h-full flex-col pt-8'}>
                        {/* Header with Motion.dev fade-in */}
                        <motion.div
                          className={'flex items-center px-1 pb-8'}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <HeyClaudeLogo size="lg" duration={1.2} />
                        </motion.div>

                        {/* Main Navigation - Staggered animations */}
                        <div className={'flex-1 overflow-y-auto'}>
                          <nav className={'space-y-3 px-3'} aria-label="Primary navigation">
                            {/* Action Links (Submit Config) - Prominent position */}
                            {ACTION_LINKS.map((link, index) => {
                              const ActionIcon = link.icon;
                              return (
                                <motion.div
                                  key={link.href}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.15 + index * 0.05 }}
                                >
                                  <Link
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex w-full items-center justify-center rounded-xl border-2 border-accent bg-accent px-5 py-4 font-semibold text-accent-foreground text-base ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:bg-accent/90 active:scale-[0.97]`}
                                  >
                                    {ActionIcon && (
                                      <ActionIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                                    )}
                                    <span>{link.label}</span>
                                  </Link>
                                </motion.div>
                              );
                            })}

                            {/* Primary Navigation */}
                            {PRIMARY_NAVIGATION.map((link, index) => {
                              const IconComponent = link.icon;
                              const adjustedIndex = ACTION_LINKS.length + index;
                              return (
                                <motion.div
                                  key={link.href}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.15 + adjustedIndex * 0.05 }}
                                >
                                  <NavLink
                                    href={link.href}
                                    isActive={isActive}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex w-full items-center rounded-xl border border-border bg-card px-5 py-4 font-medium text-base ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:border-accent/50 hover:bg-accent/10 active:scale-[0.97]`}
                                  >
                                    {IconComponent && (
                                      <IconComponent className="mr-3 h-5 w-5 flex-shrink-0" />
                                    )}
                                    <span>{link.label}</span>
                                    {link.isNew && (
                                      <UnifiedBadge
                                        variant="new-indicator"
                                        label={`New: ${link.label}`}
                                        className="ml-auto"
                                      />
                                    )}
                                  </NavLink>
                                </motion.div>
                              );
                            })}

                            {/* Secondary Navigation */}
                            <nav
                              className={'mt-4 border-border/30 border-t pt-6'}
                              aria-label="Secondary navigation"
                            >
                              <div className="space-y-3">
                                {SECONDARY_NAVIGATION.flatMap((group) => group.links).map(
                                  (link, index) => {
                                    const IconComponent = link.icon;
                                    return (
                                      <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                          delay: 0.15 + (PRIMARY_NAVIGATION.length + index) * 0.05,
                                        }}
                                      >
                                        <NavLink
                                          href={link.href}
                                          isActive={isActive}
                                          onClick={() => setIsOpen(false)}
                                          className={`flex w-full items-center rounded-xl border border-border/40 bg-card/50 px-5 py-4 font-medium text-muted-foreground text-sm ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:border-accent/30 hover:bg-accent/5 hover:text-foreground active:scale-[0.98]`}
                                        >
                                          {IconComponent && (
                                            <IconComponent className="mr-3 h-4 w-4 flex-shrink-0" />
                                          )}
                                          <span>{link.label}</span>
                                        </NavLink>
                                      </motion.div>
                                    );
                                  }
                                )}
                              </div>
                            </nav>
                          </nav>
                        </div>

                        {/* Footer with spring animation on tap */}
                        <motion.div
                          className={'border-border/30 border-t pt-6 pb-6'}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className={`${UI_CLASSES.GRID_COLS_3_GAP_4} px-4`}>
                            {[
                              {
                                icon: DiscordIcon,
                                onClick: () =>
                                  window.open('https://discord.gg/Ax3Py4YDrq', '_blank'),
                                label: 'Discord',
                                color: 'discord',
                              },
                              {
                                icon: Github,
                                onClick: () => window.open(SOCIAL_LINKS.github, '_blank'),
                                label: 'GitHub',
                                color: 'accent',
                              },
                            ].map((item) => (
                              <motion.div
                                key={item.label}
                                whileTap={{ scale: 0.9 }}
                                transition={ANIMATION_CONSTANTS.SPRING_DEFAULT}
                              >
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className={`h-20 w-full rounded-2xl border-border/40 bg-card hover:bg-${item.color}/10 hover:border-${item.color}/30 ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
                                  onClick={item.onClick}
                                  aria-label={item.label}
                                >
                                  <item.icon className={UI_CLASSES.ICON_XL} />
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </motion.nav>
        </div>
      </motion.header>
    </>
  );
};

export const Navigation = memo(NavigationComponent);
Navigation.displayName = 'Navigation';

'use client';

/**
 * Navigation Component
 *
 * Main navigation component with comprehensive accessibility support.
 *
 * **Keyboard Navigation:**
 * - ⌘K/Ctrl+K: Open global search/command menu
 * - Tab: Navigate through interactive elements
 * - Arrow keys: Navigate dropdown menu items (Radix UI)
 * - Enter/Space: Activate links and buttons
 * - Escape: Close dropdowns and mobile menu
 *
 * **Accessibility Features (WCAG 2.1 AA):**
 * - aria-current="page" on active navigation items
 * - aria-label on navigation landmarks and icon buttons
 * - aria-hidden="true" on decorative elements
 * - Semantic HTML (<nav>, <header>)
 * - Focus management with Radix UI primitives
 * - Screen reader optimized
 *
 * **Architecture:**
 * - Configuration-driven (src/config/navigation.ts)
 * - DRY principle: Single source of truth for nav items
 * - Responsive: Desktop dropdown, mobile sheet
 * - Performance: rAF scroll debouncing, passive listeners
 *
 * @see docs/NAVIGATION_KEYBOARD_GUIDE.md for full accessibility documentation
 * @see Linear Issues: SHA-3026, SHA-3027, SHA-3028, SHA-3029, SHA-3030, SHA-3031, SHA-3032
 */

import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';
import { useEffect, useState } from 'react';
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
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@/src/config/navigation';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { ROUTES } from '@/src/lib/constants/routes';
import { ChevronDown, DiscordIcon, Github, Menu } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
    className: `group relative px-2 py-1 text-sm font-medium transition-colors duration-200 no-underline ${
      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
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
          className={`absolute bottom-0 left-0 h-[2px] bg-accent transition-all duration-300 ${
            active ? 'w-full' : 'w-0 group-hover:w-full'
          }`}
          aria-hidden="true"
        />
      </span>
    </PrefetchLink>
  );
};

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const pathname = usePathname();

  // Motion.dev scroll-based animations (Phase 1.5 - October 2025)
  const { scrollY } = useScroll();
  const backdropBlur = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(12px)']);
  const navOpacity = useTransform(scrollY, [0, 50], [0.95, 1]);
  const logoScale = useTransform(scrollY, [0, 100], [1, 0.9]);

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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background transition-all duration-200"
      >
        Skip to main content
      </a>

      {/* Global Command Menu (⌘K) */}
      <NavigationCommandMenu open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      <motion.header
        className="sticky top-0 z-50 w-full pt-1 px-3 pb-3 will-change-transform contain-layout"
        style={{ opacity: navOpacity }}
      >
        <div className="container mx-auto">
          <motion.nav
            className={
              'rounded-2xl border border-border/50 bg-card/95 shadow-xl transition-colors duration-300'
            }
            style={{ backdropFilter: backdropBlur }}
            aria-label="Main navigation container"
          >
            <div className="px-3 md:px-4">
              <div
                className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} transition-[height] duration-300 will-change-auto ${
                  isScrolled ? 'h-11 md:h-12' : 'h-14 md:h-16'
                }`}
              >
                {/* Logo with Motion.dev scale animation */}
                <Link
                  href={ROUTES.HOME}
                  prefetch={true}
                  className="flex items-center flex-shrink-0 no-underline"
                  aria-label="heyclaude - Go to homepage"
                >
                  <motion.div style={{ scale: logoScale }}>
                    <HeyClaudeLogo size={isScrolled ? 'sm' : 'md'} duration={1.2} />
                  </motion.div>
                </Link>

                {/* Desktop Navigation - ONLY show at xl: (1280px+) */}
                <nav
                  className={`hidden xl:flex ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} lg:gap-4 text-sm lg:text-base`}
                  aria-label="Primary navigation"
                >
                  {PRIMARY_NAVIGATION.map((link) => (
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
                  ))}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                        aria-label="Open additional navigation menu"
                      >
                        More
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[800px] p-4">
                      <div className="grid gap-6 md:grid-cols-3">
                        {SECONDARY_NAVIGATION.map((group) => (
                          <div key={group.heading} className="space-y-3">
                            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                              {group.heading}
                            </DropdownMenuLabel>
                            <DropdownMenuGroup className="space-y-1">
                              {group.links.map((link) => {
                                const IconComponent = link.icon;
                                return (
                                  <DropdownMenuItem key={link.href} asChild>
                                    <Link
                                      href={link.href}
                                      prefetch={true}
                                      className={
                                        'flex items-start gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-accent/10 transition-colors duration-200 group'
                                      }
                                    >
                                      {IconComponent && (
                                        <div
                                          className={
                                            'flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-accent/20 transition-colors flex-shrink-0'
                                          }
                                        >
                                          <IconComponent
                                            className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors"
                                            aria-hidden="true"
                                          />
                                        </div>
                                      )}
                                      <div className={'flex flex-col items-start gap-1 flex-1'}>
                                        <div className="font-medium group-hover:text-accent transition-colors">
                                          {link.label}
                                        </div>
                                        {link.description && (
                                          <div className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors line-clamp-2">
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

                      {/* Submit Config - Standalone CTA */}
                      <DropdownMenuSeparator className="my-4" />
                      <DropdownMenuItem asChild>
                        <Link
                          href={ROUTES.SUBMIT}
                          prefetch={true}
                          className={
                            'flex items-start gap-3 w-full cursor-pointer p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors duration-200 group'
                          }
                        >
                          <div
                            className={
                              'flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors flex-shrink-0'
                            }
                          >
                            <svg
                              className="h-5 w-5 text-accent"
                              aria-hidden="true"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </div>
                          <div className={'flex flex-col items-start gap-1 flex-1'}>
                            <div className="font-medium text-accent">Submit Config</div>
                            <div className="text-xs text-muted-foreground">
                              Share your configuration with the community
                            </div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </nav>

                {/* Tablet Navigation (768px-1279px) - Horizontal scroll with Motion.dev */}
                <motion.nav
                  className="hidden md:flex xl:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory"
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
                          className="text-xs px-3 py-2 whitespace-nowrap"
                        >
                          {link.label}
                        </NavLink>
                      </motion.div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(true)}
                      className="text-xs whitespace-nowrap"
                      aria-label="Open more navigation options"
                    >
                      More
                    </Button>
                  </div>
                </motion.nav>

                {/* Right Side Actions */}
                <div className={'flex items-center gap-2 md:gap-3'}>
                  {/* Global Search Trigger - Opens Command Palette */}
                  <div className={'hidden md:block'}>
                    <SearchTrigger
                      variant="ghost"
                      size="sm"
                      showShortcut={!isScrolled}
                      onClick={() => setCommandPaletteOpen(true)}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('https://discord.gg/Ax3Py4YDrq', '_blank')}
                    className={`hidden md:flex ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                    aria-label="Join our Discord community"
                  >
                    <DiscordIcon className="h-4 w-4" />
                  </Button>

                  <UnifiedButton variant="github-stars" className={'hidden md:flex'} />

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
                        <Menu className="h-6 w-6" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-full sm:w-[380px] border-l border-border/50"
                    >
                      {/* Swipe-to-close indicator */}
                      <motion.div
                        className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-border/50 rounded-full cursor-grab active:cursor-grabbing"
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 50 }}
                        onDragEnd={(_, info) => {
                          if (info.offset.y > 100) setIsOpen(false);
                        }}
                        whileDrag={{ scale: 1.2, backgroundColor: 'hsl(var(--accent))' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      />

                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                      <div className={'flex flex-col h-full pt-8'}>
                        {/* Header with Motion.dev fade-in */}
                        <motion.div
                          className={'flex items-center pb-8 px-1'}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <HeyClaudeLogo size="lg" duration={1.2} />
                        </motion.div>

                        {/* Main Navigation - Staggered animations */}
                        <div className={'flex-1 overflow-y-auto'}>
                          <nav className={'space-y-3 px-3'} aria-label="Primary navigation">
                            {PRIMARY_NAVIGATION.map((link, index) => {
                              const IconComponent = link.icon;
                              return (
                                <motion.div
                                  key={link.href}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.15 + index * 0.05 }}
                                >
                                  <NavLink
                                    href={link.href}
                                    isActive={isActive}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center w-full px-5 py-4 text-base font-medium rounded-xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200"
                                  >
                                    {IconComponent && (
                                      <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
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
                              className={'pt-6 mt-4 border-t border-border/30'}
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
                                          className="flex items-center w-full px-5 py-4 text-sm font-medium text-muted-foreground rounded-xl bg-card/50 border border-border/40 hover:bg-accent/5 hover:text-foreground hover:border-accent/30 transition-all duration-200 active:scale-[0.98]"
                                        >
                                          {IconComponent && (
                                            <IconComponent className="h-4 w-4 mr-3 flex-shrink-0" />
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
                          className={'border-t border-border/30 pt-6 pb-6'}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="grid grid-cols-3 gap-4 px-4">
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
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                              >
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className={`w-full h-20 rounded-2xl border-border/40 bg-card hover:bg-${item.color}/10 hover:border-${item.color}/30 transition-all duration-200`}
                                  onClick={item.onClick}
                                  aria-label={item.label}
                                >
                                  <item.icon className="h-8 w-8" />
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

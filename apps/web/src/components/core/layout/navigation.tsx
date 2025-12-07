'use client';

/**
 * Main navigation with keyboard support (⌘K search, dropdowns) and responsive layout
 * Split into separate components for better tree-shaking and maintainability:
 * - NavigationDesktop: Full dropdowns (xl: breakpoint)
 * - NavigationTablet: Horizontal scroll (md-xl)
 * - NavigationMobile: Sheet drawer (<md)
 */

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { usePinboard } from '@heyclaude/web-runtime/hooks';
import { Bookmark, DiscordIcon } from '@heyclaude/web-runtime/icons';
import {
  ANIMATION_CONSTANTS,
  POSITION_PATTERNS,
  UI_CLASSES,
  Button,
} from '@heyclaude/web-runtime/ui';
import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useState } from 'react';

import { GitHubStarsButton } from '@/src/components/core/buttons/external/github-stars-button';
import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';
import { NavigationCommandMenu } from '@/src/components/core/layout/navigation-command-menu';
import { NavigationDesktop } from '@/src/components/core/layout/navigation-desktop';
import { NavigationMobile } from '@/src/components/core/layout/navigation-mobile';
import { NavigationTablet } from '@/src/components/core/layout/navigation-tablet';
import { SubMenuBar } from '@/src/components/core/layout/sub-menu-bar';
import { UserMenu } from '@/src/components/core/layout/user-menu';
import { useCommandPalette } from '@/src/components/features/navigation/command-palette-provider';
import { usePinboardDrawer } from '@/src/components/features/navigation/pinboard-drawer-provider';

// NavigationProps removed - component accepts no props

const NavigationComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isOpen: commandPaletteOpen, openPalette, closePalette } = useCommandPalette();
  const pathname = usePathname();
  const { pinnedItems, isLoaded: pinboardLoaded } = usePinboard();
  const { openDrawer: openPinboardDrawer } = usePinboardDrawer();
  const pinCount = pinboardLoaded ? pinnedItems.length : 0;

  // Motion.dev scroll-based animations (Phase 1.5 - October 2025)
  const { scrollY } = useScroll();
  const backdropBlur = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(12px)']);
  const navOpacity = useTransform(scrollY, [0, 50], [0.95, 1]);

  // SHA-2088: Optimized scroll handler with threshold check and rAF debouncing
  // Only updates state when crossing 20px threshold (prevents 98% of unnecessary re-renders)
  useEffect(() => {
    let rafId: null | number = null;

    const handleScroll = () => {
      // Cancel pending frame to debounce
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Schedule update for next animation frame
      rafId = requestAnimationFrame(() => {
        const scrolled = window.scrollY > 20;
        // Only update state when crossing threshold (prevents re-render on every pixel)
        setIsScrolled((prev) => (prev === scrolled ? prev : scrolled));
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
        className={`sr-only ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} focus:bg-accent focus:text-accent-foreground focus:ring-accent focus:ring-offset-background focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:rounded-md focus:px-4 focus:py-2 focus:shadow-lg focus:ring-2 focus:ring-offset-2 focus:outline-none`}
      >
        Skip to main content
      </a>

      {/* Global Command Menu (⌘K) */}
      <NavigationCommandMenu
        open={commandPaletteOpen}
        onOpenChange={(open) => {
          if (open) {
            openPalette();
          } else {
            closePalette();
          }
        }}
      />

      <motion.header
        className={`${POSITION_PATTERNS.STICKY_TOP} z-50 w-full will-change-transform contain-layout`}
        style={{ opacity: navOpacity }}
      >
        <div className="container mx-auto">
          <motion.nav
            className={`bg-background/95 border-b border-border/50 backdrop-blur-xl ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW}`}
            style={{ backdropFilter: backdropBlur }}
            aria-label="Main navigation container"
          >
            <div className="px-4 py-3">
              <div
                className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} transition-[height] ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} will-change-auto ${
                  isScrolled ? 'h-11 md:h-12' : 'h-14 md:h-16'
                }`}
              >
                {/* Logo */}
                <Link
                  href={ROUTES.HOME}
                  prefetch
                  className={`${UI_CLASSES.FLEX_ITEMS_CENTER_FLEX_SHRINK_0} no-underline`}
                  aria-label="heyclaude - Go to homepage"
                >
                  <HeyClaudeLogo size="md" duration={0} />
                </Link>

                {/* Desktop Navigation - ONLY show at xl: (1280px+) */}
                <NavigationDesktop
                  isActive={isActive}
                  onCommandPaletteOpen={openPalette}
                />

                {/* Tablet Navigation (768px-1279px) - Horizontal scroll with Motion.dev */}
                <NavigationTablet isActive={isActive} onMobileMenuOpen={() => setIsOpen(true)} />

                {/* Right Side Actions */}
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openPinboardDrawer}
                    className={`relative ${UI_CLASSES.BUTTON_GHOST_ICON}`}
                    aria-label={
                      pinCount > 0
                        ? `Open pinboard (${pinCount} saved)`
                        : 'Open pinboard (save items for later)'
                    }
                  >
                    <Bookmark className={UI_CLASSES.ICON_XS} />
                    {pinCount > 0 && (
                      <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                        {pinCount > 99 ? '99+' : pinCount}
                      </span>
                    )}
                  </Button>
                  {/* Discord Button - Icon only, normal opacity */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('https://discord.gg/Ax3Py4YDrq', '_blank')}
                    className="hidden md:flex transition-colors"
                    style={{ color: '#F6F8F4' }}
                    aria-label="Join our Discord community"
                  >
                    <DiscordIcon className={UI_CLASSES.ICON_XS} />
                  </Button>

                  {/* GitHub Stars Button - Icon + star count, normal opacity */}
                  <GitHubStarsButton
                    variant="ghost"
                    size="sm"
                    className="hidden md:flex transition-colors [&_span]:text-xs [&_span]:font-normal [color:#F6F8F4] [&_svg]:[color:#F6F8F4] [&_span]:[color:#F6F8F4]"
                  />

                  <UserMenu className="hidden md:flex" />

                  {/* Mobile Menu - Show ONLY below md: (< 768px) */}
                  <NavigationMobile isActive={isActive} isOpen={isOpen} onOpenChange={setIsOpen} />
                </div>
              </div>
            </div>
          </motion.nav>
          {/* Sub-menu bar - breadcrumbs and explore dropdown */}
          <SubMenuBar />
        </div>
      </motion.header>
    </>
  );
};

export const Navigation = memo(NavigationComponent);
Navigation.displayName = 'Navigation';

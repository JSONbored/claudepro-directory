'use client';

/**
 * Main navigation with keyboard support (⌘K search, dropdowns) and responsive layout
 * Split into separate components for better tree-shaking and maintainability:
 * - NavigationDesktop: Full dropdowns (xl: breakpoint)
 * - NavigationTablet: Horizontal scroll (md-xl)
 * - NavigationMobile: Sheet drawer (<md)
 */

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  ANIMATION_CONSTANTS,
  POSITION_PATTERNS,
  UI_CLASSES,
} from '@heyclaude/web-runtime/ui';
import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useState } from 'react';

import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';
// NavigationCommandMenu is now rendered in CommandMenuWrapper (root-layout-wrapper.tsx)
// Removed import to prevent duplicate rendering
import { NavigationDesktop } from '@/src/components/core/layout/navigation-desktop';
import { NavigationMobile } from '@/src/components/core/layout/navigation-mobile';
import { NavigationTablet } from '@/src/components/core/layout/navigation-tablet';
import { SubMenuBar } from '@/src/components/core/layout/sub-menu-bar';
import { UserMenu } from '@/src/components/core/layout/user-menu';

// NavigationProps removed - component accepts no props

const NavigationComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

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

      {/* CRITICAL FIX: NavigationCommandMenu is now rendered in CommandMenuWrapper (root-layout-wrapper.tsx) */}
      {/* Removed duplicate render to prevent conflicts */}
      {/* The CommandMenuWrapper handles the command palette state management */}

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

                {/* Tablet Navigation (768px-1279px) - Horizontal scroll with Motion.dev */}
                <NavigationTablet isActive={isActive} onMobileMenuOpen={() => setIsOpen(true)} />

                {/* Right Side Actions - Desktop Navigation + User Menu */}
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
                  {/* Desktop Navigation - ONLY show at xl: (1280px+) */}
                  <NavigationDesktop
                    isActive={isActive}
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

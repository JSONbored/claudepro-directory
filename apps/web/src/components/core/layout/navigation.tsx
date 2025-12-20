'use client';

/**
 * Main navigation with keyboard support (⌘K search, dropdowns) and responsive layout
 * Split into separate components for better tree-shaking and maintainability:
 * - NavigationDesktop: Full dropdowns (xl: breakpoint)
 * - NavigationTablet: Horizontal scroll (md-xl)
 * - NavigationMobile: Sheet drawer (<md)
 */

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion, useScroll } from 'motion/react';
import { useTransform } from '@heyclaude/web-runtime/hooks/motion';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';
// NavigationCommandMenu is now rendered in CommandMenuWrapper (root-layout-wrapper.tsx)
// Removed import to prevent duplicate rendering
import { NavigationMobile } from '@/src/components/core/layout/navigation-mobile';
import { SubMenuBar } from '@/src/components/core/layout/sub-menu-bar';
import { UserMenu } from '@/src/components/core/layout/user-menu';
import { lazy, Suspense } from 'react';

// OPTIMIZATION: Dynamic imports for large navigation components (1177 + 1091 lines) - only loads when needed
const NavigationDesktop = lazy(() =>
  import('@/src/components/core/layout/navigation-desktop').then((mod) => ({
    default: mod.NavigationDesktop,
  }))
);
const NavigationTablet = lazy(() =>
  import('@/src/components/core/layout/navigation-tablet').then((mod) => ({
    default: mod.NavigationTablet,
  }))
);

// NavigationProps removed - component accepts no props

const NavigationComponent = () => {
  const { value: isOpen, setTrue: setIsOpenTrue, setValue: setIsOpenValue } = useBoolean();
  // Removed unused isScrolled - scroll detection handled by Motion.dev animations
  const pathname = usePathname();

  // Motion.dev scroll-based animations (Phase 1.5 - October 2025)
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Disable blur effect for reduced motion (opacity-only is fine)
  const backdropBlur = shouldReduceMotion
    ? useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(0px)'])
    : useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(12px)']);
  const navOpacity = useTransform(scrollY, [0, 50], [0.95, 1]);

  // Scroll detection handled by Motion.dev animations (backdropBlur, navOpacity)
  // No need for isScrolled state - scroll-based styling handled via useTransform

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <>
      {/* Skip to main content link for keyboard navigation (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className="focus:bg-accent focus:text-accent-foreground focus:ring-accent focus:ring-offset-background sr-only transition-all duration-200 ease-out focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:rounded-md focus:px-4 focus:py-2 focus:shadow-lg focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        Skip to main content
      </a>

      {/* CRITICAL FIX: NavigationCommandMenu is now rendered in CommandMenuWrapper (root-layout-wrapper.tsx) */}
      {/* Removed duplicate render to prevent conflicts */}
      {/* The CommandMenuWrapper handles the command palette state management */}

      <motion.header
        className="sticky top-0 z-50 w-full will-change-transform contain-layout"
        style={{ opacity: navOpacity }}
      >
        <div className="container mx-auto">
          <motion.nav
            className="bg-background/95 border-border/50 border-b backdrop-blur-xl transition-all duration-300 ease-out"
            style={{ backdropFilter: backdropBlur }}
            aria-label="Main navigation container"
          >
            <div className="px-4 py-2">
              <div className="flex h-14 items-center justify-between transition-[height] transition-all duration-300 ease-out will-change-auto md:h-16">
                {/* Logo */}
                <Link
                  href={ROUTES.HOME}
                  prefetch
                  className={`flex flex-shrink-0 items-center no-underline`}
                  aria-label="heyclaude - Go to homepage"
                >
                  <HeyClaudeLogo size="md" duration={0} />
                </Link>

                {/* Tablet Navigation (768px-1279px) - Horizontal scroll with Motion.dev */}
                <Suspense fallback={<div className="h-10 w-32" />}>
                  <NavigationTablet isActive={isActive} onMobileMenuOpen={setIsOpenTrue} />
                </Suspense>

                {/* Right Side Actions - Desktop Navigation + User Menu */}
                <div className={cn('flex items-center gap-1', 'gap-1.5')}>
                  {/* Desktop Navigation - ONLY show at xl: (1280px+) */}
                  <Suspense fallback={<div className="h-10 w-32" />}>
                    <NavigationDesktop isActive={isActive} />
                  </Suspense>

                  <UserMenu className={`hidden md:flex`} />

                  {/* Mobile Menu - Show ONLY below md: (< 768px) */}
                  <NavigationMobile
                    isActive={isActive}
                    isOpen={isOpen}
                    onOpenChange={setIsOpenValue}
                  />
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

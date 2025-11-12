'use client';

/**
 * Main navigation with keyboard support (⌘K search, dropdowns) and responsive layout
 * Split into separate components for better tree-shaking and maintainability:
 * - NavigationDesktop: Full dropdowns (xl: breakpoint)
 * - NavigationTablet: Horizontal scroll (md-xl)
 * - NavigationMobile: Sheet drawer (<md)
 */

import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo, useEffect, useState } from 'react';
import { GitHubStarsButton } from '@/src/components/core/buttons/external/github-stars-button';
import { HeyClaudeLogo } from '@/src/components/core/layout/heyclaude-logo';
import { NavigationCommandMenu } from '@/src/components/core/layout/navigation-command-menu';
import { NavigationDesktop } from '@/src/components/core/layout/navigation-desktop';
import { NavigationMobile } from '@/src/components/core/layout/navigation-mobile';
import { NavigationTablet } from '@/src/components/core/layout/navigation-tablet';
import { UserMenu } from '@/src/components/core/layout/user-menu';
import { Button } from '@/src/components/primitives/ui/button';
import { ACTION_LINKS } from '@/src/config/navigation';
import { ROUTES } from '@/src/lib/constants';
import { DiscordIcon } from '@/src/lib/icons';
import {
  ANIMATION_CONSTANTS,
  POSITION_PATTERNS,
  RESPONSIVE_PATTERNS,
  UI_CLASSES,
} from '@/src/lib/ui-constants';

interface NavigationProps {
  /** Hide Create button when FloatingActionBar is enabled */
  hideCreateButton?: boolean;
}

const NavigationComponent = ({ hideCreateButton = false }: NavigationProps = {}) => {
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
                <NavigationDesktop
                  isActive={isActive}
                  onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
                />

                {/* Tablet Navigation (768px-1279px) - Horizontal scroll with Motion.dev */}
                <NavigationTablet isActive={isActive} onMobileMenuOpen={() => setIsOpen(true)} />

                {/* Right Side Actions */}
                <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
                  {/* Action Links - Create Button (hidden when FloatingActionBar is enabled) */}
                  {!hideCreateButton &&
                    ACTION_LINKS.map((link) => {
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

                  <GitHubStarsButton className={`hidden md:flex ${UI_CLASSES.TEXT_XS}`} />

                  <UserMenu className={'hidden md:flex'} />

                  {/* Mobile Menu - Show ONLY below md: (< 768px) */}
                  <NavigationMobile isActive={isActive} isOpen={isOpen} onOpenChange={setIsOpen} />
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

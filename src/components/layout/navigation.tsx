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

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedButton } from '@/src/components/domain/unified-button';
import { SearchTrigger } from '@/src/components/features/search/search-trigger';
import { NavigationCommandMenu } from '@/src/components/layout/navigation-command-menu';
import { ThemeToggle } from '@/src/components/layout/theme-toggle';
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
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@/src/config/navigation';
import { useSearchShortcut } from '@/src/hooks/use-search-shortcut';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';
import { ROUTES } from '@/src/lib/constants/routes';
import { ChevronDown, DiscordIcon, Github, LogoIcon, Menu } from '@/src/lib/icons';
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

  // Only spread onClick if it's defined to avoid exactOptionalPropertyTypes issues
  const linkProps = {
    href,
    className: `group relative px-2 py-1 text-sm font-medium transition-colors duration-200 ${
      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
    } ${className}`,
    // WCAG 2.1 AA: Indicate current page for screen readers
    ...(active && { 'aria-current': 'page' as const }),
    ...(onClick && { onClick }),
  };

  return (
    <Link {...linkProps}>
      {children}
      {/* Animated underline */}
      <span
        className={`absolute bottom-0 left-0 h-[2px] bg-accent transition-all duration-300 ${
          active ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
        aria-hidden="true"
      />
    </Link>
  );
};

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Global search keyboard shortcut (⌘K / Ctrl+K)
  useSearchShortcut();

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
      <NavigationCommandMenu />

      <header
        className={
          'sticky top-0 z-50 w-full pt-1 px-3 pb-3 transition-all duration-300 will-change-transform contain-layout'
        }
      >
        <div className="container mx-auto">
          <nav
            className={`rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
              isScrolled ? 'shadow-xl' : ''
            }`}
            aria-label="Main navigation container"
          >
            <div className="px-3 md:px-4">
              <div
                className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} transition-all duration-300 will-change-transform ${
                  isScrolled ? 'h-11 md:h-12' : 'h-14 md:h-16'
                }`}
              >
                {/* Logo */}
                <Link
                  href={ROUTES.HOME}
                  className={'flex items-center gap-2 min-w-0 flex-shrink'}
                  aria-label="Claude Pro Directory - Go to homepage"
                >
                  <LogoIcon
                    className={`transition-all duration-300 flex-shrink-0 hidden xl:block ${
                      isScrolled ? 'h-6 w-6' : 'h-8 w-8'
                    }`}
                  />
                  <span
                    className={`font-medium text-foreground transition-all duration-300 hidden xl:inline ${
                      isScrolled ? 'text-base' : 'text-lg'
                    }`}
                  >
                    {APP_CONFIG.domain}
                  </span>
                </Link>

                {/* Desktop Navigation */}
                <nav
                  className={`hidden ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} md:gap-3 lg:gap-4 text-sm lg:text-base md:flex`}
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
                    <DropdownMenuContent align="end" className="w-[600px] p-4">
                      <div className="grid gap-6 md:grid-cols-2">
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
                                      className={
                                        'flex items-start gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-accent/10 hover:scale-[1.02] transition-all duration-200 group'
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
                                          <div className="text-xs text-muted-foreground line-clamp-2">
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
                          className={
                            'flex items-start gap-3 w-full cursor-pointer p-3 rounded-lg bg-accent/5 hover:bg-accent/10 hover:scale-[1.01] transition-all duration-200 group'
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

                {/* Right Side Actions */}
                <div className={'flex items-center gap-2 md:gap-3'}>
                  {/* Global Search Trigger */}
                  <div className={'hidden md:block'}>
                    <SearchTrigger
                      variant="ghost"
                      size="sm"
                      showShortcut={!isScrolled}
                      onClick={() => {
                        // Trigger same behavior as ⌘K shortcut
                        const searchInput = document.querySelector<HTMLInputElement>(
                          'input[name="search"], input[type="search"]'
                        );
                        searchInput?.focus();
                        searchInput?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        });
                      }}
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

                  <ThemeToggle />

                  {/* Mobile Menu */}
                  <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden"
                        aria-label="Open mobile menu"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-[300px] sm:w-[380px] border-l border-border/50"
                    >
                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                      <div className={'flex flex-col h-full'}>
                        {/* Header */}
                        <div className={'flex items-center gap-3 pt-6 pb-8 px-1'}>
                          <LogoIcon className="h-8 w-8 flex-shrink-0" />
                          <span className={'font-semibold text-lg text-foreground'}>
                            {APP_CONFIG.domain}
                          </span>
                        </div>

                        {/* Main Navigation */}
                        <div className={'flex-1 overflow-y-auto'}>
                          <nav className={'space-y-4 px-3'} aria-label="Primary navigation">
                            <div className="space-y-3">
                              {PRIMARY_NAVIGATION.map((link) => (
                                <NavLink
                                  key={link.href}
                                  href={link.href}
                                  isActive={isActive}
                                  onClick={() => setIsOpen(false)}
                                  className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                                >
                                  {link.isNew ? (
                                    <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                                      {link.label}
                                      <UnifiedBadge
                                        variant="new-indicator"
                                        label={`New: ${link.label}`}
                                      />
                                    </span>
                                  ) : (
                                    link.label
                                  )}
                                </NavLink>
                              ))}
                            </div>

                            {/* Secondary Navigation */}
                            <nav
                              className={'pt-6 mt-4 border-t border-border/30'}
                              aria-label="Secondary navigation"
                            >
                              <div className="space-y-3">
                                {SECONDARY_NAVIGATION.flatMap((group) => group.links).map(
                                  (link) => (
                                    <NavLink
                                      key={link.href}
                                      href={link.href}
                                      isActive={isActive}
                                      onClick={() => setIsOpen(false)}
                                      className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                                    >
                                      {link.label}
                                    </NavLink>
                                  )
                                )}
                                <NavLink
                                  href={ROUTES.SUBMIT}
                                  isActive={isActive}
                                  onClick={() => setIsOpen(false)}
                                  className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                                >
                                  Submit Config
                                </NavLink>
                              </div>
                            </nav>
                          </nav>
                        </div>

                        {/* Footer Actions */}
                        <div className={'border-t border-border/30 pt-6 pb-6 px-6'}>
                          <div
                            className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2} gap-6`}
                          >
                            <Button
                              variant="outline"
                              size="lg"
                              className={
                                'w-16 h-16 rounded-2xl border-border/40 bg-card hover:bg-discord/10 hover:border-discord/30 transition-all duration-200 active:scale-[0.95]'
                              }
                              onClick={() => window.open('https://discord.gg/Ax3Py4YDrq', '_blank')}
                              aria-label="Join our Discord community"
                            >
                              <DiscordIcon className="h-7 w-7 text-discord" />
                            </Button>

                            <Button
                              variant="outline"
                              size="lg"
                              className={
                                'w-16 h-16 rounded-2xl border-border/40 bg-card hover:bg-accent/10 hover:border-accent/30 transition-all duration-200 active:scale-[0.95]'
                              }
                              onClick={() => window.open(SOCIAL_LINKS.github, '_blank')}
                              aria-label="View source code on GitHub"
                            >
                              <Github className="h-7 w-7" />
                            </Button>

                            <div
                              className={
                                'w-16 h-16 flex items-center justify-center rounded-2xl border border-border/40 bg-card'
                              }
                            >
                              <ThemeToggle />
                            </div>
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};

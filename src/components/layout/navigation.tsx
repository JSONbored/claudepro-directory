'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { lazy, Suspense, useEffect, useState } from 'react';
import { SearchTrigger } from '@/src/components/features/search/search-trigger';
import { ThemeToggle } from '@/src/components/layout/theme-toggle';
import { UserMenu } from '@/src/components/layout/user-menu';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';

// Lazy load Sheet components (mobile menu) - not needed on initial load
const Sheet = lazy(() =>
  import('@/src/components/ui/sheet').then((mod) => ({ default: mod.Sheet }))
);
const SheetContent = lazy(() =>
  import('@/src/components/ui/sheet').then((mod) => ({ default: mod.SheetContent }))
);
const SheetTitle = lazy(() =>
  import('@/src/components/ui/sheet').then((mod) => ({ default: mod.SheetTitle }))
);
const SheetTrigger = lazy(() =>
  import('@/src/components/ui/sheet').then((mod) => ({ default: mod.SheetTrigger }))
);

import { ChevronDown, ExternalLink, Github, Menu } from 'lucide-react';
import { useSearchShortcut } from '@/src/hooks/use-search-shortcut';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';
import { DiscordIcon, LogoIcon } from '@/src/lib/custom-icons';
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
    className: `${active ? `ring-2 ring-accent/30 ${UI_CLASSES.BG_ACCENT_10} border-accent/50 text-primary before:content-[''] before:absolute before:left-1/2 before:-translate-x-1/2 before:bottom-[-2px] before:w-1 before:h-1 before:rounded-full before:bg-accent` : 'text-muted-foreground hover:text-foreground'} transition-colors ${UI_CLASSES.DURATION_200} relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full ${className}`,
    ...(onClick && { onClick }),
  };

  return <Link {...linkProps}>{children}</Link>;
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
    <header
      className={`sticky ${UI_CLASSES.TOP_0} ${UI_CLASSES.Z_50} ${UI_CLASSES.W_FULL} ${UI_CLASSES.BORDER_B} border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all ${UI_CLASSES.DURATION_300} will-change-transform contain-layout ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="container mx-auto px-4">
        <div
          className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} transition-all ${UI_CLASSES.DURATION_300} will-change-transform ${
            isScrolled ? 'h-12' : 'h-16'
          }`}
        >
          {/* Logo */}
          <Link
            href="/"
            className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2 ${UI_CLASSES.MIN_W_0} flex-shrink`}
            aria-label="Claude Pro Directory - Go to homepage"
          >
            <LogoIcon
              className={`transition-all ${UI_CLASSES.DURATION_300} flex-shrink-0 ${UI_CLASSES.HIDDEN} xl:${UI_CLASSES.BLOCK} ${
                isScrolled ? 'h-6 w-6' : 'h-8 w-8'
              }`}
            />
            <span
              className={`font-medium text-foreground transition-all ${UI_CLASSES.DURATION_300} ${UI_CLASSES.HIDDEN} xl:inline ${
                isScrolled ? 'text-base' : 'text-lg'
              }`}
            >
              {APP_CONFIG.domain}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-3 lg:gap-4 text-sm lg:text-base">
            <NavLink href="/agents" isActive={isActive} onClick={() => setIsOpen(false)}>
              Agents
            </NavLink>
            <NavLink href="/commands" isActive={isActive} onClick={() => setIsOpen(false)}>
              Commands
            </NavLink>
            <NavLink href="/hooks" isActive={isActive} onClick={() => setIsOpen(false)}>
              Hooks
            </NavLink>
            <NavLink href="/mcp" isActive={isActive} onClick={() => setIsOpen(false)}>
              MCP
            </NavLink>
            <NavLink href="/rules" isActive={isActive} onClick={() => setIsOpen(false)}>
              Rules
            </NavLink>
            <NavLink href="/statuslines" isActive={isActive} onClick={() => setIsOpen(false)}>
              Statuslines
            </NavLink>
            <NavLink href="/collections" isActive={isActive} onClick={() => setIsOpen(false)}>
              Collections
            </NavLink>
            <NavLink href="/guides" isActive={isActive} onClick={() => setIsOpen(false)}>
              Guides
            </NavLink>

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
              <DropdownMenuContent align="end" className="w-52 md:w-56">
                <DropdownMenuItem>
                  <Link
                    href="/trending"
                    className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.W_FULL}`}
                  >
                    <div>Trending</div>
                    <div className={UI_CLASSES.TEXT_XS_MUTED}>Popular configurations</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link
                    href="/changelog"
                    className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.W_FULL}`}
                  >
                    <div>Changelog</div>
                    <div className={UI_CLASSES.TEXT_XS_MUTED}>Latest updates & releases</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link
                    href="/jobs"
                    className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.W_FULL}`}
                  >
                    <div>Jobs</div>
                    <div className={UI_CLASSES.TEXT_XS_MUTED}>Find opportunities</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link
                    href="/community"
                    className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.W_FULL}`}
                  >
                    <div>Community</div>
                    <div className={UI_CLASSES.TEXT_XS_MUTED}>Join the Claude community</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link
                    href="/partner"
                    className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.W_FULL}`}
                  >
                    <div>Partner</div>
                    <div className={UI_CLASSES.TEXT_XS_MUTED}>Post job listings & more</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link
                    href="/submit"
                    className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.W_FULL}`}
                  >
                    <div>Submit Config</div>
                    <div className={UI_CLASSES.TEXT_XS_MUTED}>Share your configurations</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link
                    href="/tools/config-recommender"
                    className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.W_FULL}`}
                  >
                    <div>Config Recommender</div>
                    <div className={UI_CLASSES.TEXT_XS_MUTED}>Find your perfect setup</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link
                    href="/companies"
                    className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.W_FULL}`}
                  >
                    <div>Companies</div>
                    <div className={UI_CLASSES.TEXT_XS_MUTED}>Companies building with Claude</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link
                    href="/board"
                    className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.W_FULL}`}
                  >
                    <div>Board</div>
                    <div className={UI_CLASSES.TEXT_XS_MUTED}>Discussion board</div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Side Actions */}
          <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-2 md:gap-3`}>
            {/* Global Search Trigger */}
            <div className={`${UI_CLASSES.HIDDEN} lg:${UI_CLASSES.BLOCK}`}>
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
              className={`${UI_CLASSES.HIDDEN_SM_FLEX} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
              aria-label="Join our Discord community"
            >
              <DiscordIcon className="h-4 w-4 xl:mr-2" />
              <span className={`${UI_CLASSES.HIDDEN} xl:inline`}>Discord</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(SOCIAL_LINKS.github, '_blank')}
              className={`${UI_CLASSES.HIDDEN_SM_FLEX} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
              aria-label="View source code on GitHub"
            >
              <Github className="h-4 w-4 xl:mr-2" />
              <span className={`${UI_CLASSES.HIDDEN} xl:inline`}>GitHub</span>
            </Button>

            {/* User Menu - Authentication-aware dropdown */}
            <UserMenu />

            <ThemeToggle />

            <Badge
              variant="outline"
              className={`${UI_CLASSES.HIDDEN} 2xl:flex border-accent/20 ${UI_CLASSES.BG_ACCENT_5} text-accent`}
            >
              <ExternalLink className="h-3 w-3 mr-1 text-accent" />
              Open Source
            </Badge>

            {/* Mobile Menu - Lazy loaded with Suspense for better performance */}
            <Suspense
              fallback={
                <Button
                  variant="ghost"
                  size="default"
                  className="lg:hidden min-h-[44px] min-w-[44px]"
                  aria-label="Loading menu"
                >
                  <Menu className="h-5 w-5 opacity-50" />
                </Button>
              }
            >
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="default"
                    className="lg:hidden min-h-[44px] min-w-[44px]"
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
                  <div className={`${UI_CLASSES.FLEX_COL} h-full`}>
                    {/* Header */}
                    <div
                      className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} gap-3 ${UI_CLASSES.PT_6} ${UI_CLASSES.PB_8} px-1`}
                    >
                      <LogoIcon className="h-8 w-8 flex-shrink-0" />
                      <span className={`font-semibold ${UI_CLASSES.TEXT_LG} text-foreground`}>
                        {APP_CONFIG.domain}
                      </span>
                    </div>

                    {/* Main Navigation */}
                    <div className={`flex-1 ${UI_CLASSES.OVERFLOW_Y_AUTO}`}>
                      <nav className={`${UI_CLASSES.SPACE_Y_4} ${UI_CLASSES.PX_3}`}>
                        <div className={UI_CLASSES.SPACE_Y_3}>
                          <NavLink
                            href="/agents"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                          >
                            Agents
                          </NavLink>

                          <NavLink
                            href="/commands"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                          >
                            Commands
                          </NavLink>

                          <NavLink
                            href="/hooks"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                          >
                            Hooks
                          </NavLink>

                          <NavLink
                            href="/mcp"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                          >
                            MCP
                          </NavLink>

                          <NavLink
                            href="/rules"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                          >
                            Rules
                          </NavLink>

                          <NavLink
                            href="/statuslines"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                          >
                            Statuslines
                          </NavLink>

                          <NavLink
                            href="/collections"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                          >
                            Collections
                          </NavLink>

                          <NavLink
                            href="/guides"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                          >
                            Guides
                          </NavLink>
                        </div>

                        {/* Secondary Navigation */}
                        <div
                          className={`${UI_CLASSES.PT_6} mt-4 ${UI_CLASSES.BORDER_T} border-border/30`}
                        >
                          <div className={UI_CLASSES.SPACE_Y_3}>
                            <NavLink
                              href="/trending"
                              isActive={isActive}
                              onClick={() => setIsOpen(false)}
                              className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                            >
                              Trending
                            </NavLink>

                            <NavLink
                              href="/changelog"
                              isActive={isActive}
                              onClick={() => setIsOpen(false)}
                              className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                            >
                              Changelog
                            </NavLink>

                            <NavLink
                              href="/jobs"
                              isActive={isActive}
                              onClick={() => setIsOpen(false)}
                              className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                            >
                              Jobs
                            </NavLink>

                            <NavLink
                              href="/community"
                              isActive={isActive}
                              onClick={() => setIsOpen(false)}
                              className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                            >
                              Community
                            </NavLink>

                            <NavLink
                              href="/partner"
                              isActive={isActive}
                              onClick={() => setIsOpen(false)}
                              className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                            >
                              Partner
                            </NavLink>

                            <NavLink
                              href="/submit"
                              isActive={isActive}
                              onClick={() => setIsOpen(false)}
                              className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                            >
                              Submit Config
                            </NavLink>

                            <NavLink
                              href="/tools/config-recommender"
                              isActive={isActive}
                              onClick={() => setIsOpen(false)}
                              className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                            >
                              Config Recommender
                            </NavLink>

                            <NavLink
                              href="/companies"
                              isActive={isActive}
                              onClick={() => setIsOpen(false)}
                              className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                            >
                              Companies
                            </NavLink>

                            <NavLink
                              href="/board"
                              isActive={isActive}
                              onClick={() => setIsOpen(false)}
                              className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                            >
                              Board
                            </NavLink>
                          </div>
                        </div>
                      </nav>
                    </div>

                    {/* Footer Actions */}
                    <div
                      className={`${UI_CLASSES.BORDER_T} border-border/30 ${UI_CLASSES.PT_6} pb-6 ${UI_CLASSES.PX_6}`}
                    >
                      <div
                        className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} gap-6`}
                      >
                        <Button
                          variant="outline"
                          size="lg"
                          className={`w-16 h-16 ${UI_CLASSES.ROUNDED_2XL} border-border/40 ${UI_CLASSES.BG_CARD} hover:bg-discord/10 hover:border-discord/30 transition-all duration-200 active:scale-[0.95]`}
                          onClick={() => window.open('https://discord.gg/Ax3Py4YDrq', '_blank')}
                          aria-label="Join our Discord community"
                        >
                          <DiscordIcon className="h-7 w-7 text-discord" />
                        </Button>

                        <Button
                          variant="outline"
                          size="lg"
                          className={`w-16 h-16 ${UI_CLASSES.ROUNDED_2XL} border-border/40 ${UI_CLASSES.BG_CARD} ${UI_CLASSES.HOVER_BG_ACCENT_10} hover:border-accent/30 transition-all duration-200 active:scale-[0.95]`}
                          onClick={() => window.open(SOCIAL_LINKS.github, '_blank')}
                          aria-label="View source code on GitHub"
                        >
                          <Github className="h-7 w-7" />
                        </Button>

                        <div
                          className={`w-16 h-16 ${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} ${UI_CLASSES.ROUNDED_2XL} border border-border/40 ${UI_CLASSES.BG_CARD}`}
                        >
                          <ThemeToggle />
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
};

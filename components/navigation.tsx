'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { APP_CONFIG, SOCIAL_LINKS } from '@/lib/constants';
import { ChevronDown, DiscordIcon, ExternalLink, Github, LogoIcon, Menu } from '@/lib/icons';
import { UI_CLASSES } from '@/lib/ui-constants';

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
    className: `${active ? `ring-2 ring-accent/30 ${UI_CLASSES.BG_ACCENT_10} border-accent/50 text-primary` : ''} ${className}`,
    ...(onClick && { onClick }),
  };

  return <Link {...linkProps}>{children}</Link>;
};

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

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
          <nav
            className={`${UI_CLASSES.HIDDEN} md:${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} space-x-6`}
          >
            <NavLink href="/rules" isActive={isActive} onClick={() => setIsOpen(false)}>
              Rules
            </NavLink>
            <NavLink href="/mcp" isActive={isActive} onClick={() => setIsOpen(false)}>
              MCP
            </NavLink>
            <NavLink href="/agents" isActive={isActive} onClick={() => setIsOpen(false)}>
              Agents
            </NavLink>
            <NavLink href="/commands" isActive={isActive} onClick={() => setIsOpen(false)}>
              Commands
            </NavLink>
            <NavLink href="/hooks" isActive={isActive} onClick={() => setIsOpen(false)}>
              Hooks
            </NavLink>
            <NavLink href="/jobs" isActive={isActive} onClick={() => setIsOpen(false)}>
              Jobs
            </NavLink>
            <NavLink href="/trending" isActive={isActive} onClick={() => setIsOpen(false)}>
              Trending
            </NavLink>
            <NavLink href="/guides" isActive={isActive} onClick={() => setIsOpen(false)}>
              Guides
            </NavLink>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-accent"
                  aria-label="Open additional navigation menu"
                >
                  More
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
                    href="/submit"
                    className={`${UI_CLASSES.FLEX_COL} ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.SPACE_Y_1} ${UI_CLASSES.W_FULL}`}
                  >
                    <div>Submit Config</div>
                    <div className={UI_CLASSES.TEXT_XS_MUTED}>Share your configurations</div>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Side Actions */}
          <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} space-x-3`}>
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

            <ThemeToggle />

            <Badge
              variant="outline"
              className={`${UI_CLASSES.HIDDEN} 2xl:flex border-accent/20 ${UI_CLASSES.BG_ACCENT_5} text-accent`}
            >
              <ExternalLink className="h-3 w-3 mr-1 text-accent" />
              Open Source
            </Badge>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`md:${UI_CLASSES.HIDDEN}`}
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
                          href="/rules"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                        >
                          Rules
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
                          href="/jobs"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                        >
                          Jobs
                        </NavLink>

                        <NavLink
                          href="/trending"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className={UI_CLASSES.BUTTON_PRIMARY_LARGE}
                        >
                          Trending
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
                            href="/community"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                          >
                            Community
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
                            href="/partner"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className={UI_CLASSES.BUTTON_SECONDARY_MEDIUM}
                          >
                            Partner
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
          </div>
        </div>
      </div>
    </header>
  );
};

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
    className: `${active ? 'ring-2 ring-accent/30 bg-accent/10 border-accent/50 text-primary' : ''} ${className}`,
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
      className={`sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 will-change-transform contain-layout ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="container mx-auto px-4">
        <div
          className={`flex items-center justify-between transition-all duration-300 will-change-transform ${
            isScrolled ? 'h-12' : 'h-16'
          }`}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 min-w-0 flex-shrink"
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
          <nav className="hidden md:flex items-center space-x-6">
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
                  <Link href="/community" className="flex flex-col items-start space-y-1 w-full">
                    <div>Community</div>
                    <div className="text-xs text-muted-foreground">Join the Claude community</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link href="/submit" className="flex flex-col items-start space-y-1 w-full">
                    <div>Submit Config</div>
                    <div className="text-xs text-muted-foreground">Share your configurations</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <Link href="/partner" className="flex flex-col items-start space-y-1 w-full">
                    <div>Partner</div>
                    <div className="text-xs text-muted-foreground">Post job listings & more</div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://discord.gg/Ax3Py4YDrq', '_blank')}
              className="hidden sm:flex hover:bg-accent/10 hover:text-accent"
              aria-label="Join our Discord community"
            >
              <DiscordIcon className="h-4 w-4 xl:mr-2" />
              <span className="hidden xl:inline">Discord</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(SOCIAL_LINKS.github, '_blank')}
              className="hidden sm:flex hover:bg-accent/10 hover:text-accent"
              aria-label="View source code on GitHub"
            >
              <Github className="h-4 w-4 xl:mr-2" />
              <span className="hidden xl:inline">GitHub</span>
            </Button>

            <ThemeToggle />

            <Badge
              variant="outline"
              className="hidden 2xl:flex border-accent/20 bg-accent/5 text-accent"
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
                  className="md:hidden"
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
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center gap-3 pt-6 pb-8 px-1">
                    <LogoIcon className="h-8 w-8 flex-shrink-0" />
                    <span className="font-semibold text-lg text-foreground">
                      {APP_CONFIG.domain}
                    </span>
                  </div>

                  {/* Main Navigation */}
                  <div className="flex-1 overflow-y-auto">
                    <nav className="space-y-4 px-3">
                      <div className="space-y-3">
                        <NavLink
                          href="/rules"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200"
                        >
                          Rules
                        </NavLink>

                        <NavLink
                          href="/mcp"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200"
                        >
                          MCP
                        </NavLink>

                        <NavLink
                          href="/agents"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200"
                        >
                          Agents
                        </NavLink>

                        <NavLink
                          href="/commands"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200"
                        >
                          Commands
                        </NavLink>

                        <NavLink
                          href="/hooks"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200"
                        >
                          Hooks
                        </NavLink>

                        <NavLink
                          href="/jobs"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200"
                        >
                          Jobs
                        </NavLink>

                        <NavLink
                          href="/trending"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200"
                        >
                          Trending
                        </NavLink>

                        <NavLink
                          href="/guides"
                          isActive={isActive}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200"
                        >
                          Guides
                        </NavLink>
                      </div>

                      {/* Secondary Navigation */}
                      <div className="pt-6 mt-4 border-t border-border/30">
                        <div className="space-y-3">
                          <NavLink
                            href="/community"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center w-full px-6 py-5 text-base font-medium text-muted-foreground rounded-xl bg-card/50 border border-border/40 hover:bg-accent/5 hover:text-foreground hover:border-accent/30 transition-all duration-200 active:scale-[0.98]"
                          >
                            Community
                          </NavLink>

                          <NavLink
                            href="/submit"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center w-full px-6 py-5 text-base font-medium text-muted-foreground rounded-xl bg-card/50 border border-border/40 hover:bg-accent/5 hover:text-foreground hover:border-accent/30 transition-all duration-200 active:scale-[0.98]"
                          >
                            Submit Config
                          </NavLink>

                          <NavLink
                            href="/partner"
                            isActive={isActive}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center w-full px-6 py-5 text-base font-medium text-muted-foreground rounded-xl bg-card/50 border border-border/40 hover:bg-accent/5 hover:text-foreground hover:border-accent/30 transition-all duration-200 active:scale-[0.98]"
                          >
                            Partner
                          </NavLink>
                        </div>
                      </div>
                    </nav>
                  </div>

                  {/* Footer Actions */}
                  <div className="border-t border-border/30 pt-6 pb-6 px-6">
                    <div className="flex items-center justify-center gap-6">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-16 h-16 rounded-2xl border-border/40 bg-card hover:bg-discord/10 hover:border-discord/30 transition-all duration-200 active:scale-[0.95]"
                        onClick={() => window.open('https://discord.gg/Ax3Py4YDrq', '_blank')}
                        aria-label="Join our Discord community"
                      >
                        <DiscordIcon className="h-7 w-7 text-discord" />
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="w-16 h-16 rounded-2xl border-border/40 bg-card hover:bg-accent/10 hover:border-accent/30 transition-all duration-200 active:scale-[0.95]"
                        onClick={() => window.open(SOCIAL_LINKS.github, '_blank')}
                        aria-label="View source code on GitHub"
                      >
                        <Github className="h-7 w-7" />
                      </Button>

                      <div className="w-16 h-16 flex items-center justify-center rounded-2xl border border-border/40 bg-card">
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

'use client';

import { ChevronDown, ExternalLink, Github, Menu } from 'lucide-react';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    role="img"
    aria-label="Discord"
  >
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
);

const LogoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    role="img"
    aria-label="Claude Pro Directory Logo"
  >
    {/* Background circle in theme background */}
    <circle
      cx="12"
      cy="12"
      r="11"
      fill="hsl(var(--background))"
      stroke="hsl(var(--accent))"
      strokeWidth="2"
    />
    {/* 8-pointed star/asterisk rays in Claude orange */}
    <path
      d="M12 2 L12 8 M12 16 L12 22 M4 12 L8 12 M16 12 L20 12 M6.5 6.5 L9 9 M15 15 L17.5 17.5 M17.5 6.5 L15 9 M9 15 L6.5 17.5"
      stroke="hsl(var(--accent))"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Center dot in Claude orange */}
    <circle cx="12" cy="12" r="1" fill="hsl(var(--accent))" />
  </svg>
);

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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  isActive: (path: string) => boolean;
  onClick: () => void;
}

const NavLink = ({ href, children, className = '', isActive, onClick }: NavLinkProps) => {
  const active = isActive(href);
  return (
    <Link
      href={href}
      className={`${active ? 'ring-2 ring-accent/30 bg-accent/10 border-accent/50 text-primary' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
        mounted && isScrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="container mx-auto px-4">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${
            mounted && isScrolled ? 'h-12' : 'h-16'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-w-0 flex-shrink">
            <LogoIcon
              className={`transition-all duration-300 flex-shrink-0 hidden xl:block ${
                mounted && isScrolled ? 'h-6 w-6' : 'h-8 w-8'
              }`}
            />
            <span
              className={`font-medium text-foreground transition-all duration-300 hidden xl:inline ${
                mounted && isScrolled ? 'text-base' : 'text-lg'
              }`}
            >
              claudepro.directory
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
                >
                  More
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/community" className="flex flex-col items-start space-y-1 px-3 py-3">
                    <div>Community</div>
                    <div className="text-xs text-muted-foreground">Join the Claude community</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/submit" className="flex flex-col items-start space-y-1 px-3 py-3">
                    <div>Submit Config</div>
                    <div className="text-xs text-muted-foreground">Share your configurations</div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/partner" className="flex flex-col items-start space-y-1 px-3 py-3">
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
            >
              <DiscordIcon className="h-4 w-4 xl:mr-2" />
              <span className="hidden xl:inline">Discord</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                window.open('https://github.com/JSONbored/claudepro-directory', '_blank')
              }
              className="hidden sm:flex hover:bg-accent/10 hover:text-accent"
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
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[380px] border-l border-border/50"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center gap-3 pt-6 pb-8 px-1">
                    <LogoIcon className="h-8 w-8 flex-shrink-0" />
                    <span className="font-semibold text-lg text-foreground">
                      claudepro.directory
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
                        className="w-16 h-16 rounded-2xl border-border/40 bg-card hover:bg-[#5865F2]/10 hover:border-[#5865F2]/30 transition-all duration-200 active:scale-[0.95]"
                        onClick={() => window.open('https://discord.gg/Ax3Py4YDrq', '_blank')}
                      >
                        <DiscordIcon className="h-7 w-7 text-[#5865F2]" />
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="w-16 h-16 rounded-2xl border-border/40 bg-card hover:bg-accent/10 hover:border-accent/30 transition-all duration-200 active:scale-[0.95]"
                        onClick={() =>
                          window.open('https://github.com/JSONbored/claudepro-directory', '_blank')
                        }
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

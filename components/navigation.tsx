'use client';

import { ChevronDown, ExternalLink, Github, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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

const NavLink = ({ href, children, className = '', isActive, onClick }: NavLinkProps) => (
  <Link
    href={href}
    className={`text-sm font-medium transition-colors hover:text-accent ${
      isActive(href) ? 'text-primary' : 'text-muted-foreground'
    } ${className}`}
    onClick={onClick}
  >
    {children}
  </Link>
);

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-lg font-medium text-white">claudepro.directory</span>
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
            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                window.open('https://github.com/JSONbored/claudepro-directory', '_blank')
              }
              className="hidden sm:flex hover:bg-accent/10 hover:text-accent"
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>

            <Badge
              variant="outline"
              className="hidden lg:flex border-accent/20 bg-accent/5 text-accent"
            >
              <ExternalLink className="h-3 w-3 mr-1 text-accent" />
              Free & Open Source
            </Badge>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  <NavLink
                    href="/rules"
                    isActive={isActive}
                    onClick={() => setIsOpen(false)}
                    className="text-base"
                  >
                    Claude Rules
                  </NavLink>

                  <NavLink
                    href="/mcp"
                    isActive={isActive}
                    onClick={() => setIsOpen(false)}
                    className="text-base"
                  >
                    MCP
                  </NavLink>

                  <NavLink
                    href="/agents"
                    isActive={isActive}
                    onClick={() => setIsOpen(false)}
                    className="text-base"
                  >
                    Agents
                  </NavLink>

                  <NavLink
                    href="/commands"
                    isActive={isActive}
                    onClick={() => setIsOpen(false)}
                    className="text-base"
                  >
                    Commands
                  </NavLink>

                  <NavLink
                    href="/hooks"
                    isActive={isActive}
                    onClick={() => setIsOpen(false)}
                    className="text-base"
                  >
                    Hooks
                  </NavLink>

                  <NavLink
                    href="/jobs"
                    isActive={isActive}
                    onClick={() => setIsOpen(false)}
                    className="text-base"
                  >
                    Jobs
                  </NavLink>

                  <NavLink
                    href="/trending"
                    isActive={isActive}
                    onClick={() => setIsOpen(false)}
                    className="text-base"
                  >
                    Trending
                  </NavLink>

                  <div className="border-t border-border pt-4 space-y-4">
                    <NavLink
                      href="/community"
                      isActive={isActive}
                      onClick={() => setIsOpen(false)}
                      className="text-base"
                    >
                      Community
                    </NavLink>

                    <NavLink
                      href="/submit"
                      isActive={isActive}
                      onClick={() => setIsOpen(false)}
                      className="text-base"
                    >
                      Submit Config
                    </NavLink>

                    <NavLink
                      href="/partner"
                      isActive={isActive}
                      onClick={() => setIsOpen(false)}
                      className="text-base"
                    >
                      Partner
                    </NavLink>
                  </div>

                  <div className="border-t border-border pt-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        window.open('https://github.com/JSONbored/claudepro-directory', '_blank')
                      }
                    >
                      <Github className="h-4 w-4 mr-2" />
                      View on GitHub
                    </Button>
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

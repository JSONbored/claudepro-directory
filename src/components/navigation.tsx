import { ExternalLink, Github, Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
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
    to={href}
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
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-lg font-medium text-white">claudepro.directory</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="space-x-6">
              <NavigationMenuItem>
                <NavLink href="/rules" isActive={isActive} onClick={() => setIsOpen(false)}>
                  Rules
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/mcp" isActive={isActive} onClick={() => setIsOpen(false)}>
                  MCP
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/agents" isActive={isActive} onClick={() => setIsOpen(false)}>
                  Agents
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/commands" isActive={isActive} onClick={() => setIsOpen(false)}>
                  Commands
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/hooks" isActive={isActive} onClick={() => setIsOpen(false)}>
                  Hooks
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/jobs" isActive={isActive} onClick={() => setIsOpen(false)}>
                  Jobs
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/trending" isActive={isActive} onClick={() => setIsOpen(false)}>
                  Trending
                </NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-muted-foreground hover:text-accent">
                  More
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-48">
                    <NavLink
                      href="/community"
                      isActive={isActive}
                      onClick={() => setIsOpen(false)}
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div>Community</div>
                      <div className="text-xs text-muted-foreground">Join the Claude community</div>
                    </NavLink>

                    <NavLink
                      href="/submit"
                      isActive={isActive}
                      onClick={() => setIsOpen(false)}
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div>Submit Config</div>
                      <div className="text-xs text-muted-foreground">Share your configurations</div>
                    </NavLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
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

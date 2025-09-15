import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Sparkles,
  Menu,
  Github,
  ExternalLink
} from 'lucide-react';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const NavLink = ({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) => (
    <Link 
      to={href} 
      className={`text-sm font-medium transition-colors hover:text-primary ${
        isActive(href) ? 'text-primary' : 'text-muted-foreground'
      } ${className}`}
      onClick={() => setIsOpen(false)}
    >
      {children}
    </Link>
  );

  const ExternalNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
    >
      {children}
    </a>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-lg font-medium text-white">
              claudepro.directory
            </span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="space-x-6">
              <NavigationMenuItem>
                <NavLink href="/rules">Rules</NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/mcp">MCP Servers</NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/agents">Agents</NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/commands">Commands</NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/hooks">Hooks</NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/jobs">Jobs</NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavLink href="/trending">Trending</NavLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-muted-foreground hover:text-primary">
                  More
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-48">
                    <NavLink href="/community" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div>Community</div>
                      <div className="text-xs text-muted-foreground">
                        Join the Claude community
                      </div>
                    </NavLink>
                    
                    <NavLink href="/submit" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div>Submit Config</div>
                      <div className="text-xs text-muted-foreground">
                        Share your configurations
                      </div>
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
              onClick={() => window.open('https://github.com/JSONbored/claudepro-directory', '_blank')}
              className="hidden sm:flex hover:bg-primary/10 hover:text-primary"
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>
            
            <Badge variant="outline" className="hidden lg:flex border-primary/20 bg-primary/5 text-primary">
              <ExternalLink className="h-3 w-3 mr-1" />
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
                  <NavLink href="/rules" className="text-base">
                    Claude Rules
                  </NavLink>
                  
                  <NavLink href="/mcp" className="text-base">
                    MCP Servers
                  </NavLink>

                  <NavLink href="/agents" className="text-base">
                    Agents
                  </NavLink>

                  <NavLink href="/commands" className="text-base">
                    Commands
                  </NavLink>

                  <NavLink href="/hooks" className="text-base">
                    Hooks
                  </NavLink>

                  <NavLink href="/jobs" className="text-base">
                    Jobs
                  </NavLink>

                  <NavLink href="/trending" className="text-base">
                    Trending
                  </NavLink>

                  <div className="border-t border-border pt-4 space-y-4">
                    <NavLink href="/community" className="text-base">
                      Community
                    </NavLink>
                    
                    <NavLink href="/submit" className="text-base">
                      Submit Config
                    </NavLink>
                  </div>

                  <div className="border-t border-border pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => window.open('https://github.com/JSONbored/claudepro-directory', '_blank')}
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
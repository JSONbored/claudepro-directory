/**
 * Desktop Navigation Component
 * Visible only at xl: breakpoint (1280px+)
 * Handles full dropdown menus with descriptions
 */

import { cluster, grid, iconSize, iconWrapper, flexItemText, marginBottom, absolute } from '@heyclaude/web-runtime/design-system';
import { Briefcase, ChevronDown, Handshake, Users } from '@heyclaude/web-runtime/icons';
import {
  ANIMATION_CONSTANTS,
  DIMENSIONS,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { PrefetchLink } from '@heyclaude/web-runtime/ui';
import { SearchTrigger } from '@/src/components/features/search/search-trigger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@heyclaude/web-runtime/ui';
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@heyclaude/web-runtime/config/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  isActive: (href: string) => boolean;
  onClick?: () => void;
}

const NavLink = ({ href, children, className = '', isActive, onClick }: NavLinkProps) => {
  const active = isActive(href);

  const linkProps = {
    href,
    prefetch: true,
    className: `group relative px-2 py-1 text-xs font-medium ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} no-underline ${
      active ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
    } ${className}`,
    ...(active && { 'aria-current': 'page' as const }),
    ...(onClick && { onClick }),
    style: {
      viewTransitionName: active ? 'nav-link' : undefined,
    } as React.CSSProperties,
  };

  return (
    <PrefetchLink {...linkProps}>
      <span className="relative inline-block">
        {children}
        <span
          className={`${absolute.bottomLeft} ${DIMENSIONS.UNDERLINE} bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} ${
            active ? 'w-full' : 'w-0 group-hover:w-full'
          }`}
          aria-hidden="true"
        />
      </span>
    </PrefetchLink>
  );
};

interface NavigationDesktopProps {
  isActive: (path: string) => boolean;
  onCommandPaletteOpen: () => void;
}

/**
 * Desktop-only primary navigation with dropdowns, grouped links, and a search trigger.
 *
 * Renders the full site navigation for screens >= 1280px with dropdown menus for items that have children,
 * grouped secondary links under a "More" menu, footer quick links (Community, Partner Program, Consulting),
 * and a SearchTrigger that opens the command palette via the provided callback.
 *
 * @param isActive - Function that receives a path and returns whether that path is active; used to mark links as active.
 * @param onCommandPaletteOpen - Callback invoked when the search/command palette trigger is clicked.
 * @returns The navigation JSX element intended for desktop (xl) viewports.
 *
 * @see NavLink
 * @see SearchTrigger
 */
export function NavigationDesktop({ isActive, onCommandPaletteOpen }: NavigationDesktopProps) {
  return (
    <nav
      className={`hidden xl:flex ${cluster.compact} text-xs`}
      aria-label="Primary navigation"
    >
      {PRIMARY_NAVIGATION.map((link) => {
        // Render dropdown for links with children (e.g., Configs)
        if (link.children && link.children.length > 0) {
          return (
            <DropdownMenu key={link.label}>
              <DropdownMenuTrigger asChild={true}>
                <button
                  type="button"
                  className={`group relative flex items-center px-2 py-1 font-medium text-sm ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
                  aria-label={`Open ${link.label} menu`}
                >
                  <span className="relative">
                    {link.label}
                    <span
                      className={`${absolute.bottomLeft} ${DIMENSIONS.UNDERLINE} w-0 bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} group-hover:w-full`}
                      aria-hidden="true"
                    />
                  </span>
                  <ChevronDown className="ml-1 h-2.5 w-2.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={`${DIMENSIONS.DROPDOWN_LG} p-3`}>
                <div className={grid.cols2}>
                  {link.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <DropdownMenuItem key={child.href} asChild={true}>
                        <Link
                          href={child.href}
                          prefetch={true}
                          className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/10"
                        >
                          {ChildIcon && (
                            <div className={`${iconWrapper.sm} bg-muted/50`}>
                              <ChildIcon
                                className={`${iconSize.xs} text-muted-foreground`}
                                aria-hidden="true"
                              />
                            </div>
                          )}
                          <div className={flexItemText}>
                            <div
                              className={`${cluster.snug} w-full truncate font-medium text-sm`}
                            >
                              {child.label}
                              {child.isNew && (
                                <UnifiedBadge
                                  variant="new-indicator"
                                  label={`New: ${child.label}`}
                                />
                              )}
                            </div>
                            {child.description && (
                              <div className="line-clamp-1 text-[11px] text-muted-foreground">
                                {child.description}
                              </div>
                            )}
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        // Render regular link for items without children
        return (
          <NavLink key={link.href} href={link.href} isActive={isActive}>
            {link.isNew ? (
              <span className={cluster.snug}>
                {link.label}
                <UnifiedBadge variant="new-indicator" label={`New: ${link.label}`} />
              </span>
            ) : (
              link.label
            )}
          </NavLink>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>
          <button
            type="button"
            className={`group relative flex items-center px-2 py-1 font-medium text-sm ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
            aria-label="Open additional navigation menu"
          >
            <span className="relative">
              More
              <span
                className={`${absolute.bottomLeft} ${DIMENSIONS.UNDERLINE} w-0 bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} group-hover:w-full`}
                aria-hidden="true"
              />
            </span>
            <ChevronDown className="ml-1 h-2.5 w-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={`${DIMENSIONS.DROPDOWN_XL} p-4`}>
          {/* 2-column grid for quick links */}
          <div className={`${marginBottom.tight} grid grid-cols-2 gap-4`}>
            {SECONDARY_NAVIGATION.map((group) => (
              <div key={group.heading} className="space-y-2">
                <DropdownMenuLabel className="px-2 py-1 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                  {group.heading}
                </DropdownMenuLabel>
                <DropdownMenuGroup className="space-y-0.5">
                  {group.links.map((link) => {
                    const IconComponent = link.icon;
                    return (
                      <DropdownMenuItem key={link.href} asChild={true}>
                        <Link
                          href={link.href}
                          prefetch={true}
                          className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/10"
                        >
                          {IconComponent && (
                            <div className={`${iconWrapper.sm} bg-muted/50`}>
                              <IconComponent
                                className={`${iconSize.xs} text-muted-foreground`}
                                aria-hidden="true"
                              />
                            </div>
                          )}
                          <div className={flexItemText}>
                            <div className="w-full truncate font-medium text-sm">{link.label}</div>
                            {link.description && (
                              <div className="line-clamp-1 text-[11px] text-muted-foreground">
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

          {/* Footer Links - Community, Partner Program, Consulting */}
          <DropdownMenuSeparator className="my-2.5" />
          <div className={grid.cols3}>
            <Link
              href="/community"
              prefetch={true}
              className="group flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-accent/10"
            >
              <Users
                className={`${iconSize.sm} text-muted-foreground transition-colors group-hover:text-accent`}
                aria-hidden="true"
              />
              <div className="font-medium text-foreground text-sm transition-colors group-hover:text-accent">
                Community
              </div>
            </Link>
            <Link href="/partner" prefetch={true} className="group flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-accent/10">
              <Handshake
                className={`${iconSize.sm} text-muted-foreground transition-colors group-hover:text-accent`}
                aria-hidden="true"
              />
              <div className="font-medium text-foreground text-sm transition-colors group-hover:text-accent">
                Partner Program
              </div>
            </Link>
            <Link
              href="/consulting"
              prefetch={true}
              className="group flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-accent/10"
            >
              <Briefcase
                className={`${iconSize.sm} text-muted-foreground transition-colors group-hover:text-accent`}
                aria-hidden="true"
              />
              <div className="font-medium text-foreground text-sm transition-colors group-hover:text-accent">
                Consulting
              </div>
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search Icon - Right of More */}
      <SearchTrigger
        variant="ghost"
        size="sm"
        showShortcut={false}
        onClick={onCommandPaletteOpen}
        className="text-xs"
      />
    </nav>
  );
}
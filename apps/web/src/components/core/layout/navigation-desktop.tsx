/**
 * Desktop Navigation Component
 * Visible only at xl: breakpoint (1280px+)
 * Handles full dropdown menus with descriptions
 */

import { cluster, grid, iconSize, iconWrapper, flexItemText, marginBottom, absolute, hoverBg, transition, spaceY, weight, muted, radius ,size , padding , gap , row } from '@heyclaude/web-runtime/design-system';
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
    className: `group relative ${padding.xTight} ${padding.yMicro} ${size.xs} ${weight.medium} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} no-underline ${
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
 * Render the desktop (≥1280px) primary site navigation with dropdowns, grouped secondary links, footer quick links, and a search trigger.
 *
 * Renders top-level navigation items (with optional child dropdowns), a "More" menu that groups secondary links and footer quick links (Community, Partner Program, Consulting), and a SearchTrigger that opens the command palette.
 *
 * @param isActive - Function that receives a path and returns whether that path is active; used to mark links as active
 * @param onCommandPaletteOpen - Callback invoked when the search/command palette trigger is clicked
 * @returns The navigation JSX element for desktop (xl) viewports
 *
 * @see NavLink
 * @see SearchTrigger
 */
export function NavigationDesktop({ isActive, onCommandPaletteOpen }: NavigationDesktopProps) {
  return (
    <nav
      className={`hidden xl:flex ${cluster.compact} ${size.xs}`}
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
                  className={`group relative flex items-center ${padding.xTight} ${padding.yMicro} ${weight.medium} ${size.sm} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
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
              <DropdownMenuContent align="start" className={`${DIMENSIONS.DROPDOWN_LG} ${padding.compact}`}>
                <div className={grid.cols2}>
                  {link.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <DropdownMenuItem key={child.href} asChild={true}>
                        <Link
                          href={child.href}
                          prefetch={true}
                          className={`group ${row.default} ${radius.lg} ${padding.tight} ${transition.colors} ${hoverBg.default}`}
                        >
                          {ChildIcon && (
                            <div className={`${iconWrapper.sm} bg-muted/50`}>
                              <ChildIcon
                                className={`${iconSize.xs} ${muted.default}`}
                                aria-hidden="true"
                              />
                            </div>
                          )}
                          <div className={flexItemText}>
                            <div
                              className={`${cluster.snug} w-full truncate ${weight.medium} ${size.sm}`}
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
                              <div className={`line-clamp-1 text-[11px] ${muted.default}`}>
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
            className={`group relative flex items-center ${padding.xTight} ${padding.yMicro} ${weight.medium} ${size.sm} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
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
        <DropdownMenuContent align="end" className={`${DIMENSIONS.DROPDOWN_XL} ${padding.default}`}>
          {/* 2-column grid for quick links */}
          <div className={`${marginBottom.tight} grid grid-cols-2 ${gap.comfortable}`}>
            {SECONDARY_NAVIGATION.map((group) => (
              <div key={group.heading} className={spaceY.compact}>
                <DropdownMenuLabel className={`px-2 ${padding.yMicro} ${weight.semibold} text-[10px] ${muted.default} uppercase tracking-wider`}>
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
                          className={`group ${row.default} ${radius.lg} ${padding.tight} ${transition.colors} ${hoverBg.default}`}
                        >
                          {IconComponent && (
                            <div className={`${iconWrapper.sm} bg-muted/50`}>
                              <IconComponent
                                className={`${iconSize.xs} ${muted.default}`}
                                aria-hidden="true"
                              />
                            </div>
                          )}
                          <div className={flexItemText}>
                            <div className={`w-full truncate ${weight.medium} ${size.sm}`}>{link.label}</div>
                            {link.description && (
                              <div className={`line-clamp-1 text-[11px] ${muted.default}`}>
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
              className={`group flex flex-col items-center ${gap.compact} ${radius.lg} ${padding.compact} ${transition.colors} ${hoverBg.default}`}
            >
              <Users
                className={`${iconSize.sm} ${muted.default} transition-colors group-hover:text-accent`}
                aria-hidden="true"
              />
              <div className={`${weight.medium} text-foreground ${size.sm} transition-colors group-hover:text-accent`}>
                Community
              </div>
            </Link>
            <Link href="/partner" prefetch={true} className={`group flex flex-col items-center ${gap.compact} ${radius.lg} ${padding.compact} ${transition.colors} ${hoverBg.default}`}>
              <Handshake
                className={`${iconSize.sm} ${muted.default} transition-colors group-hover:text-accent`}
                aria-hidden="true"
              />
              <div className={`${weight.medium} text-foreground ${size.sm} transition-colors group-hover:text-accent`}>
                Partner Program
              </div>
            </Link>
            <Link
              href="/consulting"
              prefetch={true}
              className={`group flex flex-col items-center ${gap.compact} ${radius.lg} ${padding.compact} ${transition.colors} ${hoverBg.default}`}
            >
              <Briefcase
                className={`${iconSize.sm} ${muted.default} transition-colors group-hover:text-accent`}
                aria-hidden="true"
              />
              <div className={`${weight.medium} text-foreground ${size.sm} transition-colors group-hover:text-accent`}>
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
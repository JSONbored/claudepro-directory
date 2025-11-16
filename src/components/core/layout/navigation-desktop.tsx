/**
 * Desktop Navigation Component
 * Visible only at xl: breakpoint (1280px+)
 * Handles full dropdown menus with descriptions
 */

import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { PrefetchLink } from '@/src/components/core/navigation/prefetch-link';
import { SearchTrigger } from '@/src/components/features/search/search-trigger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/primitives/ui/dropdown-menu';
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@/src/config/navigation';
import { Briefcase, ChevronDown, Handshake, Users } from '@/src/lib/icons';
import {
  ANIMATION_CONSTANTS,
  DIMENSIONS,
  POSITION_PATTERNS,
  UI_CLASSES,
} from '@/src/lib/ui-constants';

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
          className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} ${
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

export function NavigationDesktop({ isActive, onCommandPaletteOpen }: NavigationDesktopProps) {
  return (
    <nav
      className={`hidden xl:flex ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-xs`}
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
                  className={`group relative flex items-center px-2 py-1 font-medium ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_NAV} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
                  aria-label={`Open ${link.label} menu`}
                >
                  <span className="relative">
                    {link.label}
                    <span
                      className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} w-0 bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} group-hover:w-full`}
                      aria-hidden="true"
                    />
                  </span>
                  <ChevronDown className="ml-1 h-2.5 w-2.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className={`${DIMENSIONS.DROPDOWN_LG} p-3`}>
                <div className={UI_CLASSES.GRID_COLS_2_GAP_2}>
                  {link.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <DropdownMenuItem key={child.href} asChild={true}>
                        <Link
                          href={child.href}
                          prefetch={true}
                          className={UI_CLASSES.FLEX_INTERACTIVE_MENU_ITEM}
                        >
                          {ChildIcon && (
                            <div className={`${UI_CLASSES.FLEX_ICON_WRAPPER_SM} bg-muted/50`}>
                              <ChildIcon
                                className={`${UI_CLASSES.ICON_XS} text-muted-foreground`}
                                aria-hidden="true"
                              />
                            </div>
                          )}
                          <div className={UI_CLASSES.FLEX_MIN_W_0_FLEX_1_COL_ITEMS_START_GAP_0_5}>
                            <div
                              className={`${UI_CLASSES.FLEX_W_FULL_ITEMS_CENTER_GAP_1_5} truncate font-medium text-sm`}
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
              <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
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
            className={`group relative flex items-center px-2 py-1 font-medium ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_NAV} ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
            aria-label="Open additional navigation menu"
          >
            <span className="relative">
              More
              <span
                className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} w-0 bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} group-hover:w-full`}
                aria-hidden="true"
              />
            </span>
            <ChevronDown className="ml-1 h-2.5 w-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={`${DIMENSIONS.DROPDOWN_XL} p-4`}>
          {/* 2-column grid for quick links */}
          <div className={`${UI_CLASSES.MB_2} ${UI_CLASSES.GRID_COLS_2_GAP_4}`}>
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
                          className={UI_CLASSES.FLEX_INTERACTIVE_MENU_ITEM}
                        >
                          {IconComponent && (
                            <div className={`${UI_CLASSES.FLEX_ICON_WRAPPER_SM} bg-muted/50`}>
                              <IconComponent
                                className={`${UI_CLASSES.ICON_XS} text-muted-foreground`}
                                aria-hidden="true"
                              />
                            </div>
                          )}
                          <div className={UI_CLASSES.FLEX_MIN_W_0_FLEX_1_COL_ITEMS_START_GAP_0_5}>
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
          <div className={UI_CLASSES.GRID_COLS_3_GAP_2}>
            <Link
              href="/community"
              prefetch={true}
              className={UI_CLASSES.FLEX_INTERACTIVE_NAV_ITEM}
            >
              <Users
                className={`${UI_CLASSES.ICON_SM} text-muted-foreground transition-colors group-hover:text-accent`}
                aria-hidden="true"
              />
              <div className="font-medium text-foreground text-sm transition-colors group-hover:text-accent">
                Community
              </div>
            </Link>
            <Link href="/partner" prefetch={true} className={UI_CLASSES.FLEX_INTERACTIVE_NAV_ITEM}>
              <Handshake
                className={`${UI_CLASSES.ICON_SM} text-muted-foreground transition-colors group-hover:text-accent`}
                aria-hidden="true"
              />
              <div className="font-medium text-foreground text-sm transition-colors group-hover:text-accent">
                Partner Program
              </div>
            </Link>
            <Link
              href="/consulting"
              prefetch={true}
              className={UI_CLASSES.FLEX_INTERACTIVE_NAV_ITEM}
            >
              <Briefcase
                className={`${UI_CLASSES.ICON_SM} text-muted-foreground transition-colors group-hover:text-accent`}
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
        className={UI_CLASSES.TEXT_XS}
      />
    </nav>
  );
}

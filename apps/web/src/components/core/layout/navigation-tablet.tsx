/**
 * Tablet Navigation Component
 * Visible md:flex xl:hidden (768px-1279px)
 * Horizontal scroll with first 5 nav items
 * Uses Popover for dropdowns (click-to-open, better for touch devices)
 */

import { PRIMARY_NAVIGATION } from '@heyclaude/web-runtime/config/navigation';
import { ChevronDown } from '@heyclaude/web-runtime/icons';
import {
  ANIMATION_CONSTANTS,
  DIMENSIONS,
  POSITION_PATTERNS,
  UI_CLASSES,
  PrefetchLink,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import Link from 'next/link';

interface NavLinkProps {
  children: React.ReactNode;
  className?: string;
  href: string;
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

interface NavigationTabletProps {
  isActive: (path: string) => boolean;
  onMobileMenuOpen: () => void;
}

export function NavigationTablet({ isActive, onMobileMenuOpen }: NavigationTabletProps) {
  return (
    <motion.nav
      className="scrollbar-hide hidden snap-x snap-mandatory overflow-x-auto md:flex xl:hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="Tablet navigation"
    >
      <div className={`flex ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1} px-2`}>
        {PRIMARY_NAVIGATION.slice(0, 5).map((link, index) => {
          // Check if link has dropdown content (sections or children)
          const hasDropdown = (link.sections && link.sections.length > 0) || (link.children && link.children.length > 0);

          // Render dropdown with Popover for touch-friendly interaction
          if (hasDropdown) {
            return (
              <motion.div
                key={link.href}
                className="snap-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`group relative flex items-center px-3 py-2 text-xs font-medium whitespace-nowrap ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} ${
                        isActive(link.href) ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
                      }`}
                      aria-label={`Open ${link.label} menu`}
                    >
                      <span className="relative">
                        {link.label}
                        <span
                          className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} ${
                            isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                      <ChevronDown className="ml-1 h-2.5 w-2.5 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-56 p-3" sideOffset={8}>
                    {link.sections ? (
                      // Organized sections with headers
                      <div className="space-y-4">
                        {link.sections.map((section, sectionIndex) => (
                          <div key={section.heading}>
                            {/* Section header */}
                            <div className="px-2 py-1 mb-1.5">
                              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                                {section.heading}
                              </p>
                            </div>
                            {/* Section items */}
                            <div className="space-y-0.5">
                              {section.links.map((child) => {
                                const ChildIcon = child.icon;
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    prefetch
                                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/5 transition-colors group/item text-foreground"
                                  >
                                    {ChildIcon && (
                                      <ChildIcon className="h-4 w-4 text-muted-foreground group-hover/item:text-foreground transition-colors" />
                                    )}
                                    <span className="flex-1">{child.label}</span>
                                    {child.isNew && (
                                      <UnifiedBadge variant="new-indicator" label={`New: ${child.label}`} />
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                            {/* Separator between sections (except last) */}
                            {link.sections && sectionIndex < link.sections.length - 1 && (
                              <div className="mt-4 mb-0 h-px bg-border/50" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : link.children ? (
                      // Fallback: flat list for links without sections
                      <div className="space-y-0.5">
                        {link.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              prefetch
                              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent/5 transition-colors group/item"
                            >
                              {ChildIcon && (
                                <ChildIcon className="h-4 w-4 text-muted-foreground group-hover/item:text-foreground transition-colors" />
                              )}
                              <span className="flex-1">{child.label}</span>
                              {child.isNew && (
                                <UnifiedBadge variant="new-indicator" label={`New: ${child.label}`} />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </PopoverContent>
                </Popover>
              </motion.div>
            );
          }

          // Render regular link for items without dropdowns
          return (
            <motion.div
              key={link.href}
              className="snap-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <NavLink
                href={link.href}
                isActive={isActive}
                className="px-3 py-2 text-xs whitespace-nowrap"
              >
                {link.isNew ? (
                  <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
                    {link.label}
                    <UnifiedBadge variant="new-indicator" label={`New: ${link.label}`} />
                  </span>
                ) : (
                  link.label
                )}
              </NavLink>
            </motion.div>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuOpen}
          className="text-xs whitespace-nowrap"
          aria-label="Open more navigation options"
        >
          More
        </Button>
      </div>
    </motion.nav>
  );
}

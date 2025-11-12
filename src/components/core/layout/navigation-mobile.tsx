/**
 * Mobile Navigation Component
 * Sheet drawer navigation for mobile devices (<768px)
 * Full-height menu with staggered animations
 */

import { motion } from 'motion/react';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';
import { PrefetchLink } from '@/src/components/core/navigation/prefetch-link';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/src/components/primitives/ui/sheet';
import { ACTION_LINKS, PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@/src/config/navigation';
import { SOCIAL_LINKS } from '@/src/lib/constants';
import { DiscordIcon, Github, Menu } from '@/src/lib/icons';
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

interface NavigationMobileProps {
  isActive: (path: string) => boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavigationMobile({ isActive, isOpen, onOpenChange }: NavigationMobileProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open mobile menu">
          <Menu className={UI_CLASSES.ICON_LG} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={`w-full border-border/50 border-l sm:${DIMENSIONS.SIDEBAR_LG}`}
      >
        {/* Swipe-to-close indicator */}
        <motion.div
          className="${POSITION_PATTERNS.ABSOLUTE_TOP_HALF} -translate-x-1/2 left-1/2 h-1 w-12 cursor-grab rounded-full bg-border/50 active:cursor-grabbing"
          drag="y"
          dragConstraints={{ top: 0, bottom: 50 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100) onOpenChange(false);
          }}
          whileDrag={{ scale: 1.2, backgroundColor: 'hsl(var(--accent))' }}
          transition={ANIMATION_CONSTANTS.SPRING_DEFAULT}
        />

        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className={'flex h-full flex-col pt-8'}>
          {/* Header with Motion.dev fade-in */}
          <motion.div
            className={'flex items-center px-1 pb-8'}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HeyClaudeLogo size="lg" duration={1.2} />
          </motion.div>

          {/* Main Navigation - Staggered animations */}
          <div className={'flex-1 overflow-y-auto'}>
            <nav className={'space-y-3 px-3'} aria-label="Primary navigation">
              {/* Action Links (Submit Config) - Prominent position */}
              {ACTION_LINKS.map((link, index) => {
                const ActionIcon = link.icon;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => onOpenChange(false)}
                      className={`flex w-full items-center justify-center rounded-xl border-2 border-accent bg-accent px-5 py-4 font-semibold text-accent-foreground text-base ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:bg-accent/90 active:scale-[0.97]`}
                    >
                      {ActionIcon && <ActionIcon className="mr-2 h-5 w-5 flex-shrink-0" />}
                      <span>{link.label}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Primary Navigation */}
              {PRIMARY_NAVIGATION.map((link, index) => {
                const IconComponent = link.icon;
                const adjustedIndex = ACTION_LINKS.length + index;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + adjustedIndex * 0.05 }}
                  >
                    <NavLink
                      href={link.href}
                      isActive={isActive}
                      onClick={() => onOpenChange(false)}
                      className={`flex w-full items-center rounded-xl border border-border bg-card px-5 py-4 font-medium text-base ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:border-accent/50 hover:bg-accent/10 active:scale-[0.97]`}
                    >
                      {IconComponent && <IconComponent className="mr-3 h-5 w-5 flex-shrink-0" />}
                      <span>{link.label}</span>
                      {link.isNew && (
                        <UnifiedBadge
                          variant="new-indicator"
                          label={`New: ${link.label}`}
                          className="ml-auto"
                        />
                      )}
                    </NavLink>
                  </motion.div>
                );
              })}

              {/* Secondary Navigation */}
              <nav
                className={'mt-4 border-border/30 border-t pt-6'}
                aria-label="Secondary navigation"
              >
                <div className="space-y-3">
                  {SECONDARY_NAVIGATION.flatMap((group) => group.links).map((link, index) => {
                    const IconComponent = link.icon;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.15 + (PRIMARY_NAVIGATION.length + index) * 0.05,
                        }}
                      >
                        <NavLink
                          href={link.href}
                          isActive={isActive}
                          onClick={() => onOpenChange(false)}
                          className={`flex w-full items-center rounded-xl border border-border/40 bg-card/50 px-5 py-4 font-medium text-muted-foreground text-sm ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:border-accent/30 hover:bg-accent/5 hover:text-foreground active:scale-[0.98]`}
                        >
                          {IconComponent && (
                            <IconComponent className="mr-3 h-4 w-4 flex-shrink-0" />
                          )}
                          <span>{link.label}</span>
                        </NavLink>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>
            </nav>
          </div>

          {/* Footer with spring animation on tap */}
          <motion.div
            className={'border-border/30 border-t pt-6 pb-6'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={`${UI_CLASSES.GRID_COLS_3_GAP_4} px-4`}>
              {[
                {
                  icon: DiscordIcon,
                  onClick: () => window.open('https://discord.gg/Ax3Py4YDrq', '_blank'),
                  label: 'Discord',
                  color: 'discord',
                },
                {
                  icon: Github,
                  onClick: () => window.open(SOCIAL_LINKS.github, '_blank'),
                  label: 'GitHub',
                  color: 'accent',
                },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileTap={{ scale: 0.9 }}
                  transition={ANIMATION_CONSTANTS.SPRING_DEFAULT}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className={`h-20 w-full rounded-2xl border-border/40 bg-card hover:bg-${item.color}/10 hover:border-${item.color}/30 ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
                    onClick={item.onClick}
                    aria-label={item.label}
                  >
                    <item.icon className={UI_CLASSES.ICON_XL} />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

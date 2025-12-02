/**
 * Mobile Navigation Component
 * Sheet drawer navigation for mobile devices (<768px)
 * Full-height menu with staggered animations
 */

'use client';

import { getContactChannels } from '@heyclaude/web-runtime/core';
import { grid, iconSize, absolute, hoverBg, transition, border, borderLeft, borderTop, radius, spaceY, muted, srOnly, weight, size, padding, gap, borderColor,
  flexDir,
  overflow,
  cursor,
  bgColor,
  justify,
  textColor,
  alignItems,
  flexGrow,
  height,
  sidebarWidth,
  marginTop,
  skeletonSize,
} from '@heyclaude/web-runtime/design-system';
import { getAnimationConfig } from '@heyclaude/web-runtime/data';
import { DiscordIcon, Github, Menu } from '@heyclaude/web-runtime/icons';
import { motion, type PanInfo } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';
import { PrefetchLink } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@heyclaude/web-runtime/ui';
import { ACTION_LINKS, PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@heyclaude/web-runtime/config/navigation';

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
    className: `group relative ${padding.xTight} ${padding.yMicro} ${size.xs} ${weight.medium} ${transition.default} no-underline ${
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
          className={`${absolute.bottomLeft} ${height.underline} ${bgColor.accent} ${transition.slow} ${
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

const CONTACT_CHANNELS = getContactChannels();

/**
 * Renders the mobile navigation sheet/drawer for small screens with staggered animations, a swipe-to-close handle, header logo, action/primary/secondary navigation sections, and footer contact actions.
 *
 * @param props.isActive - Predicate that receives a path and returns whether that path is currently active.
 * @param props.isOpen - Controls whether the sheet is open.
 * @param props.onOpenChange - Called with the new open state when the sheet opens or closes.
 * @returns The mobile navigation React element.
 *
 * @see NavLink
 * @see getAnimationConfig
 * @see ACTION_LINKS, PRIMARY_NAVIGATION, SECONDARY_NAVIGATION
 */
export function NavigationMobile({ isActive, isOpen, onOpenChange }: NavigationMobileProps) {
  const [springDefault, setSpringDefault] = useState({
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  });

  useEffect(() => {
    const config = getAnimationConfig();
    setSpringDefault({
      type: 'spring' as const,
      stiffness: config['animation.spring.default.stiffness'],
      damping: config['animation.spring.default.damping'],
    });
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild={true}>
        <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open mobile menu">
          <Menu className={iconSize.lg} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={`w-full ${borderLeft.light} sm:${sidebarWidth.lg}`}
      >
        {/* Swipe-to-close indicator */}
        <motion.div
          className={`${absolute.topHalf} -translate-x-1/2 left-1/2 ${skeletonSize.handle} ${cursor.grab} ${radius.full} bg-border/50 active:cursor-grabbing`}
          drag="y"
          dragConstraints={{ top: 0, bottom: 50 }}
          onDragEnd={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (info.offset.y > 100) onOpenChange(false);
          }}
          whileDrag={{ scale: 1.2, backgroundColor: 'hsl(var(--accent))' }}
          transition={springDefault}
        />

        <SheetTitle className={srOnly.default}>Navigation Menu</SheetTitle>
        <div className={`flex h-full ${flexDir.col} pt-8`}>
          {/* Header with Motion.dev fade-in */}
          <motion.div
            className={`flex ${alignItems.center} ${padding.xMicro} pb-8`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HeyClaudeLogo size="lg" duration={1.2} />
          </motion.div>

          {/* Main Navigation - Staggered animations */}
          <div className={`flex-1 ${overflow.yAuto}`}>
            <nav className={`${spaceY.default} ${padding.xCompact}`} aria-label="Primary navigation">
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
                      className={`flex w-full ${alignItems.center} ${justify.center} ${radius.xl} border-2 ${borderColor.accent} ${bgColor.accent} ${padding.xMedium} ${padding.yDefault} ${weight.semibold} ${textColor.accentForeground} ${size.base} ${transition.default} hover:bg-accent/90 active:scale-[0.97]`}
                    >
                      {ActionIcon && <ActionIcon className={`mr-2 ${iconSize.md} ${flexGrow.shrink0}`} />}
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
                      className={`flex w-full ${alignItems.center} ${radius.xl} ${border.default} ${bgColor.card} ${padding.xMedium} ${padding.yDefault} ${weight.medium} ${size.base} ${transition.default} hover:border-accent/50 ${hoverBg.default} active:scale-[0.97]`}
                    >
                      {IconComponent && <IconComponent className={`mr-3 ${iconSize.md} ${flexGrow.shrink0}`} />}
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
                className={`${marginTop.default} ${borderTop.faint} pt-6`}
                aria-label="Secondary navigation"
              >
                <div className={spaceY.default}>
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
                          className={`flex w-full ${alignItems.center} ${radius.xl} ${border.subtle} ${bgColor['card/50']} ${padding.xMedium} ${padding.yDefault} ${weight.medium} ${muted.sm} ${transition.default} hover:border-accent/30 hover:bg-accent/5 hover:text-foreground active:scale-[0.98]`}
                        >
                          {IconComponent && <IconComponent className={`mr-3 ${iconSize.sm} ${flexGrow.shrink0}`} />}
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
            className={`${borderTop.faint} pt-6 pb-6`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={`${grid.cols3} ${gap.comfortable} ${padding.xDefault}`}>
              {[
                {
                  icon: DiscordIcon,
                  onClick: () => window.open(CONTACT_CHANNELS.discord, '_blank'),
                  label: 'Discord',
                  color: 'discord',
                },
                {
                  icon: Github,
                  onClick: () => window.open(CONTACT_CHANNELS.github, '_blank'),
                  label: 'GitHub',
                  color: 'accent',
                },
              ].map((item) => (
                <motion.div key={item.label} whileTap={{ scale: 0.9 }} transition={springDefault}>
                  <Button
                    variant="outline"
                    size="lg"
                    className={`h-20 w-full ${radius['2xl']} ${borderColor['border/40']} ${bgColor.card} hover:bg-${item.color}/10 hover:border-${item.color}/30 ${transition.default}`}
                    onClick={item.onClick}
                    aria-label={item.label}
                  >
                    <item.icon className={iconSize.xl} />
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
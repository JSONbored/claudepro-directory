/**
 * Mobile Navigation Component
 * Sheet drawer navigation for mobile devices (<768px)
 * Full-height menu with staggered animations
 */

'use client';

import {
  ACTION_LINKS,
  PRIMARY_NAVIGATION,
  SECONDARY_NAVIGATION,
} from '@heyclaude/web-runtime/config/navigation';
import { getContactChannels } from '@heyclaude/web-runtime/config/marketing-client';
import { SPRING, MICROINTERACTIONS, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion, useDragControls } from '@heyclaude/web-runtime/hooks/motion';
import { DiscordIcon, Github, Menu } from '@heyclaude/web-runtime/icons';
import {
  UnifiedBadge,
  PrefetchLink,
  Button,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  cn,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import {
  Activity,
  BarChart,
  BookOpen,
  DollarSign,
  FileText,
  HelpCircle,
  LogOut,
  Plug,
  Rocket,
  Settings,
  Shield,
  SlidersHorizontal,
  User,
} from '@heyclaude/web-runtime/icons';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toasts } from '@heyclaude/web-runtime/ui';

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
    className: cn(
      'group relative',
      'px-3',
      'py-2',
      'text-xs-medium',
      'transition-all duration-200 ease-out',
      'no-underline',
      active ? 'text-foreground' : 'text-foreground/80 hover:text-foreground',
      className
    ),
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
          className={cn(
            'bg-accent absolute bottom-0 left-0 h-[2px] transition-all duration-300 ease-out',
            active ? 'w-full' : 'w-0 group-hover:w-full'
          )}
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

export function NavigationMobile({ isActive, isOpen, onOpenChange }: NavigationMobileProps) {
  const { value: isMounted, setTrue: setIsMountedTrue } = useBoolean();
  const shouldReduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const { user, status, supabaseClient } = useAuthenticatedUser({
    context: 'NavigationMobile',
  });
  const router = useRouter();
  const {
    value: signingOut,
    setTrue: setSigningOutTrue,
    setFalse: setSigningOutFalse,
  } = useBoolean();

  useEffect(() => {
    setIsMountedTrue();
  }, [setIsMountedTrue]);

  const handleSignOut = useCallback(async () => {
    setSigningOutTrue();
    try {
      const { error } = await supabaseClient.auth.signOut({ scope: 'local' });
      if (error) {
        toasts.raw.error(`Sign out failed: ${error.message}`);
      } else {
        toasts.success.signedOut();
        router.push('/');
        router.refresh();
        onOpenChange(false);
      }
    } catch (error) {
      toasts.raw.error('An unexpected error occurred');
    } finally {
      setSigningOutFalse();
    }
  }, [supabaseClient, router, setSigningOutTrue, setSigningOutFalse, onOpenChange]);

  // Don't render Sheet until mounted to prevent Radix UI ID hydration mismatch
  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        aria-label="Open mobile menu"
        disabled
      >
        <Menu className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open mobile menu">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="border-border/50 w-full border-l sm:w-[380px]">
        {/* Swipe-to-close indicator */}
        <motion.div
          className="bg-border/50 absolute top-1/2 left-1/2 h-1 w-12 -translate-x-1/2 cursor-grab rounded-full active:cursor-grabbing"
          drag={shouldReduceMotion ? false : 'y'}
          dragControls={shouldReduceMotion ? undefined : dragControls}
          dragListener={!shouldReduceMotion}
          dragConstraints={{ top: 0, bottom: 50 }}
          onDragEnd={(
            _: MouseEvent | PointerEvent | TouchEvent,
            info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
          ) => {
            if (info.offset.y > 100) onOpenChange(false);
          }}
          whileDrag={
            shouldReduceMotion ? {} : { scale: 1.2, backgroundColor: 'var(--claude-orange)' }
          } // Claude orange from theme
          transition={SPRING.smooth}
        />

        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex h-full flex-col pt-8">
          {/* Header with Motion.dev fade-in */}
          <motion.div
            className="flex items-center px-1 pb-8"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            transition={{ delay: STAGGER.fast }}
          >
            <HeyClaudeLogo size="lg" duration={1.2} />
          </motion.div>

          {/* Main Navigation - Staggered animations */}
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-3 px-3" aria-label="Primary navigation">
              {/* Action Links (Submit Config) - Prominent position */}
              {ACTION_LINKS.map((link, index) => {
                const ActionIcon = link.icon;
                return (
                  <motion.div
                    key={`action-${link.label}-${index}`}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    transition={{ delay: STAGGER.medium + index * STAGGER.micro }}
                  >
                    <motion.div
                      whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                      transition={MICROINTERACTIONS.button.transition}
                    >
                      <Link
                        href={link.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          'border-accent bg-accent text-accent-foreground flex w-full items-center justify-center rounded-xl border-2',
                          'px-5',
                          'py-4',
                          'text-base font-semibold',
                          'transition-all duration-200 ease-out',
                          'hover:bg-accent/90'
                        )}
                      >
                        {ActionIcon ? <ActionIcon className="mr-2 h-5 w-5 shrink-0" /> : null}
                        <span>{link.label}</span>
                      </Link>
                    </motion.div>
                  </motion.div>
                );
              })}

              {/* Primary Navigation */}
              {PRIMARY_NAVIGATION.map((link, index) => {
                const IconComponent = link.icon;
                const adjustedIndex = ACTION_LINKS.length + index;
                return (
                  <motion.div
                    key={`primary-${link.label}-${index}`}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                    transition={{ delay: STAGGER.medium + adjustedIndex * STAGGER.micro }}
                  >
                    <motion.div
                      whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                      transition={MICROINTERACTIONS.button.transition}
                    >
                      <NavLink
                        href={link.href}
                        isActive={isActive}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          'border-border bg-card flex w-full items-center rounded-xl border',
                          'px-5',
                          'py-4',
                          'text-base font-medium',
                          'transition-all duration-200 ease-out',
                          'hover:border-accent/50 hover:bg-accent/10'
                        )}
                      >
                        {IconComponent ? <IconComponent className="mr-2 h-5 w-5 shrink-0" /> : null}
                        <span>{link.label}</span>
                        {link.isNew ? (
                          <UnifiedBadge
                            variant="new-indicator"
                            label={`New: ${link.label}`}
                            className="ml-auto"
                          />
                        ) : null}
                      </NavLink>
                    </motion.div>
                  </motion.div>
                );
              })}

              {/* Secondary Navigation */}
              <nav
                className="border-border/30 mt-4 border-t pt-6"
                aria-label="Secondary navigation"
              >
                <div className="space-y-3">
                  {SECONDARY_NAVIGATION.flatMap((group) => group.links)
                    .filter((link) => link.label !== 'Pinboard') // Remove pinboard from mobile
                    .map((link, index) => {
                      const IconComponent = link.icon;
                      return (
                        <motion.div
                          key={`secondary-${link.label}-${index}`}
                          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                          transition={{
                            delay:
                              STAGGER.medium + (PRIMARY_NAVIGATION.length + index) * STAGGER.micro,
                          }}
                        >
                          <motion.div
                            whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                            transition={MICROINTERACTIONS.button.transition}
                          >
                            <NavLink
                              href={link.href}
                              isActive={isActive}
                              onClick={() => onOpenChange(false)}
                              className={cn(
                                'border-border/40 bg-card/50 text-muted-foreground flex w-full items-center rounded-xl border',
                                'px-5',
                                'py-4',
                                'text-sm font-medium',
                                'transition-all duration-200 ease-out',
                                'hover:border-accent/30 hover:bg-accent/5 hover:text-foreground'
                              )}
                            >
                              {IconComponent ? (
                                <IconComponent className="mr-2 h-4 w-4 shrink-0" />
                              ) : null}
                              <span>{link.label}</span>
                            </NavLink>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                </div>
              </nav>

              {/* Account Navigation - Only show when authenticated */}
              {user && status !== 'loading' && (
                <nav
                  className="border-border/30 mt-4 border-t pt-6"
                  aria-label="Account navigation"
                >
                  <div className="mb-3 px-3">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase opacity-70">
                      {' '}
                      {/* 10px */}
                      Account
                    </p>
                  </div>
                  <div className="space-y-3">
                    {/* Dashboard */}
                    <motion.div
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                      transition={{
                        delay:
                          STAGGER.medium +
                          (PRIMARY_NAVIGATION.length +
                            SECONDARY_NAVIGATION.flatMap((g) => g.links).filter(
                              (l) => l.label !== 'Pinboard'
                            ).length) *
                            STAGGER.micro,
                      }}
                    >
                      <motion.div
                        whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                        transition={MICROINTERACTIONS.button.transition}
                      >
                        <NavLink
                          href="/account"
                          isActive={isActive}
                          onClick={() => onOpenChange(false)}
                          className={cn(
                            'border-border bg-card flex w-full items-center rounded-xl border',
                            'px-5',
                            'py-4',
                            'text-base font-medium',
                            'transition-all duration-200 ease-out',
                            'hover:border-accent/50 hover:bg-accent/10'
                          )}
                        >
                          <User className="mr-2 h-5 w-5 shrink-0" />
                          <span>Dashboard</span>
                        </NavLink>
                      </motion.div>
                    </motion.div>

                    {/* My Content */}
                    {[
                      { href: '/account/activity', icon: Activity, label: 'Activity' },
                      { href: '/account/library', icon: BookOpen, label: 'Library' },
                      { href: '/account/submissions', icon: Rocket, label: 'Submissions' },
                    ].map((link, index) => {
                      const IconComponent = link.icon;
                      const baseDelay =
                        STAGGER.medium +
                        (PRIMARY_NAVIGATION.length +
                          SECONDARY_NAVIGATION.flatMap((g) => g.links).filter(
                            (l) => l.label !== 'Pinboard'
                          ).length +
                          1) *
                          STAGGER.micro;
                      return (
                        <motion.div
                          key={`account-${link.label}-${index}`}
                          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                          transition={{ delay: baseDelay + index * STAGGER.micro }}
                        >
                          <motion.div
                            whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                            transition={MICROINTERACTIONS.button.transition}
                          >
                            <NavLink
                              href={link.href}
                              isActive={isActive}
                              onClick={() => onOpenChange(false)}
                              className={cn(
                                'border-border/40 bg-card/50 text-muted-foreground flex w-full items-center rounded-xl border',
                                'px-5',
                                'py-4',
                                'text-sm font-medium',
                                'transition-all duration-200 ease-out',
                                'hover:border-accent/30 hover:bg-accent/5 hover:text-foreground'
                              )}
                            >
                              <IconComponent className="mr-2 h-4 w-4 shrink-0" />
                              <span>{link.label}</span>
                            </NavLink>
                          </motion.div>
                        </motion.div>
                      );
                    })}

                    {/* Settings & Account */}
                    {[
                      { href: '/account/settings', icon: Settings, label: 'Settings' },
                      { href: '/account/settings/security', icon: Shield, label: 'Security' },
                      {
                        href: '/account/settings/preferences',
                        icon: SlidersHorizontal,
                        label: 'Preferences',
                      },
                      { href: '/account/data', icon: FileText, label: 'Data & Privacy' },
                      { href: '/account/billing', icon: DollarSign, label: 'Billing' },
                      { href: '/account/analytics', icon: BarChart, label: 'Analytics' },
                      { href: '/account/integrations', icon: Plug, label: 'Integrations' },
                      { href: '/account/support', icon: HelpCircle, label: 'Support' },
                    ].map((link, index) => {
                      const IconComponent = link.icon;
                      const baseDelay =
                        STAGGER.medium +
                        (PRIMARY_NAVIGATION.length +
                          SECONDARY_NAVIGATION.flatMap((g) => g.links).filter(
                            (l) => l.label !== 'Pinboard'
                          ).length +
                          4) *
                          STAGGER.micro;
                      return (
                        <motion.div
                          key={`settings-${link.label}-${index}`}
                          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                          transition={{ delay: baseDelay + index * STAGGER.micro }}
                        >
                          <motion.div
                            whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                            transition={MICROINTERACTIONS.button.transition}
                          >
                            <NavLink
                              href={link.href}
                              isActive={isActive}
                              onClick={() => onOpenChange(false)}
                              className={cn(
                                'border-border/40 bg-card/50 text-muted-foreground flex w-full items-center rounded-xl border',
                                'px-5',
                                'py-4',
                                'text-sm font-medium',
                                'transition-all duration-200 ease-out',
                                'hover:border-accent/30 hover:bg-accent/5 hover:text-foreground'
                              )}
                            >
                              <IconComponent className="mr-2 h-4 w-4 shrink-0" />
                              <span>{link.label}</span>
                            </NavLink>
                          </motion.div>
                        </motion.div>
                      );
                    })}

                    {/* Sign Out */}
                    <motion.div
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                      transition={{
                        delay:
                          STAGGER.medium +
                          (PRIMARY_NAVIGATION.length +
                            SECONDARY_NAVIGATION.flatMap((g) => g.links).filter(
                              (l) => l.label !== 'Pinboard'
                            ).length +
                            12) *
                            STAGGER.micro,
                      }}
                    >
                      <motion.button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                        transition={MICROINTERACTIONS.button.transition}
                        className={cn(
                          'text-destructive border-border/40 bg-card/50 flex w-full items-center rounded-xl border',
                          'px-5',
                          'py-4',
                          'text-sm font-medium',
                          'transition-all duration-200 ease-out',
                          'hover:border-destructive/30 hover:bg-destructive/5'
                        )}
                      >
                        <LogOut className="mr-2 h-4 w-4 shrink-0" />
                        <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
                      </motion.button>
                    </motion.div>
                  </div>
                </nav>
              )}
            </nav>
          </div>

          {/* Footer with spring animation on tap */}
          <motion.div
            className="border-border/30 border-t pt-6 pb-6"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ delay: STAGGER.slow }}
          >
            <div className={cn('grid-cols-3', 'px-4')}>
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
                <motion.div
                  key={item.label}
                  whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                  transition={MICROINTERACTIONS.button.transition}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className={`border-border/40 bg-card h-20 w-full rounded-2xl hover:bg-${item.color}/10 hover:border-${item.color}/30 transition-all duration-200 ease-out`}
                    onClick={item.onClick}
                    aria-label={item.label}
                  >
                    <item.icon className="h-8 w-8" />
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

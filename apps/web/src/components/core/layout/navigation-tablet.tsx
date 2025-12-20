/**
 * Tablet Navigation Component
 * Visible md:flex xl:hidden (768px-1279px)
 * Horizontal scroll with first 5 nav items
 * Uses Popover for dropdowns (click-to-open, better for touch devices)
 */

'use client';

import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '@heyclaude/web-runtime/config/navigation';
import {
  ChevronDown,
  PlusCircle,
  Bookmark,
  Github,
  MessageSquare,
  Search,
} from '@heyclaude/web-runtime/icons';
import {
  PrefetchLink,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  UnifiedBadge,
  AnimatedBorder,
  cn,
} from '@heyclaude/web-runtime/ui';
import { SPRING, MICROINTERACTIONS, STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

import { getSocialLinks } from '@heyclaude/web-runtime/config/marketing-client';
import {
  getCategoryFromHref,
  getIconBackgroundClass,
} from '@heyclaude/web-runtime/utils/navigation-helpers';
import { logUnhandledPromise } from '@heyclaude/web-runtime/errors';
import { usePulse } from '@heyclaude/web-runtime/hooks/use-pulse';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';

import { usePinboardDrawer } from '@/src/components/features/navigation/pinboard-drawer-provider';
import { useCommandPalette } from '@/src/components/features/navigation/command-palette-provider';

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
          className={`bg-accent absolute bottom-0 left-0 h-[2px] transition-all duration-300 ease-out ${
            active ? 'w-full' : 'w-0 group-hover:w-full'
          }`}
          aria-hidden="true"
        />
      </span>
    </PrefetchLink>
  );
};

/**
 * Community Icons Row Component
 * Horizontal row of icon-only buttons for Search, Discord, Pinboard, and GitHub Stars
 */
function CommunityIconsRow({
  openPinboardDrawer,
  isPinboardOpen,
  openCommandPalette,
  isCommandMenuOpen,
}: {
  openPinboardDrawer: () => void;
  isPinboardOpen: boolean;
  openCommandPalette: () => void;
  isCommandMenuOpen: boolean;
}) {
  const pulse = usePulse();
  const SOCIAL_LINK_SNAPSHOT = getSocialLinks();
  const [githubStars, setGithubStars] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Fetch GitHub star count
  useEffect(() => {
    const repoUrl = SOCIAL_LINK_SNAPSHOT.github;
    const apiUrl = (() => {
      try {
        const { pathname, hostname } = new URL(repoUrl);
        if (hostname === 'github.com') {
          const [, owner, repo] = pathname.split('/');
          if (owner && repo) {
            return `https://api.github.com/repos/${owner}/${repo}`;
          }
        }
      } catch {
        // Fall back to default repo
      }
      return 'https://api.github.com/repos/JSONbored/claudepro-directory';
    })();

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        const count =
          data && typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
        setGithubStars(count);
      })
      .catch((error) => {
        const normalized = normalizeError(error, 'Failed to fetch GitHub star count');
        logClientWarn(
          '[GitHub] Failed to fetch star count',
          normalized,
          'CommunityIconsRow.fetchStars',
          {
            component: 'CommunityIconsRow',
            action: 'fetch-star-count',
            category: 'external-api',
            apiUrl,
          }
        );
        setGithubStars(null);
      });
  }, []);

  const handleDiscordClick = () => {
    pulse
      .click({
        category: null,
        slug: null,
        metadata: {
          action: 'external_link',
          link_type: 'discord',
          target_url: 'https://discord.gg/Ax3Py4YDrq',
        },
      })
      .catch((error) => {
        logUnhandledPromise('CommunityIconsRow: Discord click pulse failed', error, {});
      });
    window.open('https://discord.gg/Ax3Py4YDrq', '_blank', 'noopener,noreferrer');
  };

  const handleGitHubClick = () => {
    const repoUrl = SOCIAL_LINK_SNAPSHOT.github;
    pulse
      .click({
        category: null,
        slug: null,
        metadata: {
          action: 'external_link',
          link_type: 'github',
          target_url: repoUrl,
        },
      })
      .catch((error) => {
        logUnhandledPromise('CommunityIconsRow: GitHub click pulse failed', error, { repoUrl });
      });
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={cn('border-border/30 border-t', 'mt-4', 'pt-4')}>
      <div className="flex-center gap-2 px-2">
        {/* Search / Command Menu */}
        <motion.div
          whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.button.hover}
          whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
          transition={MICROINTERACTIONS.button.transition}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={openCommandPalette}
            className={cn(
              'text-muted-foreground hover:text-foreground h-8 w-8',
              isCommandMenuOpen && 'text-accent bg-accent/10'
            )}
            aria-label={isCommandMenuOpen ? 'Close command menu' : 'Open command menu'}
            title="Search navigation (⌘K)"
          >
            <Search className={cn('h-4 w-4', isCommandMenuOpen && 'fill-current')} />
          </Button>
        </motion.div>

        {/* Discord */}
        <motion.div
          whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.button.hover}
          whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
          transition={MICROINTERACTIONS.button.transition}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDiscordClick}
            className="text-muted-foreground hover:text-foreground h-8 w-8"
            aria-label="Join our Discord community"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Pinboard */}
        <motion.div
          whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.button.hover}
          whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
          transition={MICROINTERACTIONS.button.transition}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={openPinboardDrawer}
            className={cn(
              'text-muted-foreground hover:text-foreground h-8 w-8',
              isPinboardOpen && 'text-accent bg-accent/10'
            )}
            aria-label={isPinboardOpen ? 'Close pinboard' : 'Open pinboard'}
          >
            <Bookmark className={cn('h-4 w-4', isPinboardOpen && 'fill-current')} />
          </Button>
        </motion.div>

        {/* GitHub Stars */}
        <motion.div
          whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.button.hover}
          whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
          transition={MICROINTERACTIONS.button.transition}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGitHubClick}
            className="text-muted-foreground hover:text-foreground relative h-8 w-8"
            aria-label={`Star us on GitHub${githubStars !== null ? ` - ${githubStars} stars` : ''}`}
          >
            <Github className="h-4 w-4" />
            {githubStars !== null && (
              <span
                className={cn('absolute -top-1 -right-1', 'text-[10px]', 'text-accent font-medium')}
              >
                {githubStars > 999
                  ? `${(githubStars / 1000).toFixed(1)}k`
                  : githubStars.toLocaleString()}
              </span>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

interface NavigationTabletProps {
  isActive: (path: string) => boolean;
  onMobileMenuOpen: () => void;
}

export function NavigationTablet({ isActive }: NavigationTabletProps) {
  const { openDrawer: openPinboardDrawer, isOpen: isPinboardOpen } = usePinboardDrawer();
  const { openPalette, isOpen: isCommandMenuOpen } = useCommandPalette();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.nav
      className="scrollbar-hide hidden snap-x snap-mandatory overflow-x-auto md:flex xl:hidden"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: DURATION.default, ease: 'easeOut' }}
      aria-label="Tablet navigation"
    >
      <div className={cn('flex', 'items-center gap-1', 'px-3')}>
        {PRIMARY_NAVIGATION.slice(0, 5).map((link, linkIndex) => {
          // Special handling for Jobs dropdown with enhanced design
          if (link.label === 'Jobs' && link.sections) {
            return (
              <motion.div
                key={`nav-${linkIndex}-${link.label}`}
                className="snap-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: linkIndex * STAGGER.micro, duration: DURATION.default }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'group relative flex items-center',
                        'px-3',
                        'py-2',
                        'font-medium',
                        'text-xs',
                        'text-foreground/80 hover:text-foreground',
                        'transition-all duration-200 ease-out',
                        'whitespace-nowrap'
                      )}
                      aria-label={`Open ${link.label} menu`}
                    >
                      <span className="relative">
                        {link.label}
                        <span
                          className="bg-accent absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-300 ease-out group-hover:w-full"
                          aria-hidden="true"
                        />
                      </span>
                      <ChevronDown className={cn('ml-1', 'h-2.5 w-2.5 opacity-50')} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className={cn(
                      'w-[440px]',
                      'p-4',
                      'border-border/60 bg-background/95 relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl'
                    )}
                    sideOffset={8}
                  >
                    {/* Animated gradient border */}
                    <AnimatedBorder
                      colorFrom="rgba(249, 115, 22, 0.4)"
                      colorTo="rgba(249, 115, 22, 0.2)"
                      duration={4}
                      borderWidth={1.5}
                    />
                    <div className="relative z-10 space-y-4">
                      {/* Post a Job Hero Card */}
                      <motion.div
                        whileHover={MICROINTERACTIONS.card.hover}
                        whileTap={MICROINTERACTIONS.card.tap}
                        transition={MICROINTERACTIONS.card.transition}
                      >
                        <Link
                          href="/account/jobs/new"
                          className="group/cta card-base border-accent/20 from-accent/10 to-accent/5 block border-2 bg-gradient-to-br p-4"
                        >
                          <div className={cn('flex items-center gap-3', 'mb-2')}>
                            <div className="flex-center bg-accent/20 group-hover/cta:bg-accent/30 h-10 w-10 rounded-lg transition-colors">
                              <PlusCircle className="text-accent h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold">Post a Job</h3>
                              <p className="text-muted-foreground text-xs">
                                Reach talented developers
                              </p>
                            </div>
                          </div>
                          <p className={cn('text-muted-foreground text-xs', 'mb-4')}>
                            Featured listings available. Premium placement options.
                          </p>
                          <div className="text-xs-medium text-accent flex items-center gap-1">
                            <span>Create Listing</span>
                            <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                          </div>
                        </Link>
                      </motion.div>

                      {/* Quick Links */}
                      <div className="space-y-1">
                        {link.sections[0]?.links.map((child, childIndex) => {
                          const ChildIcon = child.icon;
                          const iconBgClass = getIconBackgroundClass(child.href);
                          return (
                            <motion.div
                              key={`${link.label}-quick-${childIndex}-${child.label}`}
                              whileHover={MICROINTERACTIONS.button.hover}
                              whileTap={MICROINTERACTIONS.button.tap}
                              transition={MICROINTERACTIONS.button.transition}
                            >
                              <Link
                                href={child.href}
                                prefetch
                                className="group/item hover:bg-accent/5 focus:bg-accent/5 block overflow-hidden rounded-lg px-3 py-2 text-sm leading-none no-underline outline-none"
                              >
                                <div className="flex items-start gap-2">
                                  {ChildIcon && (
                                    <motion.div
                                      className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                        iconBgClass
                                      )}
                                      whileHover={{
                                        scale: MICROINTERACTIONS.iconButton.hover.scale,
                                      }}
                                      whileTap={{ scale: MICROINTERACTIONS.iconButton.tap.scale }}
                                      transition={MICROINTERACTIONS.iconButton.transition}
                                    >
                                      <ChildIcon className="h-4 w-4" />
                                    </motion.div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium">{child.label}</div>
                                    {child.description && (
                                      <p
                                        className={cn(
                                          'text-muted-foreground line-clamp-1 text-xs leading-snug',
                                          'mt-0.5'
                                        )}
                                      >
                                        {child.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </motion.div>
            );
          }

          // Special handling for Configs - Hero card layout (tablet optimized)
          if (link.label === 'Configs' && link.sections) {
            return (
              <motion.div
                key={`nav-${linkIndex}-${link.label}`}
                className="snap-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: linkIndex * STAGGER.micro, duration: DURATION.default }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'group relative flex items-center',
                        'px-3',
                        'py-2',
                        'font-medium',
                        'text-xs',
                        'text-foreground/80 hover:text-foreground',
                        'transition-all duration-200 ease-out',
                        'whitespace-nowrap'
                      )}
                      aria-label={`Open ${link.label} menu`}
                    >
                      <span className="relative">
                        {link.label}
                        <span
                          className="bg-accent absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-300 ease-out group-hover:w-full"
                          aria-hidden="true"
                        />
                      </span>
                      <ChevronDown className={cn('ml-1', 'h-2.5 w-2.5 opacity-50')} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className={cn(
                      'w-[720px] xl:w-[800px]',
                      'p-4',
                      'border-border/60 bg-background/95 relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl'
                    )}
                    sideOffset={8}
                  >
                    {/* Animated gradient border with heyclaude orange */}
                    <AnimatedBorder
                      colorFrom="#F97316"
                      colorTo="#FB923C"
                      duration={3}
                      borderWidth={2}
                    />
                    <div className="relative z-10 grid grid-cols-[.6fr_1.4fr] gap-4">
                      {/* Left Column: Hero Card */}
                      <div>
                        <motion.div
                          whileHover={MICROINTERACTIONS.card.hover}
                          whileTap={MICROINTERACTIONS.card.tap}
                          transition={MICROINTERACTIONS.card.transition}
                        >
                          <Link
                            href="/tools/config-recommender"
                            className="group/hero card-base border-border/50 bg-card/50 block p-4"
                          >
                            <div className="mb-4">
                              <h3 className={cn('text-base font-semibold', 'mb-1')}>
                                {link.label}
                              </h3>
                              <p className="text-muted-foreground text-sm leading-tight">
                                {link.description ||
                                  'Browse all configuration types for Claude Code'}
                              </p>
                            </div>
                            <div className="text-xs-medium text-accent flex items-center gap-1">
                              <span>Explore All</span>
                              <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                            </div>
                          </Link>
                        </motion.div>
                      </div>

                      {/* Right Column: Multi-column sections */}
                      <div>
                        {(() => {
                          const allLinks = link.sections!.flatMap((section) =>
                            section.links.map((child) => ({
                              ...child,
                              sectionHeading: section.heading,
                            }))
                          );

                          const itemsPerColumn = 4;
                          const columns: Array<Array<(typeof allLinks)[0]>> = [];
                          for (let i = 0; i < allLinks.length; i += itemsPerColumn) {
                            columns.push(allLinks.slice(i, i + itemsPerColumn));
                          }

                          return (
                            <div
                              className={cn(
                                'grid gap-4',
                                columns.length === 1
                                  ? 'grid-cols-1'
                                  : columns.length === 2
                                    ? 'grid-cols-2'
                                    : 'grid-cols-3'
                              )}
                            >
                              {columns.map((columnLinks, colIndex) => (
                                <div
                                  key={`${link.label}-column-${colIndex}`}
                                  className="scrollbar-hide max-h-[280px] space-y-2 overflow-x-hidden overflow-y-auto"
                                >
                                  {columnLinks.map((child, childIndex) => {
                                    const category = getCategoryFromHref(child.href);
                                    const ChildIcon = child.icon;
                                    const isLastInColumn = childIndex === columnLinks.length - 1;
                                    return (
                                      <div
                                        key={`${link.label}-${child.label}-${colIndex}-${childIndex}`}
                                      >
                                        <motion.div
                                          initial={{ opacity: 0, y: 4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{
                                            ...SPRING.smooth,
                                            delay:
                                              (colIndex * itemsPerColumn + childIndex) *
                                              STAGGER.micro,
                                          }}
                                        >
                                          <motion.div
                                            whileHover={MICROINTERACTIONS.card.hover}
                                            whileTap={MICROINTERACTIONS.card.tap}
                                            transition={MICROINTERACTIONS.card.transition}
                                          >
                                            <Link
                                              href={child.href}
                                              prefetch
                                              className={cn(
                                                'group/item block rounded-lg',
                                                'px-2.5',
                                                'py-3',
                                                'text-sm leading-none no-underline outline-none',
                                                'hover:bg-accent/20',
                                                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                                'overflow-hidden'
                                              )}
                                            >
                                              <div
                                                className={cn(
                                                  'flex items-center gap-2',
                                                  'mb-0.5',
                                                  'flex-wrap'
                                                )}
                                              >
                                                {ChildIcon && (
                                                  <div className="flex-center bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground h-6 w-6 shrink-0 rounded-lg">
                                                    <ChildIcon className="h-3.5 w-3.5" />
                                                  </div>
                                                )}
                                                <div className="word-break-break-word font-medium break-words">
                                                  {child.label}
                                                </div>
                                                {category && (
                                                  <UnifiedBadge
                                                    variant="category"
                                                    category={category}
                                                    href={null}
                                                    className={cn(
                                                      'shrink-0',
                                                      'text-[10px]',
                                                      'px-1.5',
                                                      'py-0'
                                                    )}
                                                  />
                                                )}
                                                {child.isNew && (
                                                  <UnifiedBadge
                                                    variant="new-badge"
                                                    badgeVariant="default"
                                                    className="shrink-0"
                                                  />
                                                )}
                                                {child.external && (
                                                  <span
                                                    className={cn(
                                                      'text-muted-foreground shrink-0 text-xs',
                                                      'ml-auto'
                                                    )}
                                                  >
                                                    ↗
                                                  </span>
                                                )}
                                              </div>
                                              {child.description && (
                                                <p
                                                  className={cn(
                                                    'text-muted-foreground',
                                                    'text-[11px]',
                                                    'word-break-break-word line-clamp-1 leading-snug break-words',
                                                    'ml-8'
                                                  )}
                                                >
                                                  {child.description}
                                                </p>
                                              )}
                                            </Link>
                                          </motion.div>
                                        </motion.div>
                                        {!isLastInColumn && (
                                          <div className="bg-border/30 my-0.5 h-px" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </motion.div>
            );
          }

          // Special handling for Discover, Resources, Contribute - Enhanced with descriptions
          if (
            (link.label === 'Discover' ||
              link.label === 'Resources' ||
              link.label === 'Contribute') &&
            link.sections
          ) {
            const { value: isOpen, setValue: setIsOpen } = useBoolean();
            const [animationKey, setAnimationKey] = useState(0);

            useEffect(() => {
              if (isOpen) {
                // Force remount of animated children when popover opens
                setAnimationKey((prev) => prev + 1);
              }
            }, [isOpen]);

            return (
              <motion.div
                key={`nav-${linkIndex}-${link.label}`}
                className="snap-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: linkIndex * STAGGER.micro, duration: DURATION.default }}
              >
                <Popover onOpenChange={setIsOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'group relative flex items-center',
                        'px-3',
                        'py-2',
                        'font-medium',
                        'text-xs',
                        'text-foreground/80 hover:text-foreground',
                        'transition-all duration-200 ease-out',
                        'whitespace-nowrap'
                      )}
                      aria-label={`Open ${link.label} menu`}
                    >
                      <span className="relative">
                        {link.label}
                        <span
                          className="bg-accent absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-300 ease-out group-hover:w-full"
                          aria-hidden="true"
                        />
                      </span>
                      <ChevronDown className={cn('ml-1', 'h-2.5 w-2.5 opacity-50')} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className={cn(
                      'w-[480px]',
                      'lg:w-[600px]',
                      'p-4',
                      'border-border/60 bg-background/95 relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl'
                    )}
                    sideOffset={8}
                  >
                    {/* Animated gradient border with heyclaude orange */}
                    <AnimatedBorder
                      colorFrom="#F97316"
                      colorTo="#FB923C"
                      duration={3}
                      borderWidth={2}
                    />
                    <AnimatePresence mode="wait">
                      {isOpen && (
                        <motion.ul
                          key={animationKey}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: DURATION.micro }}
                          className={cn(
                            'relative z-10 grid',
                            'space-y-3',
                            'sm:w-[400px]',
                            'md:w-[480px]',
                            'md:grid-cols-2',
                            'lg:w-[600px]'
                          )}
                        >
                          {link.sections.map((section, sectionIndex) => (
                            <li key={`${link.label}-section-${sectionIndex}-${section.heading}`}>
                              <div className="mb-2">
                                <p
                                  className={cn(
                                    'text-[10px]',
                                    'font-semibold',
                                    'text-muted-foreground',
                                    'uppercase opacity-70',
                                    'tracking-wide',
                                    'px-3'
                                  )}
                                >
                                  {section.heading}
                                </p>
                              </div>
                              <div className="space-y-1">
                                {section.links.map((child, childIndex) => {
                                  const ChildIcon = child.icon;
                                  return (
                                    <motion.div
                                      key={`${animationKey}-${link.label}-${section.heading}-${child.label}`}
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{
                                        ...SPRING.smooth,
                                        delay: childIndex * STAGGER.micro, // Using micro for 30ms
                                      }}
                                    >
                                      <motion.div
                                        whileHover={MICROINTERACTIONS.card.hover}
                                        whileTap={MICROINTERACTIONS.card.tap}
                                        transition={MICROINTERACTIONS.card.transition}
                                      >
                                        <Link
                                          href={child.href}
                                          prefetch
                                          className={cn(
                                            'group/item block rounded-lg',
                                            'px-3',
                                            'py-2.5',
                                            'text-sm leading-none no-underline outline-none',
                                            'hover:bg-accent/20',
                                            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                                          )}
                                        >
                                          <div className="flex items-start gap-2">
                                            {ChildIcon && (
                                              <div className="flex-center bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground h-8 w-8 shrink-0 rounded-lg">
                                                <ChildIcon className="h-4 w-4" />
                                              </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                              <div
                                                className={cn(
                                                  'flex items-center gap-2',
                                                  'mb-0.5',
                                                  'flex-wrap'
                                                )}
                                              >
                                                <div className="word-break-break-word font-medium break-words">
                                                  {child.label}
                                                </div>
                                                {(() => {
                                                  const category = getCategoryFromHref(child.href);
                                                  return category ? (
                                                    <UnifiedBadge
                                                      variant="category"
                                                      category={category}
                                                      href={null}
                                                      className={cn(
                                                        'shrink-0',
                                                        'text-[10px]',
                                                        'px-1.5',
                                                        'py-0'
                                                      )}
                                                    />
                                                  ) : null;
                                                })()}
                                                {child.isNew && (
                                                  <UnifiedBadge
                                                    variant="new-badge"
                                                    badgeVariant="default"
                                                    className="shrink-0"
                                                  />
                                                )}
                                                {child.external && (
                                                  <span
                                                    className={cn(
                                                      'text-muted-foreground shrink-0 text-xs',
                                                      'ml-auto'
                                                    )}
                                                  >
                                                    ↗
                                                  </span>
                                                )}
                                              </div>
                                              {child.description && (
                                                <p className="text-muted-foreground word-break-break-word line-clamp-2 text-xs leading-snug break-words">
                                                  {child.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </Link>
                                      </motion.div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </PopoverContent>
                </Popover>
              </motion.div>
            );
          }

          // Check if link has dropdown content (sections or children)
          const hasDropdown =
            (link.sections && link.sections.length > 0) ||
            (link.children && link.children.length > 0);

          // Render dropdown with Popover for touch-friendly interaction
          if (hasDropdown) {
            return (
              <motion.div
                key={`nav-${linkIndex}-${link.label}`}
                className="snap-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: linkIndex * STAGGER.micro, duration: DURATION.default }}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'group relative flex items-center',
                        'px-3',
                        'py-2',
                        'font-medium',
                        'text-xs',
                        'text-foreground/80 hover:text-foreground',
                        'transition-all duration-200 ease-out',
                        'whitespace-nowrap'
                      )}
                      aria-label={`Open ${link.label} menu`}
                    >
                      <span className="relative">
                        {link.label}
                        <span
                          className="bg-accent absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-300 ease-out group-hover:w-full"
                          aria-hidden="true"
                        />
                      </span>
                      <ChevronDown className={cn('ml-1', 'h-2.5 w-2.5 opacity-50')} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className={cn(
                      'w-64',
                      'p-3',
                      'border-border/60 bg-background/95 relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl'
                    )}
                    sideOffset={8}
                  >
                    {/* Animated gradient border with heyclaude orange */}
                    <AnimatedBorder
                      colorFrom="#F97316"
                      colorTo="#FB923C"
                      duration={3}
                      borderWidth={2}
                    />
                    <div className="relative z-10">
                      {link.sections ? (
                        // Organized sections with headers
                        <div className="space-y-4">
                          {link.sections.map((section, sectionIndex) => (
                            <div key={`${link.label}-section-${sectionIndex}-${section.heading}`}>
                              {/* Section header */}
                              <div className={cn('px-3', 'py-2', 'mb-1.5')}>
                                <p
                                  className={cn(
                                    'text-[10px]',
                                    'font-semibold',
                                    'text-muted-foreground',
                                    'uppercase opacity-70',
                                    'tracking-wide'
                                  )}
                                >
                                  {section.heading}
                                </p>
                              </div>
                              {/* Section items */}
                              <div className="space-y-1">
                                {section.links.map((child, childIndex) => {
                                  const ChildIcon = child.icon;
                                  const iconBgClass = getIconBackgroundClass(child.href);
                                  return (
                                    <motion.div
                                      key={`${link.label}-section-${sectionIndex}-${section.heading}-${child.label}`}
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{
                                        ...SPRING.smooth,
                                        delay: childIndex * STAGGER.micro, // Using micro for 30ms
                                      }}
                                    >
                                      <motion.div
                                        whileHover={MICROINTERACTIONS.card.hover}
                                        whileTap={MICROINTERACTIONS.card.tap}
                                        transition={MICROINTERACTIONS.card.transition}
                                      >
                                        <Link
                                          href={child.href}
                                          prefetch
                                          className={cn(
                                            'group/item block rounded-lg',
                                            'px-3',
                                            'py-2.5',
                                            'text-sm leading-none no-underline outline-none',
                                            'hover:bg-accent/20',
                                            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                                          )}
                                        >
                                          <div className="flex items-start gap-2">
                                            {ChildIcon && (
                                              <div
                                                className={cn(
                                                  'flex-center h-8 w-8 shrink-0 rounded-lg',
                                                  iconBgClass
                                                )}
                                              >
                                                <ChildIcon className="h-4 w-4" />
                                              </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                              <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                                                <div className="word-break-break-word font-medium break-words">
                                                  {child.label}
                                                </div>
                                                {(() => {
                                                  const category = getCategoryFromHref(child.href);
                                                  return category ? (
                                                    <UnifiedBadge
                                                      variant="category"
                                                      category={category}
                                                      href={null}
                                                      className={cn(
                                                        'shrink-0',
                                                        'text-[10px]',
                                                        'px-1.5',
                                                        'py-0'
                                                      )}
                                                    />
                                                  ) : null;
                                                })()}
                                                {child.isNew && (
                                                  <UnifiedBadge
                                                    variant="new-badge"
                                                    badgeVariant="default"
                                                    className="shrink-0"
                                                  />
                                                )}
                                                {child.external && (
                                                  <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                                                    ↗
                                                  </span>
                                                )}
                                              </div>
                                              {child.description && (
                                                <p className="text-muted-foreground word-break-break-word line-clamp-2 text-xs leading-snug break-words">
                                                  {child.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </Link>
                                      </motion.div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                              {/* Separator between sections (except last) */}
                              {link.sections && sectionIndex < link.sections.length - 1 && (
                                <div className={cn('mt-4', 'mb-0', 'bg-border/50 h-px')} />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : link.children ? (
                        // Fallback: flat list for links without sections
                        <div className="space-y-3.5">
                          {link.children.map((child, childIndex) => {
                            const ChildIcon = child.icon;
                            return (
                              <motion.div
                                key={`${link.label}-child-${childIndex}-${child.label}`}
                                whileHover={MICROINTERACTIONS.button.hover}
                                whileTap={MICROINTERACTIONS.button.tap}
                                transition={MICROINTERACTIONS.button.transition}
                              >
                                <Link
                                  href={child.href}
                                  prefetch
                                  className="hover:bg-accent/5 group/item flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm"
                                >
                                  {ChildIcon && (
                                    <motion.div
                                      className="flex-center h-6 w-6 shrink-0 rounded-lg opacity-70 group-hover/item:opacity-100"
                                      whileHover={MICROINTERACTIONS.iconButton.hover}
                                      whileTap={MICROINTERACTIONS.iconButton.tap}
                                      transition={MICROINTERACTIONS.iconButton.transition}
                                    >
                                      <ChildIcon className="text-muted-foreground group-hover/item:text-foreground h-4 w-4 transition-colors" />
                                    </motion.div>
                                  )}
                                  <span className="flex-1">{child.label}</span>
                                  {child.isNew && (
                                    <UnifiedBadge
                                      variant="new-indicator"
                                      label={`New: ${child.label}`}
                                    />
                                  )}
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </PopoverContent>
                </Popover>
              </motion.div>
            );
          }

          // Render regular link for items without dropdowns
          return (
            <motion.div
              key={`nav-${linkIndex}-${link.label}`}
              className="snap-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: linkIndex * STAGGER.micro, duration: DURATION.default }}
            >
              <NavLink
                href={link.href}
                isActive={isActive}
                className="px-2 py-1 text-xs whitespace-nowrap"
              >
                {link.isNew ? (
                  <span className={cn('flex items-center gap-2', 'gap-1.5')}>
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
        {/* More dropdown - matches desktop */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'group relative flex items-center',
                'px-3',
                'py-2',
                'font-medium',
                'text-xs',
                'text-foreground/80 hover:text-foreground',
                'transition-all duration-200 ease-out',
                'whitespace-nowrap'
              )}
              aria-label="Open additional navigation menu"
            >
              <span className="relative">
                More
                <span
                  className="bg-accent absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-300 ease-out group-hover:w-full"
                  aria-hidden="true"
                />
              </span>
              <ChevronDown className="ml-0.5 h-2.5 w-2.5 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className={cn(
              'w-80',
              'p-4',
              'border-border/60 bg-background/95 relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl'
            )}
            sideOffset={8}
          >
            {/* Subtle animated gradient border */}
            <AnimatedBorder
              colorFrom="rgba(249, 115, 22, 0.4)"
              colorTo="rgba(249, 115, 22, 0.2)"
              duration={4}
              borderWidth={1.5}
            />
            {/* Support group with enhanced layout */}
            <div className={cn('relative z-10', 'space-y-3')}>
              {SECONDARY_NAVIGATION.map((group, groupIndex) => {
                const isLastGroup = groupIndex === SECONDARY_NAVIGATION.length - 1;
                return (
                  <div key={group.heading}>
                    <div
                      className={cn(
                        'text-[10px]',
                        'font-semibold',
                        'text-muted-foreground',
                        'uppercase',
                        'tracking-wide',
                        'px-3',
                        'py-1.5',
                        'mb-2'
                      )}
                    >
                      {group.heading}
                    </div>
                    <ul className="grid gap-0.5">
                      {group.links
                        // Filter out Pinboard, Discord, and GitHub from vertical list (they'll be in horizontal icon row at bottom)
                        .filter((link) => {
                          if (group.heading === 'Community') {
                            return (
                              link.label !== 'Pinboard' &&
                              link.label !== 'Discord' &&
                              link.label !== 'GitHub'
                            );
                          }
                          return true;
                        })
                        .map((link, linkIndex) => {
                          const LinkIcon = link.icon;

                          return (
                            <Fragment key={`${group.heading}-${link.label}-fragment`}>
                              {linkIndex > 0 && (
                                <li key={`${group.heading}-${link.label}-divider`}>
                                  <div className="bg-border/30 mx-2 my-0.5 h-px" />
                                </li>
                              )}
                              <li key={`${group.heading}-${link.label}`}>
                                <motion.div
                                  whileHover={{
                                    ...MICROINTERACTIONS.card.hover,
                                    backgroundColor: 'rgba(249, 115, 22, 0.05)', // Preserve exact original background (accent/5)
                                    y: 0, // Preserve original (no y movement for these links)
                                  }}
                                  whileTap={MICROINTERACTIONS.card.tap}
                                  transition={MICROINTERACTIONS.card.transition}
                                >
                                  <Link
                                    href={link.href}
                                    prefetch={!link.external}
                                    {...(link.external && {
                                      target: '_blank',
                                      rel: 'noopener noreferrer',
                                    })}
                                    className="group/item focus:bg-accent/5 block rounded-lg px-3 py-2.5 text-sm leading-none no-underline outline-none"
                                  >
                                    <div className="flex items-start gap-2">
                                      {LinkIcon && (
                                        <div className="flex-center bg-muted/50 text-muted-foreground group-hover/item:bg-muted group-hover/item:text-foreground h-8 w-8 shrink-0 rounded-lg">
                                          <LinkIcon className="h-4 w-4" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1 overflow-hidden">
                                        <div className={cn('font-medium', 'mb-0.5', 'break-words')}>
                                          {link.label}
                                        </div>
                                        {link.description && (
                                          <p className="text-muted-foreground line-clamp-2 text-xs leading-snug break-words">
                                            {link.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                </motion.div>
                              </li>
                            </Fragment>
                          );
                        })}
                    </ul>
                    {!isLastGroup && <div className="bg-border/40 mx-1 my-4 h-px" />}
                  </div>
                );
              })}
            </div>

            {/* Horizontal icon row at bottom: Search, Discord, Pinboard, GitHub Stars */}
            <CommunityIconsRow
              openPinboardDrawer={openPinboardDrawer}
              isPinboardOpen={isPinboardOpen}
              openCommandPalette={openPalette}
              isCommandMenuOpen={isCommandMenuOpen}
            />
          </PopoverContent>
        </Popover>
      </div>
    </motion.nav>
  );
}

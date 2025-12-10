'use client';

/**
 * Homepage Hero Client Wrapper
 *
 * Client component that wraps the server hero component and connects it
 * to the search interaction context for coordinated animations.
 */

import { 
  NumberTicker, 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import { MICROINTERACTIONS, ANIMATIONS } from '@heyclaude/web-runtime/design-system';
import { SCROLL_ANIMATIONS, VIEWPORT, STAGGER } from '@heyclaude/web-runtime/design-system';
import { getCategoryConfigs, getCategoryStatsConfig } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import dynamicImport from 'next/dynamic';
import Link from 'next/link';
import { memo, useMemo } from 'react';

import { useHeroSearchConnection } from './hero-search-connection';
import { MagneticSearchWrapper } from './magnetic-search-wrapper';

const RollingText = dynamicImport(
  () => import('@heyclaude/web-runtime/ui').then((mod) => ({ default: mod.RollingText })),
  {
    loading: () => <span style={{ color: 'var(--claude-orange)' }}>enthusiasts</span>,
  }
);

interface HomepageHeroClientProps {
  memberCount: number;
  stats?: Record<string, { featured: number; total: number } | number>;
}

function HomepageHeroClientComponent({ 
  memberCount,
  stats = {},
}: HomepageHeroClientProps) {
  const { isSearchFocused, searchProps } = useHeroSearchConnection();

  const categoryStatsConfig = useMemo(() => getCategoryStatsConfig(), []);
  const categoryConfigs = useMemo(() => getCategoryConfigs(), []);

  // Hero scroll-linked fade: Content fades as user scrolls down
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(
    scrollYProgress,
    [...SCROLL_ANIMATIONS.presets.heroFade.input],
    [...SCROLL_ANIMATIONS.presets.heroFade.output]
  );
  const heroScale = useTransform(
    scrollYProgress,
    [...SCROLL_ANIMATIONS.presets.heroScale.input],
    [...SCROLL_ANIMATIONS.presets.heroScale.output]
  );
  // Smooth the animations with spring physics for fluid feel
  // Note: useSpring expects MotionValue<number>, heroOpacity/heroScale are already MotionValue<number>
  const smoothOpacity = useSpring(heroOpacity as any, {
    ...SPRING.hero,
    restDelta: 0.001,
  });
  const smoothScale = useSpring(heroScale as any, {
    ...SPRING.hero,
    restDelta: 0.001,
  });

  return (
    <section
      className="border-border/50 relative border-b overflow-hidden min-h-[500px]"
      aria-label="Homepage hero"
    >
      <motion.div
        key={isSearchFocused ? 'focused' : 'unfocused'}
        className="relative z-10 container mx-auto px-4 py-10 sm:py-16 lg:py-20"
        {...(isSearchFocused
          ? {
              animate: {
                opacity: MICROINTERACTIONS.hero.focused.opacity,
                scale: MICROINTERACTIONS.hero.focused.scale,
              },
            }
          : {
              // Scroll-linked fade: Apply scroll fade when not search-focused
              style: {
                opacity: smoothOpacity,
                scale: smoothScale,
              },
            })}
        transition={MICROINTERACTIONS.hero.transition}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-3xl leading-tight font-bold tracking-tight sm:mb-6 sm:text-4xl sm:leading-tight lg:text-5xl lg:leading-tight">
            <span className="block">The ultimate directory for Claude</span>
            <RollingText
              words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
              duration={3000}
              className="block"
              style={{ color: 'var(--claude-orange)' }}
            />
          </h1>

          <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-lg lg:text-xl mb-8">
            Join{' '}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <NumberTicker value={memberCount} className="font-semibold" style={{ color: 'var(--claude-orange)' }} suffix="+" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Active community members who have contributed configurations, rules, or content to the directory
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>{' '}
            members discovering and sharing the best Claude configurations. Explore expert rules,
            powerful MCP servers, specialized agents, automation hooks, and connect with the
            community building the future of AI.
          </p>

          {/* Search Bar - Directly below sub-heading */}
          {searchProps && (
            <div className="mx-auto max-w-4xl mb-6">
              <MagneticSearchWrapper
                placeholder="Search for rules, MCP servers, agents, commands, and more..."
                {...searchProps}
                enableMagnetic={true}
                enableExpansion={true}
              />
            </div>
          )}

          {/* Quick Stats - Below Search Bar - Smaller and without background */}
          {stats && Object.keys(stats).length > 0 && (
            <>
              {/* Mobile Stats - Compact horizontal scroll carousel */}
              <TooltipProvider delayDuration={300}>
                <motion.div
                  className="scrollbar-hide mt-4 overflow-x-auto md:hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...ANIMATIONS.spring.smooth, delay: 0.3 }}
                >
                  <div className="flex gap-2 px-4 pb-2">
                    {categoryStatsConfig.slice(0, 5).map(({ categoryId, delay }, index) => {
                      const categoryRoute = ROUTES[categoryId.toUpperCase() as keyof typeof ROUTES];
                      const count =
                        typeof stats[categoryId] === 'number'
                          ? stats[categoryId]
                          : stats[categoryId]?.total || 0;
                      const categoryConfig = categoryConfigs[categoryId];
                      const tooltipText = categoryConfig?.description || `View all ${categoryId} configurations`;

                      return (
                        <Tooltip key={categoryId}>
                          <TooltipTrigger asChild>
                            <Link href={categoryRoute}>
                              <motion.div
                                className="flex min-w-fit items-center gap-1.5 rounded-md border border-border/30 px-2 py-1 whitespace-nowrap transition-colors cursor-help bg-transparent"
                                initial={{ opacity: 0, x: -8 }}
                                whileInView={{ 
                                  opacity: 1, 
                                  x: 0,
                                }}
                                viewport={VIEWPORT.default}
                                transition={{
                                  delay: index * STAGGER.fast,
                                  ...ANIMATIONS.spring.smooth,
                                }}
                                whileHover={{
                                  scale: MICROINTERACTIONS.button.hover.scale,
                                  borderColor: 'rgba(249, 115, 22, 0.5)',
                                  transition: MICROINTERACTIONS.button.transition,
                                }}
                                whileTap={{
                                  scale: MICROINTERACTIONS.button.tap.scale,
                                  transition: MICROINTERACTIONS.button.transition,
                                }}
                              >
                                <UnifiedBadge
                                  variant="category"
                                  category={categoryId}
                                  href={null}
                                  className="shrink-0 text-xs"
                                />
                                <NumberTicker
                                  value={count}
                                  delay={delay}
                                  className="text-xs font-semibold tabular-nums"
                                />
                              </motion.div>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs text-center">
                            {tooltipText}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </motion.div>
              </TooltipProvider>

              {/* Desktop Stats - Smaller design without background */}
              <TooltipProvider delayDuration={300}>
                <div className="mt-4 hidden flex-wrap justify-center gap-2 md:flex lg:gap-2">
                  {categoryStatsConfig.map(({ categoryId, delay }, index) => {
                    const categoryRoute = ROUTES[categoryId.toUpperCase() as keyof typeof ROUTES];
                    const count =
                      typeof stats[categoryId] === 'number'
                        ? stats[categoryId]
                        : stats[categoryId]?.total || 0;
                    const categoryConfig = categoryConfigs[categoryId];
                    const tooltipText = categoryConfig?.description || `View all ${categoryId} configurations`;

                    return (
                      <Tooltip key={categoryId}>
                        <TooltipTrigger asChild>
                          <Link
                            href={categoryRoute}
                            className="group no-underline"
                            aria-label={`View all ${categoryId} configurations`}
                          >
                            <motion.div
                              className="group flex items-center gap-1.5 rounded-md border border-border/30 px-2 py-1 transition-colors cursor-help bg-transparent"
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ 
                                opacity: 1, 
                                y: 0,
                              }}
                              viewport={VIEWPORT.default}
                              transition={{
                                delay: index * STAGGER.fast,
                                ...ANIMATIONS.spring.smooth,
                              }}
                              whileHover={{
                                scale: MICROINTERACTIONS.button.hover.scale,
                                borderColor: 'rgba(249, 115, 22, 0.5)',
                                transition: MICROINTERACTIONS.button.transition,
                              }}
                              whileTap={{
                                scale: MICROINTERACTIONS.button.tap.scale,
                                transition: MICROINTERACTIONS.button.transition,
                              }}
                            >
                              <UnifiedBadge
                                variant="category"
                                category={categoryId}
                                href={null}
                                className="shrink-0 text-xs"
                              />
                              <NumberTicker
                                value={count}
                                delay={delay}
                                className="text-xs font-semibold tabular-nums"
                              />
                            </motion.div>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-center">
                          {tooltipText}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
}

export const HomepageHeroClient = memo(HomepageHeroClientComponent);

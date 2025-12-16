'use client';

/**
 * Homepage Hero Client Component
 *
 * Absolutely stunning, responsive hero section with integrated search bar, Terminal component,
 * and partner marquee. Follows modern 2025 SaaS design standards (Vercel, Linear, Raycast,
 * Claude/Anthropic patterns) with OKLCH colors, spring animations, and semantic design tokens.
 *
 * Features:
 * - Stunning responsive typography hierarchy with perfect scaling
 * - Integrated search bar (elegantly positioned, optimal UX)
 * - Partner marquee ("Trusted by") at bottom (feature-flagged)
 * - Smooth spring animations with perfect stagger timing
 * - Search focus coordination (hero dims when search focused)
 * - Subtle visual polish and depth
 * - Accessible (respects prefers-reduced-motion)
 * - Beautiful at every breakpoint
 * - Hero text: "Claude <RollingText>" on same line on desktop
 * - Brand color consistency: member count and RollingText use exact logo color
 */

import { 
  NumberTicker, 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger,
  UnifiedBadge,
  HighlightText,
  cn,
  ScrambledText,
} from '@heyclaude/web-runtime/ui';
import { 
  SPRING, 
  STAGGER, 
  MICROINTERACTIONS,
  VIEWPORT, paddingX, paddingTop, paddingBottom, marginX, marginBottom, gap, paddingY, maxWidth, size, weight, leading, tracking, gradient } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { getCategoryConfigs, getCategoryStatsConfig } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import Link from 'next/link';

import { useHeroSearchConnection } from './hero-search-connection';
import { HomepageSearchBar } from './homepage-search-wrapper';
import { HeroPartners } from './hero-partners';

interface HomepageHeroClientProps {
  memberCount: number;
  stats?: Record<string, { featured: number; total: number } | number>;
}

function HomepageHeroClientComponent({ 
  memberCount,
  stats,
}: HomepageHeroClientProps) {
  const { isSearchFocused, setSearchFocused } = useHeroSearchConnection();
  const shouldReduceMotion = useReducedMotion();
  
  // OPTIMIZATION: Memoize category configs to avoid recreating on every render
  // React Compiler will automatically optimize this, but explicit memoization ensures stability
  const categoryStatsConfig = useMemo(() => getCategoryStatsConfig(), []);
  const categoryConfigs = useMemo(() => getCategoryConfigs(), []);

  return (
    <section
      className="border-border/50 relative border-b overflow-hidden bg-background"
      aria-label="Homepage hero"
    >
      {/* Subtle Background Texture - Modern 2025 Pattern */}
      {!shouldReduceMotion && (
        <div 
          className={`absolute inset-0 opacity-[0.015] dark:opacity-[0.03] ${gradient.heroTexture}`}
          aria-hidden="true"
        />
      )}

      {/* Hero Content Container */}
      <motion.div
        key={isSearchFocused ? 'focused' : 'unfocused'}
        className={`relative z-10 flex flex-col ${paddingTop.hero} ${paddingBottom.hero} sm:${paddingTop.heroLarge} sm:${paddingBottom.heroLarge} lg:${paddingTop.heroXLarge} lg:${paddingBottom.heroXLarge}`}
        {...(isSearchFocused
          ? {
              animate: shouldReduceMotion
                ? { opacity: MICROINTERACTIONS.hero.focused.opacity }
                : {
                    opacity: MICROINTERACTIONS.hero.focused.opacity,
                    scale: MICROINTERACTIONS.hero.focused.scale,
                  },
            }
          : {
              animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 },
            })}
        transition={MICROINTERACTIONS.hero.transition}
      >
        <div className={`container ${marginX.auto} ${paddingX.default} sm:${paddingX.comfortable} lg:${paddingX.relaxed}`}>
          <div className={`${marginX.auto} ${maxWidth['4xl']}`}>
            {/* Hero Content - Centered with Perfect Hierarchy */}
            <div className="text-center">
              {/* Main Heading - Stunning Typography */}
              <div className={`${marginBottom.default} sm:${marginBottom.comfortable} lg:${marginBottom.relaxed}`}>
                <motion.h1
                  className={`flex items-center justify-center ${size['3xl']} sm:${size['4xl']} lg:${size['5xl']} ${weight.bold} ${leading.tight} ${tracking.tight} text-foreground ${marginBottom.compact} sm:${marginBottom.default}`}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING.hero,
                    delay: STAGGER.tight,
                  }}
                >
                  <motion.span 
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{
                      ...SPRING.smooth,
                      delay: STAGGER.tight + STAGGER.micro * 0.5,
                    }}
                  >
                    The ultimate directory for
                  </motion.span>
                </motion.h1>
                <motion.h1
                  className={`flex items-center justify-center ${size['3xl']} sm:${size['4xl']} lg:${size['5xl']} ${weight.bold} ${leading.tight} ${tracking.tight} text-foreground ${gap.compact}`}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING.hero,
                    delay: STAGGER.tight + STAGGER.micro * 0.5,
                  }}
                >
                  <motion.span
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{
                      ...SPRING.smooth,
                      delay: STAGGER.tight + STAGGER.micro,
                    }}
                    className="whitespace-nowrap"
                  >
                    Claude
                  </motion.span>
                  <motion.span
                    initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                    transition={{
                      ...SPRING.smooth,
                      delay: STAGGER.tight + STAGGER.micro * 1.2,
                    }}
                    className="whitespace-nowrap"
                  >
                    <HighlightText
                      text="creators"
                      inView={!shouldReduceMotion}
                      inViewOnce={true}
                      transition={{
                        duration: 2,
                        ease: 'easeInOut',
                      }}
                    />
                  </motion.span>
                </motion.h1>
              </div>

              {/* Description - Enhanced Readability with Scrambled Text */}
              <motion.div
                className={`text-muted-foreground ${marginX.auto} ${maxWidth['2xl']} ${size.base} sm:${size.lg} lg:${size.xl} ${leading.relaxed} ${weight.normal} ${marginBottom.comfortable} sm:${marginBottom.loose} lg:${marginBottom.hero}`}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{
                  ...SPRING.smooth,
                  delay: STAGGER.tight + STAGGER.micro * 1.5,
                }}
              >
                <ScrambledText
                  radius={100}
                  duration={1.2}
                  speed={0.5}
                  scrambleChars=".:"
                  className="block"
                >
                  Join{' '}
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help font-semibold inline-block">
                          <HighlightText
                            text={`${memberCount}+`}
                            inView={!shouldReduceMotion}
                            inViewOnce={true}
                            transition={{
                              duration: 2,
                              ease: 'easeInOut',
                            }}
                          />
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
                </ScrambledText>
              </motion.div>

              {/* Search Bar - Integrated with Perfect Spacing */}
              <motion.div
                className={`${marginX.auto} ${maxWidth['2xl']} ${marginBottom.default} sm:${marginBottom.comfortable}`}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{
                  ...SPRING.smooth,
                  delay: STAGGER.tight + STAGGER.micro * 2.5,
                }}
              >
                <HomepageSearchBar onFocusChange={setSearchFocused} />
              </motion.div>

              {/* Category Stats Section - Directly Below Search Bar */}
              {stats && typeof stats === 'object' && Object.keys(stats).length > 0 && (
                <motion.div
                  className={`${marginX.auto} ${maxWidth['4xl']} ${marginBottom.comfortable} sm:${marginBottom.loose} lg:${marginBottom.hero}`}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING.smooth,
                    delay: STAGGER.tight + STAGGER.micro * 3,
                  }}
                >
                  {/* OPTIMIZATION: Single TooltipProvider for both mobile and desktop stats */}
                  <TooltipProvider delayDuration={300}>
                    {/* Mobile Stats - Horizontal scroll */}
                    <motion.div
                      className={`flex ${gap.tight} overflow-x-auto ${paddingBottom.tight} md:hidden`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={VIEWPORT.default}
                      transition={SPRING.smooth}
                    >
                      {categoryStatsConfig.map(({ categoryId, delay }, index: number) => {
                        // Type guard: categoryId is already content_category from CategoryStatsConfig
                        // Map to ROUTES key safely
                        const routeKey = categoryId.toUpperCase() as keyof typeof ROUTES;
                        const categoryRoute = routeKey in ROUTES ? ROUTES[routeKey] : `/${categoryId}`;
                        const count =
                          typeof stats[categoryId] === 'number'
                            ? stats[categoryId]
                            : stats[categoryId]?.total || 0;
                        // Type guard: categoryId is already content_category, no assertion needed
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
                                  className={cn('flex min-w-fit items-center', gap['1.5'], 'rounded-md border border-border/30', paddingX.tight, paddingY.micro, 'whitespace-nowrap transition-colors cursor-help bg-transparent')}
                                  initial={{ opacity: 0, x: -8 }}
                                  whileInView={{ 
                                    opacity: 1, 
                                    x: 0,
                                  }}
                                  viewport={VIEWPORT.default}
                                  transition={{
                                    delay: index * STAGGER.fast,
                                    ...SPRING.smooth,
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
                    </motion.div>

                    {/* Desktop Stats */}
                    <div className={`hidden flex-wrap justify-center ${gap.tight} md:flex lg:${gap.tight}`}>
                      {categoryStatsConfig.map(({ categoryId, delay }, index: number) => {
                        // Type guard: categoryId is already content_category from CategoryStatsConfig
                        // Map to ROUTES key safely
                        const routeKey = categoryId.toUpperCase() as keyof typeof ROUTES;
                        const categoryRoute = routeKey in ROUTES ? ROUTES[routeKey] : `/${categoryId}`;
                        const count =
                          typeof stats[categoryId] === 'number'
                            ? stats[categoryId]
                            : stats[categoryId]?.total || 0;
                        // Type guard: categoryId is already content_category, no assertion needed
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
                                  className={cn('flex items-center', gap['1.5'], 'rounded-md border border-border/30', paddingX.compact, paddingY['1.5'], 'transition-colors cursor-help bg-transparent')}
                                  initial={{ opacity: 0, y: 8 }}
                                  whileInView={{ 
                                    opacity: 1, 
                                    y: 0,
                                  }}
                                  viewport={VIEWPORT.default}
                                  transition={{
                                    delay: index * STAGGER.fast,
                                    ...SPRING.smooth,
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
                </motion.div>
              )}
            </div>

            {/* Partner Marquee - "Trusted by" (Feature-Flagged) */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{
                ...SPRING.smooth,
                delay: STAGGER.tight + STAGGER.micro * 3,
              }}
            >
              <HeroPartners />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export const HomepageHeroClient = memo(HomepageHeroClientComponent);

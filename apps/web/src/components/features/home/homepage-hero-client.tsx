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
  ScrambledText,
} from '@heyclaude/web-runtime/ui';
import { 
  SPRING, 
  STAGGER, 
  MICROINTERACTIONS,
  VIEWPORT,
} from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { type Database } from '@heyclaude/database-types';
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
  
  // Category stats config for counters
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
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, var(--claude-orange) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, var(--claude-orange) 0%, transparent 50%)
            `,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
      )}

      {/* Hero Content Container */}
      <motion.div
        key={isSearchFocused ? 'focused' : 'unfocused'}
        className="relative z-10 flex flex-col"
        style={{
          paddingTop: 'clamp(4rem, 10vw, 7rem)',
          paddingBottom: 'clamp(3rem, 8vw, 5rem)',
        }}
        {...(isSearchFocused
          ? {
              animate: shouldReduceMotion
                ? {
                    opacity: MICROINTERACTIONS.hero.focused.opacity,
                  }
                : {
                    opacity: MICROINTERACTIONS.hero.focused.opacity,
                    scale: MICROINTERACTIONS.hero.focused.scale,
                  },
            }
          : {
              animate: shouldReduceMotion
                ? {
                    opacity: 1,
                  }
                : {
                    opacity: 1,
                    scale: 1,
                  },
            })}
        transition={MICROINTERACTIONS.hero.transition}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Hero Content - Centered with Perfect Hierarchy */}
            <div className="text-center">
              {/* Main Heading - Stunning Typography */}
              <div
                style={{
                  marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
                }}
              >
                <motion.h1
                  className="flex items-center justify-center"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING.hero,
                    delay: STAGGER.tight,
                  }}
                  style={{
                    fontSize: 'clamp(1.75rem, 4.5vw, 3rem)', // Smaller heading
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: '-0.025em',
                    marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
                    color: 'var(--color-foreground)', // White text for heading
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
                  className="flex items-center justify-center"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING.hero,
                    delay: STAGGER.tight + STAGGER.micro * 0.5,
                  }}
                  style={{
                    fontSize: 'clamp(1.75rem, 4.5vw, 3rem)', // Smaller heading
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: '-0.025em',
                    gap: '0.5rem', // Proper spacing between Claude and HighlightText
                    color: 'var(--color-foreground)', // White text for heading
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
                className="text-muted-foreground mx-auto max-w-2xl"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{
                  ...SPRING.smooth,
                  delay: STAGGER.tight + STAGGER.micro * 1.5,
                }}
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.25rem)', // Smaller subheading
                  lineHeight: 1.65,
                  marginBottom: 'clamp(2.5rem, 6vw, 3.5rem)',
                  fontWeight: 400,
                }}
              >
                <ScrambledText
                  radius={100}
                  duration={1.2}
                  speed={0.5}
                  scrambleChars=".:"
                  style={{
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    display: 'block',
                  }}
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
                className="mx-auto max-w-2xl"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{
                  ...SPRING.smooth,
                  delay: STAGGER.tight + STAGGER.micro * 2.5,
                }}
                style={{ marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}
              >
                <HomepageSearchBar onFocusChange={setSearchFocused} />
              </motion.div>

              {/* Category Stats Section - Directly Below Search Bar */}
              {stats && typeof stats === 'object' && Object.keys(stats).length > 0 && (
                <motion.div
                  className="mx-auto max-w-4xl"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING.smooth,
                    delay: STAGGER.tight + STAGGER.micro * 3,
                  }}
                  style={{ marginBottom: 'clamp(2.5rem, 6vw, 4rem)' }}
                >
                  {/* Mobile Stats - Horizontal scroll */}
                  <TooltipProvider delayDuration={300}>
                    <motion.div
                      className="flex gap-2 overflow-x-auto pb-2 md:hidden"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={VIEWPORT.default}
                      transition={SPRING.smooth}
                    >
                      {categoryStatsConfig.map(({ categoryId, delay }, index: number) => {
                        const categoryRoute = ROUTES[categoryId.toUpperCase() as keyof typeof ROUTES];
                        const count =
                          typeof stats[categoryId] === 'number'
                            ? stats[categoryId]
                            : stats[categoryId]?.total || 0;
                        const categoryConfig = categoryConfigs[categoryId as Database['public']['Enums']['content_category']];
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
                                  className="flex min-w-fit items-center gap-1.5 rounded-md border border-border/30 px-2 py-1 whitespace-nowrap transition-colors cursor-help bg-transparent"
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
                  </TooltipProvider>

                  {/* Desktop Stats */}
                  <TooltipProvider delayDuration={300}>
                    <div className="hidden flex-wrap justify-center gap-2 md:flex lg:gap-2">
                      {categoryStatsConfig.map(({ categoryId, delay }, index: number) => {
                        const categoryRoute = ROUTES[categoryId.toUpperCase() as keyof typeof ROUTES];
                        const count =
                          typeof stats[categoryId] === 'number'
                            ? stats[categoryId]
                            : stats[categoryId]?.total || 0;
                        const categoryConfig = categoryConfigs[categoryId as Database['public']['Enums']['content_category']];
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
                                  className="flex items-center gap-1.5 rounded-md border border-border/30 px-3 py-1.5 transition-colors cursor-help bg-transparent"
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

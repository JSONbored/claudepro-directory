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
} from '@heyclaude/web-runtime/ui';
import { 
  SPRING, 
  STAGGER, 
  MICROINTERACTIONS,
} from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import dynamicImport from 'next/dynamic';
import { memo } from 'react';

import { useHeroSearchConnection } from './hero-search-connection';
import { HomepageSearchBar } from './homepage-search-wrapper';
import { HeroPartners } from './hero-partners';

const RollingText = dynamicImport(
  () => import('@heyclaude/web-runtime/ui').then((mod) => ({ default: mod.RollingText })),
  {
    loading: () => <span style={{ color: 'var(--claude-orange)' }}>enthusiasts</span>,
  }
);

interface HomepageHeroClientProps {
  memberCount: number;
}

function HomepageHeroClientComponent({ 
  memberCount,
}: HomepageHeroClientProps) {
  const { isSearchFocused, setSearchFocused } = useHeroSearchConnection();
  const shouldReduceMotion = useReducedMotion();

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
              <motion.h1
                className="flex flex-wrap items-center justify-center gap-2 md:flex-nowrap md:gap-3"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{
                  ...SPRING.hero,
                  delay: STAGGER.tight,
                }}
                style={{
                  fontSize: 'clamp(2rem, 5.5vw, 3.5rem)',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: '-0.025em',
                  marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
                }}
              >
                <motion.span 
                  className="whitespace-nowrap"
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING.smooth,
                    delay: STAGGER.tight + STAGGER.micro * 0.5,
                  }}
                >
                  The ultimate directory for Claude
                </motion.span>
                <motion.span
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING.smooth,
                    delay: STAGGER.tight + STAGGER.micro,
                  }}
                  style={{ color: 'oklch(74% 0.2 35)' }}
                  className="whitespace-nowrap"
                >
                  <RollingText
                    words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
                    duration={3000}
                    className="inline-block"
                    style={{ color: 'oklch(74% 0.2 35)' }}
                  />
                </motion.span>
              </motion.h1>

              {/* Description - Enhanced Readability */}
              <motion.p
                className="text-muted-foreground mx-auto max-w-2xl"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{
                  ...SPRING.smooth,
                  delay: STAGGER.tight + STAGGER.micro * 1.5,
                }}
                style={{
                  fontSize: 'clamp(1.125rem, 2.5vw, 1.375rem)',
                  lineHeight: 1.65,
                  marginBottom: 'clamp(2.5rem, 6vw, 3.5rem)',
                  fontWeight: 400,
                }}
              >
                Join{' '}
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.span 
                        className="cursor-help font-semibold"
                        style={{ color: 'oklch(74% 0.2 35)' }}
                        whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                        transition={SPRING.smooth}
                      >
                        <NumberTicker 
                          value={memberCount} 
                          className="font-semibold" 
                          style={{ color: 'oklch(74% 0.2 35)' }} 
                          suffix="+" 
                        />
                      </motion.span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Active community members who have contributed configurations, rules, or content to the directory
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>{' '}
                members discovering and sharing the best Claude configurations. Explore expert rules,
                powerful MCP servers, specialized agents, automation hooks, and connect with the
                community building the future of AI.
              </motion.p>

              {/* Search Bar - Integrated with Perfect Spacing */}
              <motion.div
                className="mx-auto max-w-2xl"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{
                  ...SPRING.smooth,
                  delay: STAGGER.tight + STAGGER.micro * 2.5,
                }}
                style={{ marginBottom: 'clamp(2.5rem, 6vw, 4rem)' }}
              >
                <HomepageSearchBar onFocusChange={setSearchFocused} />
              </motion.div>
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

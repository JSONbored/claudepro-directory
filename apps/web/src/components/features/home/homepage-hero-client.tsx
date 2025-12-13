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
} from '@heyclaude/web-runtime/ui';
import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import dynamicImport from 'next/dynamic';
import { memo } from 'react';

import { useHeroSearchConnection } from './hero-search-connection';

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
  const { isSearchFocused } = useHeroSearchConnection();
  const shouldReduceMotion = useReducedMotion();

  // Removed scroll-linked background animations (never worked properly)
  // ✅ No parallax effects - already removed for accessibility (WCAG compliance)

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
              animate: shouldReduceMotion
                ? {
                    opacity: MICROINTERACTIONS.hero.focused.opacity,
                  }
                : {
                    opacity: MICROINTERACTIONS.hero.focused.opacity,
                    scale: MICROINTERACTIONS.hero.focused.scale,
                  },
            }
          : undefined)}
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
        </div>
      </motion.div>
    </section>
  );
}

export const HomepageHeroClient = memo(HomepageHeroClientComponent);

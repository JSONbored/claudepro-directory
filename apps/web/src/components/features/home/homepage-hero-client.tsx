'use client';

/**
 * Homepage Hero Client Wrapper
 *
 * Client component that wraps the server hero component and connects it
 * to the search interaction context for coordinated animations.
 */

import { NumberTicker, MorphingBlobBackground } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import dynamicImport from 'next/dynamic';
import { memo } from 'react';

import { useHeroSearchConnection } from './hero-search-connection';

const RollingText = dynamicImport(
  () => import('@heyclaude/web-runtime/ui').then((mod) => ({ default: mod.RollingText })),
  {
    loading: () => <span className="text-accent">enthusiasts</span>,
  }
);

interface HomepageHeroClientProps {
  memberCount: number;
}

function HomepageHeroClientComponent({ memberCount }: HomepageHeroClientProps) {
  const { searchRef, isSearchFocused } = useHeroSearchConnection();
  
  // Convert input ref to element ref for blob targeting
  const targetRef = searchRef as React.RefObject<HTMLElement>;

  return (
    <section
      className="border-border/50 relative border-b overflow-hidden"
      aria-label="Homepage hero"
    >
      {/* Morphing Blob Background - Responds to search focus */}
      <MorphingBlobBackground
        targetRef={targetRef}
        isTargetActive={isSearchFocused}
        blobCount={3}
        colors={['#F97316', '#FB923C', '#FDBA74']}
      />

      <motion.div
        key={isSearchFocused ? 'focused' : 'unfocused'}
        className="relative z-10 container mx-auto px-4 py-10 sm:py-16 lg:py-24"
        animate={{
          opacity: isSearchFocused ? 0.7 : 1,
          scale: isSearchFocused ? 0.98 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
          mass: 0.5,
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-3xl leading-tight font-bold tracking-tight sm:mb-6 sm:text-4xl sm:leading-tight lg:text-5xl lg:leading-tight">
            <span className="block">The ultimate directory for Claude</span>
            <RollingText
              words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
              duration={3000}
              className="text-accent block"
            />
          </h1>

          <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-lg lg:text-xl">
            Join{' '}
            <NumberTicker value={memberCount} className="text-accent font-semibold" suffix="+" />{' '}
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

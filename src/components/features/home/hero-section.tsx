'use client';

/**
 * Hero Section - Homepage Hero with Parallax Effects
 *
 * Modern hero section with Motion.dev scroll-linked animations:
 * - Parallax background pattern
 * - Fade-out text on scroll
 * - Scale animation for subtitle
 * - GPU-accelerated, 60fps smooth
 *
 * @module components/features/home/hero-section
 */

import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { useFadeOnScroll, useParallax, useScaleOnScroll } from '@/src/hooks/use-scroll-animation';

// Lazy load RollingText animation
const RollingText = dynamic(
  () => import('@/src/components/magic/rolling-text').then((mod) => ({ default: mod.RollingText })),
  {
    loading: () => <span className="text-accent">enthusiasts</span>,
    ssr: false,
  }
);

/**
 * HeroSection Component
 *
 * Displays homepage hero with parallax scroll effects.
 * Title fades out as user scrolls, creating depth.
 * Background pattern moves slower than content (parallax).
 */
export function HeroSection() {
  // Fade out title/subtitle as user scrolls down
  const { ref: titleRef, opacity: titleOpacity } = useFadeOnScroll();

  // Parallax background (moves slower than scroll)
  const { ref: bgRef, y: bgY } = useParallax({ speed: 0.5, direction: 'vertical' });

  // Scale subtitle slightly as it fades
  const { ref: subtitleRef, scale: subtitleScale } = useScaleOnScroll([1, 0.95]);

  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-background to-background/95">
      {/* Parallax Background - Less opacity on mobile */}
      <motion.div
        ref={bgRef}
        style={bgY ? { y: bgY } : {}}
        className="absolute inset-0 opacity-[0.02] md:opacity-[0.03] pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] md:bg-[size:32px_32px]" />
      </motion.div>

      {/* Hero Content - More aggressive mobile scaling */}
      <div className="container relative mx-auto px-4 py-12 md:py-16 lg:py-20 text-center">
        {/* Title - Smaller on mobile */}
        <motion.div ref={titleRef} style={{ opacity: titleOpacity }}>
          <h1 className="mb-4 md:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Claude Pro Directory
            </span>
          </h1>
        </motion.div>

        {/* Subtitle - More responsive sizing */}
        <motion.div
          ref={subtitleRef}
          style={{ opacity: titleOpacity, scale: subtitleScale }}
          className="mx-auto max-w-3xl px-4"
        >
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed">
            The ultimate collection of{' '}
            <span className="font-semibold text-foreground">AI agents</span>,{' '}
            <span className="font-semibold text-foreground">MCP servers</span>,{' '}
            <span className="font-semibold text-foreground">Claude rules</span>, and{' '}
            <span className="font-semibold text-foreground">commands</span> for{' '}
            <RollingText
              words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
              duration={3000}
              className="text-accent"
            />
          </p>
        </motion.div>

        {/* Accent decoration - Smaller on mobile */}
        <motion.div
          style={bgY ? { y: bgY, opacity: titleOpacity } : { opacity: titleOpacity }}
          className="mx-auto mt-6 md:mt-8 h-1 w-16 md:w-24 rounded-full bg-gradient-to-r from-accent/50 to-accent"
        />
      </div>
    </section>
  );
}

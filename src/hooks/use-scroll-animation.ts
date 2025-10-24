'use client';

/**
 * Scroll Animation Hooks - Motion.dev Scroll-Linked Effects
 *
 * Reusable hooks for scroll-based animations using Motion.dev.
 * GPU-accelerated, performant, and configuration-driven.
 *
 * Features:
 * - Parallax effects (different scroll speeds)
 * - Fade in/out based on scroll position
 * - Scale transformations
 * - Rotate effects
 * - Custom transform ranges
 *
 * Performance:
 * - Uses Motion.dev's useScroll (native scroll events)
 * - GPU-accelerated transforms (scale, rotate, translate)
 * - No layout thrashing
 * - 60fps smooth animations
 *
 * @module hooks/use-scroll-animation
 */

import { type MotionValue, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

/**
 * Parallax configuration
 */
export interface ParallaxConfig {
  /**
   * Parallax speed multiplier
   * - 1.0 = normal scroll speed
   * - 0.5 = half speed (slower, background effect)
   * - 1.5 = faster than scroll
   * @default 0.5
   */
  speed?: number;

  /**
   * Direction of parallax movement
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal';

  /**
   * Offset range in pixels
   * @default [-100, 100]
   */
  range?: [number, number];
}

/**
 * Scroll reveal configuration
 */
export interface ScrollRevealConfig {
  /**
   * Start reveal when element is this far in viewport (0-1)
   * @default 0.8 - Start when 80% down the viewport
   */
  threshold?: number;

  /**
   * Animation type
   * @default 'fade'
   */
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'rotate';

  /**
   * Distance for slide animations (pixels)
   * @default 50
   */
  distance?: number;
}

/**
 * Parallax scroll effect
 * Element moves at different speed than page scroll
 *
 * @param config - Parallax configuration
 * @returns Motion values and ref to attach to element
 *
 * @example
 * ```tsx
 * function Hero() {
 *   const { ref, y } = useParallax({ speed: 0.5 });
 *   return <motion.div ref={ref} style={{ y }}>Background</motion.div>;
 * }
 * ```
 */
export function useParallax(config: ParallaxConfig = {}) {
  const { speed = 0.5, direction = 'vertical', range = [-100, 100] } = config;
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Calculate parallax offset based on speed
  const offset = useTransform(
    scrollYProgress,
    [0, 1],
    range.map((val) => val * speed)
  );

  if (direction === 'vertical') {
    return { ref, y: offset };
  }
  return { ref, x: offset };
}

/**
 * Scroll reveal effect
 * Element animates in when scrolled into view
 *
 * @param config - Reveal configuration
 * @returns Motion values and ref to attach to element
 *
 * @example
 * ```tsx
 * function Card() {
 *   const { ref, style } = useScrollReveal({ animation: 'slide-up' });
 *   return <motion.div ref={ref} style={style}>Content</motion.div>;
 * }
 * ```
 */
export function useScrollReveal(config: ScrollRevealConfig = {}) {
  const { threshold = 0.8, animation = 'fade', distance = 50 } = config;
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`start ${threshold}`, 'start 0.2'],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Call all hooks unconditionally (Rules of Hooks)
  const ySlideUp = useTransform(scrollYProgress, [0, 1], [distance, 0]);
  const ySlideDown = useTransform(scrollYProgress, [0, 1], [-distance, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [45, 0]);

  let style: Record<string, MotionValue<number>> = { opacity };

  switch (animation) {
    case 'fade':
      // opacity already set
      break;

    case 'slide-up':
      style = { opacity, y: ySlideUp };
      break;

    case 'slide-down':
      style = { opacity, y: ySlideDown };
      break;

    case 'scale':
      style = { opacity, scale };
      break;

    case 'rotate':
      style = { opacity, rotateX };
      break;
  }

  return { ref, style };
}

/**
 * Fade on scroll (fade out as you scroll down)
 * Useful for hero sections that should disappear
 *
 * @example
 * ```tsx
 * function HeroText() {
 *   const { ref, opacity } = useFadeOnScroll();
 *   return <motion.h1 ref={ref} style={{ opacity }}>Hero Title</motion.h1>;
 * }
 * ```
 */
export function useFadeOnScroll() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

  return { ref, opacity };
}

/**
 * Scale on scroll
 * Element scales up/down as you scroll
 *
 * @param config - Scale range [start, end]
 * @example
 * ```tsx
 * function ScalingImage() {
 *   const { ref, scale } = useScaleOnScroll([1, 1.2]);
 *   return <motion.img ref={ref} style={{ scale }} />;
 * }
 * ```
 */
export function useScaleOnScroll(range: [number, number] = [1, 1.2]) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [range[0], range[1], range[0]]);

  return { ref, scale };
}

/**
 * Rotate on scroll
 * Element rotates as you scroll
 *
 * @param range - Rotation range in degrees [start, end]
 * @example
 * ```tsx
 * function RotatingBadge() {
 *   const { ref, rotate } = useRotateOnScroll([0, 360]);
 *   return <motion.div ref={ref} style={{ rotate }} />;
 * }
 * ```
 */
export function useRotateOnScroll(range: [number, number] = [0, 10]) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], range);

  return { ref, rotate };
}

/**
 * Section progress (shows how far through a section user has scrolled)
 *
 * @example
 * ```tsx
 * function Article() {
 *   const { ref, progress } = useSectionProgress();
 *   return (
 *     <section ref={ref}>
 *       <motion.div style={{ scaleX: progress }} className="progress-bar" />
 *       {content}
 *     </section>
 *   );
 * }
 * ```
 */
export function useSectionProgress() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  return { ref, progress: scrollYProgress };
}

/**
 * useTransform Hook
 *
 * Transforms one MotionValue into another by mapping its values through a function.
 * Perfect for creating derived values, scroll-linked animations, and value conversions.
 *
 * @module web-runtime/hooks/motion/use-transform
 *
 * @example
 * ```tsx
 * function ScrollProgress() {
 *   const { scrollYProgress } = useScroll();
 *   const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
 *
 *   return <motion.div style={{ opacity }} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function ParallaxElement() {
 *   const { scrollY } = useScroll();
 *   const y = useTransform(scrollY, [0, 1000], [0, -100]);
 *
 *   return <motion.div style={{ y }} />;
 * }
 * ```
 */

'use client';

import { useTransform as useMotionTransform } from 'motion/react';

/**
 * Hook that transforms one MotionValue into another.
 *
 * Maps input values through a transformation function or value range.
 * The output MotionValue updates reactively as the input changes.
 *
 * This is a re-export of Motion.dev's useTransform for consistency
 * and centralized imports.
 *
 * @see https://motion.dev/docs/react/utilities/use-transform
 */
export const useTransform = useMotionTransform;

'use client';

import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

const initialProps = {
  pathLength: 0,
  opacity: 0,
} as const;

const animateProps = {
  pathLength: 1,
  opacity: 1,
} as const;

type Props = React.ComponentProps<typeof motion.svg> & {
  speed?: number;
  onAnimationComplete?: () => void;
};

/**
 * HeyClaude Effect
 *
 * Apple-inspired handwritten text animation for "heyclaude"
 * Based on the Apple Hello Effect pattern
 */
export function HeyClaudeEffect({ className, speed = 1, onAnimationComplete, ...props }: Props) {
  const calc = (x: number) => x * speed;

  return (
    <motion.svg
      className={cn('h-16 md:h-20', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="12"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      <title>heyclaude</title>

      {/* h - vertical stroke and curve */}
      <motion.path
        d="M 20 40 Q 20 80, 20 140 M 20 90 Q 20 85, 30 85 Q 40 85, 40 95 Q 40 120, 40 145"
        style={{ strokeLinecap: 'round' }}
        initial={initialProps}
        animate={animateProps}
        transition={{
          duration: calc(0.6),
          ease: 'easeInOut',
          opacity: { duration: 0.3 },
        }}
      />

      {/* e - circular stroke */}
      <motion.path
        d="M 70 110 Q 60 95, 75 90 Q 95 90, 95 110 Q 95 130, 75 130 Q 60 130, 65 120"
        style={{ strokeLinecap: 'round' }}
        initial={initialProps}
        animate={animateProps}
        transition={{
          duration: calc(0.5),
          ease: 'easeInOut',
          delay: calc(0.5),
          opacity: { duration: 0.25, delay: calc(0.5) },
        }}
      />

      {/* y - descending stroke */}
      <motion.path
        d="M 115 90 Q 120 110, 125 125 M 135 90 Q 130 115, 125 125 Q 120 135, 115 155"
        style={{ strokeLinecap: 'round' }}
        initial={initialProps}
        animate={animateProps}
        transition={{
          duration: calc(0.7),
          ease: 'easeInOut',
          delay: calc(0.9),
          opacity: { duration: 0.35, delay: calc(0.9) },
        }}
      />

      {/* c - open curve */}
      <motion.path
        d="M 185 95 Q 160 95, 160 110 Q 160 125, 170 130 Q 180 133, 190 130"
        style={{ strokeLinecap: 'round' }}
        initial={initialProps}
        animate={animateProps}
        transition={{
          duration: calc(0.5),
          ease: 'easeInOut',
          delay: calc(1.5),
          opacity: { duration: 0.25, delay: calc(1.5) },
        }}
      />

      {/* l - vertical stroke */}
      <motion.path
        d="M 210 40 Q 210 80, 210 145"
        style={{ strokeLinecap: 'round' }}
        initial={initialProps}
        animate={animateProps}
        transition={{
          duration: calc(0.6),
          ease: 'easeInOut',
          delay: calc(1.9),
          opacity: { duration: 0.3, delay: calc(1.9) },
        }}
      />

      {/* a - circular with tail */}
      <motion.path
        d="M 250 110 Q 235 95, 245 90 Q 265 90, 265 110 Q 265 130, 245 130 Q 235 130, 240 120 M 265 90 Q 265 110, 265 145"
        style={{ strokeLinecap: 'round' }}
        initial={initialProps}
        animate={animateProps}
        transition={{
          duration: calc(0.8),
          ease: 'easeInOut',
          delay: calc(2.4),
          opacity: { duration: 0.4, delay: calc(2.4) },
        }}
      />

      {/* u - curved bottom */}
      <motion.path
        d="M 290 90 Q 290 115, 290 125 Q 290 135, 300 135 Q 310 135, 310 125 Q 310 105, 310 90"
        style={{ strokeLinecap: 'round' }}
        initial={initialProps}
        animate={animateProps}
        transition={{
          duration: calc(0.6),
          ease: 'easeInOut',
          delay: calc(3.1),
          opacity: { duration: 0.3, delay: calc(3.1) },
        }}
      />

      {/* d - circular with ascender */}
      <motion.path
        d="M 350 110 Q 335 95, 345 90 Q 365 90, 365 110 Q 365 130, 345 130 Q 335 130, 340 120 M 365 40 Q 365 80, 365 145"
        style={{ strokeLinecap: 'round' }}
        initial={initialProps}
        animate={animateProps}
        transition={{
          duration: calc(0.9),
          ease: 'easeInOut',
          delay: calc(3.6),
          opacity: { duration: 0.45, delay: calc(3.6) },
        }}
      />

      {/* e - circular stroke (second e) */}
      <motion.path
        d="M 395 110 Q 385 95, 400 90 Q 420 90, 420 110 Q 420 130, 400 130 Q 385 130, 390 120"
        style={{ strokeLinecap: 'round' }}
        initial={initialProps}
        animate={animateProps}
        transition={{
          duration: calc(0.5),
          ease: 'easeInOut',
          delay: calc(4.4),
          opacity: { duration: 0.25, delay: calc(4.4) },
        }}
        {...(onAnimationComplete && { onAnimationComplete })}
      />
    </motion.svg>
  );
}

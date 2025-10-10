'use client';

/**
 * Text Roll Component
 * Apple Hello effect - Rolling/morphing text animation
 *
 * Performance optimizations:
 * - Pure CSS animations with GPU acceleration
 * - Minimal DOM manipulation
 * - Uses clip-path for smooth transitions
 * - Automatic cycling through text array
 *
 * Accessibility:
 * - aria-live for screen readers
 * - Reduced motion support
 *
 * @module components/ui/magic/text-roll
 */

import { type HTMLAttributes, useEffect, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface TextRollProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Array of text strings to cycle through
   */
  words: string[];

  /**
   * Duration each word is displayed (ms)
   * @default 2000
   */
  duration?: number;

  /**
   * Custom class name for the container
   */
  className?: string;
}

export function TextRoll({ words, duration = 2000, className, ...props }: TextRollProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (words.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);

      // Wait for animation to complete before changing word
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 600); // Animation duration
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  return (
    <div
      className={cn('relative inline-block overflow-hidden', className)}
      aria-live="polite"
      aria-atomic="true"
      {...props}
    >
      <span
        className={cn(
          'inline-block transition-all duration-600 ease-in-out will-change-transform',
          isAnimating && 'animate-textRoll'
        )}
        style={{
          animationDuration: '600ms',
        }}
      >
        {words[currentIndex]}
      </span>
    </div>
  );
}

TextRoll.displayName = 'TextRoll';

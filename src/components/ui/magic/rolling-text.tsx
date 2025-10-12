'use client';

/**
 * Rolling Text Component
 * Character-by-character 3D rotation animation (shadcn-style)
 *
 * Features:
 * - 3D character rotation with proper perspective
 * - Cycles through multiple words/phrases
 * - Hardware-accelerated animations
 * - LazyMotion with domAnimation for reduced bundle size (~15-20KB savings)
 * - Accessibility support
 *
 * @module components/ui/magic/rolling-text
 */

import { domAnimation, LazyMotion, m, type Transition, useInView } from 'framer-motion';
import * as React from 'react';
import { cn } from '@/src/lib/utils';

const ENTRY_ANIMATION = {
  initial: { rotateX: 90 },
  animate: { rotateX: 0 },
};

const EXIT_ANIMATION = {
  initial: { rotateX: 0 },
  animate: { rotateX: 90 },
};

const formatCharacter = (char: string) => (char === ' ' ? '\u00A0' : char);

interface RollingTextProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /**
   * Array of words to cycle through
   */
  words: string[];

  /**
   * Duration each word is displayed (ms)
   * @default 3000
   */
  duration?: number;

  /**
   * Animation transition settings
   */
  transition?: Transition;

  /**
   * Custom class name
   */
  className?: string;
}

export function RollingText({
  words,
  duration = 3000,
  transition = { duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] },
  className,
  ...props
}: RollingTextProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isExiting, setIsExiting] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const localRef = React.useRef<HTMLSpanElement>(null);

  const isInView = useInView(localRef, {
    once: false,
    margin: '0px',
  });

  // Prevent hydration mismatch
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cycle through words
  React.useEffect(() => {
    if (words.length <= 1) return;

    const interval = setInterval(() => {
      setIsExiting(true);

      // Wait for exit animation, then switch word
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsExiting(false);
      }, 600); // Exit animation duration (match transition duration)
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  const currentWord = words[currentIndex] || '';
  const characters = React.useMemo(
    () =>
      currentWord.split('').map((char, idx) => ({
        char,
        id: `${currentIndex}-${char}-${idx}-${Date.now()}`,
      })),
    [currentWord, currentIndex]
  );

  return (
    <LazyMotion features={domAnimation} strict>
      <span
        ref={localRef}
        className={cn('inline-block relative', className)}
        aria-live="polite"
        aria-atomic="true"
        style={{
          minWidth: '12ch', // Prevent layout shift for word changes
        }}
        {...props}
      >
        <span className="sr-only">{currentWord}</span>
        <span aria-hidden="true" className="inline-flex">
          {isMounted ? (
            characters.map((item, idx) => (
              <m.span
                key={item.id}
                className="inline-block"
                initial={isExiting ? EXIT_ANIMATION.initial : ENTRY_ANIMATION.initial}
                animate={
                  isInView
                    ? isExiting
                      ? EXIT_ANIMATION.animate
                      : ENTRY_ANIMATION.animate
                    : ENTRY_ANIMATION.initial
                }
                transition={{
                  ...transition,
                  delay: (transition.delay as number) * idx,
                }}
                style={{
                  perspective: '1000px',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  transformOrigin: 'bottom center',
                  willChange: 'transform',
                }}
              >
                {formatCharacter(item.char)}
              </m.span>
            ))
          ) : (
            <span className="inline-block">{words[0]}</span>
          )}
        </span>
      </span>
    </LazyMotion>
  );
}

RollingText.displayName = 'RollingText';

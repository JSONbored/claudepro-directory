'use client';

/**
 * Rolling Text Component
 * Character-by-character 3D rotation animation (shadcn-style)
 *
 * Features:
 * - 3D character rotation with proper perspective
 * - Cycles through multiple words/phrases
 * - Hardware-accelerated animations
 * - Motion.dev for 50KB bundle savings vs Framer Motion (Phase 1.5 - October 2025)
 * - Accessibility support
 *
 * @module components/ui/magic/rolling-text
 */

import { SPRING, STAGGER } from '../../../design-system/index.ts';
import { cn } from '../../utils.ts';
import { useBoolean } from '../../../hooks/use-boolean.ts';
import { useInterval } from '../../../hooks/use-interval.ts';
import { useTimeout } from '../../../hooks/use-timeout.ts';
import { motion, type Transition, useInView } from 'motion/react';
import * as React from 'react';

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
  transition = { ...SPRING.smooth, delay: STAGGER.micro },
  className,
  ...props
}: RollingTextProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { value: isExiting, setTrue: setIsExitingTrue, setFalse: setIsExitingFalse } = useBoolean();
  const { value: isMounted, setTrue: setIsMountedTrue } = useBoolean();
  const localRef = React.useRef<HTMLSpanElement>(null);

  const isInView = useInView(localRef, {
    once: false,
    margin: '0px',
  });

  // Prevent hydration mismatch
  React.useEffect(() => {
    setIsMountedTrue();
  }, []);

  // Cycle through words
  const handleWordCycle = React.useCallback(() => {
    setIsExitingTrue();
  }, [setIsExitingTrue]);

  useInterval(handleWordCycle, words.length > 1 ? duration : null);

  // Handle word switch after exit animation
  useTimeout(
    () => {
      if (isExiting) {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsExitingFalse();
      }
    },
    isExiting ? 600 : null
  );

  const currentWord = words[currentIndex] || '';
  const characters = React.useMemo(
    () =>
      currentWord.split('').map((char, idx) => ({
        char,
        id: `${currentIndex}-${char}-${idx}-${Date.now()}`,
      })),
    [currentWord, currentIndex]
  );

  // Calculate max width needed for all words to prevent layout shift
  const maxWordLength = React.useMemo(() => Math.max(...words.map((word) => word.length)), [words]);

  // Extract style prop to ensure color inheritance
  const { style: propsStyle, ...restProps } = props;

  return (
    <span
      ref={localRef}
      className={cn('relative inline-block', className)}
      aria-live="polite"
      aria-atomic="true"
      style={{
        // Fixed width based on longest word to prevent layout shift
        // Add extra padding for smooth character animations
        minWidth: `${maxWordLength + 2}ch`,
        maxWidth: `${maxWordLength + 2}ch`,
        display: 'inline-flex',
        justifyContent: 'flex-start', // Left-align to match parent container alignment
        alignItems: 'center',
        // Inherit color from parent (for logo orange color)
        ...propsStyle,
      }}
      {...restProps}
    >
      <span className="sr-only">{currentWord}</span>
      <span
        aria-hidden="true"
        className="inline-flex"
        style={propsStyle ? { color: 'inherit' } : undefined}
      >
        {isMounted ? (
          characters.map((item, idx) => (
            <motion.span
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
                // Inherit color from parent
                color: 'inherit',
              }}
            >
              {formatCharacter(item.char)}
            </motion.span>
          ))
        ) : (
          <span className="inline-block" style={propsStyle ? { color: 'inherit' } : undefined}>
            {words[0]}
          </span>
        )}
      </span>
    </span>
  );
}

RollingText.displayName = 'RollingText';

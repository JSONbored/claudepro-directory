'use client';

/**
 * Typing Placeholder Component
 *
 * Animated placeholder text that cycles through multiple example searches
 * with a typewriter effect. Perfect for search inputs to provide context
 * and create an engaging, "alive" feeling.
 *
 * Features:
 * - Cycles through multiple placeholder texts
 * - Typewriter effect (types out, then deletes)
 * - Configurable typing/deleting speeds
 * - Blinking cursor
 * - Pauses between cycles
 * - Respects prefers-reduced-motion
 *
 * Usage:
 * ```tsx
 * <TypingPlaceholder
 *   texts={["Search configurations...", "Find MCP servers...", "Discover commands..."]}
 *   className="text-muted-foreground"
 * />
 * ```
 */

import { DURATION } from '../../../design-system/index.ts';
import { cn } from '../../utils.ts';
import { motion } from 'motion/react';
import { useEffect, useState, useRef } from 'react';

interface TypingPlaceholderProps {
  /** Array of texts to cycle through */
  texts: string[];
  /** Typing speed in milliseconds per character */
  typingSpeed?: number;
  /** Deleting speed in milliseconds per character */
  deletingSpeed?: number;
  /** Pause duration after completing a text (ms) */
  pauseDuration?: number;
  /** Initial delay before starting (ms) */
  initialDelay?: number;
  /** Whether to loop through texts */
  loop?: boolean;
  /** Show blinking cursor */
  showCursor?: boolean;
  /** Cursor character */
  cursorCharacter?: string;
  /** Custom className */
  className?: string;
  /** Callback when text changes */
  onTextChange?: (text: string, index: number) => void;
}

export function TypingPlaceholder({
  texts,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 2000,
  initialDelay = 500,
  loop = true,
  showCursor = true,
  cursorCharacter = '|',
  className,
  onTextChange,
}: TypingPlaceholderProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Start after initial delay
    const startTimeout = setTimeout(() => {
      setIsStarted(true);
    }, initialDelay);

    return () => clearTimeout(startTimeout);
  }, [initialDelay]);

  // Main typing effect - use refs to track state without causing re-renders
  const currentIndexRef = useRef(currentTextIndex);
  const deletingRef = useRef(isDeleting);
  const textRef = useRef(displayedText);

  // Sync refs with state
  useEffect(() => {
    currentIndexRef.current = currentTextIndex;
    deletingRef.current = isDeleting;
    textRef.current = displayedText;
  }, [currentTextIndex, isDeleting, displayedText]);

  useEffect(() => {
    if (!isStarted || texts.length === 0) return;
    if (prefersReducedMotion) {
      // Just show first text without animation
      setDisplayedText(texts[0] || '');
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const type = () => {
      const currentIndex = currentIndexRef.current;
      const deleting = deletingRef.current;
      let text = textRef.current;
      const currentText = texts[currentIndex] || '';

      if (!deleting) {
        // Typing
        if (text.length < currentText.length) {
          const nextChar = currentText[text.length];
          text = text + nextChar;
          textRef.current = text;
          setDisplayedText(text);
          timeoutRef.current = setTimeout(type, typingSpeed);
        } else {
          // Finished typing, pause then delete
          timeoutRef.current = setTimeout(() => {
            deletingRef.current = true;
            setIsDeleting(true);
            type();
          }, pauseDuration);
        }
      } else {
        // Deleting
        if (text.length > 0) {
          text = text.slice(0, -1);
          textRef.current = text;
          setDisplayedText(text);
          timeoutRef.current = setTimeout(type, deletingSpeed);
        } else {
          // Finished deleting, move to next text
          deletingRef.current = false;
          setIsDeleting(false);
          const nextIndex = (currentIndex + 1) % texts.length;
          if (nextIndex === 0 && !loop) {
            // Don't loop, stop at last text
            return;
          }
          currentIndexRef.current = nextIndex;
          setCurrentTextIndex(nextIndex);
          textRef.current = '';
          if (onTextChange) {
            onTextChange(texts[nextIndex] || '', nextIndex);
          }
          timeoutRef.current = setTimeout(type, 300); // Brief pause before next text
        }
      }
    };

    // Start typing
    type();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isStarted, texts, typingSpeed, deletingSpeed, pauseDuration, loop, onTextChange, prefersReducedMotion]);

  // Initialize with first text if reduced motion
  useEffect(() => {
    if (prefersReducedMotion && texts.length > 0) {
      setDisplayedText(texts[0] || '');
    }
  }, [prefersReducedMotion, texts]);

  return (
    <span className={cn('inline-block', className)}>
      <span className="inline">{displayedText}</span>
      {showCursor && (
        <motion.span
          className="inline-block ml-0.5 text-accent"
          animate={{ opacity: [1, 0, 1] }}
          transition={{
            duration: DURATION.long,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {cursorCharacter}
        </motion.span>
      )}
    </span>
  );
}

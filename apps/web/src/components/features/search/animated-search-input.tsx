'use client';

/**
 * Animated Search Input
 *
 * Wraps the search input with typing placeholder animation and focus microinteractions.
 * Shows animated typing placeholder when input is empty and not focused.
 */

import { TypingPlaceholder, cn } from '@heyclaude/web-runtime/ui';
import { MICROINTERACTIONS, DURATION } from '@heyclaude/web-runtime/design-system';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef, useEffect } from 'react';

interface AnimatedSearchInputProps {
  /** Input element */
  children: React.ReactElement;
  /** Placeholder texts to cycle through */
  placeholderTexts?: string[];
  /** Whether to show typing animation */
  enableTypingPlaceholder?: boolean;
  /** Custom className */
  className?: string;
}

export function AnimatedSearchInput({
  children,
  placeholderTexts = [
    'Search configurations...',
    'Find MCP servers...',
    'Discover commands...',
    'Explore rules...',
    'Browse hooks...',
  ],
  enableTypingPlaceholder = true,
  className,
}: AnimatedSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track focus and value changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const input = container.querySelector('input') as HTMLInputElement | null;
    if (!input) return;

    inputRef.current = input;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    const handleInput = () => {
      setValue(input.value || '');
    };
    const handleChange = () => {
      setValue(input.value || '');
    };

    // Set initial value immediately
    setValue(input.value || '');

    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
    input.addEventListener('input', handleInput);
    input.addEventListener('change', handleChange);

    return () => {
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
      input.removeEventListener('input', handleInput);
      input.removeEventListener('change', handleChange);
    };
  }, []);

  // Only show typing placeholder when input is empty, not focused, and no value
  const showTypingPlaceholder =
    enableTypingPlaceholder && !isFocused && !value && placeholderTexts.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Original input */}
      {children}

      {/* Animated typing placeholder overlay */}
      <AnimatePresence>
        {showTypingPlaceholder && (
          <motion.div
            className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 z-10"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.quick }}
          >
            <TypingPlaceholder
              texts={placeholderTexts}
              typingSpeed={50}
              deletingSpeed={30}
              pauseDuration={2000}
              initialDelay={300}
              loop={true}
              showCursor={true}
              className="text-muted-foreground text-base"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus glow effect */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            className="absolute -inset-0.5 -z-10 rounded-md bg-gradient-to-r from-accent/20 via-accent/10 to-transparent blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MICROINTERACTIONS.search.transition}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

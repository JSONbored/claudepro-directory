/**
 * useFieldHighlight Hook
 *
 * Provides visual feedback when fields are auto-filled by templates.
 * Shows a subtle pulse/glow animation on affected fields.
 */

import { useCallback, useState } from 'react';

const HIGHLIGHT_DURATION = 2000; // 2 seconds

export function useFieldHighlight() {
  const [highlightedFields, setHighlightedFields] = useState<Map<string, number>>(new Map());

  /**
   * Highlight a field with a pulse animation
   */
  const highlightField = useCallback((fieldName: string) => {
    const timestamp = Date.now();

    setHighlightedFields((prev) => {
      const next = new Map(prev);
      next.set(fieldName, timestamp);
      return next;
    });

    // Auto-remove after duration
    setTimeout(() => {
      setHighlightedFields((prev) => {
        const next = new Map(prev);
        const fieldTimestamp = next.get(fieldName);

        // Only remove if it's the same timestamp (handles rapid successive highlights)
        if (fieldTimestamp === timestamp) {
          next.delete(fieldName);
        }

        return next;
      });
    }, HIGHLIGHT_DURATION);
  }, []);

  /**
   * Highlight multiple fields at once
   */
  const highlightFields = useCallback((fieldNames: string[]) => {
    const timestamp = Date.now();

    setHighlightedFields((prev) => {
      const next = new Map(prev);
      for (const name of fieldNames) {
        next.set(name, timestamp);
      }
      return next;
    });

    // Auto-remove after duration
    setTimeout(() => {
      setHighlightedFields((prev) => {
        const next = new Map(prev);
        for (const name of fieldNames) {
          const fieldTimestamp = next.get(name);
          if (fieldTimestamp === timestamp) {
            next.delete(name);
          }
        }
        return next;
      });
    }, HIGHLIGHT_DURATION);
  }, []);

  /**
   * Check if a field is currently highlighted
   */
  const isHighlighted = useCallback(
    (fieldName: string): boolean => {
      return highlightedFields.has(fieldName);
    },
    [highlightedFields]
  );

  /**
   * Clear all highlights immediately
   */
  const clearHighlights = useCallback(() => {
    setHighlightedFields(new Map());
  }, []);

  /**
   * Get CSS classes for a highlighted field
   */
  const getHighlightClasses = useCallback(
    (fieldName: string): string => {
      if (!isHighlighted(fieldName)) return '';

      return 'animate-pulse ring-2 ring-amber-500/50 ring-offset-2 ring-offset-background transition-all duration-500';
    },
    [isHighlighted]
  );

  /**
   * Get inline styles for a highlighted field (alternative to classes)
   */
  const getHighlightStyles = useCallback(
    (fieldName: string): React.CSSProperties => {
      if (!isHighlighted(fieldName)) return {};

      return {
        boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.2)',
        transition: 'box-shadow 0.5s ease-in-out',
      };
    },
    [isHighlighted]
  );

  return {
    highlightField,
    highlightFields,
    isHighlighted,
    clearHighlights,
    getHighlightClasses,
    getHighlightStyles,
    highlightedFieldsCount: highlightedFields.size,
  };
}

/**
 * Animation variants for motion components
 */
export const highlightAnimationVariants = {
  initial: { scale: 1, opacity: 1 },
  highlight: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.8, 1],
    boxShadow: [
      '0 0 0 0 rgba(245, 158, 11, 0)',
      '0 0 0 4px rgba(245, 158, 11, 0.3)',
      '0 0 0 0 rgba(245, 158, 11, 0)',
    ],
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

/**
 * Keyframes for CSS animation (if not using motion)
 */
export const highlightKeyframes = `
  @keyframes field-highlight {
    0% {
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.2);
      transform: scale(1.01);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
      transform: scale(1);
    }
  }

  .field-highlight-active {
    animation: field-highlight 0.6s ease-out;
  }
`;

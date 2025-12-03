'use client';

/**
 * useConfetti Hook
 *
 * Confetti animations with config values from unified config
 * Uses web-runtime utilities for logging and configuration
 */

import type { Database } from '@heyclaude/database-types';
import { logger, normalizeError } from '../entries/core.ts';
import { animation } from '../design-system/tokens.ts';
import confetti from 'canvas-confetti';
import { useCallback } from 'react';

export function useConfetti() {
  const fireConfetti = useCallback(
    (variant: Database['public']['Enums']['confetti_variant'] = 'success') => {
      try {
        const configs: Record<Database['public']['Enums']['confetti_variant'], confetti.Options> = {
          // Green + gold for success actions (bookmark, save, etc)
          success: {
            particleCount: animation.confetti.success.particleCount,
            spread: animation.confetti.success.spread,
            origin: { y: 0.6 },
            colors: [...animation.confetti.success.colors],
            ticks: animation.confetti.success.ticks,
          },

          // Rainbow confetti for major milestones (submission approved, profile complete)
          celebration: {
            particleCount: animation.confetti.celebration.particleCount,
            spread: animation.confetti.celebration.spread,
            origin: { y: 0.6 },
            colors: [...animation.confetti.celebration.colors],
            ticks: animation.confetti.celebration.ticks,
          },

          // Star emoji confetti for achievements
          milestone: {
            particleCount: animation.confetti.milestone.particleCount,
            spread: animation.confetti.milestone.spread,
            origin: { y: 0.6 },
            shapes: ['star'],
            colors: [...animation.confetti.milestone.colors],
            ticks: animation.confetti.milestone.ticks,
            scalar: animation.confetti.milestone.scalar,
          },

          // Subtle burst for low-key actions (newsletter signup)
          subtle: {
            particleCount: animation.confetti.subtle.particleCount,
            spread: animation.confetti.subtle.spread,
            origin: { y: 0.7 },
            colors: [...animation.confetti.subtle.colors],
            ticks: animation.confetti.subtle.ticks,
            startVelocity: 20,
          },
        };

        const variantConfig = configs[variant];
        confetti(variantConfig);
      } catch (error) {
        const normalized = normalizeError(error, `useConfetti: fireConfetti failed for variant ${variant}`);
        logger.warn('[Animation] Confetti failed', {
          err: normalized,
          category: 'animation',
          component: 'useConfetti',
          nonCritical: true,
          variant,
        });
      }
    },
    []
  );

  // Preset functions for common actions (now synchronous)
  const celebrateBookmark = useCallback(() => {
    fireConfetti('success');
  }, [fireConfetti]);
  
  const celebrateSubmission = useCallback(() => {
    fireConfetti('celebration');
  }, [fireConfetti]);
  
  const celebrateMilestone = useCallback(() => {
    fireConfetti('milestone');
  }, [fireConfetti]);
  
  const celebrateSignup = useCallback(() => {
    fireConfetti('subtle');
  }, [fireConfetti]);

  return {
    fireConfetti,
    celebrateBookmark,
    celebrateSubmission,
    celebrateMilestone,
    celebrateSignup,
  };
}

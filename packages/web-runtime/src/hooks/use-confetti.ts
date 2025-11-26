'use client';

/**
 * useConfetti Hook
 *
 * Confetti animations with config values from feature flags
 * Uses web-runtime utilities for logging and configuration
 */

import type { Database } from '@heyclaude/database-types';
import { logger, normalizeError } from '../entries/core.ts';
import { getAnimationConfig } from '../config/client-defaults.ts';
import confetti from 'canvas-confetti';
import { useCallback } from 'react';

export function useConfetti() {
  const fireConfetti = useCallback(
    async (variant: Database['public']['Enums']['confetti_variant'] = 'success') => {
      try {
        const result = await getAnimationConfig();
        if (!result) return;
        const config = result;

        const configs: Record<Database['public']['Enums']['confetti_variant'], confetti.Options> = {
          // Green + gold for success actions (bookmark, save, etc)
          success: {
            particleCount: config['confetti.success.particle_count'],
            spread: config['confetti.success.spread'],
            origin: { y: 0.6 },
            colors: ['#10b981', '#fbbf24', '#34d399'],
            ticks: config['confetti.success.ticks'],
          },

          // Rainbow confetti for major milestones (submission approved, profile complete)
          celebration: {
            particleCount: config['confetti.celebration.particle_count'],
            spread: config['confetti.celebration.spread'],
            origin: { y: 0.6 },
            colors: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
            ticks: config['confetti.celebration.ticks'],
          },

          // Star emoji confetti for achievements
          milestone: {
            particleCount: config['confetti.milestone.particle_count'],
            spread: config['confetti.milestone.spread'],
            origin: { y: 0.6 },
            shapes: ['star'],
            colors: ['#fbbf24', '#f59e0b', '#fcd34d'],
            ticks: config['confetti.milestone.ticks'],
            scalar: config['confetti.milestone.scalar'],
          },

          // Subtle burst for low-key actions (newsletter signup)
          subtle: {
            particleCount: config['confetti.subtle.particle_count'],
            spread: config['confetti.subtle.spread'],
            origin: { y: 0.7 },
            colors: ['#3b82f6', '#8b5cf6'],
            ticks: config['confetti.subtle.ticks'],
            startVelocity: 20,
          },
        };

        const variantConfig = configs[variant];
        confetti(variantConfig);
      } catch (error) {
        const normalized = normalizeError(error, `useConfetti: fireConfetti failed for variant ${variant}`);
        logger.error('useConfetti: fireConfetti failed', normalized, {
          hook: 'useConfetti',
          variant,
        });
      }
    },
    []
  );

  // Preset functions for common actions
  const celebrateBookmark = useCallback(() => {
    fireConfetti('success').catch((error) => {
      // Error handling is done inside fireConfetti, but we need to catch to prevent floating promise
      const normalized = normalizeError(error, 'useConfetti: celebrateBookmark failed');
      logger.error('useConfetti: celebrateBookmark failed', normalized, {
        hook: 'useConfetti',
      });
    });
  }, [fireConfetti]);
  const celebrateSubmission = useCallback(() => {
    fireConfetti('celebration').catch((error) => {
      const normalized = normalizeError(error, 'useConfetti: celebrateSubmission failed');
      logger.error('useConfetti: celebrateSubmission failed', normalized, {
        hook: 'useConfetti',
      });
    });
  }, [fireConfetti]);
  const celebrateMilestone = useCallback(() => {
    fireConfetti('milestone').catch((error) => {
      const normalized = normalizeError(error, 'useConfetti: celebrateMilestone failed');
      logger.error('useConfetti: celebrateMilestone failed', normalized, {
        hook: 'useConfetti',
      });
    });
  }, [fireConfetti]);
  const celebrateSignup = useCallback(() => {
    fireConfetti('subtle').catch((error) => {
      const normalized = normalizeError(error, 'useConfetti: celebrateSignup failed');
      logger.error('useConfetti: celebrateSignup failed', normalized, {
        hook: 'useConfetti',
      });
    });
  }, [fireConfetti]);

  return {
    fireConfetti,
    celebrateBookmark,
    celebrateSubmission,
    celebrateMilestone,
    celebrateSignup,
  };
}

'use client';

import confetti from 'canvas-confetti';
import { useCallback } from 'react';
import { getAnimationConfig } from '@/src/lib/actions/feature-flags.actions';
import { logger } from '@/src/lib/logger';
import type { ConfettiVariant } from '@/src/types/database-overrides';

/** Confetti animations - config values from Statsig animationConfigs */

export function useConfetti() {
  const fireConfetti = useCallback(async (variant: ConfettiVariant = 'success') => {
    const result = await getAnimationConfig({});
    if (!result?.data) return;
    const config = result.data;

    const configs: Record<ConfettiVariant, confetti.Options> = {
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
  }, []);

  // Preset functions for common actions
  const celebrateBookmark = useCallback(() => {
    fireConfetti('success').catch((error) => {
      // Error handling is done inside fireConfetti, but we need to catch to prevent floating promise
      logger.error('useConfetti: celebrateBookmark failed', error as Error);
    });
  }, [fireConfetti]);
  const celebrateSubmission = useCallback(() => {
    fireConfetti('celebration').catch((error) => {
      logger.error('useConfetti: celebrateSubmission failed', error as Error);
    });
  }, [fireConfetti]);
  const celebrateMilestone = useCallback(() => {
    fireConfetti('milestone').catch((error) => {
      logger.error('useConfetti: celebrateMilestone failed', error as Error);
    });
  }, [fireConfetti]);
  const celebrateSignup = useCallback(() => {
    fireConfetti('subtle').catch((error) => {
      logger.error('useConfetti: celebrateSignup failed', error as Error);
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

'use client';

/**
 * useConfetti Hook
 *
 * Confetti animations with config values from unified config
 * Uses web-runtime utilities for logging and configuration
 */

import type { Database } from '@heyclaude/database-types';
import { logger, normalizeError } from '../entries/core.ts';
import { CONFETTI_CONFIG } from '../config/unified-config.ts';
import confetti from 'canvas-confetti';
import { useCallback } from 'react';

export function useConfetti() {
  const fireConfetti = useCallback(
    (variant: Database['public']['Enums']['confetti_variant'] = 'success') => {
      try {
        const configs: Record<Database['public']['Enums']['confetti_variant'], confetti.Options> = {
          // Green + gold for success actions (bookmark, save, etc)
          success: {
            particleCount: CONFETTI_CONFIG['success.particle_count'],
            spread: CONFETTI_CONFIG['success.spread'],
            origin: { y: 0.6 },
            colors: ['#10b981', '#fbbf24', '#34d399'],
            ticks: CONFETTI_CONFIG['success.ticks'],
          },

          // Rainbow confetti for major milestones (submission approved, profile complete)
          celebration: {
            particleCount: CONFETTI_CONFIG['celebration.particle_count'],
            spread: CONFETTI_CONFIG['celebration.spread'],
            origin: { y: 0.6 },
            colors: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
            ticks: CONFETTI_CONFIG['celebration.ticks'],
          },

          // Star emoji confetti for achievements
          milestone: {
            particleCount: CONFETTI_CONFIG['milestone.particle_count'],
            spread: CONFETTI_CONFIG['milestone.spread'],
            origin: { y: 0.6 },
            shapes: ['star'],
            colors: ['#fbbf24', '#f59e0b', '#fcd34d'],
            ticks: CONFETTI_CONFIG['milestone.ticks'],
            scalar: CONFETTI_CONFIG['milestone.scalar'],
          },

          // Subtle burst for low-key actions (newsletter signup)
          subtle: {
            particleCount: CONFETTI_CONFIG['subtle.particle_count'],
            spread: CONFETTI_CONFIG['subtle.spread'],
            origin: { y: 0.7 },
            colors: ['#3b82f6', '#8b5cf6'],
            ticks: CONFETTI_CONFIG['subtle.ticks'],
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

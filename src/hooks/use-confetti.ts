'use client';

import { useCallback } from 'react';
import confetti from 'canvas-confetti';

/**
 * Confetti hook for delightful celebration animations
 * Wrapped behind confetti_animations feature flag
 */

export type ConfettiVariant = 'success' | 'celebration' | 'milestone' | 'subtle';

export function useConfetti() {
  const fireConfetti = useCallback((variant: ConfettiVariant = 'success') => {
    const configs: Record<ConfettiVariant, confetti.Options> = {
      // Green + gold for success actions (bookmark, save, etc)
      success: {
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#34d399'],
        ticks: 150,
      },

      // Rainbow confetti for major milestones (submission approved, profile complete)
      celebration: {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
        ticks: 200,
      },

      // Star emoji confetti for achievements
      milestone: {
        particleCount: 30,
        spread: 100,
        origin: { y: 0.6 },
        shapes: ['star'],
        colors: ['#fbbf24', '#f59e0b', '#fcd34d'],
        ticks: 200,
        scalar: 1.2,
      },

      // Subtle burst for low-key actions (newsletter signup)
      subtle: {
        particleCount: 30,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#3b82f6', '#8b5cf6'],
        ticks: 100,
        startVelocity: 20,
      },
    };

    const config = configs[variant];
    confetti(config);
  }, []);

  // Preset functions for common actions
  const celebrateBookmark = useCallback(() => fireConfetti('success'), [fireConfetti]);
  const celebrateSubmission = useCallback(() => fireConfetti('celebration'), [fireConfetti]);
  const celebrateMilestone = useCallback(() => fireConfetti('milestone'), [fireConfetti]);
  const celebrateSignup = useCallback(() => fireConfetti('subtle'), [fireConfetti]);

  return {
    fireConfetti,
    celebrateBookmark,
    celebrateSubmission,
    celebrateMilestone,
    celebrateSignup,
  };
}

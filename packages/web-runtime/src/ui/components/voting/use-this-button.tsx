'use client';

/**
 * UseThisButton Component
 *
 * A beautiful "I use this" voting button for content items.
 * Supports both authenticated users and anonymous sessions.
 * Shows optimistic UI updates with smooth animations.
 */

import type { Database } from '@heyclaude/database-types';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { toggleContentVote, getContentVote } from '../../../actions/voting.ts';
import { logger, normalizeError } from '../../../entries/core.ts';
import { toasts } from '../../../client/toast.ts';
import { CheckCircle, Zap } from '../../../icons.tsx';
import { Button } from '../button.tsx';
import { cluster, gap, padding, height } from '../../../design-system/styles/layout.ts';
import { iconSize } from '../../../design-system/styles/icons.ts';
import { size as textSize, weight as fontWeight, muted } from '../../../design-system/styles/typography.ts';
import { bgColor } from '../../../design-system/styles/colors.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import { shadow, shadowColor } from '../../../design-system/styles/effects.ts';
import { transition } from '../../../design-system/styles/interactive.ts';
import { bgGradient, gradientFrom, gradientTo } from '../../../design-system/styles/colors.ts';

// Session ID management for anonymous voting
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const STORAGE_KEY = 'heyclaude_session_id';
  
  try {
    let sessionId = localStorage.getItem(STORAGE_KEY);
    
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(STORAGE_KEY, sessionId);
    }
    
    return sessionId;
  } catch {
    // Fallback for private browsing or storage errors
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

export interface UseThisButtonProps {
  /** Content slug */
  slug: string;
  /** Content category */
  category: Database['public']['Enums']['content_category'];
  /** Initial use count from server */
  initialCount?: number;
  /** Initial voted state (for authenticated users) */
  initialVoted?: boolean;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Show count alongside button */
  showCount?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * "I use this" voting button with beautiful animations
 */
export function UseThisButton({
  slug,
  category,
  initialCount = 0,
  initialVoted = false,
  size = 'default',
  showCount = true,
  className = '',
}: UseThisButtonProps) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [isAnimating, setIsAnimating] = useState(false);

  // Check initial vote status on mount (for sessions)
  useEffect(() => {
    if (initialVoted) return; // Already know the state

    const checkVoteStatus = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        const result = await getContentVote({
          content_slug: slug,
          content_type: category,
          session_id: sessionId,
        });
        if (result?.data) {
          setVoted(result.data);
        }
      } catch (error) {
        // Silent fail - not critical
        logger.warn('Failed to check vote status', {
          error: error instanceof Error ? error.message : 'Unknown',
          slug,
          category,
        });
      }
    };

    checkVoteStatus();
  }, [slug, category, initialVoted]);

  const handleVote = useCallback(() => {
    // Optimistic update
    const newVoted = !voted;
    const newCount = newVoted ? count + 1 : Math.max(0, count - 1);
    
    setVoted(newVoted);
    setCount(newCount);
    
    if (newVoted) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }

    startTransition(async () => {
      try {
        const sessionId = getOrCreateSessionId();
        const result = await toggleContentVote({
          content_slug: slug,
          content_type: category,
          session_id: sessionId,
        });

        if (result?.data) {
          // Sync with server state
          setVoted(result.data.voted);
          setCount(result.data.newCount);
          
          if (result.data.voted) {
            toasts.raw.success('Added to your toolkit!', {
              description: 'Thanks for letting us know you use this.',
            });
          }
        }
      } catch (error) {
        // Revert optimistic update
        setVoted(voted);
        setCount(count);
        
        const normalized = normalizeError(error, 'Failed to record vote');
        logger.error('Vote toggle failed', normalized, { slug, category });
        toasts.error.fromError(new Error('Failed to record your vote. Please try again.'));
      }
    });
  }, [voted, count, slug, category]);

  const sizeClasses = {
    sm: `${height.buttonSm} ${padding.xBetween} ${textSize.xs} ${gap.snug}`,
    default: `${height.input} ${padding.xCompact} ${textSize.sm} ${gap.compact}`,
    lg: `${height.buttonLg} ${padding.xComfortable} ${textSize.base} ${gap.compact}`,
  };

  const iconSizes = {
    sm: iconSize.xsPlus,
    default: iconSize.sm,
    lg: iconSize.md,
  };

  return (
    <Button
      variant={voted ? 'default' : 'outline'}
      size="sm"
      onClick={handleVote}
      disabled={isPending}
      className={`
        ${sizeClasses[size]}
        ${voted 
          ? `${bgGradient.toR} ${gradientFrom.emerald} ${gradientTo.teal} hover:${gradientFrom.emerald600} hover:${gradientTo.teal600} text-white border-0 ${shadow.md} ${shadowColor.success}` 
          : 'hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400'
        }
        ${transition.all} duration-300 ease-out
        ${className}
      `}
      aria-label={voted ? 'Remove from your toolkit' : 'Add to your toolkit'}
      aria-pressed={voted}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={voted ? 'voted' : 'not-voted'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: isAnimating ? [1, 1.3, 1] : 1, 
            opacity: 1,
            rotate: isAnimating ? [0, -10, 10, 0] : 0,
          }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cluster.tight}
        >
          {voted ? (
            <CheckCircle className={`${iconSizes[size]} ${isAnimating ? 'text-white' : ''}`} />
          ) : (
            <Zap className={iconSizes[size]} />
          )}
        </motion.span>
      </AnimatePresence>
      
      <span className={fontWeight.medium}>
        {voted ? 'I use this' : 'I use this'}
      </span>
      
      {showCount && (
        <motion.span
          key={count}
          initial={{ scale: 0.8, opacity: 0, y: -5 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className={`
            ${voted ? 'bg-white/20' : bgColor.muted} 
            ${padding.xSnug} ${padding.yHair} ${radius.full} ${textSize.xs} ${fontWeight.semibold}
            ${voted ? 'text-white' : muted.default}
          `}
        >
          {count}
        </motion.span>
      )}
    </Button>
  );
}

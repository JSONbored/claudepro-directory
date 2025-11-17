'use client';

/**
 * ConfigCard Enhancements - Hover Previews, Animations, Confetti
 *
 * Wraps ConfigCard with additional visual polish:
 * - Hover preview tooltip with full description
 * - Enhanced hover animations (scale + glow)
 * - Confetti on copy/bookmark success
 * - Animated view counter
 *
 * Usage:
 * <EnhancedConfigCard item={item} />
 */

import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '@/src/components/primitives/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/primitives/ui/tooltip';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@/src/lib/design-tokens/submission-form';
import { Bookmark, Eye } from '@/src/lib/icons';
import type { ConfigCardProps } from '@/src/lib/types/component.types';
import { ConfigCard } from './config-card';

interface EnhancedConfigCardProps extends ConfigCardProps {
  /** Show hover preview tooltip */
  showHoverPreview?: boolean;
  /** Enable confetti on interactions */
  enableConfetti?: boolean;
  /** Animate view count on hover */
  animateViewCount?: boolean;
}

export function EnhancedConfigCard({
  item,
  variant = 'default',
  showCategory = true,
  showActions = true,
  enableSwipeGestures = true,
  useViewTransitions = true,
  showBorderBeam,
  searchQuery,
  showHoverPreview = true,
  enableConfetti = true,
  animateViewCount = true,
}: EnhancedConfigCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [viewCount, setViewCount] = useState('viewCount' in item ? item.viewCount : 0);
  const [bookmarkCount, setBookmarkCount] = useState(
    'bookmark_count' in item ? item.bookmark_count : 0
  );
  const cardRef = useRef<HTMLDivElement>(null);

  // Trigger confetti at specific position
  const triggerConfetti = useCallback(
    (type: 'copy' | 'bookmark') => {
      if (!(enableConfetti && cardRef.current)) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      const colors =
        type === 'copy'
          ? [TOKENS.colors.accent.primary, '#FB923C', '#FDBA74']
          : [TOKENS.colors.success.text, '#34D399', '#6EE7B7'];

      confetti({
        particleCount: 30,
        spread: 60,
        origin: { x, y },
        colors,
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 20,
        shapes: ['circle', 'square'],
        scalar: 0.8,
      });
    },
    [enableConfetti]
  );

  // Listen for copy/bookmark events
  useEffect(() => {
    const handleCopy = (e: CustomEvent) => {
      if (e.detail?.slug === item.slug) {
        triggerConfetti('copy');
      }
    };

    const handleBookmark = (e: CustomEvent) => {
      if (e.detail?.slug === item.slug) {
        triggerConfetti('bookmark');
        setBookmarkCount((prev: number) => prev + 1);
      }
    };

    const copyEventType = 'card:copy' as keyof WindowEventMap;
    const bookmarkEventType = 'card:bookmark' as keyof WindowEventMap;

    window.addEventListener(copyEventType, handleCopy as EventListener);
    window.addEventListener(bookmarkEventType, handleBookmark as EventListener);

    return () => {
      window.removeEventListener(copyEventType, handleCopy as EventListener);
      window.removeEventListener(bookmarkEventType, handleBookmark as EventListener);
    };
  }, [item.slug, triggerConfetti]);

  // Animate view count on hover
  useEffect(() => {
    if (animateViewCount && isHovered && 'viewCount' in item) {
      setViewCount((prev: number) => prev + 1);
    }
  }, [isHovered, animateViewCount, item]);

  const description = 'description' in item ? item.description : '';
  const tags = 'tags' in item ? item.tags : [];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild={true}>
          <motion.div
            ref={cardRef}
            initial={false}
            whileHover={{
              scale: 1.02,
              transition: TOKENS.animations.spring.snappy,
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            style={{
              boxShadow: isHovered ? TOKENS.shadows.glow.orange : 'none',
              transition: 'box-shadow 0.2s ease-out',
            }}
            className="relative rounded-lg"
          >
            <ConfigCard
              item={item}
              variant={variant}
              showCategory={showCategory}
              showActions={showActions}
              enableSwipeGestures={enableSwipeGestures}
              useViewTransitions={useViewTransitions}
              {...(showBorderBeam !== undefined ? { showBorderBeam } : {})}
              {...(searchQuery !== undefined ? { searchQuery } : {})}
            />

            {/* Animated Stats Overlay (Bottom) */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={TOKENS.animations.spring.smooth}
                  className="absolute right-3 bottom-3 flex gap-2"
                >
                  {/* View Count */}
                  {viewCount > 0 && (
                    <motion.div
                      key={viewCount}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={TOKENS.animations.spring.bouncy}
                      className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs backdrop-blur-sm"
                    >
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{viewCount}</span>
                    </motion.div>
                  )}

                  {/* Bookmark Count */}
                  {bookmarkCount > 0 && (
                    <motion.div
                      key={bookmarkCount}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={TOKENS.animations.spring.bouncy}
                      className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs backdrop-blur-sm"
                    >
                      <Bookmark className="h-3 w-3 fill-current text-accent-primary" />
                      <span className="font-medium">{bookmarkCount}</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </TooltipTrigger>

        {/* Hover Preview Tooltip */}
        {showHoverPreview && description && (
          <TooltipContent
            side="top"
            align="center"
            className="max-w-md space-y-3 p-4"
            style={{
              backgroundColor: TOKENS.colors.background.elevated,
              borderColor: TOKENS.colors.border.medium,
            }}
          >
            {/* Full Description */}
            <p className="line-clamp-4 text-sm leading-relaxed">{description}</p>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 5).map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: `${TOKENS.colors.accent.primary}15`,
                      borderColor: `${TOKENS.colors.accent.primary}30`,
                      color: TOKENS.colors.accent.primary,
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{tags.length - 5} more
                  </Badge>
                )}
              </div>
            )}

            {/* Social Proof */}
            <div className="flex items-center gap-3 border-t pt-2 text-muted-foreground text-xs">
              {viewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {viewCount.toLocaleString()} views
                </span>
              )}
              {bookmarkCount > 0 && (
                <span className="flex items-center gap-1">
                  <Bookmark className="h-3 w-3" />
                  {bookmarkCount.toLocaleString()} bookmarks
                </span>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Helper to trigger card events from other components
 */
export const cardEvents = {
  copy: (slug: string) => {
    window.dispatchEvent(new CustomEvent('card:copy', { detail: { slug } }));
  },
  bookmark: (slug: string) => {
    window.dispatchEvent(new CustomEvent('card:bookmark', { detail: { slug } }));
  },
};

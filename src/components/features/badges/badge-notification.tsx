/**
 * Badge Notification System - Database-First with Realtime
 * Zero-query real-time notifications via PostgreSQL trigger-enriched payloads.
 */

'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { Award, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import { cn } from '@/src/lib/utils';
import type { Tables } from '@/src/types/database.types';

type Badge = Tables<'badges'>;

const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  common: {
    bg: 'bg-gray-50 dark:bg-gray-900/30',
    text: 'text-gray-900 dark:text-gray-100',
    border: 'border-gray-200 dark:border-gray-800',
  },
  uncommon: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-900 dark:text-green-100',
    border: 'border-green-200 dark:border-green-800',
  },
  rare: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-900 dark:text-blue-100',
    border: 'border-blue-200 dark:border-blue-800',
  },
  epic: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-900 dark:text-purple-100',
    border: 'border-purple-200 dark:border-purple-800',
  },
  legendary: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    text: 'text-yellow-900 dark:text-yellow-100',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
};

export interface BadgeNotificationProviderProps {
  enabled?: boolean;
  userId?: string;
  children?: React.ReactNode;
}

interface BadgeToastProps {
  badge: Badge;
  earnedAt: Date;
}

const BadgeToastContent = memo(function BadgeToastContent({ badge, earnedAt }: BadgeToastProps) {
  const rarity = badge.rarity || 'common';
  const rarityColors = RARITY_COLORS[rarity];

  return (
    <div className="flex items-start gap-3 p-2">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          duration: 0.6,
        }}
        className={cn(
          'relative flex items-center justify-center rounded-full p-3',
          rarityColors?.bg,
          rarityColors?.border,
          'border-2'
        )}
      >
        <span className="text-3xl" role="img" aria-label={`${badge.name} icon`}>
          {badge.icon}
        </span>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 2,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sparkles className={cn('h-8 w-8', rarityColors?.text)} />
        </motion.div>
      </motion.div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Badge Earned!</span>
        </div>
        <h4 className={cn('font-bold', rarityColors?.text)}>{badge.name}</h4>
        <p className="text-muted-foreground text-xs">{badge.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-xs capitalize', rarityColors?.bg)}>
            {rarity}
          </span>
          <span className="text-muted-foreground text-xs">
            {earnedAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
});

export const BadgeNotificationProvider = memo(function BadgeNotificationProvider({
  enabled = false,
  userId,
  children,
}: BadgeNotificationProviderProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!(enabled && userId)) return;

    const supabase = createClient();

    channelRef.current = supabase
      .channel(`user-badges:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          try {
            const newUserBadge = payload.new as Tables<'user_badges'> & {
              badge_details?: Badge;
            };

            if (newUserBadge.badge_details) {
              toast(
                <BadgeToastContent
                  badge={newUserBadge.badge_details}
                  earnedAt={new Date(newUserBadge.earned_at)}
                />,
                {
                  duration: 6000,
                  className: 'badge-earned-toast',
                }
              );
            }
          } catch (error) {
            logger.error(
              'Failed to process badge notification',
              error instanceof Error ? error : new Error(String(error)),
              { userId, badgeId: (payload.new as Tables<'user_badges'>).badge_id }
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [enabled, userId]);

  return <>{children}</>;
});

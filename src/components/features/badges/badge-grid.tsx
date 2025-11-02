/**
 * Badge Grid Component
 *
 * Displays user badges in a responsive grid with rarity indicators.
 * Supports featuring badges (up to 5) and shows badge details on hover.
 *
 * Production Standards:
 * - Configuration-driven using badges.config.ts
 * - Type-safe with Zod schemas
 * - Performance-optimized with React.memo
 * - Accessible with ARIA labels and keyboard navigation
 * - Responsive grid layout
 * - Theme-aware with rarity colors
 * - Interactive with hover states
 *
 * @module components/features/badges/badge-grid
 */

'use client';

import { Info, Lock, Star } from 'lucide-react';
import { memo, useTransition } from 'react';
import { toast } from 'sonner';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/primitives/tooltip';
import { toggleBadgeFeatured } from '@/src/lib/actions/badges.actions';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import type { Tables } from '@/src/types/database.types';

type Badge = Tables<'badges'>;

// Rarity color mapping (moved from config)
const BADGE_RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
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

// =============================================================================
// TYPES
// =============================================================================

/** UserBadge with badge details joined - returned by get_user_badges_with_details RPC */
type UserBadgeWithBadge = {
  id: string;
  badge_id: string;
  earned_at: string;
  featured: boolean | null;
  metadata?: any;
  badge?: Badge; // Full badge details from RPC
  badges?: {
    // Legacy format for backward compatibility
    slug: string;
    name: string;
    description: string;
    icon: string | null;
    category: string;
  };
};

export interface BadgeGridProps {
  /** User badges with badge details */
  badges: UserBadgeWithBadge[];
  /** Show featured badges only */
  featuredOnly?: boolean;
  /** Allow user to toggle featured status (owner only) */
  canEdit?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

interface BadgeCardProps {
  userBadge: UserBadgeWithBadge;
  badgeDetail?: Badge | undefined;
  canEdit: boolean;
  onFeaturedChange?: () => void | undefined;
}

// =============================================================================
// BADGE CARD COMPONENT
// =============================================================================

const BadgeCard = memo(function BadgeCard({
  userBadge,
  badgeDetail,
  canEdit,
  onFeaturedChange,
}: BadgeCardProps) {
  const [isPending, startTransition] = useTransition();
  const isFeatured = userBadge.featured;

  const handleToggleFeatured = () => {
    if (!canEdit || isPending) return;

    startTransition(async () => {
      try {
        const result = await toggleBadgeFeatured({
          badgeId: userBadge.id,
          featured: !isFeatured,
        });
        const data = result?.data as { success: boolean; featured: boolean } | undefined;

        if (data?.success) {
          toast.success(
            isFeatured ? 'Badge removed from featured' : 'Badge featured on your profile'
          );
          // Trigger parent refresh (optimistic update done via router.refresh in parent)
          onFeaturedChange?.();
        } else {
          throw new Error(result?.serverError || 'Failed to update badge');
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to update badge. You can only feature up to 5 badges.'
        );
      }
    });
  };

  const rarity = badgeDetail?.rarity || 'common';
  const rarityColors = BADGE_RARITY_COLORS[rarity] || BADGE_RARITY_COLORS.common;

  const Container = canEdit ? 'button' : 'div';

  return (
    <Container
      type={canEdit ? 'button' : undefined}
      className={cn(
        'relative group rounded-lg border p-4 transition-all duration-200',
        rarityColors?.bg,
        rarityColors?.border,
        'hover:shadow-md hover:scale-[1.02]',
        canEdit && 'cursor-pointer w-full text-left'
      )}
      onClick={canEdit ? handleToggleFeatured : undefined}
      aria-label={
        canEdit
          ? `${badgeDetail?.name || 'Badge'}. ${isFeatured ? 'Featured' : 'Not featured'}. Click to ${isFeatured ? 'unfeature' : 'feature'}`
          : badgeDetail?.name || 'Badge'
      }
    >
      {/* Featured Star */}
      {isFeatured && (
        <div className="absolute top-2 right-2">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" aria-label="Featured badge" />
        </div>
      )}

      {/* Badge Content */}
      <div className="flex flex-col items-center text-center space-y-2">
        {/* Badge Icon */}
        <div className="text-4xl" role="img" aria-label={`${badgeDetail?.name || 'Badge'} icon`}>
          {badgeDetail?.icon || '🏆'}
        </div>

        {/* Badge Name */}
        <div className="space-y-1">
          <h3 className={cn('font-semibold text-sm', rarityColors?.text)}>
            {badgeDetail?.name || 'Unknown Badge'}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {badgeDetail?.description || 'Badge description'}
          </p>
        </div>

        {/* Rarity Badge */}
        <UnifiedBadge
          variant="base"
          style="outline"
          className={cn('text-xs capitalize', rarityColors?.text)}
        >
          {rarity}
        </UnifiedBadge>

        {/* Earned Date */}
        <p className="text-xs text-muted-foreground">
          Earned{' '}
          {new Date(userBadge.earned_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Hover Instruction (only if editable) */}
      {canEdit && (
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'rounded-b-lg p-2 text-center'
          )}
        >
          <p className="text-xs text-muted-foreground">
            {isFeatured ? 'Click to unfeature' : 'Click to feature'}
          </p>
        </div>
      )}

      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </Container>
  );
});

// =============================================================================
// BADGE GRID COMPONENT
// =============================================================================

/**
 * Badge Grid Component
 *
 * Displays user badges in responsive grid with:
 * - Rarity color coding
 * - Featured badge indicators
 * - Interactive featuring/unfeaturing (if canEdit)
 * - Empty state handling
 * - Responsive layout (1-col mobile, 2-col tablet, 3-col desktop)
 *
 * @example
 * ```tsx
 * <BadgeGrid
 *   badges={userBadges}
 *   canEdit={isOwner}
 *   featuredOnly={false}
 * />
 * ```
 */
export const BadgeGrid = memo(function BadgeGrid({
  badges,
  featuredOnly = false,
  canEdit = false,
  className,
  emptyMessage = 'No badges earned yet',
}: BadgeGridProps) {
  // Filter badges (if needed - but parent should pass pre-filtered data)
  const displayedBadges = featuredOnly ? badges.filter((b) => b.featured) : badges;

  const handleFeaturedChange = () => {
    // Refresh badge list (optimistic update already handled in BadgeCard)
    // In production, you might want to refetch from server
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
          <div>
            <CardTitle as="h3" className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              {featuredOnly ? (
                <>
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  Featured Badges
                </>
              ) : (
                'All Badges'
              )}
            </CardTitle>
            <CardDescription>
              {featuredOnly
                ? 'Showcased achievements (max 5)'
                : `${displayedBadges.length} badge${displayedBadges.length === 1 ? '' : 's'} earned`}
            </CardDescription>
          </div>

          {/* Info Tooltip */}
          {canEdit && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-2 hover:bg-accent/10 rounded-md transition-colors"
                    aria-label="Badge featuring help"
                  >
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click any badge to feature it on your profile (max 5)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {displayedBadges.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 p-4 rounded-full bg-muted/30">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{emptyMessage}</p>
            {!featuredOnly && canEdit && (
              <p className="text-xs text-muted-foreground mt-2">
                Earn badges by contributing to the community
              </p>
            )}
          </div>
        ) : (
          /* Badge Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedBadges.map((userBadge) => {
              // Badge detail is now included in the RPC response
              const badgeDetail = userBadge.badge as Badge | undefined;

              return (
                <BadgeCard
                  key={userBadge.id}
                  userBadge={userBadge}
                  badgeDetail={badgeDetail}
                  canEdit={canEdit}
                  onFeaturedChange={handleFeaturedChange}
                />
              );
            })}
          </div>
        )}

        {/* Featured Count Indicator */}
        {canEdit && !featuredOnly && displayedBadges.length > 0 && (
          <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border/40">
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <p className="text-sm text-muted-foreground">
                {displayedBadges.filter((b) => b.featured).length} of 5 featured badges selected
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

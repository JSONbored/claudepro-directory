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
import { memo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import { toggleBadgeFeatured } from '@/src/lib/actions/badges.actions';
import {
  BADGE_RARITY_COLORS,
  BADGE_REGISTRY,
  type BadgeDefinition,
} from '@/src/lib/config/badges.config';
import type { UserBadgeWithBadge } from '@/src/lib/repositories/user-badge.repository';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

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
  /** User badge with details */
  userBadge: UserBadgeWithBadge;
  /** Badge definition from registry */
  badgeDefinition?: BadgeDefinition;
  /** Can edit featured status */
  canEdit: boolean;
  /** Callback when featured status changes */
  onFeaturedChange?: () => void;
}

// =============================================================================
// BADGE CARD COMPONENT
// =============================================================================

const BadgeCard = memo(function BadgeCard({
  userBadge,
  badgeDefinition,
  canEdit,
  onFeaturedChange,
}: BadgeCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isFeatured, setIsFeatured] = useState(userBadge.featured);

  const handleToggleFeatured = () => {
    if (!canEdit || isPending) return;

    startTransition(async () => {
      try {
        const result = await toggleBadgeFeatured({
          badgeId: userBadge.id,
          featured: !isFeatured,
        });

        if (result?.data?.success) {
          setIsFeatured(!isFeatured);
          toast.success(
            isFeatured ? 'Badge removed from featured' : 'Badge featured on your profile'
          );
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

  const rarity = badgeDefinition?.rarity || 'common';
  const rarityColors = BADGE_RARITY_COLORS[rarity];

  const Container = canEdit ? 'button' : 'div';

  return (
    <Container
      type={canEdit ? 'button' : undefined}
      className={cn(
        'relative group rounded-lg border p-4 transition-all duration-200',
        rarityColors.bg,
        rarityColors.border,
        'hover:shadow-md hover:scale-[1.02]',
        canEdit && 'cursor-pointer w-full text-left'
      )}
      onClick={canEdit ? handleToggleFeatured : undefined}
      aria-label={
        canEdit
          ? `${badgeDefinition?.name || 'Badge'}. ${isFeatured ? 'Featured' : 'Not featured'}. Click to ${isFeatured ? 'unfeature' : 'feature'}`
          : badgeDefinition?.name || 'Badge'
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
        <div
          className="text-4xl"
          role="img"
          aria-label={`${badgeDefinition?.name || 'Badge'} icon`}
        >
          {badgeDefinition?.icon || '🏆'}
        </div>

        {/* Badge Name */}
        <div className="space-y-1">
          <h3 className={cn('font-semibold text-sm', rarityColors.text)}>
            {badgeDefinition?.name || 'Unknown Badge'}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {badgeDefinition?.description || 'Badge description'}
          </p>
        </div>

        {/* Rarity Badge */}
        <Badge variant="outline" className={cn('text-xs capitalize', rarityColors.text)}>
          {rarity}
        </Badge>

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
  // Filter badges
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
              // Look up badge definition from registry
              // In production, this should come from the join query
              const badgeDefinition = Object.values(BADGE_REGISTRY).find(
                (def) => def.slug === userBadge.badges?.slug
              );

              // Skip if badge definition not found
              if (!badgeDefinition) {
                return null;
              }

              return (
                <BadgeCard
                  key={userBadge.id}
                  userBadge={userBadge}
                  badgeDefinition={badgeDefinition}
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

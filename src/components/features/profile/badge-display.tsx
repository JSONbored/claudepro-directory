'use client';

/**
 * Badge Display Components
 * Components for displaying user badges and achievements
 */

import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import type { Badge as BadgeType, UserBadgeWithDetails } from '@/src/lib/schemas/badge.schema';

interface BadgeIconProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge icon display
 */
export function BadgeIcon({ badge, size = 'md' }: BadgeIconProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <span
      className={`flex items-center justify-center ${sizeClasses[size]}`}
      title={badge.name}
      role="img"
      aria-label={badge.name}
    >
      {badge.icon || '🏆'}
    </span>
  );
}

interface BadgeCardProps {
  userBadge: UserBadgeWithDetails;
  showEarnedDate?: boolean;
}

/**
 * Individual badge card
 */
export function BadgeCard({ userBadge, showEarnedDate = true }: BadgeCardProps) {
  const { badge, earned_at } = userBadge;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <BadgeIcon badge={badge} size="md" />
          {userBadge.featured && (
            <Badge variant="default" className="text-xs">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-base mb-1">{badge.name}</CardTitle>
        <CardDescription className="text-sm">{badge.description}</CardDescription>
        {showEarnedDate && (
          <p className="text-xs text-muted-foreground mt-2">
            Earned{' '}
            {new Date(earned_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface BadgeListProps {
  userBadges: UserBadgeWithDetails[];
  title?: string;
  description?: string;
  emptyMessage?: string;
}

/**
 * List of user badges
 */
export function BadgeList({
  userBadges,
  title = 'Badges',
  description,
  emptyMessage = 'No badges earned yet',
}: BadgeListProps) {
  if (userBadges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {userBadges.map((userBadge) => (
          <BadgeCard key={userBadge.id} userBadge={userBadge} />
        ))}
      </div>
    </div>
  );
}

interface CompactBadgeDisplayProps {
  userBadges: UserBadgeWithDetails[];
  maxDisplay?: number;
}

/**
 * Compact badge display (icons only)
 * Good for profile sidebars
 */
export function CompactBadgeDisplay({ userBadges, maxDisplay = 5 }: CompactBadgeDisplayProps) {
  const displayBadges = userBadges.slice(0, maxDisplay);
  const remainingCount = Math.max(0, userBadges.length - maxDisplay);

  if (userBadges.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {displayBadges.map((userBadge) => (
        <div
          key={userBadge.id}
          className="relative group"
          title={`${userBadge.badge.name}: ${userBadge.badge.description}`}
        >
          <BadgeIcon badge={userBadge.badge} size="sm" />
          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {userBadge.badge.name}
          </div>
        </div>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

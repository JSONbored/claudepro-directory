'use client';

/**
 * ProfileCard Component - User-Focused Profile Display
 *
 * Architecture:
 * - Reuses BaseCard for composition (zero duplication)
 * - Avatar-first design with user image display
 * - Configuration-driven badge/metadata rendering
 * - Performance optimized with React.memo
 * - SEO-friendly with proper ARIA labels
 * - Secure with validated data
 *
 * @module components/domain/profile-card
 */

import { memo } from 'react';
import { BaseCard } from '@/src/components/core/domain/base-card';
import { UnifiedBadge } from '@/src/components/core/domain/unified-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/primitives/avatar';
import { Button } from '@/src/components/primitives/button';
import { Award, ExternalLink, Users } from '@/src/lib/icons';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database.types';

/**
 * User profile data with runtime-added stats from materialized views
 */
export type UserProfile = Tables<'users'> & {
  // Runtime-added stats (from materialized view)
  total_contributions?: number;
  followers_count?: number;
  following_count?: number;
  // Optional company data (from get_user_profile RPC)
  company?: {
    name: string;
    logo: string | null;
  } | null;
};

export interface ProfileCardProps {
  user: UserProfile;
  variant?: 'default' | 'compact';
  showActions?: boolean;
}

/**
 * Member type badge configuration based on user role/activity
 */
const getMemberBadge = (user: UserProfile) => {
  // Priority 1: Company owner (highest status)
  if (user.company) {
    return {
      label: 'Company Owner',
      className: BADGE_COLORS.memberType.owner,
    };
  }

  // Priority 2: Active contributor
  const contributionCount = user.total_contributions || 0;
  if (contributionCount >= 10) {
    return {
      label: 'Contributor',
      className: BADGE_COLORS.memberType.contributor,
    };
  }

  // Default: Member
  return {
    label: 'Member',
    className: BADGE_COLORS.memberType.member,
  };
};

function ProfileCardComponent({ user, variant = 'default', showActions = true }: ProfileCardProps) {
  const memberBadge = getMemberBadge(user);
  const slug = user.slug || 'unknown';
  const username = `@${slug}`;
  const displayName = user.name || username;
  const profileUrl = `/u/${slug}`;

  // Generate initials for avatar fallback
  const initials =
    (user.name || slug)
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <BaseCard
      targetPath={profileUrl}
      displayTitle=""
      showActions={showActions}
      ariaLabel={`${username} - ${user.work || 'Community member'}`}
      showAuthor={false}
      compactMode={variant === 'compact'}
      renderHeader={() => (
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Avatar */}
          <Avatar className="h-16 w-16 ring-2 ring-accent/20 ring-offset-2 ring-offset-background">
            {user.image && (
              <AvatarImage src={user.image} alt={`${username}'s avatar`} className="object-cover" />
            )}
            <AvatarFallback className="bg-accent/10 font-semibold text-accent text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Username */}
          <div className="w-full min-w-0">
            <h3 className="truncate font-semibold text-base">{username}</h3>
            {user.work && (
              <p className="mt-0.5 truncate text-muted-foreground text-sm">{user.work}</p>
            )}
          </div>
        </div>
      )}
      renderTopBadges={() => (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {/* Member type badge */}
          <UnifiedBadge
            variant="base"
            style="outline"
            className={`${UI_CLASSES.TEXT_BADGE} ${memberBadge.className}`}
          >
            {memberBadge.label}
          </UnifiedBadge>

          {/* Top interests (max 2) */}
          {Array.isArray(user.interests) &&
            user.interests
              .slice(0, 2)
              .filter((interest): interest is string => typeof interest === 'string')
              .map((interest) => (
                <UnifiedBadge
                  key={interest}
                  variant="base"
                  style="secondary"
                  className={`${UI_CLASSES.TEXT_BADGE} border-primary/20 text-primary`}
                >
                  {interest}
                </UnifiedBadge>
              ))}
        </div>
      )}
      renderMetadataBadges={() => (
        <>
          {/* Contributions count */}
          {user.total_contributions !== undefined && user.total_contributions > 0 && (
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="h-7 gap-1.5 border-primary/20 bg-primary/10 font-medium text-primary"
            >
              <Award className={UI_CLASSES.ICON_XS} aria-hidden="true" />
              <span className={UI_CLASSES.TEXT_BADGE}>{user.total_contributions}</span>
            </UnifiedBadge>
          )}

          {/* Followers count */}
          {user.followers_count !== undefined && user.followers_count > 0 && (
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="h-7 gap-1.5 border-border bg-muted/50 font-medium text-foreground"
            >
              <Users className={UI_CLASSES.ICON_XS} aria-hidden="true" />
              <span className={UI_CLASSES.TEXT_BADGE}>{user.followers_count}</span>
            </UnifiedBadge>
          )}
        </>
      )}
      renderActions={() => (
        <>
          {/* Website link */}
          {user.website && (
            <Button
              variant="ghost"
              size="sm"
              className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
              onClick={(e) => {
                e.stopPropagation();
                window.open(user.website as string, '_blank');
              }}
              aria-label={`Visit ${displayName}'s website`}
            >
              <ExternalLink className={UI_CLASSES.ICON_XS} aria-hidden="true" />
            </Button>
          )}

          {/* Twitter/X link */}
          {user.social_x_link && (
            <Button
              variant="ghost"
              size="sm"
              className={`${UI_CLASSES.ICON_BUTTON_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
              onClick={(e) => {
                e.stopPropagation();
                window.open(user.social_x_link as string, '_blank');
              }}
              aria-label={`Visit ${displayName} on X/Twitter`}
            >
              <ExternalLink className={UI_CLASSES.ICON_XS} aria-hidden="true" />
            </Button>
          )}

          {/* View profile button */}
          <Button
            variant="ghost"
            size="sm"
            className={`${UI_CLASSES.BUTTON_ICON_TEXT_SM} ${UI_CLASSES.BUTTON_GHOST_ICON}`}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = profileUrl;
            }}
            aria-label={`View ${displayName}'s profile`}
          >
            View
          </Button>
        </>
      )}
      customMetadataText={null}
    />
  );
}

export const ProfileCard = memo(ProfileCardComponent);
ProfileCard.displayName = 'ProfileCard';

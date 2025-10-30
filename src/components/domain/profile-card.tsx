'use client';

/**
 * ProfileCard Component - Configuration-Driven User Profile Display
 *
 * Architecture:
 * - Reuses BaseCard for composition (zero duplication)
 * - Configuration-driven badge/metadata rendering
 * - Performance optimized with React.memo
 * - SEO-friendly with proper ARIA labels
 * - Secure with validated data
 *
 * @module components/domain/profile-card
 */

import { memo } from 'react';
import { BaseCard } from '@/src/components/domain/base-card';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { Button } from '@/src/components/primitives/button';
import { Award, Briefcase, ExternalLink, Medal, Users } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database.types';

/**
 * User profile data with runtime-added stats from materialized views
 */
export type UserProfile = Tables<'users'> & {
  // Runtime-added stats (from materialized view)
  total_contributions?: number;
  followers_count?: number;
  following_count?: number;
};

export interface ProfileCardProps {
  user: UserProfile;
  variant?: 'default' | 'compact';
  showActions?: boolean;
}

/**
 * Tier badge configuration
 */
const TIER_CONFIG = {
  free: { label: 'Free', className: 'border-muted-foreground/20 text-muted-foreground' },
  pro: {
    label: 'Pro',
    className:
      'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400',
  },
  enterprise: {
    label: 'Enterprise',
    className:
      'border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400',
  },
} as const;

/**
 * Format reputation score with K/M suffixes
 */
function formatReputation(score: number | null): string {
  if (!score) return '0';
  if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
  return score.toString();
}

function ProfileCardComponent({ user, variant = 'default', showActions = true }: ProfileCardProps) {
  const tier = (user.tier || 'free') as 'free' | 'pro' | 'enterprise';
  const tierConfig = TIER_CONFIG[tier];
  const slug = user.slug || 'unknown';
  const displayName = user.name || `@${slug}`;
  const profileUrl = `/u/${slug}`;

  return (
    <BaseCard
      targetPath={profileUrl}
      displayTitle={displayName}
      {...(user.bio ? { description: user.bio } : {})}
      showActions={showActions}
      ariaLabel={`${displayName} - ${user.work || 'Community member'}`}
      showAuthor={false}
      compactMode={variant === 'compact'}
      renderTopBadges={() => (
        <>
          {/* Tier badge */}
          <UnifiedBadge
            variant="base"
            style="outline"
            className={`text-xs ${tierConfig.className}`}
          >
            {tierConfig.label}
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
                  className="text-xs border-primary/20 text-primary"
                >
                  {interest}
                </UnifiedBadge>
              ))}
        </>
      )}
      renderMetadataBadges={() => (
        <>
          {/* Reputation score */}
          {user.reputation_score !== null && user.reputation_score > 0 && (
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="h-7 px-2.5 gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium"
            >
              <Medal className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">{formatReputation(user.reputation_score)}</span>
            </UnifiedBadge>
          )}

          {/* Contributions count */}
          {user.total_contributions !== undefined && user.total_contributions > 0 && (
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary border-primary/20 font-medium"
            >
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">{user.total_contributions}</span>
            </UnifiedBadge>
          )}

          {/* Followers count */}
          {user.followers_count !== undefined && user.followers_count > 0 && (
            <UnifiedBadge
              variant="base"
              style="secondary"
              className="h-7 px-2.5 gap-1.5 bg-muted/50 text-foreground border-border font-medium"
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">{user.followers_count}</span>
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
              className={`h-7 w-7 p-0 ${UI_CLASSES.BUTTON_GHOST_ICON}`}
              onClick={(e) => {
                e.stopPropagation();
                window.open(user.website as string, '_blank');
              }}
              aria-label={`Visit ${displayName}'s website`}
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Button>
          )}

          {/* Twitter/X link */}
          {user.social_x_link && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 ${UI_CLASSES.BUTTON_GHOST_ICON}`}
              onClick={(e) => {
                e.stopPropagation();
                window.open(user.social_x_link as string, '_blank');
              }}
              aria-label={`Visit ${displayName} on X/Twitter`}
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Button>
          )}

          {/* View profile button */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 text-xs ${UI_CLASSES.BUTTON_GHOST_ICON}`}
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
      customMetadataText={
        user.work ? (
          <>
            <Briefcase className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{user.work}</span>
          </>
        ) : null
      }
    />
  );
}

export const ProfileCard = memo(ProfileCardComponent);
ProfileCard.displayName = 'ProfileCard';
